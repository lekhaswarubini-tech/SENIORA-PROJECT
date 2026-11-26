import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Mic,
  MicOff,
  RotateCcw,
  ShieldAlert,
  UserCheck,
  Volume2,
} from 'lucide-react';
import {
  detectDialectFromText,
  getTamilDialectConfig,
  TAMIL_DIALECTS,
} from '../i18n/tamilDialects';
import { TRANSLATIONS, VOICE_PERSONAS } from '../i18n/translations';
import { SpeechRecognitionController } from '../services/speechRecognitionService';
import { voiceEngine } from '../services/voiceEngine';
import type { ElderProfile, LanguageCode, TamilDialectId, VoicePersonaId } from '../types';

interface OnboardingFlowProps {
  token: string;
  initialProfile: ElderProfile;
  onComplete: (updates: Partial<ElderProfile>, emergencyContact?: { name: string; relationship: string; phone: string }) => Promise<void>;
  onOpenRoleLogin: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  token,
  initialProfile,
  onComplete,
  onOpenRoleLogin,
}) => {
  const [step, setStep] = useState<number>(0); // 0 = Welcome intro, 1..7 = 7 questions
  const [name, setName] = useState<string>('');
  const [language, setLanguage] = useState<LanguageCode>(initialProfile.language || 'en');
  const [tamilDialect, setTamilDialect] = useState<TamilDialectId>(initialProfile.tamilDialect || 'neutral');
  const [voicePersona, setVoicePersona] = useState<VoicePersonaId>(initialProfile.voicePersona || 'female_warm');
  const [speechRate, setSpeechRate] = useState<number>(initialProfile.speechRate || 0.85);
  const [livingArrangement, setLivingArrangement] = useState<'alone' | 'with_family' | 'with_caregiver'>('alone');
  const [supportAreas, setSupportAreas] = useState<string[]>(['healthcare', 'daily_activities', 'transportation', 'social_connections']);
  const [ecName, setEcName] = useState('');
  const [ecRelation, setEcRelation] = useState('family');
  const [ecPhone, setEcPhone] = useState('');

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [micFeedback, setMicFeedback] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionController>(new SpeechRecognitionController());
  const t = TRANSLATIONS[language];
  const currentPersona = VOICE_PERSONAS.find((v) => v.id === voicePersona) || VOICE_PERSONAS[1];

  const questionTexts: Record<number, string> = {
    0: t.onboarding.welcomeSpeech,
    1: t.onboarding.questions.name,
    2: t.onboarding.questions.language,
    3: t.onboarding.questions.voice,
    4: t.onboarding.questions.pace,
    5: t.onboarding.questions.living,
    6: t.onboarding.questions.support,
    7: t.onboarding.questions.emergency,
  };

  const speakCurrentStep = async (
    stepIndex: number,
    langOverride?: LanguageCode,
    personaOverride?: VoicePersonaId,
    rateOverride?: number,
    dialectOverride?: TamilDialectId
  ) => {
    const activeLang = langOverride || language;
    const activeDialect = dialectOverride || tamilDialect;
    const tr = TRANSLATIONS[activeLang];
    const map: Record<number, string> = {
      0: tr.onboarding.welcomeSpeech,
      1: tr.onboarding.questions.name,
      2: tr.onboarding.questions.language,
      3: tr.onboarding.questions.voice,
      4: tr.onboarding.questions.pace,
      5: tr.onboarding.questions.living,
      6: tr.onboarding.questions.support,
      7: tr.onboarding.questions.emergency,
    };
    const text = map[stepIndex] || '';
    if (!text) return;

    setIsSpeaking(true);
    try {
      await voiceEngine.speak(text, {
        voicePersona: personaOverride || voicePersona,
        language: activeLang,
        tamilDialect: activeDialect,
        rate: rateOverride ?? speechRate,
        volume: 0.95,
        token,
        onStart: () => {
          setIsSpeaking(true);
          setAudioBlocked(false);
        },
        onEnd: () => setIsSpeaking(false),
      });
    } catch {
      setIsSpeaking(false);
      setAudioBlocked(true);
    }
  };

  useEffect(() => {
    // Attempt gentle welcome speech on entry; if browser blocks autoplay, offer a prominent Tap to Hear button
    const timer = window.setTimeout(() => {
      speakCurrentStep(0);
    }, 350);
    const controller = recognitionRef.current;
    return () => {
      window.clearTimeout(timer);
      controller.stop();
      voiceEngine.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStepChange = (nextStep: number) => {
    voiceEngine.stop();
    stopMic();
    setMicFeedback(null);
    setStep(nextStep);
    speakCurrentStep(nextStep);
  };

  const stopMic = () => {
    recognitionRef.current.stop();
    setIsListening(false);
  };

  const handleMicAnswer = async () => {
    if (isListening) {
      stopMic();
      return;
    }

    setMicFeedback(null);
    voiceEngine.stop();
    await recognitionRef.current.start({
      language,
      continuous: false,
      onListeningChange: (listening) => setIsListening(listening),
      onFinalTranscript: (transcript) => {
        applySpokenAnswer(transcript);
      },
      onErrorFeedback: (_kind, msg) => {
        setMicFeedback(msg);
      },
    });
  };

  const applySpokenAnswer = (spoken: string) => {
    const lower = spoken.toLowerCase();
    if (step === 1) {
      const cleaned = spoken.replace(/^(my name is|call me|i am|நான்|मेरा नाम)\s+/i, '').trim();
      setName(cleaned || spoken);
    } else if (step === 2) {
      const matchedDialect = detectDialectFromText(spoken);
      if (matchedDialect) {
        setLanguage('ta');
        setTamilDialect(matchedDialect);
      } else if (lower.includes('tamil') || lower.includes('தமிழ்')) setLanguage('ta');
      else if (lower.includes('hindi') || lower.includes('हिन्दी') || lower.includes('हिंदी')) setLanguage('hi');
      else if (lower.includes('english')) setLanguage('en');
    } else if (step === 3) {
      if (lower.includes('male') && !lower.includes('female')) setVoicePersona('male_calm');
      else if (lower.includes('female')) setVoicePersona('female_warm');
    } else if (step === 4) {
      if (lower.includes('slow') || lower.includes('மெது')) setSpeechRate(0.78);
      else if (lower.includes('normal') || lower.includes('சாதாரண')) setSpeechRate(0.98);
    } else if (step === 5) {
      if (lower.includes('alone') || lower.includes('தனி') || lower.includes('अकेले')) setLivingArrangement('alone');
      else if (lower.includes('family') || lower.includes('குடும்ப') || lower.includes('परिवार')) setLivingArrangement('with_family');
      else if (lower.includes('caregiver')) setLivingArrangement('with_caregiver');
    } else if (step === 7) {
      if (/\d{6,}/.test(spoken)) {
        setEcPhone(spoken);
      } else {
        setEcName(spoken);
      }
    }
  };

  const toggleSupport = (key: string) => {
    if (key === 'all') {
      setSupportAreas(['healthcare', 'daily_activities', 'transportation', 'social_connections']);
      return;
    }
    setSupportAreas((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const finishOnboarding = async (useDemoLakshmi = false) => {
    setIsSaving(true);
    voiceEngine.stop();
    const chosenLang = useDemoLakshmi ? language : language;
    const chosenName = useDemoLakshmi ? 'Lakshmi' : name.trim() || 'Friend';

    const completionText =
      chosenLang === 'ta'
        ? `${getTamilDialectConfig(tamilDialect).greetingTemplateTa(chosenName)} ${TRANSLATIONS.ta.onboarding.completionSpeech}`
        : TRANSLATIONS[chosenLang].onboarding.completionSpeech;

    await voiceEngine.speak(completionText, {
      voicePersona,
      language: chosenLang,
      tamilDialect,
      rate: speechRate,
      volume: 0.95,
      token,
    }).catch(() => {});

    await onComplete(
      {
        name: chosenName,
        language: chosenLang,
        tamilDialect,
        voicePersona,
        speechRate,
        livesAlone: useDemoLakshmi ? true : livingArrangement === 'alone',
        livingArrangement: useDemoLakshmi ? 'alone' : livingArrangement,
        supportAreas: supportAreas.length > 0 ? supportAreas : ['healthcare', 'daily_activities'],
        onboardingCompleted: true,
      },
      !useDemoLakshmi && ecName.trim() && ecPhone.trim()
        ? { name: ecName.trim(), relationship: ecRelation, phone: ecPhone.trim() }
        : undefined
    );
    setIsSaving(false);
  };

  const sampleVoice = (optionId: VoicePersonaId) => {
    const p = VOICE_PERSONAS.find((v) => v.id === optionId);
    if (!p) return;
    setVoicePersona(optionId);
    const sampleText =
      language === 'ta'
        ? `${p.sampleLine.ta} ${getTamilDialectConfig(tamilDialect).sampleLineTa}`
        : p.sampleLine[language];
    voiceEngine.speak(sampleText, {
      voicePersona: optionId,
      language,
      tamilDialect,
      rate: speechRate,
      volume: 0.95,
      token,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF3E8] text-[#382C27] flex flex-col">
      {/* Warm Welcoming Header */}
      <header className="w-full max-w-6xl mx-auto px-6 py-5 flex items-center justify-between gap-4 border-b border-[#E8D5B5]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#355C48] text-[#FAF3E8] flex items-center justify-center font-bold text-lg shadow-sm">
            S
          </div>
          <span className="text-xl font-bold tracking-tight text-[#382C27]">SENIORA</span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-[#FFFDF9] border border-[#E8D5B5] rounded-xl p-1">
            {(['en', 'ta', 'hi'] as LanguageCode[]).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => {
                  setLanguage(code);
                  speakCurrentStep(step, code);
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  language === code
                    ? 'bg-[#783F45] text-[#FAF3E8]'
                    : 'text-[#382C27] hover:bg-[#F3E7D2]'
                }`}
              >
                {code === 'en' ? 'English' : code === 'ta' ? 'தமிழ்' : 'हिन्दी'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onOpenRoleLogin}
            className="px-4 py-2 rounded-xl border border-[#D9C098] bg-[#FFFDF9] text-[#382C27] text-sm font-semibold hover:bg-[#F3E7D2] transition-colors whitespace-nowrap"
          >
            {t.switchRole}
          </button>
        </div>
      </header>

      {/* Main Centered Onboarding Stage */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-8 md:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left: Human Companion Video-Call Portrait */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div
            className={`relative w-full max-w-md rounded-3xl overflow-hidden border border-[#E8D5B5] bg-[#FFFDF9] shadow-md transition-transform duration-500 ${
              isSpeaking ? 'ring-4 ring-[#C46A4A]/35' : ''
            }`}
          >
            <div className="aspect-[4/3] w-full overflow-hidden bg-[#F3E7D2]">
              <img
                src={currentPersona.portraitUrl}
                alt={currentPersona.label[language]}
                referrerPolicy="no-referrer"
                className={`w-full h-full object-cover object-top ${
                  isSpeaking ? 'animate-gentle-breathe' : ''
                }`}
              />
            </div>
            <div className="p-4 bg-gradient-to-r from-[#FFFDF9] to-[#F3E7D2] border-t border-[#E8D5B5] flex items-center justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-[#382C27]">SENIORA Companion</p>
                <p className="text-sm text-[#63534B]">{currentPersona.label[language]}</p>
              </div>
              <button
                type="button"
                onClick={() => speakCurrentStep(step)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F3E7D2] text-[#382C27] hover:bg-[#E8D5B5] border border-[#D9C098] font-semibold text-sm transition-colors"
              >
                <Volume2 className="w-4 h-4 text-[#9E4B30]" />
                {step === 0 ? t.onboarding.tapToHear : t.onboarding.repeatQuestion}
              </button>
            </div>
          </div>

          {audioBlocked && (
            <button
              type="button"
              onClick={() => speakCurrentStep(step)}
              className="mt-4 w-full max-w-md py-3 px-5 rounded-xl bg-[#C46A4A] text-white font-semibold text-base flex items-center justify-center gap-2 hover:bg-[#AE583A] shadow-sm"
            >
              <Volume2 className="w-5 h-5" />
              {t.onboarding.tapToHear}
            </button>
          )}
        </div>

        {/* Right: Step-by-Step Unhurried Question Card */}
        <div className="lg:col-span-7 bg-[#FFFDF9] rounded-3xl border border-[#E8D5B5] p-6 md:p-8 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-5">
            <span className="text-sm font-semibold text-[#783F45]">{t.onboarding.badge}</span>
            {step > 0 && (
              <span className="text-sm font-medium text-[#63534B] tabular-nums">
                {step} / 7
              </span>
            )}
          </div>

          {/* Progress Bar */}
          {step > 0 && (
            <div className="w-full h-2.5 bg-[#F3E7D2] rounded-full overflow-hidden mb-6">
              <div
                className="h-full bg-gradient-to-r from-[#C46A4A] to-[#783F45] transition-all duration-300"
                style={{ width: `${(step / 7) * 100}%` }}
              />
            </div>
          )}

          <h1 className="text-2xl md:text-3xl font-bold text-[#382C27] leading-snug mb-3">
            {questionTexts[step]}
          </h1>
          <p className="text-base text-[#63534B] mb-6">{t.onboarding.welcomeSub}</p>

          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => handleStepChange(1)}
                className="w-full py-4 px-6 rounded-2xl bg-[#C46A4A] hover:bg-[#AE583A] text-white text-lg font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                {t.onboarding.nextStep}
                <ChevronRight className="w-5 h-5" />
              </button>

              <button
                type="button"
                disabled={isSaving}
                onClick={() => finishOnboarding(true)}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#EFF3EC] hover:bg-[#E1E9DB] border border-[#A8B89A] text-[#382C27] text-base font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <UserCheck className="w-5 h-5 text-[#355C48]" />
                {t.onboarding.orUseDemoLakshmi}
              </button>
            </div>
          )}

          {/* Step 1: Name */}
          {step === 1 && (
            <div className="space-y-4">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.onboarding.typePlaceholder}
                className="w-full px-5 py-4 text-lg rounded-2xl border-2 border-[#D9C098] focus:border-[#783F45] focus:outline-none bg-[#FAF3E8] text-[#382C27]"
              />
              <button
                type="button"
                onClick={handleMicAnswer}
                className={`w-full py-3.5 px-5 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 border-2 transition-colors ${
                  isListening
                    ? 'bg-[#F7ECEE] border-[#783F45] text-[#783F45]'
                    : 'bg-[#FAF3E8] border-[#E8D5B5] text-[#382C27] hover:bg-[#F3E7D2]'
                }`}
              >
                {isListening ? <MicOff className="w-5 h-5 text-[#783F45]" /> : <Mic className="w-5 h-5 text-[#C46A4A]" />}
                {isListening ? t.onboarding.listeningNow : t.onboarding.speakAnswer}
              </button>
              {micFeedback && (
                <div className="p-3 rounded-xl bg-[#F3E7D2] border border-[#D4B483] text-[#382C27] text-sm">
                  {micFeedback}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Language + Regional Tamil Dialect */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { code: 'en' as LanguageCode, title: 'English', sub: 'Indian English' },
                  { code: 'ta' as LanguageCode, title: 'தமிழ்', sub: 'தமிழ்நாடு வட்டார வழக்குகள்' },
                  { code: 'hi' as LanguageCode, title: 'हिन्दी', sub: 'Hindi' },
                ].map((opt) => (
                  <button
                    key={opt.code}
                    type="button"
                    onClick={() => {
                      setLanguage(opt.code);
                      speakCurrentStep(2, opt.code);
                    }}
                    className={`p-5 rounded-2xl border-2 text-left transition-colors ${
                      language === opt.code
                        ? 'border-[#783F45] bg-[#F7ECEE]'
                        : 'border-[#E8D5B5] bg-[#FAF3E8] hover:bg-[#F3E7D2]'
                    }`}
                  >
                    <div className="text-xl font-bold text-[#382C27]">{opt.title}</div>
                    <div className="text-sm text-[#63534B] mt-1">{opt.sub}</div>
                  </button>
                ))}
              </div>

              {language === 'ta' && (
                <div className="p-4 rounded-2xl bg-[#FAF3E8] border border-[#E8D5B5] space-y-3">
                  <div>
                    <div className="text-base font-bold text-[#382C27]">
                      {t.settings.dialectLabel}
                    </div>
                    <div className="text-xs text-[#63534B]">{t.settings.dialectSub}</div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {TAMIL_DIALECTS.map((d) => {
                      const active = tamilDialect === d.id;
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => {
                            setTamilDialect(d.id);
                            voiceEngine.speak(d.sampleLineTa, {
                              voicePersona,
                              language: 'ta',
                              tamilDialect: d.id,
                              rate: speechRate,
                              volume: 0.95,
                              token,
                              onStart: () => setIsSpeaking(true),
                              onEnd: () => setIsSpeaking(false),
                            });
                          }}
                          className={`p-3 rounded-xl border-2 text-left transition-colors ${
                            active
                              ? 'border-[#783F45] bg-[#F7ECEE]'
                              : 'border-[#E8D5B5] bg-[#FFFDF9] hover:bg-[#F3E7D2]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-sm text-[#382C27]">{d.nameTa}</span>
                            {active && <Check className="w-4 h-4 text-[#783F45] shrink-0" />}
                          </div>
                          <div className="text-xs text-[#63534B] mt-0.5">{d.regionTa}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: 4 Voices with Sample Playback */}
          {step === 3 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {VOICE_PERSONAS.map((persona) => {
                const selected = voicePersona === persona.id;
                return (
                  <div
                    key={persona.id}
                    onClick={() => setVoicePersona(persona.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') setVoicePersona(persona.id);
                    }}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-colors ${
                      selected
                        ? 'border-[#783F45] bg-[#F7ECEE]'
                        : 'border-[#E8D5B5] bg-[#FAF3E8] hover:bg-[#F3E7D2]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-base text-[#382C27]">
                        {persona.label[language]}
                      </span>
                      {selected && <Check className="w-5 h-5 text-[#783F45] shrink-0" />}
                    </div>
                    <p className="text-sm text-[#63534B] mt-1 mb-3">{persona.description[language]}</p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        sampleVoice(persona.id);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFFDF9] border border-[#D9C098] text-sm font-semibold text-[#382C27] hover:bg-[#F3E7D2]"
                    >
                      <Volume2 className="w-4 h-4 text-[#9E4B30]" />
                      {t.settings.listenSample}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Step 4: Pace */}
          {step === 4 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  setSpeechRate(0.78);
                  speakCurrentStep(4, language, voicePersona, 0.78);
                }}
                className={`p-5 rounded-2xl border-2 text-left transition-colors ${
                  speechRate <= 0.88
                    ? 'border-[#783F45] bg-[#F7ECEE]'
                    : 'border-[#E8D5B5] bg-[#FAF3E8] hover:bg-[#F3E7D2]'
                }`}
              >
                <div className="text-lg font-bold text-[#382C27]">{t.onboarding.paceSlow}</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSpeechRate(0.98);
                  speakCurrentStep(4, language, voicePersona, 0.98);
                }}
                className={`p-5 rounded-2xl border-2 text-left transition-colors ${
                  speechRate > 0.88
                    ? 'border-[#783F45] bg-[#F7ECEE]'
                    : 'border-[#E8D5B5] bg-[#FAF3E8] hover:bg-[#F3E7D2]'
                }`}
              >
                <div className="text-lg font-bold text-[#382C27]">{t.onboarding.paceNormal}</div>
              </button>
            </div>
          )}

          {/* Step 5: Living Arrangement */}
          {step === 5 && (
            <div className="grid grid-cols-1 gap-3">
              {[
                { key: 'alone' as const, label: t.onboarding.livingAlone },
                { key: 'with_family' as const, label: t.onboarding.livingFamily },
                { key: 'with_caregiver' as const, label: t.onboarding.livingCaregiver },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setLivingArrangement(opt.key)}
                  className={`p-4 rounded-2xl border-2 text-left text-lg font-semibold transition-colors ${
                    livingArrangement === opt.key
                      ? 'border-[#783F45] bg-[#F7ECEE] text-[#382C27]'
                      : 'border-[#E8D5B5] bg-[#FAF3E8] hover:bg-[#F3E7D2] text-[#382C27]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {/* Step 6: Support Areas */}
          {step === 6 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(
                [
                  ['healthcare', t.onboarding.supportOptions.healthcare],
                  ['daily_activities', t.onboarding.supportOptions.daily_activities],
                  ['transportation', t.onboarding.supportOptions.transportation],
                  ['social_connections', t.onboarding.supportOptions.social_connections],
                  ['all', t.onboarding.supportOptions.all],
                ] as const
              ).map(([key, label]) => {
                const active =
                  key === 'all' ? supportAreas.length === 4 : supportAreas.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleSupport(key)}
                    className={`p-4 rounded-2xl border-2 text-left font-semibold text-base flex items-center justify-between gap-2 transition-colors ${
                      active
                        ? 'border-[#783F45] bg-[#F7ECEE] text-[#382C27]'
                        : 'border-[#E8D5B5] bg-[#FAF3E8] hover:bg-[#F3E7D2] text-[#382C27]'
                    }`}
                  >
                    <span>{label}</span>
                    {active && <Check className="w-5 h-5 text-[#783F45] shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Step 7: Emergency Contact */}
          {step === 7 && (
            <div className="space-y-3">
              <div className="flex items-start gap-2 p-3 rounded-xl bg-[#F3E7D2] border border-[#D4B483] text-[#382C27] text-sm">
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-[#783F45]" />
                <span>112 (India National Emergency) is always pre-configured for safety.</span>
              </div>
              <input
                type="text"
                value={ecName}
                onChange={(e) => setEcName(e.target.value)}
                placeholder={t.onboarding.emergencyNamePlaceholder}
                className="w-full px-4 py-3.5 text-base rounded-xl border-2 border-[#D9C098] bg-[#FAF3E8] text-[#382C27] focus:border-[#783F45] focus:outline-none"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={ecRelation}
                  onChange={(e) => setEcRelation(e.target.value)}
                  className="px-4 py-3.5 text-base rounded-xl border-2 border-[#D9C098] bg-[#FAF3E8] text-[#382C27] focus:border-[#783F45] focus:outline-none"
                >
                  <option value="family">Family Member</option>
                  <option value="neighbour">Neighbour</option>
                  <option value="caregiver">Caregiver</option>
                  <option value="doctor">Personal Doctor</option>
                </select>
                <input
                  type="tel"
                  value={ecPhone}
                  onChange={(e) => setEcPhone(e.target.value)}
                  placeholder={t.onboarding.emergencyPhonePlaceholder}
                  className="px-4 py-3.5 text-base rounded-xl border-2 border-[#D9C098] bg-[#FAF3E8] text-[#382C27] focus:border-[#783F45] focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Navigation Controls for Steps 1..7 */}
          {step > 0 && (
            <div className="mt-8 pt-5 border-t border-[#E8D5B5] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleStepChange(step - 1)}
                  className="px-4 py-3 rounded-xl border border-[#D9C098] bg-[#FAF3E8] text-[#382C27] font-semibold text-base hover:bg-[#F3E7D2] flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {t.onboarding.prevStep}
                </button>
                <button
                  type="button"
                  onClick={() => speakCurrentStep(step)}
                  className="px-4 py-3 rounded-xl border border-[#D9C098] bg-[#FAF3E8] text-[#382C27] font-semibold text-base hover:bg-[#F3E7D2] flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4 text-[#9E4B30]" />
                  {t.onboarding.repeatQuestion}
                </button>
              </div>

              <div className="flex items-center gap-2">
                {step < 7 ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleStepChange(step + 1)}
                      className="px-4 py-3 rounded-xl text-[#63534B] hover:bg-[#F3E7D2] font-semibold text-base"
                    >
                      {t.onboarding.skipStep}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStepChange(step + 1)}
                      className="px-6 py-3 rounded-xl bg-[#C46A4A] hover:bg-[#AE583A] text-white font-semibold text-base flex items-center gap-1.5 shadow-sm"
                    >
                      {t.onboarding.nextStep}
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => finishOnboarding(false)}
                    className="px-6 py-3.5 rounded-xl bg-[#355C48] hover:bg-[#294838] text-white font-semibold text-base flex items-center gap-2 shadow-sm"
                  >
                    <Check className="w-5 h-5" />
                    {t.onboarding.finishAndOpen}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
