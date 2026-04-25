import { useEffect, useRef, useState } from 'react';
import { HeroHeaderProps } from './HeroHeader';
import {
  ScenarioCard,
  TYPE_SPEED_MS,
  TYPING_HOLD_MS,
  FULL_TEXT_HOLD_MS,
  SWAP_MS,
} from './scenarios';

type Phase = 'typing' | 'hold' | 'swap';

/** Slice of the View's prop type that the hook drives. */
export type TypewriterHeroViewProps = Pick<
  HeroHeaderProps,
  'phrase' | 'typedCount' | 'cursorVisible' | 'productCard' | 'peekImages' | 'cardVisible'
>;

export interface TypewriterHeroOptions {
  typeSpeedMs?: number;
  typingHoldMs?: number;
  fullTextHoldMs?: number;
  swapMs?: number;
  /**
   * If false, the hook returns a frozen "first scenario, fully typed" snapshot
   * and never starts the loop. Lets a parent disable motion (e.g. for prefers-
   * reduced-motion) without removing the Container.
   */
  enabled?: boolean;
}

/**
 * Owns the three-phase state machine (typing → hold → swap) for the typewriter
 * hero. Mirrors the source at
 * 3-12-sovrn-launch-version/src/components/HeroHeader.tsx:74-159.
 *
 * - Types one char per `typeSpeedMs`.
 * - On typing complete: holds `typingHoldMs`, then enters `hold` phase.
 * - On hold complete: holds `fullTextHoldMs`, then enters `swap` phase.
 * - On swap complete: advances to next scenario after `swapMs`, restarts at typing.
 *
 * Image swap is locked to the rising edge of `typingDone` via `prevTypingDoneRef`,
 * so the displayed card flips to the new scenario the moment the new phrase
 * finishes typing — never mid-type.
 *
 * Loop is gated on `document.fonts.ready` + 200ms to avoid FOUT.
 */
export function useTypewriterHero(
  scenarios: ScenarioCard[],
  opts: TypewriterHeroOptions = {},
): TypewriterHeroViewProps {
  const {
    typeSpeedMs = TYPE_SPEED_MS,
    typingHoldMs = TYPING_HOLD_MS,
    fullTextHoldMs = FULL_TEXT_HOLD_MS,
    swapMs = SWAP_MS,
    enabled = true,
  } = opts;

  const [activeIndex, setActiveIndex] = useState(0);
  const [displayedIndex, setDisplayedIndex] = useState(0);
  const [typedCount, setTypedCount] = useState(0);
  const [phase, setPhase] = useState<Phase>('typing');
  const [heroReady, setHeroReady] = useState(false);
  const [showCard, setShowCard] = useState(false);

  const activeCard = scenarios[activeIndex];
  const displayedCard = scenarios[displayedIndex];
  const phrase = activeCard.scenario;
  const typingDone = typedCount >= phrase.length;
  const prevTypingDoneRef = useRef(false);

  /* Rising-edge image swap: only flip the displayed card the first frame
     typedCount reaches phrase.length. Without the ref, displayedIndex
     would re-flip every render while typing was complete. */
  useEffect(() => {
    if (typingDone && !prevTypingDoneRef.current) {
      setDisplayedIndex(activeIndex);
    }
    prevTypingDoneRef.current = typingDone;
  }, [typingDone, activeIndex]);

  /* 400ms grace period after typing finishes before fading the card in. */
  useEffect(() => {
    if (typingDone) {
      const t = window.setTimeout(() => setShowCard(true), 400);
      return () => window.clearTimeout(t);
    }
    setShowCard(false);
    return undefined;
  }, [typingDone]);

  /* Wait for fonts before starting (avoids FOUT on the typewriter line). */
  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    const start = () =>
      window.setTimeout(() => {
        if (!cancelled) setHeroReady(true);
      }, 200);
    if (typeof document !== 'undefined' && document.fonts) {
      if (document.fonts.status === 'loaded') {
        start();
      } else {
        document.fonts.ready.then(() => {
          if (!cancelled) start();
        });
      }
    } else {
      start();
    }
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  /* The driver loop. Single setTimeout keyed by phase + typedCount. */
  useEffect(() => {
    if (!enabled || !heroReady) return undefined;

    const delay =
      phase === 'typing'
        ? typedCount < phrase.length
          ? typeSpeedMs
          : typingHoldMs
        : phase === 'hold'
          ? fullTextHoldMs
          : swapMs;

    const id = window.setTimeout(() => {
      if (phase === 'typing') {
        if (typedCount < phrase.length) {
          setTypedCount((n) => n + 1);
        } else {
          setPhase('hold');
        }
        return;
      }
      if (phase === 'hold') {
        setPhase('swap');
        return;
      }
      // phase === 'swap'
      const nextIndex = (activeIndex + 1) % scenarios.length;
      setDisplayedIndex(nextIndex);
      setActiveIndex(nextIndex);
      setTypedCount(1);
      setPhase('typing');
    }, delay);

    return () => window.clearTimeout(id);
  }, [
    enabled,
    heroReady,
    phase,
    typedCount,
    phrase.length,
    activeIndex,
    scenarios.length,
    typeSpeedMs,
    typingHoldMs,
    fullTextHoldMs,
    swapMs,
  ]);

  const cardVisible = heroReady && showCard && phase !== 'swap';

  return {
    phrase,
    typedCount,
    cursorVisible: !typingDone,
    productCard: {
      image: displayedCard.productImage,
      name: displayedCard.productName,
      brand: displayedCard.brand,
      rotation: displayedCard.rotation,
    },
    peekImages: displayedCard.peekImages,
    cardVisible,
  };
}
