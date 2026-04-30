/**
 * Meta Conversions API (CAPI) — server-side conversion forwarding.
 *
 * The browser-side Meta pixel (`fbq()`) drops 50-70% of paid-social
 * conversions to iOS 14.5 ATT, ad blockers, and third-party cookie
 * restrictions. CAPI bypasses all of that by sending the event from our
 * server directly to Meta's Graph API.
 *
 * How dedup works (this is the key thing): for every event fire we
 * generate ONE `event_id` and pass it to both `fbq()` (4th arg
 * `{eventID}`) and our CAPI endpoint. Meta dedupes by `event_name + event_id`
 * so:
 *   - Both arrive → counted once (best case, normal user)
 *   - Only FE pixel arrives → counted once (no CAPI implementation issue)
 *   - Only CAPI arrives → counted once (the recovery — iOS ATT user, ad
 *     blocker user, etc.)
 *
 * Why fetch + keepalive instead of sendBeacon: keepalive supports
 * `Content-Type: application/json` and arbitrary headers; sendBeacon
 * can't send JSON without CORS preflight. Both survive page unload, but
 * keepalive is more flexible. sendBeacon is the documented fallback for
 * older browsers.
 *
 * Endpoint (`/api/meta-capi`): same-origin, routed via Firebase Hosting
 * rewrite to the `metaCapiEvent` Cloud Function. Same-origin avoids the
 * CORS preflight roundtrip (saves ~100ms on every fire) and means we
 * don't need any CORS configuration on the Hosting side.
 */
import { isBot } from './botDetect';

/** Events Meta CAPI knows about that we currently forward. Add new entries
 *  here AND in `mutations/handle_meta_capi_event.py:ALLOWED_EVENT_NAMES`. */
export type CapiEventName =
  | 'PageView'
  | 'ViewContent'   // Maps to product_click (affiliate click-out).
  | 'AddToWishlist' // Maps to product_saved (heart on product card).
  | 'Lead';         // Maps to quiz_complete.

interface CapiEventPayload {
  event_name: CapiEventName;
  event_id: string;
  event_source_url: string;
  fbp?: string;
  fbc?: string;
  /** SHA-256 hashed email — caller's responsibility to hash. */
  em?: string;
  /** SHA-256 hashed phone — caller's responsibility to hash. */
  ph?: string;
  custom_data?: Record<string, unknown>;
}

const CAPI_ENDPOINT = '/api/meta-capi';

/** RFC4122-ish v4 UUID. Good enough for Meta's dedup key — the only requirement
 *  is "unique within the dedup window" and 122 random bits clears that easily. */
export function generateEventId(): string {
  // Prefer crypto.randomUUID when available (all modern browsers); fall back
  // to a Math.random-based generator for older webviews. Meta doesn't care
  // about UUID validity per se, just uniqueness, so the fallback is safe.
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Read a cookie by name. Returns undefined if not present. Used for `_fbp` and
 *  `_fbc` which Meta's pixel script sets on first PageView. */
function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${name}=([^;]+)`),
  );
  return match ? decodeURIComponent(match[1]) : undefined;
}

/** Read fbclid from URL (Meta-set click-through ID) and synthesize a `_fbc`
 *  cookie value if Meta's pixel hasn't done it yet. Per Meta's spec:
 *    fbc = "fb.1.<creation_unix_ms>.<fbclid>"
 *  This matters because mobile webviews can drop cookies before the pixel
 *  reads them; pulling fbclid directly from the URL is more reliable. */
function readFbcOrSynthesize(): string | undefined {
  const fromCookie = readCookie('_fbc');
  if (fromCookie) return fromCookie;
  if (typeof window === 'undefined') return undefined;
  const fbclid = new URLSearchParams(window.location.search).get('fbclid');
  if (!fbclid) return undefined;
  return `fb.1.${Date.now()}.${fbclid}`;
}

interface SendOptions {
  /** SHA-256 hash of email if available. Pass undefined for anonymous fires. */
  emailHash?: string;
  /** SHA-256 hash of phone number if available. */
  phoneHash?: string;
  /** Event-specific payload (currency, value, content_ids, etc.). Typed as
   *  `unknown` keys-and-values so callers can pass typed event-param interfaces
   *  (e.g. ViewContentParams) without a verbose cast at the call site. */
  customData?: Record<string, unknown> | object;
}

/**
 * Send a single event to our CAPI endpoint. Fire-and-forget; never throws.
 *
 * Returns the `event_id` so the caller can pass it to `fbq()` for dedup:
 *   const id = sendCapiEvent('PageView');
 *   window.fbq('track', 'PageView', {}, { eventID: id });
 *
 * Pre-generated event_id can be passed in via `eventId` to keep both fires
 * synchronous (no async dependency between fbq and CAPI).
 */
export function sendCapiEvent(
  eventName: CapiEventName,
  eventId: string,
  options: SendOptions = {},
): void {
  if (typeof window === 'undefined') return;
  if (isBot()) return; // Same bot guard as the FE pixel — keep symmetric.

  const payload: CapiEventPayload = {
    event_name: eventName,
    event_id: eventId,
    event_source_url: window.location.href,
  };

  const fbp = readCookie('_fbp');
  if (fbp) payload.fbp = fbp;

  const fbc = readFbcOrSynthesize();
  if (fbc) payload.fbc = fbc;

  if (options.emailHash) payload.em = options.emailHash;
  if (options.phoneHash) payload.ph = options.phoneHash;
  if (options.customData) {
    payload.custom_data = options.customData as Record<string, unknown>;
  }

  // `keepalive: true` makes the request survive page unload — critical for
  // bouncing users where the FE pixel's idle-callback fire might never run.
  // We don't await the promise; CAPI is best-effort and must never block paint.
  try {
    fetch(CAPI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      // Network errors are expected on flaky mobile connections. The FE
      // pixel is firing in parallel — losing CAPI on top of pixel-loss is
      // a small additional fraction we accept rather than retry-loop on.
    });
  } catch {
    // Older browsers without `keepalive` will throw — fall back to sendBeacon.
    try {
      navigator.sendBeacon?.(
        CAPI_ENDPOINT,
        new Blob([JSON.stringify(payload)], { type: 'application/json' }),
      );
    } catch {
      // Even sendBeacon failed. Give up silently — pixel-only attribution
      // for this user. They'll be one of the population CAPI was meant to
      // help; we can't help everyone.
    }
  }
}
