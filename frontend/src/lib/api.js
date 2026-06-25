import axios from 'axios';

// In dev, Vite proxies '/api' to the local backend (see vite.config.js).
// In production (frontend on Netlify, backend on Render/etc.), set
// VITE_API_URL to the deployed backend's full /api URL at build time.
const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({ baseURL: API_BASE });

// Attach JWT token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('scribe_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 — token expired.
// Auth endpoints (login/register/etc.) also return 401 for plain "wrong
// password" cases — those aren't an expired-session situation, so we must
// NOT force a hard redirect there. Doing so wiped the form and the error
// message before the page even had a chance to render it.
const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password', '/auth/verify-email'];

api.interceptors.response.use(
  res => res,
  err => {
    const url = err.config?.url || '';
    const isAuthEndpoint = AUTH_ENDPOINTS.some(p => url.includes(p));
    if (err.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('scribe_token');
      window.location.href = '/auth';
    }
    return Promise.reject(err);
  }
);

export default api;

// ─── FRIENDLY ERROR MESSAGES ───────────────────────────────────────────
// Anthropic / backend errors often arrive as raw JSON strings like:
// `400 {"type":"error","error":{"type":"invalid_request_error","message":"..."}}`
// This converts them into something a non-technical user can read.
export function friendlyError(raw) {
  if (!raw) return 'Something went wrong. Please try again or contact support.';
  const text = typeof raw === 'string' ? raw : (raw.message || JSON.stringify(raw));

  if (/credit balance is too low/i.test(text)) {
    return 'Your AI provider account is out of credits. Please add credits in your Anthropic billing settings, then try again.';
  }
  if (/invalid_api_key|authentication/i.test(text)) {
    return 'There’s a problem connecting to the AI service right now. Please try again shortly, or contact support if this continues.';
  }
  if (/rate_limit/i.test(text)) {
    return 'The AI is receiving too many requests right now. Please wait a moment and try again.';
  }
  if (/ANTHROPIC_API_KEY not set/i.test(text)) {
    return 'The AI service isn’t available right now. Please try again shortly, or contact support if this continues.';
  }
  // Looks like raw JSON / developer-facing output — don't show it
  if (/^\d{3}\s*\{/.test(text) || /"type"\s*:\s*"error"/.test(text)) {
    return 'Something went wrong generating your content. Please try again or contact support.';
  }
  return text;
}

// ─── STREAMING UTILITY ────────────────────────────────────────────────
// Handles fetch-based streaming from the backend SSE endpoints
export async function streamRequest(url, body, onChunk, onDone, onError) {
  const token = localStorage.getItem('scribe_token');
  // Call sites pass paths like '/api/generate/chapter'. In production the
  // backend lives on a different origin (Render), so resolve against the
  // same configurable base the axios client uses.
  const resolvedUrl = url.startsWith('/api') ? API_BASE + url.slice(4) : url;
  try {
    const response = await fetch(resolvedUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Request failed' }));
      onError?.(friendlyError(err.error) || 'Generation failed');
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep incomplete line

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') { onDone?.(); return; }
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) { onError?.(friendlyError(parsed.error)); return; }
          if (parsed.text) onChunk(parsed.text);
          if (parsed.suggestions !== undefined) { onDone?.(parsed.suggestions); return; }
        } catch (e) {
          // ignore parse errors on partial chunks
        }
      }
    }
    onDone?.();
  } catch (e) {
    onError?.(friendlyError(e.message) || 'Network error');
  }
}
