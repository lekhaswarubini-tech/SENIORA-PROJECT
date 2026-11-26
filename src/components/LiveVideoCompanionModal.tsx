import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Camera,
  CameraOff,
  CheckCircle2,
  Mic,
  MicOff,
  Pause,
  PhoneOff,
  Play,
  RotateCcw,
  Send,
  ShieldAlert,
  Square,
  Volume2,
  X,
} from 'lucide-react';
import {
  getTamilCompanionGreeting,
  getTamilDialectConfig,
  TAMIL_DIALECTS,
} from '../i18n/tamilDialects';
import { TRANSLATIONS, VOICE_PERSONAS } from '../i18n/translations';
import { processAssistantMessage } from '../services/aiAssistantService';
import {
  getLocalizedMicError,
  isGeminiRecorderSupported,
  SpeechRecognitionController,
} from '../services/speechRecognitionService';
import { speechSynthesisService } from '../services/speechSynthesisService';
import type {
  AgentProposal,
  ElderProfile,
  LanguageCode,
  SharedPlatformState,
  TamilDialectId,
  VoicePersonaId,
} from '../types';

interface LiveVideoCompanionModalProps {
  open: boolean;
  onClose: () => void;
  token: string;
  profile: ElderProfile;
  onTokenRefreshed?: (newToken: string, nextState?: SharedPlatformState) => void;
  onUpdateVoiceSettings: (updates: Partial<ElderProfile>) => Promise<void>;
  onExecuteProposal: (proposal: AgentProposal) => Promise<string>;
  onOpenEmergency: () => void;
}

interface ChatTurn {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  agents?: string[];
}

export const LiveVideoCompanionModal: React.FC<LiveVideoCompanionModalProps> = ({
  open,
  onClose,
  token,
  profile,
  onTokenRefreshed,
  onUpdateVoiceSettings,
  onExecuteProposal,
  onOpenEmergency,
}) => {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [inputText, setInputText] = useState('');
  const [interimText, setInterimText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [continuousMode, setContinuousMode] = useState(true);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pendingProposal, setPendingProposal] = useState<AgentProposal | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [micUnavailable, setMicUnavailable] = useState(false);
  const [useGeminiStt, setUseGeminiStt] = useState<boolean>(
    () => (profile.language === 'ta') && isGeminiRecorderSupported()
  );

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognitionController>(new SpeechRecognitionController());
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const textInputRef = useRef<HTMLInputElement | null>(null);

  // Mutable refs prevent stale closures across async speech & continuous mic callbacks
  const openRef = useRef(open);
  const continuousModeRef = useRef(continuousMode);
  const useGeminiSttRef = useRef(useGeminiStt);
  const turnsRef = useRef<ChatTurn[]>(turns);
  const tokenRef = useRef(token);
  const profileRef = useRef(profile);
  const isThinkingRef = useRef(isThinking);
  const micUnavailableRef = useRef(micUnavailable);
  const autoListenTimerRef = useRef<number | null>(null);
  const requestAbortRef = useRef<AbortController | null>(null);
  const requestGenRef = useRef(0);
  const lastSubmittedRef = useRef<{ text: string; at: number }>({ text: '', at: 0 });

  openRef.current = open;
  continuousModeRef.current = continuousMode;
  useGeminiSttRef.current = useGeminiStt;
  turnsRef.current = turns;
  tokenRef.current = token;
  profileRef.current = profile;
  isThinkingRef.current = isThinking;
  micUnavailableRef.current = micUnavailable;

  const lang: LanguageCode = profile.language || 'en';
  const dialectConfig = getTamilDialectConfig(profile.tamilDialect);
  const t = TRANSLATIONS[lang];
  const persona = VOICE_PERSONAS.find((v) => v.id === profile.voicePersona) || VOICE_PERSONAS[0];

  const clearAutoListenTimer = useCallback(() => {
    if (autoListenTimerRef.current !== null) {
      window.clearTimeout(autoListenTimerRef.current);
      autoListenTimerRef.current = null;
    }
  }, []);

  const stopListening = useCallback(() => {
    clearAutoListenTimer();
    recognitionRef.current.stop();
    setIsListening(false);
    setInterimText('');
  }, [clearAutoListenTimer]);

  const finishListeningUtterance = useCallback(() => {
    clearAutoListenTimer();
    recognitionRef.current.finishCurrentUtterance();
    setIsListening(false);
  }, [clearAutoListenTimer]);

  const stopAllSpeechAndRequests = useCallback(() => {
    clearAutoListenTimer();
    requestGenRef.current += 1;
    if (requestAbortRef.current) {
      requestAbortRef.current.abort();
      requestAbortRef.current = null;
    }
    speechSynthesisService.stop();
    setIsSpeaking(false);
    setIsPaused(false);
    setIsThinking(false);
  }, [clearAutoListenTimer]);

  const stopAllMedia = useCallback(() => {
    stopAllSpeechAndRequests();
    stopListening();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
    }
    setCameraOn(false);
  }, [stopAllSpeechAndRequests, stopListening]);

  // Ref-safe startListening & speakText callbacks so continuous loop never breaks
  const handleSendRef = useRef<(rawMessage?: string) => Promise<void>>(async () => {});

  const startListening = useCallback(async () => {
    if (!openRef.current) return;

    // Immediate voice interruption: silence assistant before activating mic
    clearAutoListenTimer();
    speechSynthesisService.stop();
    setIsSpeaking(false);
    setIsPaused(false);

    const activeLang = profileRef.current.language || 'en';
    if (!recognitionRef.current.isSupported()) {
      setMicUnavailable(true);
      setErrorMsg(getLocalizedMicError('unsupported', activeLang));
      textInputRef.current?.focus();
      return;
    }

    setErrorMsg(null);
    const started = await recognitionRef.current.start({
      language: activeLang,
      tamilDialect: profileRef.current.tamilDialect,
      token: tokenRef.current,
      preferGeminiStt: useGeminiSttRef.current && activeLang === 'ta',
      continuous: continuousModeRef.current,
      onListeningChange: (listening) => {
        setIsListening(listening);
      },
      onInterimTranscript: (interim) => {
        setInterimText(interim);
      },
      onFinalTranscript: (spoken) => {
        setInterimText('');
        if (spoken) {
          handleSendRef.current(spoken);
        }
      },
      onErrorFeedback: (kind, message) => {
        if (kind === 'permission_denied' || kind === 'no_microphone' || kind === 'unsupported') {
          setMicUnavailable(true);
          textInputRef.current?.focus();
        }
        setErrorMsg(message);
      },
    });

    if (!started) {
      setIsListening(false);
    }
  }, [clearAutoListenTimer]);

  const speakText = useCallback(
    async (text: string, allowAutoListen = false, languageOverride?: LanguageCode) => {
      if (!openRef.current) return;
      clearAutoListenTimer();
      stopListening();

      const currentProfile = profileRef.current;
      const activeLang = languageOverride || currentProfile.language || 'en';

      setIsSpeaking(true);
      setIsPaused(false);

      await speechSynthesisService.speak(text, {
        voicePersona: currentProfile.voicePersona || 'female_warm',
        language: activeLang,
        tamilDialect: currentProfile.tamilDialect,
        rate: currentProfile.speechRate || 0.85,
        volume: currentProfile.volume ?? 0.95,
        token: tokenRef.current,
        onStart: () => {
          if (openRef.current) {
            setIsSpeaking(true);
          }
        },
        onEnd: () => {
          setIsSpeaking(false);
          setIsPaused(false);
          if (
            allowAutoListen &&
            continuousModeRef.current &&
            openRef.current &&
            !isThinkingRef.current &&
            !micUnavailableRef.current &&
            recognitionRef.current.isSupported()
          ) {
            // Natural pause after assistant finishes speaking to prevent speaker echo
            autoListenTimerRef.current = window.setTimeout(() => {
              if (
                openRef.current &&
                continuousModeRef.current &&
                !isThinkingRef.current &&
                !speechSynthesisService.isSpeakingNow()
              ) {
                startListening();
              }
            }, 550);
          }
        },
      });
    },
    [clearAutoListenTimer, startListening, stopListening]
  );

  const handleSend = useCallback(
    async (rawMessage?: string) => {
      const text = (rawMessage ?? inputText).trim();
      if (!text) return;

      // Prevent duplicate submission of identical phrase within 2 seconds
      const now = Date.now();
      if (
        text.toLowerCase() === lastSubmittedRef.current.text.toLowerCase() &&
        now - lastSubmittedRef.current.at < 2000
      ) {
        return;
      }
      lastSubmittedRef.current = { text, at: now };

      // Allow interrupting current AI thinking/speech cleanly
      stopAllSpeechAndRequests();
      stopListening();
      setInputText('');
      setErrorMsg(null);

      const userTurn: ChatTurn = {
        id: `u-${Date.now()}`,
        role: 'user',
        text,
      };
      const updatedTurns = [...turnsRef.current, userTurn];
      setTurns(updatedTurns);
      turnsRef.current = updatedTurns;
      setIsThinking(true);
      isThinkingRef.current = true;

      const myReqGen = ++requestGenRef.current;
      const abortController = new AbortController();
      requestAbortRef.current = abortController;

      try {
        const result = await processAssistantMessage({
          message: text,
          history: updatedTurns.map((item) => ({ role: item.role, text: item.text })),
          language: profileRef.current.language || 'en',
          tamilDialect: profileRef.current.tamilDialect,
          token: tokenRef.current,
          signal: abortController.signal,
          onTokenRefreshed,
        });

        if (myReqGen !== requestGenRef.current || !openRef.current) {
          return;
        }

        const aiData = result.response;
        const botTurn: ChatTurn = {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: aiData.replyText,
          agents: aiData.activeAgents,
        };

        setTurns((prev) => [...prev, botTurn]);
        if (aiData.proposal) {
          setPendingProposal(aiData.proposal);
        }
        if (result.errorNotice) {
          setErrorMsg(result.errorNotice);
        }

        setIsThinking(false);
        isThinkingRef.current = false;
        await speakText(aiData.replyText, continuousModeRef.current, aiData.language);
      } catch {
        if (myReqGen === requestGenRef.current && openRef.current) {
          setIsThinking(false);
          isThinkingRef.current = false;
          const fallbackMsg =
            profileRef.current.language === 'ta'
              ? 'மன்னிக்கவும், சிறிய தடங்கல் ஏற்பட்டது. மீண்டும் பேசலாம் அல்லது கீழே தட்டச்சு செய்யலாம்.'
              : profileRef.current.language === 'hi'
              ? 'क्षमा कीजिए, थोड़ी परेशानी आई। आप फिर से बोल सकते हैं या नीचे लिख सकते हैं।'
              : 'I had a brief hiccup connecting. Please speak again or type below anytime.';
          setErrorMsg(fallbackMsg);
          await speakText(fallbackMsg, continuousModeRef.current);
        }
      } finally {
        if (requestAbortRef.current === abortController) {
          requestAbortRef.current = null;
        }
      }
    },
    [inputText, onTokenRefreshed, speakText, stopAllSpeechAndRequests, stopListening]
  );

  handleSendRef.current = handleSend;

  useEffect(() => {
    if (!open) {
      stopAllMedia();
      return;
    }

    const activeLang = profileRef.current.language || 'en';
    const elderName = profileRef.current.name || (activeLang === 'ta' ? 'அம்மா' : 'Friend');
    const greeting =
      activeLang === 'ta'
        ? getTamilCompanionGreeting(profileRef.current.tamilDialect, elderName)
        : activeLang === 'hi'
        ? `नमस्ते ${elderName}! मैं यहाँ आपके साथ हूँ। आज आप कैसा महसूस कर रहे हैं?`
        : `Hello ${elderName}. Take your time — I am right here with you. How are you feeling today, and how may I help?`;

    const initialTurn: ChatTurn = {
      id: 'greet-1',
      role: 'assistant',
      text: greeting,
      agents: ['Personal Companion Agent'],
    };

    setTurns([initialTurn]);
    turnsRef.current = [initialTurn];
    setPendingProposal(null);
    setErrorMsg(null);
    setMicUnavailable(!recognitionRef.current.isSupported());

    if (!recognitionRef.current.isSupported()) {
      setErrorMsg(getLocalizedMicError('unsupported', activeLang));
    }

    speakText(greeting, true);

    return () => {
      stopAllMedia();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns, pendingProposal, interimText]);

  const toggleSelfCamera = async () => {
    if (cameraOn) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((tr) => tr.stop());
        streamRef.current = null;
      }
      setCameraOn(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      setCameraOn(true);
      window.setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 60);
    } catch {
      setErrorMsg('Camera permission was not granted in the browser.');
    }
  };

  const handleStopAllVoice = () => {
    stopAllSpeechAndRequests();
    stopListening();
  };

  const handleConfirmProposal = async () => {
    if (!pendingProposal) return;
    const resultMsg = await onExecuteProposal(pendingProposal);
    setPendingProposal(null);
    const botTurn: ChatTurn = {
      id: `conf-${Date.now()}`,
      role: 'assistant',
      text: resultMsg,
      agents: ['Coordination Agent'],
    };
    setTurns((prev) => [...prev, botTurn]);
    await speakText(resultMsg, continuousModeRef.current);
  };

  if (!open) return null;

  const stopButtonLabel =
    lang === 'ta' ? 'நிறுத்து' : lang === 'hi' ? 'रोकें' : 'Stop';

  const statusText = isListening
    ? t.videoCall.listeningStatus
    : isThinking
    ? t.videoCall.thinkingStatus
    : isSpeaking
    ? t.videoCall.speakingStatus
    : t.videoCall.readyStatus;

  return (
    <div className="fixed inset-0 z-50 bg-[#382C27]/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-6">
      <div className="w-full max-w-6xl bg-[#FAF3E8] rounded-3xl overflow-hidden border border-[#E8D5B5] shadow-2xl flex flex-col max-h-[94vh]">
        {/* Top Video Bar */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#FFFDF9] to-[#F3E7D2] border-b border-[#E8D5B5] flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-[#382C27]">{t.videoCall.title}</h2>
            <p className="text-sm text-[#63534B] flex items-center gap-2">
              <span
                className={`inline-block w-2.5 h-2.5 rounded-full ${
                  isListening
                    ? 'bg-[#783F45] animate-pulse'
                    : isSpeaking
                    ? 'bg-[#C46A4A] animate-pulse'
                    : isThinking
                    ? 'bg-[#E8D5B5] ring-2 ring-[#C46A4A] animate-pulse'
                    : 'bg-[#A8B89A]'
                }`}
              />
              {persona.label[lang]}
              {lang === 'ta' ? ` · ${dialectConfig.nameTa}` : ''} · {statusText}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-[#FFFDF9] border border-[#E8D5B5] rounded-xl p-1">
              {(['en', 'ta', 'hi'] as LanguageCode[]).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => {
                    onUpdateVoiceSettings({ language: code });
                    setUseGeminiStt(code === 'ta' && isGeminiRecorderSupported());
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                    lang === code
                      ? 'bg-[#783F45] text-[#FAF3E8]'
                      : 'text-[#382C27] hover:bg-[#F3E7D2]'
                  }`}
                >
                  {code === 'en' ? 'EN' : code === 'ta' ? 'தமிழ்' : 'हिन्दी'}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={onOpenEmergency}
              className="px-4 py-2.5 rounded-xl bg-[#783F45] hover:bg-[#613136] text-[#FAF3E8] font-semibold text-sm flex items-center gap-1.5"
            >
              <ShieldAlert className="w-4 h-4" />
              {t.emergencySos}
            </button>
            <button
              type="button"
              onClick={() => {
                stopAllMedia();
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl bg-[#382C27] hover:bg-[#2A201C] text-[#FAF3E8] font-semibold text-sm flex items-center gap-1.5"
            >
              <PhoneOff className="w-4 h-4" />
              {t.videoCall.endCall}
            </button>
          </div>
        </div>

        {/* Main Video Stage + Conversation Area */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-5 p-5">
          {/* Left: Human Live Video Companion Stage + Large Voice Controls */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="relative rounded-3xl overflow-hidden bg-[#382C27] border border-[#D9C098] aspect-[4/3]">
              <img
                src={persona.portraitUrl}
                alt={persona.label[lang]}
                referrerPolicy="no-referrer"
                className={`w-full h-full object-cover object-top transition-transform duration-700 ${
                  isSpeaking ? 'animate-gentle-breathe scale-[1.02]' : ''
                }`}
              />
              {/* Bottom gradient scrim for large accessible subtitles */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#382C27]/95 via-[#382C27]/70 to-transparent p-5">
                <p className="text-[#FAF3E8] text-lg md:text-xl font-medium leading-snug">
                  {interimText ? `"${interimText}..."` : turns[turns.length - 1]?.text}
                </p>
              </div>

              {/* Optional Elder Self-Camera Picture-in-Picture */}
              {cameraOn && (
                <div className="absolute top-3 right-3 w-32 h-24 rounded-2xl overflow-hidden border-2 border-[#E8D5B5] shadow-lg bg-[#382C27]">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                </div>
              )}
            </div>

            {/* Large, Accessible Voice & Stop Controls Bar */}
            <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8D5B5] p-4 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={isListening ? finishListeningUtterance : startListening}
                  className={`flex-1 min-w-[190px] min-h-[60px] py-4 px-6 rounded-2xl font-bold text-lg flex items-center justify-center gap-2.5 transition-colors shadow-sm ${
                    isListening
                      ? 'bg-[#783F45] hover:bg-[#613136] text-[#FAF3E8]'
                      : 'bg-[#C46A4A] hover:bg-[#AE583A] text-white'
                  }`}
                >
                  {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                  {isListening ? t.videoCall.stopListening : t.videoCall.tapToSpeak}
                </button>

                <button
                  type="button"
                  onClick={handleStopAllVoice}
                  disabled={!isSpeaking && !isListening && !isThinking}
                  aria-label={stopButtonLabel}
                  className="min-h-[60px] px-6 py-4 rounded-2xl border-2 border-[#382C27] bg-[#382C27] hover:bg-[#2A201C] disabled:opacity-40 text-[#FAF3E8] font-bold text-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Square className="w-5 h-5 fill-current" />
                  {stopButtonLabel}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  disabled={!isSpeaking && !isPaused}
                  onClick={() => {
                    if (isPaused) {
                      speechSynthesisService.resume();
                      setIsPaused(false);
                    } else {
                      speechSynthesisService.pause();
                      setIsPaused(true);
                    }
                  }}
                  className="flex-1 px-4 py-3 rounded-xl border border-[#D9C098] bg-[#FAF3E8] hover:bg-[#F3E7D2] disabled:opacity-45 text-[#382C27] font-semibold text-sm flex items-center justify-center gap-1.5"
                >
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  {isPaused ? t.videoCall.resumeSpeech : t.videoCall.pauseSpeech}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    stopListening();
                    speechSynthesisService.repeatLast();
                  }}
                  className="flex-1 px-4 py-3 rounded-xl border border-[#D9C098] bg-[#FAF3E8] hover:bg-[#F3E7D2] text-[#382C27] font-semibold text-sm flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4 text-[#9E4B30]" />
                  {t.videoCall.repeatLast}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#E8D5B5] items-center">
                <label className="flex items-center gap-2 text-sm font-medium text-[#382C27] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={continuousMode}
                    onChange={(e) => setContinuousMode(e.target.checked)}
                    className="w-4 h-4 accent-[#355C48]"
                  />
                  {t.videoCall.continuousMode}
                </label>

                <div className="flex items-center gap-2 text-sm text-[#382C27]">
                  <span className="whitespace-nowrap font-medium">{t.settings.speedLabel}:</span>
                  <input
                    type="range"
                    min="0.65"
                    max="1.15"
                    step="0.05"
                    value={profile.speechRate}
                    onChange={(e) =>
                      onUpdateVoiceSettings({ speechRate: parseFloat(e.target.value) })
                    }
                    className="w-full accent-[#C46A4A]"
                  />
                  <span className="text-xs font-mono-num text-[#63534B] w-9 text-right">
                    {profile.speechRate.toFixed(2)}x
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <Volume2 className="w-4 h-4 text-[#63534B] shrink-0" />
                  <input
                    type="range"
                    min="0.3"
                    max="1"
                    step="0.05"
                    value={profile.volume}
                    onChange={(e) =>
                      onUpdateVoiceSettings({ volume: parseFloat(e.target.value) })
                    }
                    className="w-24 accent-[#C46A4A]"
                  />
                  <button
                    type="button"
                    onClick={toggleSelfCamera}
                    className="px-3 py-1.5 rounded-xl border border-[#D9C098] text-xs font-semibold text-[#382C27] hover:bg-[#F3E7D2] flex items-center gap-1"
                  >
                    {cameraOn ? <CameraOff className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
                    {cameraOn ? t.videoCall.disableMyCamera : t.videoCall.enableMyCamera}
                  </button>
                </div>
              </div>

              {/* Tamil Regional Dialect & AI Speech Recognition Controls */}
              {lang === 'ta' && (
                <div className="pt-2 border-t border-[#E8D5B5] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-[210px]">
                    <label htmlFor="live-tamil-dialect" className="text-xs font-bold text-[#382C27] whitespace-nowrap">
                      வட்டார வழக்கு:
                    </label>
                    <select
                      id="live-tamil-dialect"
                      value={profile.tamilDialect || 'neutral'}
                      onChange={(e) => {
                        const nextDialect = e.target.value as TamilDialectId;
                        onUpdateVoiceSettings({ tamilDialect: nextDialect });
                        const cfg = getTamilDialectConfig(nextDialect);
                        speakText(cfg.sampleLineTa, false, 'ta');
                      }}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-[#D9C098] bg-[#FAF3E8] text-xs font-semibold text-[#382C27] focus:border-[#783F45] focus:outline-none"
                    >
                      {TAMIL_DIALECTS.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.nameTa} ({d.nameEn})
                        </option>
                      ))}
                    </select>
                  </div>

                  {isGeminiRecorderSupported() && (
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-[#355C48] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useGeminiStt}
                        onChange={(e) => setUseGeminiStt(e.target.checked)}
                        className="w-4 h-4 accent-[#355C48]"
                      />
                      {t.videoCall.aiDialectMicLabel}
                    </label>
                  )}
                </div>
              )}

              {/* Quick Voice Persona Selector */}
              <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-[#E8D5B5]">
                {VOICE_PERSONAS.map((vp) => (
                  <button
                    key={vp.id}
                    type="button"
                    onClick={() => onUpdateVoiceSettings({ voicePersona: vp.id as VoicePersonaId })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                      profile.voicePersona === vp.id
                        ? 'bg-[#783F45] text-[#FAF3E8] border-[#783F45]'
                        : 'bg-[#FAF3E8] text-[#382C27] border-[#E8D5B5] hover:bg-[#F3E7D2]'
                    }`}
                  >
                    {vp.label[lang]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Accessible Transcript, Agent Confirmation Card, & Text Input Fallback */}
          <div className="lg:col-span-6 flex flex-col bg-[#FFFDF9] rounded-3xl border border-[#E8D5B5] overflow-hidden min-h-[380px]">
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {turns.map((turn) => (
                <div
                  key={turn.id}
                  className={`flex flex-col ${
                    turn.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-3 text-base leading-relaxed ${
                      turn.role === 'user'
                        ? 'bg-[#355C48] text-white'
                        : 'bg-[#F3E7D2] text-[#382C27] border border-[#E8D5B5]'
                    }`}
                  >
                    {turn.text}
                  </div>
                  {turn.agents && turn.agents.length > 0 && (
                    <span className="text-xs text-[#63534B] mt-1 px-1">
                      {turn.agents.join(' · ')}
                    </span>
                  )}
                </div>
              ))}

              {interimText && (
                <div className="flex flex-col items-end">
                  <div className="max-w-[88%] rounded-2xl px-4 py-2.5 text-sm italic bg-[#EFF3EC] border border-[#A8B89A] text-[#382C27]">
                    {interimText}...
                  </div>
                </div>
              )}

              {/* Interactive Agent Confirmation Card */}
              {pendingProposal && (
                <div className="p-4 rounded-2xl border-2 border-[#A8B89A] bg-[#EFF3EC] space-y-3">
                  <div className="text-xs font-semibold text-[#355C48]">
                    {pendingProposal.agentName}
                  </div>
                  <div className="text-lg font-bold text-[#382C27]">{pendingProposal.title}</div>
                  <p className="text-sm text-[#382C27]">{pendingProposal.summary}</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleConfirmProposal}
                      className="px-4 py-2.5 rounded-xl bg-[#355C48] hover:bg-[#294838] text-white font-semibold text-sm flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {t.videoCall.confirmAction}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingProposal(null)}
                      className="px-4 py-2.5 rounded-xl bg-[#FFFDF9] border border-[#D9C098] text-[#382C27] font-semibold text-sm flex items-center gap-1.5"
                    >
                      <X className="w-4 h-4" />
                      {t.videoCall.dismissAction}
                    </button>
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-[#F3E7D2] border border-[#D4B483] text-[#382C27] text-sm font-medium">
                  {errorMsg}
                </div>
              )}
              <div ref={transcriptEndRef} />
            </div>

            {/* Helpful Spoken/Tap Suggestions (Regional Dialect + Language-Switch Testing) */}
            <div className="px-4 py-2.5 bg-[#FAF3E8] border-t border-[#E8D5B5]">
              <div className="text-xs font-semibold text-[#63534B] mb-1.5">
                {t.videoCall.quickPromptsTitle}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(lang === 'ta'
                  ? [...dialectConfig.sampleUserPhrasesTa, 'Hello, what medicines do I have today?']
                  : t.videoCall.quickPrompts
                ).map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleSend(prompt)}
                    className="px-3 py-1.5 rounded-xl bg-[#FFFDF9] border border-[#E8D5B5] hover:border-[#C46A4A] text-xs font-medium text-[#382C27] text-left transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Always-Available Accessible Text Input Fallback */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-4 bg-[#FFFDF9] border-t border-[#E8D5B5] flex items-center gap-2"
            >
              <input
                ref={textInputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={t.videoCall.typeMessagePlaceholder}
                className="flex-1 px-4 py-3.5 text-base rounded-xl border-2 border-[#D9C098] bg-[#FAF3E8] text-[#382C27] focus:border-[#783F45] focus:outline-none"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="px-5 py-3.5 rounded-xl bg-[#C46A4A] hover:bg-[#AE583A] disabled:opacity-50 text-white font-semibold text-base flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                {t.videoCall.sendBtn}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
