import type { AgentTurnResponse, LanguageCode, SharedPlatformState, TamilDialectId } from '../types';
import { safeApiFetch } from './apiClient';
import { validateAgentTurnResponse } from './safeJson';

export interface ConversationTurnInput {
  role: 'user' | 'assistant';
  text: string;
}

export interface ProcessAssistantMessageParams {
  message: string;
  history: ConversationTurnInput[];
  language: LanguageCode;
  tamilDialect?: TamilDialectId;
  token: string;
  signal?: AbortSignal;
  onTokenRefreshed?: (newToken: string, nextState?: SharedPlatformState) => void;
}

export interface ProcessAssistantResult {
  response: AgentTurnResponse;
  errorNotice?: string;
}

function getCalmFallbackReply(lang: LanguageCode, timedOut?: boolean): string {
  if (lang === 'ta') {
    return timedOut
      ? 'மன்னிக்கவும், பதில் வர சிறிது தாமதமாகிறது. நான் இங்கே இருக்கிறேன்; தயவுசெய்து மீண்டும் ஒருமுறை மெதுவாகச் சொல்லுங்கள்.'
      : 'மன்னிக்கவும், இப்போது இணைப்பில் சிறிய தடங்கல் உள்ளது. கவலைப்பட வேண்டாம், நான் உங்களுடன்தான் இருக்கிறேன்; சிறிது நேரம் கழித்து மீண்டும் பேசலாம்.';
  }
  if (lang === 'hi') {
    return timedOut
      ? 'क्षमा कीजिए, जवाब आने में थोड़ा समय लग रहा है। मैं यहीं हूँ, कृपया एक बार फिर आराम से बोलिए।'
      : 'क्षमा कीजिए, अभी संपर्क करने में थोड़ी परेशानी आई है। चिंता मत कीजिए, मैं यहीं आपके साथ हूँ; कृपया थोड़ी देर में फिर कोशिश करें।';
  }
  return timedOut
    ? 'Take your time. My reply took a moment longer than usual, so please say that once more when you are ready.'
    : 'I had a brief moment of trouble connecting just now. Please do not worry — I am right here with you. Could you say that again or type a quick note below?';
}

function sanitizeUserVisibleError(raw: string | undefined, lang: LanguageCode): string {
  if (!raw) {
    return lang === 'ta'
      ? 'உதவி சேவையுடன் இணைப்பதில் சிறிய தடங்கல் ஏற்பட்டுள்ளது.'
      : lang === 'hi'
      ? 'सहायक सेवा से जुड़ने में थोड़ी समस्या आई।'
      : 'A brief connection issue occurred. You can speak again or type below.';
  }

  // Never expose raw JSON syntax errors or technical trace text to the elderly user
  const lower = raw.toLowerCase();
  if (
    lower.includes('unexpected token') ||
    lower.includes('json') ||
    lower.includes('syntaxerror') ||
    lower.includes('undefined') ||
    lower.includes('fetch') ||
    lower.includes('abort')
  ) {
    return lang === 'ta'
      ? 'இப்போது பதில் பெற முடியவில்லை. மீண்டும் முயற்சிக்கலாம்.'
      : lang === 'hi'
      ? 'अभी जवाब प्राप्त नहीं हो सका। हम फिर से कोशिश कर सकते हैं।'
      : 'I could not reach the assistant just now, but we can try again right away.';
  }

  return raw;
}

export async function processAssistantMessage(
  params: ProcessAssistantMessageParams
): Promise<ProcessAssistantResult> {
  const cleanMessage = String(params.message ?? '').trim();
  const safeHistory = (Array.isArray(params.history) ? params.history : [])
    .filter(
      (item) =>
        item &&
        (item.role === 'user' || item.role === 'assistant') &&
        typeof item.text === 'string' &&
        item.text.trim().length > 0
    )
    .slice(-12)
    .map((item) => ({
      role: item.role,
      text: item.text.trim(),
    }));

  const result = await safeApiFetch<unknown>('/api/ai/converse', {
    method: 'POST',
    token: params.token,
    role: 'elder',
    timeoutMs: 20000,
    signal: params.signal,
    onTokenRefreshed: params.onTokenRefreshed,
    body: JSON.stringify({
      message: cleanMessage,
      history: safeHistory,
      language: params.language,
      tamilDialect: params.tamilDialect,
    }),
  });

  if (result.ok && result.data) {
    const validated = validateAgentTurnResponse(result.data, params.language);
    if (validated) {
      return { response: validated };
    }
  }

  const fallbackText = getCalmFallbackReply(params.language, result.timedOut);
  return {
    response: {
      replyText: fallbackText,
      activeAgents: ['Personal Companion Agent'],
      language: params.language,
      usedFallback: true,
    },
    errorNotice: sanitizeUserVisibleError(result.error, params.language),
  };
}
