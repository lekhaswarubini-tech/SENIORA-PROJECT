import type { LanguageCode, TamilDialectId, VoicePersonaId } from '../types';
import { safeReadResponseJson } from './safeJson';

export interface SpeakOptions {
  voicePersona: VoicePersonaId;
  language: LanguageCode;
  tamilDialect?: TamilDialectId;
  rate: number;
  volume: number;
  token?: string;
  preferBrowserSpeech?: boolean;
  onStart?: () => void;
  onEnd?: () => void;
}

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

function splitIntoNaturalSentences(text: string): string[] {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];

  // Split on sentence boundaries (English, Tamil, Hindi danda) while keeping punctuation
  const rawParts = normalized.split(/(?<=[.!?।])\s+/);
  const chunks: string[] = [];

  for (const part of rawParts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    if (trimmed.length <= 180) {
      chunks.push(trimmed);
    } else {
      // Split overly long clauses on commas/semicolons so browser SpeechSynthesis never stalls
      const subParts = trimmed.split(/(?<=[,;:])\s+/);
      let buffer = '';
      for (const sub of subParts) {
        if (buffer && buffer.length + sub.length + 1 > 160) {
          chunks.push(buffer.trim());
          buffer = sub;
        } else {
          buffer = buffer ? `${buffer} ${sub}` : sub;
        }
      }
      if (buffer.trim()) chunks.push(buffer.trim());
    }
  }

  return chunks.length > 0 ? chunks : [normalized];
}

export function getSpeechLangTag(language: LanguageCode): string {
  if (language === 'ta') return 'ta-IN';
  if (language === 'hi') return 'hi-IN';
  return 'en-IN';
}

class SpeechSynthesisService {
  private currentAudio: HTMLAudioElement | null = null;
  private ttsAbortController: AbortController | null = null;
  private speechGeneration = 0;
  private isPaused = false;
  private speakingActive = false;
  private lastSpoken = '';
  private lastOptions: SpeakOptions | null = null;
  private cachedVoices: SpeechSynthesisVoice[] = [];
  private voicesListenerBound = false;
  private ttsAudioCache = new Map<string, { audioBase64: string; mimeType: string }>();

  constructor() {
    this.bindVoicesListener();
  }

  private bindVoicesListener(): void {
    if (
      this.voicesListenerBound ||
      typeof window === 'undefined' ||
      !('speechSynthesis' in window)
    ) {
      return;
    }
    this.voicesListenerBound = true;
    const refreshVoices = () => {
      try {
        this.cachedVoices = window.speechSynthesis.getVoices() || [];
      } catch {
        this.cachedVoices = [];
      }
    };
    refreshVoices();
    if (typeof window.speechSynthesis.addEventListener === 'function') {
      window.speechSynthesis.addEventListener('voiceschanged', refreshVoices);
    } else {
      window.speechSynthesis.onvoiceschanged = refreshVoices;
    }
  }

  private getAvailableVoices(): SpeechSynthesisVoice[] {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
    this.bindVoicesListener();
    try {
      const live = window.speechSynthesis.getVoices();
      if (live && live.length > 0) {
        this.cachedVoices = live;
      }
    } catch {
      // ignore
    }
    return this.cachedVoices;
  }

  private selectVoice(
    language: LanguageCode,
    persona: VoicePersonaId
  ): SpeechSynthesisVoice | undefined {
    const voices = this.getAvailableVoices();
    if (voices.length === 0) return undefined;

    const langPrefix = language === 'ta' ? 'ta' : language === 'hi' ? 'hi' : 'en';
    const matching = voices.filter((v) =>
      v.lang.toLowerCase().startsWith(langPrefix)
    );
    const pool = matching.length > 0 ? matching : voices;

    const isMale = persona.startsWith('male');
    const femaleRegex =
      /female|lekha|veena|heera|kalpana|swara|pallavi|kanya|samantha|ava|aria|zira|victoria|karen|moira|tessa|natural.*female|woman/i;
    const maleRegex =
      /\bmale\b|rishi|prabhat|valluvar|david|daniel|alex|george|richard|guy|ryan|andrew|anbu|tamil.*male/i;

    const scored = pool
      .map((voice) => {
        let score = 0;
        const name = voice.name || '';
        const lang = (voice.lang || '').toLowerCase();

        if (lang === getSpeechLangTag(language).toLowerCase()) score += 8;
        else if (lang.startsWith(langPrefix)) score += 5;

        if (!isMale) {
          if (femaleRegex.test(name)) score += 10;
          if (maleRegex.test(name)) score -= 8;
        } else {
          if (maleRegex.test(name)) score += 10;
          if (femaleRegex.test(name)) score -= 8;
        }

        if (/natural|neural|google|enhanced|premium/i.test(name)) score += 3;
        if (voice.localService) score += 1;
        return { voice, score };
      })
      .sort((a, b) => b.score - a.score);

    return scored[0]?.voice;
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public isSpeakingNow(): boolean {
    return this.speakingActive;
  }

  public getPaused(): boolean {
    return this.isPaused;
  }

  public stop(): void {
    this.speechGeneration += 1;
    this.isPaused = false;
    this.speakingActive = false;

    if (this.ttsAbortController) {
      this.ttsAbortController.abort();
      this.ttsAbortController = null;
    }

    if (this.currentAudio) {
      try {
        this.currentAudio.onended = null;
        this.currentAudio.onerror = null;
        this.currentAudio.onplay = null;
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch {
        // ignore audio teardown errors
      }
      this.currentAudio = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore synthesis cancel errors
      }
    }
  }

  public pause(): void {
    if (!this.speakingActive) return;
    this.isPaused = true;
    if (this.currentAudio && !this.currentAudio.paused) {
      try {
        this.currentAudio.pause();
      } catch {
        // ignore
      }
    }
    if (
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      window.speechSynthesis.speaking
    ) {
      try {
        window.speechSynthesis.pause();
      } catch {
        // ignore
      }
    }
  }

  public resume(): void {
    this.isPaused = false;
    if (this.currentAudio && this.currentAudio.paused) {
      this.currentAudio.play().catch(() => {});
    }
    if (
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      window.speechSynthesis.paused
    ) {
      try {
        window.speechSynthesis.resume();
      } catch {
        // ignore
      }
    }
  }

  public async repeatLast(): Promise<void> {
    if (this.lastSpoken && this.lastOptions) {
      await this.speak(this.lastSpoken, this.lastOptions);
    }
  }

  public async speak(text: string, options: SpeakOptions): Promise<void> {
    this.stop();
    const myGen = this.speechGeneration;

    const cleanText = String(text ?? '').trim();
    this.lastSpoken = cleanText;
    this.lastOptions = options;

    if (!cleanText) {
      options.onEnd?.();
      return;
    }

    this.speakingActive = true;
    this.isPaused = false;

    // Optional high-quality server TTS (only if token present and not preferring local Web Speech API)
    if (options.token && !options.preferBrowserSpeech) {
      const cacheKey = `${options.language}|${options.tamilDialect || 'neutral'}|${options.voicePersona}|${options.rate <= 0.85 ? 'slow' : 'norm'}|${cleanText}`;
      const cached = this.ttsAudioCache.get(cacheKey);
      if (cached) {
        const played = await this.playAudioBase64(
          cached.audioBase64,
          cached.mimeType,
          options,
          myGen
        );
        if (played || myGen !== this.speechGeneration) {
          return;
        }
      }

      const controller = new AbortController();
      this.ttsAbortController = controller;
      const timeoutTimer = window.setTimeout(() => controller.abort(), 12000);

      try {
        const res = await fetch('/api/ai/tts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${options.token}`,
          },
          body: JSON.stringify({
            text: cleanText,
            voicePersona: options.voicePersona,
            language: options.language,
            tamilDialect: options.tamilDialect,
            rate: options.rate,
          }),
          signal: controller.signal,
        });

        window.clearTimeout(timeoutTimer);

        // If user interrupted or started another speech while fetching, abort silently
        if (myGen !== this.speechGeneration) {
          return;
        }

        if (res.ok) {
          const parsed = await safeReadResponseJson<{
            audioBase64?: string;
            mimeType?: string;
          } | null>(res, null);
          const audioBase64 = parsed.data?.audioBase64;
          const mimeType = parsed.data?.mimeType || 'audio/wav';
          if (audioBase64 && myGen === this.speechGeneration) {
            if (this.ttsAudioCache.size >= 20) {
              const firstKey = this.ttsAudioCache.keys().next().value;
              if (firstKey) this.ttsAudioCache.delete(firstKey);
            }
            this.ttsAudioCache.set(cacheKey, { audioBase64, mimeType });

            const played = await this.playAudioBase64(
              audioBase64,
              mimeType,
              options,
              myGen
            );
            if (played || myGen !== this.speechGeneration) {
              return;
            }
          }
        }
      } catch {
        // Fall through cleanly to Web Speech API
      } finally {
        window.clearTimeout(timeoutTimer);
        if (this.ttsAbortController === controller) {
          this.ttsAbortController = null;
        }
      }
    }

    if (myGen !== this.speechGeneration) {
      return;
    }

    await this.speakWithBrowserSynthesis(cleanText, options, myGen);
  }

  private playAudioBase64(
    base64: string,
    mimeType: string,
    options: SpeakOptions,
    gen: number
  ): Promise<boolean> {
    return new Promise((resolve) => {
      if (gen !== this.speechGeneration) {
        resolve(false);
        return;
      }

      const audio = new Audio(`data:${mimeType};base64,${base64}`);
      audio.playbackRate = Math.max(0.7, Math.min(1.15, options.rate || 0.85));
      audio.volume = Math.max(0, Math.min(1, options.volume ?? 0.95));
      this.currentAudio = audio;

      let settled = false;
      const finish = (playedOk: boolean) => {
        if (settled) return;
        settled = true;
        if (this.currentAudio === audio) {
          this.currentAudio = null;
        }
        if (gen === this.speechGeneration) {
          this.speakingActive = false;
          this.isPaused = false;
          options.onEnd?.();
        }
        resolve(playedOk);
      };

      audio.onplay = () => {
        if (gen === this.speechGeneration) {
          options.onStart?.();
        }
      };
      audio.onended = () => finish(true);
      audio.onerror = () => finish(false);
      audio.play().catch(() => finish(false));
    });
  }

  private async speakWithBrowserSynthesis(
    text: string,
    options: SpeakOptions,
    gen: number
  ): Promise<void> {
    if (!this.isSupported()) {
      if (gen === this.speechGeneration) {
        this.speakingActive = false;
        options.onEnd?.();
      }
      return;
    }

    // Small settle delay after speechSynthesis.cancel() so Chrome never drops the utterance
    await sleep(45);
    if (gen !== this.speechGeneration) return;

    const sentences = splitIntoNaturalSentences(text);
    const chosenVoice = this.selectVoice(options.language, options.voicePersona);
    const langTag = getSpeechLangTag(options.language);
    const rate = Math.max(0.65, Math.min(1.15, options.rate || 0.85));
    const volume = Math.max(0, Math.min(1, options.volume ?? 0.95));
    const pitch =
      options.voicePersona === 'female_soft'
        ? 1.04
        : options.voicePersona === 'female_warm'
        ? 1.0
        : options.voicePersona === 'female_mature'
        ? 0.94
        : options.voicePersona === 'male_calm'
        ? 0.91
        : options.voicePersona === 'male_gentle'
        ? 0.89
        : 0.84;

    let notifiedStart = false;

    for (let i = 0; i < sentences.length; i++) {
      if (gen !== this.speechGeneration) return;

      // Respect pause state cleanly before starting next sentence
      while (this.isPaused && gen === this.speechGeneration) {
        await sleep(120);
      }
      if (gen !== this.speechGeneration) return;

      await this.speakSingleSentence(sentences[i], {
        langTag,
        rate,
        volume,
        pitch,
        voice: chosenVoice,
        gen,
        onFirstStart: () => {
          if (!notifiedStart && gen === this.speechGeneration) {
            notifiedStart = true;
            options.onStart?.();
          }
        },
      });

      if (gen !== this.speechGeneration) return;

      // Natural calming pause between sentences for elderly clarity
      if (i < sentences.length - 1) {
        await sleep(230);
      }
    }

    if (gen === this.speechGeneration) {
      this.speakingActive = false;
      this.isPaused = false;
      options.onEnd?.();
    }
  }

  private speakSingleSentence(
    sentence: string,
    cfg: {
      langTag: string;
      rate: number;
      volume: number;
      pitch: number;
      voice?: SpeechSynthesisVoice;
      gen: number;
      onFirstStart: () => void;
    }
  ): Promise<void> {
    return new Promise((resolve) => {
      if (cfg.gen !== this.speechGeneration || !this.isSupported()) {
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(sentence);
      utterance.lang = cfg.langTag;
      utterance.rate = cfg.rate;
      utterance.volume = cfg.volume;
      utterance.pitch = cfg.pitch;
      if (cfg.voice) {
        utterance.voice = cfg.voice;
      }

      let resolved = false;
      const maxDurationMs = Math.max(6000, Math.min(20000, sentence.length * 130 + 3500));
      const watchdog = window.setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve();
        }
      }, maxDurationMs);

      const finish = () => {
        window.clearTimeout(watchdog);
        if (!resolved) {
          resolved = true;
          resolve();
        }
      };

      utterance.onstart = () => {
        cfg.onFirstStart();
      };
      utterance.onend = finish;
      utterance.onerror = finish;

      try {
        cfg.onFirstStart();
        window.speechSynthesis.speak(utterance);
      } catch {
        finish();
      }
    });
  }
}

export const speechSynthesisService = new SpeechSynthesisService();
