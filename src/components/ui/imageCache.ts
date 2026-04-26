import { useEffect, useState, RefObject } from 'react';

/**
 * Module-level Set of image URLs that have already started loading on this
 * page session. Survives navigation between routes; cleared only on a hard
 * reload. Used by OccasionProductCard so a card that has already been seen
 * once renders its <picture> immediately on re-mount instead of going through
 * the IntersectionObserver placeholder dance again.
 *
 * The browser HTTP cache holds the actual bytes — Firebase Storage URLs are
 * unique per backfill (?token=...), so cache hits are effectively forever.
 */
export const loadedImageUrls = new Set<string>();

export const markImageLoaded = (url: string | undefined) => {
  if (url) loadedImageUrls.add(url);
};

export const isImageCached = (url: string | undefined) =>
  Boolean(url && loadedImageUrls.has(url));

/**
 * Returns true once the observed element has intersected the viewport (with
 * a generous rootMargin to start loading shortly before scroll-into-view).
 * Sticky: once true, stays true so we never unmount loaded images.
 *
 * Falls back to true immediately if IntersectionObserver is unavailable
 * (older browsers, jsdom test environment).
 */
export const useInViewportOnce = (
  ref: RefObject<Element>,
  rootMargin = '400px 400px',
): boolean => {
  const [seen, setSeen] = useState(() => typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    if (seen) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, rootMargin, seen]);

  return seen;
};
