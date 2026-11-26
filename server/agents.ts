import { FunctionDeclaration, GoogleGenAI, Type } from '@google/genai';
import {
  detectSpokenLanguage,
  getTamilDialectConfig,
} from '../src/i18n/tamilDialects';
import type {
  AgentProposal,
  AgentTurnResponse,
  LanguageCode,
  SharedPlatformState,
  TamilDialectId,
  VoicePersonaId,
} from '../src/types';

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const VOICE_MAP: Record<
  VoicePersonaId,
  { voiceName: 'Kore' | 'Zephyr' | 'Puck' | 'Fenrir' | 'Charon'; style: string }
> = {
  female_soft: {
    voiceName: 'Zephyr',
    style:
      'Soft, gentle, unhurried, warm and soothing female elder-care companion speaking clearly with peaceful pauses.',
  },
  female_warm: {
    voiceName: 'Kore',
    style:
      'Warm, comforting, patient, affectionate female companion speaking like a caring family daughter at a calm, steady rhythm.',
  },
  female_mature: {
    voiceName: 'Kore',
    style:
      'Mature, motherly, deeply comforting, poised female voice with rich warmth, gentle authority, and natural unhurried breathing pauses.',
  },
  male_calm: {
    voiceName: 'Puck',
    style:
      'Calm, friendly, clear, respectful male companion speaking softly and patiently without haste.',
  },
  male_gentle: {
    voiceName: 'Fenrir',
    style:
      'Gentle, soft-spoken, polite male companion speaking with heartfelt respect and smooth conversational rhythm.',
  },
  male_reassuring: {
    voiceName: 'Charon',
    style:
      'Mature, steady, deeply reassuring male voice speaking clearly and unhurriedly with warmth and elder respect.',
  },
};

const LANGUAGE_NAMES: Record<LanguageCode, string> = {
  en: 'English (warm, simple, respectful Indian English)',
  ta: 'Tamil (தமிழ் — fluent, pure, culturally authentic everyday spoken Tamil in Tamil script)',
  hi: 'Hindi (हिन्दी — natural, warm, respectful everyday Hindi Devanagari script)',
};

const agentToolDeclarations: FunctionDeclaration[] = [
  {
    name: 'proposeAppointment',
    description:
      'Appointment Agent: Propose a doctor appointment when the user expresses pain, discomfort, or asks to see a doctor. Never auto-book without user confirmation.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        doctorName: { type: Type.STRING, description: 'Recommended doctor name from the directory.' },
        specialty: { type: Type.STRING, description: 'Specialty e.g. Orthopaedic Specialist or General Physician.' },
        hospital: { type: Type.STRING, description: 'Hospital or clinic name.' },
        date: { type: Type.STRING, description: 'YYYY-MM-DD date.' },
        time: { type: Type.STRING, description: 'HH:MM 24h slot.' },
        mode: { type: Type.STRING, description: 'in_person or teleconsult' },
        reason: { type: Type.STRING, description: 'Brief non-diagnostic reason for consultation.' },
        summaryForUser: {
          type: Type.STRING,
          description:
            'Short friendly confirmation question strictly in the conversation reply language (for Tamil, pure natural Tamil in the selected dialect without English words).',
        },
      },
      required: ['doctorName', 'specialty', 'date', 'time', 'reason', 'summaryForUser'],
    },
  },
  {
    name: 'proposeTransport',
    description:
      'Coordination/Transport Agent: Propose a vehicle booking for a doctor visit, hospital, pharmacy, or errands. Always ask confirmation before booking.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        purpose: { type: Type.STRING, description: 'doctor, hospital, pharmacy, shopping, or personal' },
        destination: { type: Type.STRING, description: 'Destination clinic or place.' },
        date: { type: Type.STRING, description: 'YYYY-MM-DD date.' },
        time: { type: Type.STRING, description: 'HH:MM pickup time.' },
        vehicleType: { type: Type.STRING, description: 'accessible_van, car, auto_rickshaw, or ambulance' },
        summaryForUser: {
          type: Type.STRING,
          description:
            'Short friendly confirmation question strictly in the conversation reply language (for Tamil, pure natural Tamil in the selected dialect without English words).',
        },
      },
      required: ['purpose', 'destination', 'date', 'time', 'vehicleType', 'summaryForUser'],
    },
  },
  {
    name: 'proposeMarkMedicineTaken',
    description:
      'Medication Agent: Propose marking a prescribed medicine as taken when the user confirms or asks to record their dose.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        medicationName: { type: Type.STRING, description: 'Name of the prescribed medication.' },
        summaryForUser: {
          type: Type.STRING,
          description: 'Short friendly confirmation message strictly in the reply language.',
        },
      },
      required: ['medicationName', 'summaryForUser'],
    },
  },
  {
    name: 'proposeLogWater',
    description:
      'Nutrition & Habit Agent: Propose adding 1 glass of water to today hydration tracker.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        glasses: { type: Type.NUMBER, description: 'Number of glasses to add (usually 1).' },
        summaryForUser: {
          type: Type.STRING,
          description: 'Short encouraging note strictly in the reply language.',
        },
      },
      required: ['glasses', 'summaryForUser'],
    },
  },
  {
    name: 'proposeAddReminder',
    description:
      'Personal Assistant / Coordination Agent: Propose adding a reminder (appointment, medicine, water, family event, or task).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'Reminder title in the user language.' },
        date: { type: Type.STRING, description: 'YYYY-MM-DD date.' },
        time: { type: Type.STRING, description: 'HH:MM time.' },
        category: { type: Type.STRING, description: 'medication, appointment, hydration, family, transport, or task' },
        summaryForUser: {
          type: Type.STRING,
          description: 'Short friendly confirmation question strictly in the reply language.',
        },
      },
      required: ['title', 'date', 'time', 'category', 'summaryForUser'],
    },
  },
  {
    name: 'proposeSaveMemory',
    description:
      'Personal Companion Agent: Propose saving a liked food, disliked food, music preference, hobby, or family detail to memory.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        category: { type: Type.STRING, description: 'food, music, hobby, family, topic, routine, or other' },
        label: { type: Type.STRING, description: 'Short label.' },
        value: { type: Type.STRING, description: 'Preference detail.' },
        preferenceType: { type: Type.STRING, description: 'like, dislike, or fact' },
        summaryForUser: {
          type: Type.STRING,
          description: 'Short friendly confirmation strictly in the reply language.',
        },
      },
      required: ['category', 'label', 'value', 'preferenceType', 'summaryForUser'],
    },
  },
  {
    name: 'proposeEmergencyReview',
    description:
      'Emergency Response Agent: Trigger whenever the elder reports chest pain, breathing trouble, a fall, dizziness, or asks to call 112 / neighbour / emergency help.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        reason: { type: Type.STRING, description: 'Reported symptom or emergency request.' },
        recommendedContact: { type: Type.STRING, description: '112, family, or neighbour' },
        summaryForUser: {
          type: Type.STRING,
          description: 'Calm, urgent reassurance strictly in the reply language directing them to the emergency card.',
        },
      },
      required: ['reason', 'recommendedContact', 'summaryForUser'],
    },
  },
];

async function withTimeoutAndRetry<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  retries = 1
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await Promise.race<T>([
        fn(),
        new Promise<T>((_resolve, reject) =>
          setTimeout(() => reject(new Error('AI request timed out')), timeoutMs)
        ),
      ]);
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message.toLowerCase() : '';
      const nonRetryable =
        msg.includes('api_key') ||
        msg.includes('permission_denied') ||
        msg.includes('not configured') ||
        msg.includes('400') ||
        msg.includes('403');
      if (nonRetryable || attempt === retries) {
        throw err;
      }
      await new Promise((r) => setTimeout(r, 350 * (attempt + 1)));
    }
  }
  throw lastError;
}

export async function orchestrateElderConversation(params: {
  message: string;
  history: Array<{ role: 'user' | 'assistant'; text: string }>;
  state: SharedPlatformState;
  languageOverride?: LanguageCode;
  tamilDialectOverride?: TamilDialectId;
}): Promise<AgentTurnResponse> {
  const { message, history, state, languageOverride, tamilDialectOverride } = params;
  const profileLang: LanguageCode = languageOverride || state.profile.language || 'en';
  const dialectId: TamilDialectId = tamilDialectOverride || state.profile.tamilDialect || 'neutral';
  const dialect = getTamilDialectConfig(dialectId);

  // Intelligent language switching: match the language actually spoken by the user in this turn
  const detected = detectSpokenLanguage(message, profileLang);
  const effectiveLang: LanguageCode = detected.replyLanguage;

  const ai = getAiClient();
  if (!ai) {
    throw new Error('GEMINI_API_KEY is not configured in server secrets.');
  }

  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);

  const memorySummary = state.profile.memories
    .map((m) => `${m.preferenceType.toUpperCase()} (${m.category}): ${m.label} - ${m.value}`)
    .join('; ');

  const medsSummary = state.medications
    .map((m) => `${m.name} ${m.dosage} at ${m.scheduledTime} (${m.foodInstruction}, status: ${m.status})`)
    .join('; ');

  const doctorsSummary = state.doctors
    .map((d) => `${d.name} (${d.specialty}) at ${d.hospital}, next slots: ${d.nextSlots.join(', ')}`)
    .join(' | ');

  const apptsSummary = state.appointments
    .filter((a) => a.status === 'scheduled')
    .map((a) => `${a.doctorName} on ${a.date} at ${a.time} (${a.hospital})`)
    .join('; ');

  const tamilLinguisticSection =
    effectiveLang === 'ta'
      ? `
TAMIL LANGUAGE & REGIONAL DIALECT MASTERY (STRICTLY FOLLOW):
- Selected Regional Dialect: ${dialect.nameEn} (${dialect.nameTa} — ${dialect.regionEn}).
- Dialect Style Guide: ${dialect.llmDialectGuidance}
- Think and compose NATIVELY in natural spoken Tamil. NEVER translate English sentences word-for-word. Use natural Tamil Subject-Object-Verb grammar, proper suffixes, and respectful elder address (நீங்கள் / உங்களுக்கு / மரியாதையான வட்டார வழக்கு).
- STRICT PURITY RULE: ${
          detected.isMixedTamilEnglish
            ? 'The user naturally mixed a couple of Tamil and English words; respond in natural Tamil in the selected dialect and only reference the specific English word if essential for clarity—never add extra English filler words.'
            : 'Do NOT mix English words, Tanglish, or Romanised Tamil into your reply. Avoid words like "OK", "sorry", "tablet", "appointment", "water", "breakfast", "check", "report", "ride", "today", "doctor" in English script—use simple natural Tamil words like சரி, மன்னிக்கவும், மாத்திரை/மருந்து, மருத்துவ சந்திப்பு, தண்ணீர், காலை உணவு, பரிசோதனை, அறிக்கை, வாகனம், இன்று, மருத்துவர்.'
        }
- Keep Tamil simple, warm, unhurried, and crystal clear for a 70+ year old elder to understand effortlessly by ear (2 to 4 short sentences).`
      : '';

  const languageSwitchingRule =
    effectiveLang === 'en' && profileLang === 'ta'
      ? `1. The elder spoke in English this turn, so reply warmly in simple, clear, respectful English (and be ready to switch smoothly back to ${dialect.nameEn} Tamil if they speak Tamil next).`
      : `1. Respond strictly in ${LANGUAGE_NAMES[effectiveLang]}. Match the language the elder spoke without mixing unprompted foreign words.`;

  const systemInstruction = `You are SENIORA, a warm, patient, dignified voice-first AI companion for an elderly person named ${state.profile.name} (age ${state.profile.age}, city ${state.profile.city}).

CRITICAL COMMUNICATION RULES:
${languageSwitchingRule}
${tamilLinguisticSection}
2. Speak warmly, gently, and clearly using short, easy-to-understand sentences (2 to 4 short sentences max). Never use complicated medical jargon, technical terms, robotic phrasing, or overly hyper cheerfulness.
3. NEVER claim to be a human, doctor, or emergency service. NEVER diagnose conditions or prescribe, start, stop, or alter medicines.
4. Always personalize thoughtfully using ${state.profile.name}'s approved profile:
   - Favourite foods: ${state.profile.favouriteFoods.join(', ')}
   - Disliked foods (NEVER recommend these!): ${state.profile.dislikedFoods.join(', ')}
   - Favourite music/hobbies: ${state.profile.favouriteMusic.join(', ')}; ${state.profile.hobbies.join(', ')}
   - Mobility needs: ${state.profile.mobilityNeeds}
   - Saved memories: ${memorySummary}
   - Today's date: ${today}; Tomorrow's date: ${tomorrow}
   - Medications today: ${medsSummary}
   - Scheduled appointments: ${apptsSummary || 'None'}
   - Water today: ${state.waterGlasses}/${state.waterGoal} glasses
   - Wearable (DEMO): HR ${state.wearable.heartRate} bpm, BP ${state.wearable.bpSystolic}/${state.wearable.bpDiastolic} mmHg, Steps ${state.wearable.steps}
   - Available doctors: ${doctorsSummary}
5. MULTI-AGENT ORCHESTRATION:
   - When the elder expresses pain/symptoms (e.g. knee pain / முழங்கால் வலி / கால் வலி), politely ask a brief clarifying question OR use 'proposeAppointment' to suggest a suitable specialist and ask for confirmation.
   - If the elder reports chest pain (நெஞ்சு வலி), breathing trouble (மூச்சுத் திணறல்), severe dizziness (தலை சுற்றல் / மயக்கம்), a fall, or asks for emergency help / neighbour, IMMEDIATELY call 'proposeEmergencyReview' and urge immediate medical/112 escalation.
   - When they want transport (வண்டி / வாகனம் / ride), call 'proposeTransport' (preferring accessible_van when mobility needs exist) and ask confirmation.
   - When they ask about medicines (மருந்து / மாத்திரை), summarize clearly and if they say they took one, call 'proposeMarkMedicineTaken'.
   - When they want a reminder (நினைவூட்டல்), call 'proposeAddReminder'.
   - When they mention not wanting food or feeling hungry, suggest a gentle option they LIKE (e.g. இட்லி) and never force them or mention disliked items (e.g. பால்).`;

  const sanitizedHistory = (Array.isArray(history) ? history : [])
    .filter(
      (turn) =>
        turn &&
        (turn.role === 'user' || turn.role === 'assistant') &&
        typeof turn.text === 'string' &&
        turn.text.trim().length > 0
    )
    .slice(-10);

  const contents = [
    ...sanitizedHistory.map((turn) => ({
      role: turn.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: turn.text.trim() }],
    })),
    {
      role: 'user',
      parts: [{ text: String(message).trim() }],
    },
  ];

  const response = await withTimeoutAndRetry(
    () =>
      ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents,
        config: {
          systemInstruction,
          tools: [{ functionDeclarations: agentToolDeclarations }],
        },
      }),
    16000,
    1
  );

  const activeAgents: string[] = ['Personal Companion Agent'];
  let proposal: AgentProposal | undefined;

  const fnCalls = response.functionCalls;
  if (fnCalls && fnCalls.length > 0) {
    const call = fnCalls[0];
    const args = (call.args || {}) as Record<string, unknown>;
    const summaryText = typeof args.summaryForUser === 'string' ? args.summaryForUser.trim() : '';

    if (call.name === 'proposeAppointment') {
      activeAgents.push('Health Monitoring Agent', 'Appointment Agent', 'Family & NGO Coordination Agent');
      proposal = {
        id: `prop-${Date.now()}`,
        agentName: effectiveLang === 'ta' ? 'மருத்துவ சந்திப்பு உதவியாளர்' : 'Appointment Agent',
        actionType: 'book_appointment',
        title:
          effectiveLang === 'ta'
            ? `மருத்துவர் சந்திப்பை உறுதிசெய்யவும் (${String(args.doctorName || 'மருத்துவர்')})`
            : `Confirm Doctor Appointment (${String(args.doctorName || 'Doctor')})`,
        summary:
          summaryText ||
          (effectiveLang === 'ta'
            ? `${String(args.date)} அன்று ${String(args.time)} மணிக்கு மருத்துவ சந்திப்பைப் பதிவு செய்யலாமா?`
            : `Book ${String(args.specialty)} visit on ${String(args.date)} at ${String(args.time)}.`),
        payload: args,
      };
    } else if (call.name === 'proposeTransport') {
      activeAgents.push('Transport & Coordination Agent');
      proposal = {
        id: `prop-${Date.now()}`,
        agentName: effectiveLang === 'ta' ? 'பயண ஒருங்கிணைப்பு உதவியாளர்' : 'Coordination Agent',
        actionType: 'book_transport',
        title:
          effectiveLang === 'ta'
            ? 'வாகனப் பயணத்தை உறுதிசெய்யவும்'
            : `Confirm Ride (${String(args.vehicleType || 'car')})`,
        summary:
          summaryText ||
          (effectiveLang === 'ta'
            ? `${String(args.date)} அன்று ${String(args.time)} மணிக்கு வாகனம் ஏற்பாடு செய்யலாமா?`
            : `Arrange ${String(args.vehicleType)} to ${String(args.destination)} on ${String(args.date)} at ${String(args.time)}.`),
        payload: args,
      };
    } else if (call.name === 'proposeMarkMedicineTaken') {
      activeAgents.push('Medication Agent');
      proposal = {
        id: `prop-${Date.now()}`,
        agentName: effectiveLang === 'ta' ? 'மருந்து உதவியாளர்' : 'Medication Agent',
        actionType: 'mark_medicine_taken',
        title:
          effectiveLang === 'ta'
            ? `${String(args.medicationName)} எடுத்ததாகப் பதிவு செய்யவும்`
            : `Record ${String(args.medicationName)} as Taken`,
        summary:
          summaryText ||
          (effectiveLang === 'ta'
            ? `இன்று ${String(args.medicationName)} மருந்தை எடுத்துக்கொண்டதாகப் பதிவு செய்யலாமா?`
            : `Mark ${String(args.medicationName)} as taken today.`),
        payload: args,
      };
    } else if (call.name === 'proposeLogWater') {
      activeAgents.push('Nutrition & Habit Agent');
      proposal = {
        id: `prop-${Date.now()}`,
        agentName: effectiveLang === 'ta' ? 'உணவு மற்றும் பழக்க உதவியாளர்' : 'Nutrition & Habit Agent',
        actionType: 'log_water',
        title: effectiveLang === 'ta' ? 'தண்ணீர் குடித்ததைப் பதிவு செய்யவும்' : 'Log Water Intake',
        summary:
          summaryText ||
          (effectiveLang === 'ta'
            ? 'இன்றைய கணக்கில் ஒரு குவளை தண்ணீர் சேர்க்கலாமா?'
            : 'Add 1 glass of water to your tracker.'),
        payload: args,
      };
    } else if (call.name === 'proposeAddReminder') {
      activeAgents.push('Personal Companion Agent', 'Coordination Agent');
      proposal = {
        id: `prop-${Date.now()}`,
        agentName: effectiveLang === 'ta' ? 'நினைவூட்டல் உதவியாளர்' : 'Reminder Agent',
        actionType: 'add_reminder',
        title:
          effectiveLang === 'ta'
            ? `நினைவூட்டல் சேர்க்கவும்: ${String(args.title)}`
            : `Save Reminder: ${String(args.title)}`,
        summary:
          summaryText ||
          (effectiveLang === 'ta'
            ? `${String(args.date)} அன்று ${String(args.time)} மணிக்கு நினைவூட்டல் அமைக்கலாமா?`
            : `Remind you on ${String(args.date)} at ${String(args.time)}.`),
        payload: args,
      };
    } else if (call.name === 'proposeSaveMemory') {
      activeAgents.push('Personal Companion Agent');
      proposal = {
        id: `prop-${Date.now()}`,
        agentName: effectiveLang === 'ta' ? 'நினைவக உதவியாளர்' : 'Memory Agent',
        actionType: 'save_memory',
        title:
          effectiveLang === 'ta'
            ? `தனிப்பட்ட நினைவகத்தில் சேமிக்கவும்: ${String(args.label)}`
            : `Save to Personal Memory: ${String(args.label)}`,
        summary: summaryText || String(args.value),
        payload: args,
      };
    } else if (call.name === 'proposeEmergencyReview') {
      activeAgents.push('Emergency Response Agent', 'Family & NGO Coordination Agent');
      proposal = {
        id: `prop-${Date.now()}`,
        agentName: effectiveLang === 'ta' ? 'அவசர உதவிப் பிரிவு' : 'Emergency Response Agent',
        actionType: 'trigger_emergency_review',
        title:
          effectiveLang === 'ta'
            ? 'உடனடி அவசர உதவி மற்றும் நம்பகமான தொடர்புகள்'
            : 'Immediate Emergency & Trusted Contact Options',
        summary:
          summaryText ||
          (effectiveLang === 'ta'
            ? 'உடனடியாக 112 அவசர எண்ணையும் நம்பகமான தொடர்புகளையும் திறக்கலாமா?'
            : 'Open emergency calling (112) and contact alert options right away.'),
        payload: args,
      };
    }
  } else {
    const lower = message.toLowerCase();
    if (
      lower.includes('medicine') ||
      lower.includes('tablet') ||
      lower.includes('மாத்திரை') ||
      lower.includes('மருந்து') ||
      lower.includes('दवा')
    ) {
      activeAgents.push('Medication Agent');
    }
    if (
      lower.includes('food') ||
      lower.includes('water') ||
      lower.includes('breakfast') ||
      lower.includes('eat') ||
      lower.includes('சாப்ப') ||
      lower.includes('தண்ணீ') ||
      lower.includes('உணவு')
    ) {
      activeAgents.push('Nutrition & Habit Agent');
    }
    if (
      lower.includes('heart') ||
      lower.includes('watch') ||
      lower.includes('blood pressure') ||
      lower.includes('sleep') ||
      lower.includes('வலி') ||
      lower.includes('சுத்த') ||
      lower.includes('உடம்பு')
    ) {
      activeAgents.push('Health Monitoring Agent');
    }
  }

  let replyText = typeof response.text === 'string' ? response.text.trim() : '';
  replyText = replyText.replace(/^```[\w]*\s*/i, '').replace(/```$/i, '').trim();

  if (!replyText && proposal) {
    replyText = proposal.summary;
  }
  if (!replyText) {
    replyText =
      effectiveLang === 'ta'
        ? dialect.sampleLineTa
        : effectiveLang === 'hi'
        ? 'मैं यहाँ हूँ। मैं आपकी सेहत, दवाइयों या यात्रा में मदद करने के लिए तैयार हूँ।'
        : "I'm right here with you. How can I help with your day, medicines, or appointments?";
  }

  return {
    replyText,
    activeAgents: Array.from(new Set(activeAgents)),
    proposal,
    language: effectiveLang,
    tamilDialect: effectiveLang === 'ta' ? dialectId : undefined,
    detectedInputLanguage: detected.replyLanguage,
  };
}

export async function synthesizeGeminiSpeech(params: {
  text: string;
  voicePersona: VoicePersonaId;
  language: LanguageCode;
  tamilDialect?: TamilDialectId;
  rate?: number;
}): Promise<{ audioBase64: string; mimeType: string }> {
  const ai = getAiClient();
  if (!ai) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  const voiceCfg = VOICE_MAP[params.voicePersona] || VOICE_MAP.female_warm;
  const dialect = getTamilDialectConfig(params.tamilDialect);
  const paceNote =
    typeof params.rate === 'number' && params.rate <= 0.85
      ? 'Speak slowly, calmly, and clearly with gentle pauses between commas and sentences for an elderly listener.'
      : 'Speak at a calm, natural, unhurried conversational pace with pleasant warmth and clear articulation.';

  const stylePrompt =
    params.language === 'ta'
      ? `${voiceCfg.style} ${dialect.ttsPronunciationStyle} ${paceNote} Pronounce every Tamil syllable cleanly and naturally like a native Tamil Nadu speaker without any robotic cadence or Western accent.`
      : `${voiceCfg.style} Language: ${LANGUAGE_NAMES[params.language]}. ${paceNote}`;

  const callTtsModel = async (model: 'gemini-3.8-flash-tts' | 'gemini-3.8-flash-lite-tts') => {
    const response = await withTimeoutAndRetry(
      () =>
        ai.models.generateContent({
          model,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: params.text,
                  speechMetadata: {
                    style: stylePrompt,
                  },
                },
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voiceCfg.voiceName },
              },
            },
          },
        }),
      10500,
      0
    );
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error(`No audio bytes returned by ${model}`);
    }
    return {
      audioBase64: base64Audio,
      mimeType: 'audio/wav',
    };
  };

  // For Tamil regional Voice Design, prefer flagship gemini-3.8-flash-tts and fall back smoothly to gemini-3.8-flash-lite-tts
  if (params.language === 'ta') {
    try {
      return await callTtsModel('gemini-3.8-flash-tts');
    } catch {
      return await callTtsModel('gemini-3.8-flash-lite-tts');
    }
  }

  return await callTtsModel('gemini-3.8-flash-lite-tts');
}

export async function transcribeGeminiAudio(params: {
  audioBase64: string;
  mimeType: string;
  language: LanguageCode;
  tamilDialect?: TamilDialectId;
}): Promise<string> {
  const ai = getAiClient();
  if (!ai) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  const dialect = getTamilDialectConfig(params.tamilDialect);

  const instruction =
    params.language === 'ta'
      ? `Listen carefully to this elderly speaker. They may speak in Tamil (especially ${dialect.nameEn} from ${dialect.regionEn}), or in English, or switch naturally between Tamil and English.
- If they speak Tamil, transcribe accurately in Tamil Unicode script (தமிழ் எழுத்துருவில்), preserving their regional dialect words naturally—NEVER convert Tamil words into Romanised Tanglish.
- If they speak English, transcribe cleanly in English.
- Return ONLY the exact transcribed words with natural punctuation, nothing else.`
      : `Transcribe this spoken audio accurately in ${LANGUAGE_NAMES[params.language]} (or English if the speaker spoke English). Return only the spoken words.`;

  const response = await withTimeoutAndRetry(
    () =>
      ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: params.mimeType || 'audio/webm',
                data: params.audioBase64,
              },
            },
            {
              text: instruction,
            },
          ],
        },
      }),
    12000,
    0
  );
  return (typeof response.text === 'string' ? response.text : '').trim();
}
