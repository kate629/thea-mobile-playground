import { useEffect, useState } from 'react';

interface UseImagesPreloadedOptions {
  /** How many of the leading URLs to require before flipping `ready`. Default 3. */
  firstN?: number;
  /** Safety-net cap. After this many ms with `ready === false`, flip to true
   *  anyway so a single slow/broken CDN request can't strand the loading
   *  state forever. Default 30000 (30s). */
  timeoutMs?: number;
}

// Track when the first N URLs from a list have completed their browser-side
// fetch (load OR error — broken images shouldn't block forever). Bug #50:
// the gift-recs page was flipping from a polished loading aesthetic to
// real carousels before the network had delivered the product images, so
// users saw flat grey boxes for ~2-3 seconds. This hook gates the flip on
// real image readiness — by the time `ready === true`, the first N images
// are in the browser cache and will paint instantly.
//
// Sticky once `ready` flips true. Re-runs as `urls` changes (kicks off
// `new Image()` for each new entry; the browser dedupes the actual HTTP
// fetch by URL so re-creating Image objects for the same URL is cheap).
export function useImagesPreloaded(
  urls: string[],
  options: UseImagesPreloadedOptions = {},
): boolean {
  const { firstN = 3, timeoutMs = 30000 } = options;
  const [ready, setReady] = useState(false);

  // Stable string key for the first N URLs — drives the effect dep so we
  // re-fire when the leading window changes but not on every parent render.
  // Filter falsy entries first so empty strings (e.g. a product with no
  // CDN image yet) don't consume one of the N slots.
  const urlKey = urls.filter(Boolean).slice(0, firstN).join('|');

  useEffect(() => {
    if (ready) return;
    const targets = urls.filter(Boolean).slice(0, firstN);
    if (targets.length === 0) return;

    let completed = 0;
    let cancelled = false;

    const tick = () => {
      completed++;
      if (!cancelled && completed >= targets.length) {
        setReady(true);
      }
    };

    targets.forEach((url) => {
      const img = new Image();
      img.onload = tick;
      img.onerror = tick;
      img.src = url;
    });

    const timer = window.setTimeout(() => {
      if (!cancelled) setReady(true);
    }, timeoutMs);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // urlKey covers content of `urls.slice(0, firstN)`; we don't want
    // `urls` itself in the deps because it's a fresh array on every parent
    // render even when content is unchanged.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlKey, firstN, timeoutMs, ready]);

  return ready;
}
