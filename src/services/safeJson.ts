import type { AgentProposal, AgentTurnResponse, LanguageCode } from '../types';

export interface SafeJsonParseResult<T> {
  ok: boolean;
  value: T;
  error?: string;
}

/**
 * Safely parse a value that is expected to be a JSON object or array string.
 * Never passes undefined, non-strings, HTML, or plain speech transcripts into JSON.parse.
 */
export function safeJsonParse<T>(raw: unknown, fallback: T): SafeJsonParseResult<T> {
  if (typeof raw !== 'string') {
    return { ok: false, value: fallback, error: 'Response was not text.' };
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, value: fallback, error: 'Response was empty.' };
  }

  // Only attempt JSON.parse if payload starts like a JSON object or array
  const firstChar = trimmed[0];
  if (firstChar !== '{' && firstChar !== '[') {
    return { ok: false, value: fallback, error: 'Response was plain text rather than structured data.' };
  }

  try {
    const parsed = JSON.parse(trimmed) as T;
    if (parsed === null || typeof parsed !== 'object') {
      return { ok: false, value: fallback, error: 'Parsed data was not an object.' };
    }
    return { ok: true, value: parsed };
  } catch {
    return { ok: false, value: fallback, error: 'Malformed data received from server.' };
  }
}

/**
 * Safely reads a Fetch Response body as text first, then parses JSON only if valid.
 * Prevents "Unexpected token '<'" or "Invalid JSON" errors on HTML/text error responses.
 */
export async function safeReadResponseJson<T>(
  res: Response,
  fallback: T
): Promise<{ ok: boolean; data: T; isJson: boolean }> {
  try {
    const rawText = await res.text();
    const parsed = safeJsonParse<T>(rawText, fallback);
    if (!parsed.ok) {
      return { ok: false, data: fallback, isJson: false };
    }
    return { ok: true, data: parsed.value, isJson: true };
  } catch {
    return { ok: false, data: fallback, isJson: false };
  }
}

const VALID_ACTIONS = new Set<AgentProposal['actionType']>([
  'book_appointment',
  'book_transport',
  'mark_medicine_taken',
  'log_water',
  'add_reminder',
  'save_memory',
  'trigger_emergency_review',
]);

export function validateAgentTurnResponse(
  raw: unknown,
  fallbackLanguage: LanguageCode
): AgentTurnResponse | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const obj = raw as Record<string, unknown>;
  const replyText = typeof obj.replyText === 'string' ? obj.replyText.trim() : '';
  if (!replyText) {
    return null;
  }

  const activeAgents = Array.isArray(obj.activeAgents)
    ? obj.activeAgents.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : ['Personal Companion Agent'];

  const language: LanguageCode =
    obj.language === 'ta' || obj.language === 'hi' || obj.language === 'en'
      ? obj.language
      : fallbackLanguage;

  let proposal: AgentProposal | undefined;
  if (obj.proposal && typeof obj.proposal === 'object') {
    const p = obj.proposal as Record<string, unknown>;
    const actionType = p.actionType as AgentProposal['actionType'];
    if (
      typeof p.id === 'string' &&
      typeof p.agentName === 'string' &&
      VALID_ACTIONS.has(actionType) &&
      typeof p.title === 'string' &&
      typeof p.summary === 'string'
    ) {
      proposal = {
        id: p.id,
        agentName: p.agentName,
        actionType,
        title: p.title,
        summary: p.summary,
        payload:
          p.payload && typeof p.payload === 'object' && !Array.isArray(p.payload)
            ? (p.payload as Record<string, unknown>)
            : {},
      };
    }
  }

  return {
    replyText,
    activeAgents: activeAgents.length > 0 ? activeAgents : ['Personal Companion Agent'],
    proposal,
    language,
    usedFallback: Boolean(obj.usedFallback),
  };
}
