import type { LanguageCode, TamilDialectId } from '../types';
import { safeReadResponseJson } from './safeJson';
import { getSpeechLangTag } from './speechSynthesisService';

export type RecognitionErrorKind =
  | 'unsupported'
  | 'permission_denied'
  | 'no_microphone'
  | 'network'
  | 'aborted'
  | 'unknown';

export interface SpeechRecognitionCallbacks {
  language: LanguageCode;
  tamilDialect?: TamilDialectId;
  token?: string;
  preferGeminiStt?: boolean;
  continuous: boolean;
  onListeningChange?: (listening: boolean) => void;
  onInterimTranscript?: (text: string) => void;
  onFinalTranscript: (text: string) => void;
  onErrorFeedback?: (kind: RecognitionErrorKind, message: string) => void;
}

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  resultIndex?: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionErrorEventLike {
  error?: string;
}

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onerror: ((ev: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

export function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

export function isGeminiRecorderSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof MediaRecorder !== 'undefined'
  );
}

export function getLocalizedMicError(
  kind: RecognitionErrorKind,
  lang: LanguageCode
): string {
  if (kind === 'unsupported') {
    return lang === 'ta'
      ? 'இந்த உலாவியில் குரல் உணர்தல் இல்லை. தயவுசெய்து கீழே உள்ள பெட்டியில் தமிழில் தட்டச்சு செய்யவும்.'
      : lang === 'hi'
      ? 'इस ब्राउज़र में वॉइस पहचान उपलब्ध नहीं है। कृपया नीचे दिए गए बॉक्स में लिखकर बात करें।'
      : 'Voice recognition is not available in this browser. You can gently type your message below instead.';
  }
  if (kind === 'permission_denied') {
    return lang === 'ta'
      ? 'ஒலிவாங்கி அனுமதி மறுக்கப்பட்டது. உலாவி அமைப்பில் ஒலிவாங்கியை அனுமதிக்கவும் அல்லது கீழே தட்டச்சு செய்யவும்.'
      : lang === 'hi'
      ? 'माइक्रोफ़ोन की अनुमति नहीं मिली। कृपया ब्राउज़र में माइक्रोफ़ोन की अनुमति दें या नीचे लिखकर भेजें।'
      : 'Microphone access is turned off in your browser. Please allow microphone permission or type your message below.';
  }
  if (kind === 'no_microphone') {
    return lang === 'ta'
      ? 'ஒலிவாங்கி எதுவும் கண்டறியப்படவில்லை. கீழே தட்டச்சு செய்து பேசலாம்.'
      : lang === 'hi'
      ? 'कोई माइक्रोफ़ोन नहीं मिला। आप नीचे लिखकर भी बात कर सकते हैं।'
      : 'No microphone was detected on this device. You can type your message below anytime.';
  }
  if (kind === 'network') {
    return lang === 'ta'
      ? 'குரல் சேவையில் இணையத் தடங்கல் ஏற்பட்டது. மீண்டும் முயற்சிக்கவும் அல்லது கீழே தட்டச்சு செய்யவும்.'
      : lang === 'hi'
      ? 'आवाज़ सेवा से जुड़ने में नेटवर्क समस्या आई। कृपया फिर कोशिश करें या नीचे लिखें।'
      : 'Voice recognition had a brief network interruption. Please tap the microphone again or type below.';
  }
  return lang === 'ta'
    ? 'குரலை இப்போது தெளிவாகக் கேட்க முடியவில்லை. மீண்டும் ஒலிவாங்கியை அழுத்தவும் அல்லது கீழே தட்டச்சு செய்யவும்.'
    : lang === 'hi'
    ? 'अभी आवाज़ सुनने में समस्या आई। कृपया माइक्रोफ़ोन फिर दबाएं या नीचे लिखें।'
    : 'I could not hear clearly right now. Please tap the microphone again or type below.';
}

export async function probeMicrophonePermission(): Promise<
  'granted' | 'denied' | 'prompt' | 'unavailable'
> {
  if (typeof navigator === 'undefined') return 'unavailable';
  try {
    if (navigator.permissions && typeof navigator.permissions.query === 'function') {
      const status = await navigator.permissions.query({
        name: 'microphone' as PermissionName,
      });
      if (status.state === 'granted' || status.state === 'denied' || status.state === 'prompt') {
        return status.state;
      }
    }
  } catch {
    // Some browsers throw for microphone permission query; fall back safely
  }
  if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
    return 'unavailable';
  }
  return 'prompt';
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(new Error('Failed to read recorded audio'));
    reader.readAsDataURL(blob);
  });
}

export class SpeechRecognitionController {
  private instance: SpeechRecognitionInstance | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private audioCtx: AudioContext | null = null;
  private vadTimer: number | null = null;
  private maxRecordTimer: number | null = null;
  private discardRecordingOnStop = false;
  private sessionId = 0;
  private restartTimer: number | null = null;
  private keepListening = false;
  private active = false;
  private lastTranscript = '';
  private lastTranscriptTime = 0;
  private callbacks: SpeechRecognitionCallbacks | null = null;

  public isSupported(): boolean {
    return getSpeechRecognitionCtor() !== null || isGeminiRecorderSupported();
  }

  public isActive(): boolean {
    return this.active;
  }

  private teardownRecorderResources(): void {
    if (this.vadTimer !== null) {
      window.clearInterval(this.vadTimer);
      this.vadTimer = null;
    }
    if (this.maxRecordTimer !== null) {
      window.clearTimeout(this.maxRecordTimer);
      this.maxRecordTimer = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((tr) => tr.stop());
      this.mediaStream = null;
    }
    this.mediaRecorder = null;
  }

  /**
   * Stops and discards any active recognition or recording immediately.
   */
  public stop(): void {
    this.keepListening = false;
    this.sessionId += 1;
    this.discardRecordingOnStop = true;

    if (this.restartTimer !== null) {
      window.clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }

    if (this.mediaRecorder) {
      try {
        if (this.mediaRecorder.state !== 'inactive') {
          this.mediaRecorder.stop();
        }
      } catch {
        // ignore
      }
      this.teardownRecorderResources();
    }

    if (this.instance) {
      const inst = this.instance;
      this.instance = null;
      inst.onstart = null;
      inst.onresult = null;
      inst.onerror = null;
      inst.onend = null;
      try {
        inst.abort();
      } catch {
        try {
          inst.stop();
        } catch {
          // ignore
        }
      }
    }

    if (this.active) {
      this.active = false;
      this.callbacks?.onListeningChange?.(false);
    }
    this.callbacks?.onInterimTranscript?.('');
  }

  /**
   * Gracefully finishes the current spoken recording/utterance and submits it for transcription.
   */
  public finishCurrentUtterance(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.discardRecordingOnStop = false;
      try {
        this.mediaRecorder.stop();
      } catch {
        this.stop();
      }
      return;
    }
    this.stop();
  }

  public async start(callbacks: SpeechRecognitionCallbacks): Promise<boolean> {
    this.stop();
    this.callbacks = callbacks;
    this.discardRecordingOnStop = false;

    const Ctor = getSpeechRecognitionCtor();
    const canUseGeminiRecorder = Boolean(callbacks.token) && isGeminiRecorderSupported();

    if (!Ctor && !canUseGeminiRecorder) {
      callbacks.onErrorFeedback?.(
        'unsupported',
        getLocalizedMicError('unsupported', callbacks.language)
      );
      return false;
    }

    const perm = await probeMicrophonePermission();
    if (perm === 'denied') {
      callbacks.onErrorFeedback?.(
        'permission_denied',
        getLocalizedMicError('permission_denied', callbacks.language)
      );
      return false;
    }

    this.keepListening = callbacks.continuous;
    const mySession = this.sessionId;

    // Prefer Gemini regional audio transcription when requested (or when Web Speech API is unavailable)
    if ((callbacks.preferGeminiStt || !Ctor) && canUseGeminiRecorder) {
      return this.startGeminiRecorder(mySession);
    }

    if (Ctor) {
      return this.spawnRecognition(Ctor, mySession);
    }

    return false;
  }

  private async startGeminiRecorder(mySession: number): Promise<boolean> {
    if (mySession !== this.sessionId || !this.callbacks) return false;
    const cb = this.callbacks;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (mySession !== this.sessionId) {
        stream.getTracks().forEach((tr) => tr.stop());
        return false;
      }

      this.mediaStream = stream;
      const preferredTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
      const chosenType = preferredTypes.find((t) =>
        typeof MediaRecorder.isTypeSupported === 'function' ? MediaRecorder.isTypeSupported(t) : false
      );

      const recorder = chosenType
        ? new MediaRecorder(stream, { mimeType: chosenType })
        : new MediaRecorder(stream);
      this.mediaRecorder = recorder;

      const chunks: BlobPart[] = [];
      let speechDetected = false;
      let silenceStartedAt: number | null = null;
      const startedAt = Date.now();

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          chunks.push(ev.data);
        }
      };

      recorder.onstart = () => {
        if (mySession !== this.sessionId) return;
        this.active = true;
        cb.onListeningChange?.(true);
        cb.onInterimTranscript?.(
          cb.language === 'ta'
            ? 'பேசுங்கள்... முடிந்ததும் சிறிது நேரம் நிறுத்துங்கள்'
            : cb.language === 'hi'
            ? 'बोलिए... पूरा होने पर रुकिए'
            : 'Speak calmly... pause when finished'
        );
      };

      recorder.onstop = async () => {
        const shouldDiscard = this.discardRecordingOnStop || mySession !== this.sessionId;
        const mimeType = recorder.mimeType || chosenType || 'audio/webm';
        this.teardownRecorderResources();

        if (this.active) {
          this.active = false;
          cb.onListeningChange?.(false);
        }

        if (shouldDiscard || chunks.length === 0) {
          cb.onInterimTranscript?.('');
          return;
        }

        const audioBlob = new Blob(chunks, { type: mimeType });
        if (audioBlob.size < 1200) {
          cb.onInterimTranscript?.('');
          return;
        }

        cb.onInterimTranscript?.(
          cb.language === 'ta'
            ? 'உங்கள் தமிழ் குரலைப் புரிந்துகொள்கிறேன்...'
            : cb.language === 'hi'
            ? 'आपकी आवाज़ समझ रही हूँ...'
            : 'Understanding your voice...'
        );

        try {
          const base64 = await blobToBase64(audioBlob);
          if (mySession !== this.sessionId) return;

          const res = await fetch('/api/ai/transcribe', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(cb.token ? { Authorization: `Bearer ${cb.token}` } : {}),
            },
            body: JSON.stringify({
              audioBase64: base64,
              mimeType,
              language: cb.language,
              tamilDialect: cb.tamilDialect,
            }),
          });

          if (mySession !== this.sessionId) return;
          cb.onInterimTranscript?.('');

          const parsed = await safeReadResponseJson<{ text?: string } | null>(res, null);
          const transcript = typeof parsed.data?.text === 'string' ? parsed.data.text.trim() : '';

          if (res.ok && transcript) {
            cb.onFinalTranscript(transcript);
          } else {
            cb.onErrorFeedback?.('unknown', getLocalizedMicError('unknown', cb.language));
          }
        } catch {
          if (mySession === this.sessionId) {
            cb.onInterimTranscript?.('');
            cb.onErrorFeedback?.('network', getLocalizedMicError('network', cb.language));
          }
        }
      };

      // Gentle Voice-Activity Silence Detection so elderly speakers are never rushed
      try {
        const AudioContextCtor =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (AudioContextCtor) {
          const ctx = new AudioContextCtor();
          this.audioCtx = ctx;
          const source = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 1024;
          source.connect(analyser);
          const data = new Uint8Array(analyser.frequencyBinCount);

          this.vadTimer = window.setInterval(() => {
            if (mySession !== this.sessionId || recorder.state !== 'recording') return;
            analyser.getByteTimeDomainData(data);
            let sumSq = 0;
            for (let i = 0; i < data.length; i++) {
              const norm = (data[i] - 128) / 128;
              sumSq += norm * norm;
            }
            const rms = Math.sqrt(sumSq / data.length);
            const now = Date.now();

            if (rms > 0.025) {
              speechDetected = true;
              silenceStartedAt = null;
            } else if (speechDetected && now - startedAt > 1200) {
              if (silenceStartedAt === null) {
                silenceStartedAt = now;
              } else if (now - silenceStartedAt > 1850) {
                // Natural 1.85s pause after speaking -> process utterance cleanly
                this.finishCurrentUtterance();
              }
            }
          }, 150);
        }
      } catch {
        // If AudioContext VAD unavailable, manual stop still works seamlessly
      }

      // Safety cap at 20 seconds per turn
      this.maxRecordTimer = window.setTimeout(() => {
        if (mySession === this.sessionId && recorder.state === 'recording') {
          this.finishCurrentUtterance();
        }
      }, 20000);

      recorder.start(250);
      return true;
    } catch (err) {
      this.teardownRecorderResources();
      const name = err instanceof Error ? err.name.toLowerCase() : '';
      if (name.includes('notallowed') || name.includes('permission')) {
        cb.onErrorFeedback?.('permission_denied', getLocalizedMicError('permission_denied', cb.language));
      } else if (name.includes('notfound') || name.includes('devicesnotfound')) {
        cb.onErrorFeedback?.('no_microphone', getLocalizedMicError('no_microphone', cb.language));
      } else {
        cb.onErrorFeedback?.('unknown', getLocalizedMicError('unknown', cb.language));
      }
      return false;
    }
  }

  private spawnRecognition(Ctor: SpeechRecognitionCtor, mySession: number): boolean {
    if (mySession !== this.sessionId || !this.callbacks) return false;
    const cb = this.callbacks;

    const rec = new Ctor();
    rec.lang = getSpeechLangTag(cb.language);
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;

    let capturedFinalInRun = false;

    rec.onstart = () => {
      if (mySession !== this.sessionId) return;
      this.active = true;
      cb.onListeningChange?.(true);
    };

    rec.onresult = (event) => {
      if (mySession !== this.sessionId) return;
      const results = event?.results;
      if (!results || results.length === 0) return;

      let interim = '';
      let finalChunk = '';
      const startIndex = typeof event.resultIndex === 'number' ? event.resultIndex : 0;

      for (let i = startIndex; i < results.length; i++) {
        const res = results[i];
        const rawText = res?.[0]?.transcript;
        if (typeof rawText !== 'string') continue;
        if (res.isFinal) {
          finalChunk += ` ${rawText}`;
        } else {
          interim += ` ${rawText}`;
        }
      }

      const cleanInterim = interim.trim();
      cb.onInterimTranscript?.(cleanInterim);

      const cleanFinal = finalChunk.trim();
      if (cleanFinal) {
        const now = Date.now();
        const isDuplicate =
          cleanFinal.toLowerCase() === this.lastTranscript.toLowerCase() &&
          now - this.lastTranscriptTime < 2500;

        if (!isDuplicate) {
          this.lastTranscript = cleanFinal;
          this.lastTranscriptTime = now;
          capturedFinalInRun = true;
          cb.onInterimTranscript?.('');
          this.keepListening = false;
          this.active = false;
          cb.onListeningChange?.(false);
          try {
            rec.stop();
          } catch {
            // ignore
          }
          cb.onFinalTranscript(cleanFinal);
        }
      }
    };

    rec.onerror = (ev) => {
      if (mySession !== this.sessionId) return;
      const errCode = (ev?.error || '').toLowerCase();

      if (errCode === 'no-speech') {
        return;
      }
      if (errCode === 'aborted') {
        return;
      }

      this.keepListening = false;
      this.active = false;
      cb.onListeningChange?.(false);
      cb.onInterimTranscript?.('');

      if (errCode === 'not-allowed' || errCode === 'service-not-allowed') {
        cb.onErrorFeedback?.(
          'permission_denied',
          getLocalizedMicError('permission_denied', cb.language)
        );
      } else if (errCode === 'audio-capture') {
        cb.onErrorFeedback?.(
          'no_microphone',
          getLocalizedMicError('no_microphone', cb.language)
        );
      } else if (errCode === 'network') {
        cb.onErrorFeedback?.(
          'network',
          getLocalizedMicError('network', cb.language)
        );
      } else {
        cb.onErrorFeedback?.(
          'unknown',
          getLocalizedMicError('unknown', cb.language)
        );
      }
    };

    rec.onend = () => {
      if (mySession !== this.sessionId) return;
      if (this.instance === rec) {
        this.instance = null;
      }

      if (this.keepListening && !capturedFinalInRun) {
        this.restartTimer = window.setTimeout(() => {
          if (mySession === this.sessionId && this.keepListening) {
            const NextCtor = getSpeechRecognitionCtor();
            if (NextCtor) {
              this.spawnRecognition(NextCtor, mySession);
            }
          }
        }, 280);
        return;
      }

      this.active = false;
      cb.onListeningChange?.(false);
      cb.onInterimTranscript?.('');
    };

    this.instance = rec;
    try {
      rec.start();
      return true;
    } catch {
      this.instance = null;
      this.active = false;
      this.keepListening = false;
      cb.onListeningChange?.(false);
      cb.onErrorFeedback?.(
        'unknown',
        getLocalizedMicError('unknown', cb.language)
      );
      return false;
    }
  }
}
