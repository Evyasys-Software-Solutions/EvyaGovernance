/**
 * HTTP POST helper with retry policy tuned for team-scale batch operations.
 *
 * Retries on:      408 (timeout), 429 (rate-limit — honours Retry-After), 5xx, transient network
 * Does NOT retry:  4xx client errors (config/auth — user must fix)
 * Fails fast on:   ENOTFOUND, ECONNREFUSED, EHOSTUNREACH (definitively unreachable — no point waiting)
 *
 * A 50-story batch calling into an unreachable Teams webhook now fails in ~50ms per attempt
 * instead of ~7 seconds of pointless exponential backoff.
 */

const DEFAULT_RETRIES        = 2;
const DEFAULT_BASE_DELAY_MS  = 1000;
const MAX_RETRY_AFTER_MS     = 30_000; // cap server-instructed waits at 30s
const FATAL_NETWORK_CODES    = new Set(['ENOTFOUND', 'ECONNREFUSED', 'EHOSTUNREACH', 'EAI_AGAIN']);

function isFatalNetworkError(err) {
  const code = err && (err.code || (err.cause && err.cause.code));
  return code && FATAL_NETWORK_CODES.has(code);
}

/**
 * Parse Retry-After header — seconds (integer) or HTTP-date. Returns ms or null.
 */
function parseRetryAfter(value) {
  if (!value) return null;
  const asNum = Number(value);
  if (!Number.isNaN(asNum)) return Math.min(asNum * 1000, MAX_RETRY_AFTER_MS);
  const asDate = Date.parse(value);
  if (!Number.isNaN(asDate)) return Math.max(0, Math.min(asDate - Date.now(), MAX_RETRY_AFTER_MS));
  return null;
}

/**
 * @param {string} url
 * @param {object} body — JSON-serialisable body
 * @param {object} [opts]
 * @param {number} [opts.retries=2]         — number of retries after the first attempt
 * @param {number} [opts.baseDelayMs=1000]  — delay before first retry; doubles each attempt
 * @returns {Promise<{ ok: boolean, status: number, body: string, attempt: number }>}
 * @throws Error only on the final failure. Includes attempt count in the message.
 */
async function postJsonWithRetry(url, body, opts = {}) {
  const retries     = opts.retries ?? DEFAULT_RETRIES;
  const baseDelayMs = opts.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;

  // Resolve fetch upfront — fail fast if neither built-in nor node-fetch is available.
  let fetchFn = typeof fetch !== 'undefined' ? fetch : null;
  if (!fetchFn) {
    try { fetchFn = require('node-fetch'); }
    catch { throw new Error('HTTP client unavailable: this Node runtime has no built-in fetch and node-fetch is not installed.'); }
  }

  const payload = JSON.stringify(body);
  let lastErr = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchFn(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    payload,
      });

      if (res.ok) {
        return { ok: true, status: res.status, body: '', attempt: attempt + 1 };
      }

      const status    = res.status;
      const respBody  = await res.text().catch(() => '');
      const retriable = status === 408 || status === 429 || status >= 500;

      if (!retriable || attempt === retries) {
        throw new Error(`HTTP ${status} after ${attempt + 1} attempt(s): ${respBody.slice(0, 200)}`);
      }

      // 429: honour Retry-After if the server sent one; otherwise use exponential backoff.
      const retryAfter = status === 429 ? parseRetryAfter(res.headers.get('retry-after')) : null;
      const wait       = retryAfter ?? (baseDelayMs * Math.pow(2, attempt));
      lastErr = new Error(`HTTP ${status}: ${respBody.slice(0, 200)}`);
      await new Promise(r => setTimeout(r, wait));
      continue;
    } catch (err) {
      // Definitive network errors: no point retrying — fail fast.
      if (isFatalNetworkError(err)) {
        throw new Error(`Network unreachable (${err.code || err.message}) — no retry attempted.`);
      }
      lastErr = err;
      if (attempt === retries) throw lastErr;
      await new Promise(r => setTimeout(r, baseDelayMs * Math.pow(2, attempt)));
    }
  }

  throw lastErr || new Error('postJsonWithRetry: unknown failure');
}

module.exports = { postJsonWithRetry, isFatalNetworkError, parseRetryAfter };
