import { useEffect, useState } from 'react';
import {
  AMBIENT_POSITIONS,
  AmbientSlot,
  ProductImage,
} from './AmbientProductScroll';

const CYCLE_INTERVAL_MS = 1200;
const STAGGER_OFFSET_MS = 400;
const FADE_OUT_MS = 300;

const SLOT_COUNT = AMBIENT_POSITIONS.length;

/**
 * Drives the staggered fade-cycle for `AmbientProductScroll`. Each of the 6
 * slots independently fades out, advances to the next image, and fades back
 * in on a 1.2s cycle, offset 400ms per slot to prevent a single global flash.
 */
export function useAmbientScroll(images: ProductImage[]): AmbientSlot[] {
  const [indices, setIndices] = useState<number[]>(() => Array.from({ length: SLOT_COUNT }, (_, i) => i));
  const [visible, setVisible] = useState<boolean[]>(() => new Array(SLOT_COUNT).fill(true));

  // Spread the initial slot indices across the available image pool whenever
  // the pool size changes.
  useEffect(() => {
    if (images.length === 0) return;
    setIndices(Array.from({ length: SLOT_COUNT }, (_, i) => i % images.length));
    setVisible(new Array(SLOT_COUNT).fill(true));
  }, [images.length]);

  // Stagger each slot's cycle independently.
  useEffect(() => {
    if (images.length <= 1) return;
    const activeSlots = Math.min(SLOT_COUNT, images.length);
    const timers: ReturnType<typeof setTimeout>[] = [];

    for (let slot = 0; slot < activeSlots; slot++) {
      const start = setTimeout(() => {
        const interval = setInterval(() => {
          setVisible((prev) => {
            const next = [...prev];
            next[slot] = false;
            return next;
          });
          const swap = setTimeout(() => {
            setIndices((prev) => {
              const next = [...prev];
              next[slot] = (next[slot] + activeSlots) % images.length;
              return next;
            });
            setVisible((prev) => {
              const next = [...prev];
              next[slot] = true;
              return next;
            });
          }, FADE_OUT_MS);
          timers.push(swap);
        }, CYCLE_INTERVAL_MS);
        timers.push(interval as unknown as ReturnType<typeof setTimeout>);
      }, slot * STAGGER_OFFSET_MS);
      timers.push(start);
    }

    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.forEach((t) => clearInterval(t as unknown as number));
    };
  }, [images.length]);

  if (images.length === 0) {
    return new Array(SLOT_COUNT).fill(null).map(() => ({ image: null, visible: false }));
  }

  return Array.from({ length: SLOT_COUNT }, (_, i) => ({
    image: images[indices[i] % images.length],
    visible: visible[i],
  }));
}
