import type { Role, SharedPlatformState } from '../types';
import { safeReadResponseJson } from './safeJson';

export interface SafeApiResult<T = { state?: SharedPlatformState; error?: string }> {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
  refreshedToken?: string;
  timedOut?: boolean;
}

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export async function safeApiFetch<T = { state?: SharedPlatformState; error?: string }>(
  url: string,
  options: RequestInit & {
    token?: string;
    role?: Role;
    timeoutMs?: number;
    onTokenRefreshed?: (newToken: string, nextState?: SharedPlatformState) => void;
  } = {}
): Promise<SafeApiResult<T>> {
  const { token, role, timeoutMs = 15000, onTokenRefreshed, headers, signal, ...rest } = options;

  const makeRequest = async (activeToken?: string): Promise<Response> => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);

    const onExternalAbort = () => controller.abort();
    if (signal) {
      if (signal.aborted) controller.abort();
      else signal.addEventListener('abort', onExternalAbort, { once: true });
    }

    try {
      const mergedHeaders: Record<string, string> = {
        ...(rest.body ? { 'Content-Type': 'application/json' } : {}),
        ...(headers as Record<string, string> | undefined),
      };
      if (activeToken) {
        mergedHeaders.Authorization = `Bearer ${activeToken}`;
      }
      return await fetch(url, {
        ...rest,
        headers: mergedHeaders,
        signal: controller.signal,
      });
    } finally {
      window.clearTimeout(timer);
      if (signal) {
        signal.removeEventListener('abort', onExternalAbort);
      }
    }
  };

  let res: Response | null = null;
  let lastErr: unknown = null;

  // Retry once on transient network errors (do not retry if caller aborted)
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      res = await makeRequest(token);
      break;
    } catch (err) {
      lastErr = err;
      const isAbort = err instanceof Error && err.name === 'AbortError';
      if (attempt === 0 && !isAbort) {
        await sleep(350);
      } else {
        break;
      }
    }
  }

  if (!res) {
    const isTimeout = lastErr instanceof Error && lastErr.name === 'AbortError';
    return {
      ok: false,
      status: 0,
      data: null,
      timedOut: isTimeout,
      error: isTimeout
        ? 'The service took too long to respond. Please try again gently.'
        : 'Connection is temporarily unavailable. Please try again.',
    };
  }

  // If elder session expired after a server restart, silently re-establish elder session and retry once
  if (res.status === 401 && (!role || role === 'elder')) {
    try {
      const bootRes = await fetch('/api/auth/elder-session', { method: 'POST' });
      if (bootRes.ok) {
        const bootParsed = await safeReadResponseJson<{
          token?: string;
          state?: SharedPlatformState;
        } | null>(bootRes, null);
        const bootData = bootParsed.data;
        if (bootData?.token) {
          onTokenRefreshed?.(bootData.token, bootData.state);
          res = await makeRequest(bootData.token);
          const retryParsed = await safeReadResponseJson<T | null>(res, null);
          const errText =
            (retryParsed.data as { error?: string } | null)?.error ||
            (res.ok ? undefined : 'Could not complete the request. Please try again.');
          return {
            ok: res.ok,
            status: res.status,
            data: retryParsed.data,
            refreshedToken: bootData.token,
            error: errText,
          };
        }
      }
    } catch {
      // fall through cleanly
    }
  }

  const parsed = await safeReadResponseJson<T | null>(res, null);
  const parsedError = (parsed.data as { error?: string } | null)?.error;
  return {
    ok: res.ok,
    status: res.status,
    data: parsed.data,
    error: res.ok
      ? undefined
      : parsedError || 'The service is momentarily busy. Please try again.',
  };
}
