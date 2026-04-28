/**
 * Bot / headless-browser detection.
 *
 * Used to suppress analytics + pixel calls for headless / scripted traffic so
 * Meta attribution numbers reflect real humans only. Ported verbatim from the
 * old givethea.com codebase (`src/lib/botDetect.ts`).
 *
 * Flip BOT_DETECTION_ENABLED to `false` as a kill switch if it ever
 * misclassifies real users.
 */
const BOT_DETECTION_ENABLED = true;

let _isBot: boolean | null = null;

function detectBot(): boolean {
  if (!BOT_DETECTION_ENABLED) return false;

  try {
    // 1. navigator.webdriver — standard headless flag
    if (navigator.webdriver === true) return true;

    const ua = navigator.userAgent || '';
    const isChrome = /Chrome\//.test(ua) && !/Edg\//.test(ua);
    const isMobile = /Mobi|Android/i.test(ua);

    // 2. window.chrome missing on a desktop Chrome UA (headless Chrome lacks it)
    if (isChrome && !isMobile && !(window as unknown as { chrome?: unknown }).chrome) return true;

    // 3. Screen dimensions 0×0
    const scr = typeof window !== 'undefined' ? window.screen : undefined;
    if (scr && scr.width === 0 && scr.height === 0) return true;

    // 4. navigator.languages empty/undefined (real browsers always have this)
    if (!navigator.languages || navigator.languages.length === 0) return true;

    // 5. No plugins on desktop Chrome (headless typically has 0; skip mobile & non-Chrome)
    if (isChrome && !isMobile && navigator.plugins && navigator.plugins.length === 0) return true;
  } catch {
    // If any check throws, assume human — don't block real users.
    return false;
  }

  return false;
}

/** Returns true if the current visitor is likely a bot. Cached after first call. */
export function isBot(): boolean {
  if (_isBot === null) {
    _isBot = detectBot();
  }
  return _isBot;
}

/** Test-only — clears the cached result so different UAs can be exercised. */
export function _resetBotCacheForTesting(): void {
  _isBot = null;
}
