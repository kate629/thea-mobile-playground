import React from 'react';
import { act, render } from '@testing-library/react';
import { useTypewriterHero, TypewriterHeroViewProps } from './useTypewriterHero';
import { ScenarioCard } from './scenarios';

const SCENARIOS: ScenarioCard[] = [
  {
    scenario: 'ab',
    productImage: '/img-A.jpg',
    productName: 'A',
    rotation: 0,
  },
  {
    scenario: 'cd',
    productImage: '/img-B.jpg',
    productName: 'B',
    rotation: 0,
  },
];

const TYPE_SPEED_MS = 10;
const TYPING_HOLD_MS = 30;
const FULL_TEXT_HOLD_MS = 40;
const SWAP_MS = 20;

interface HarnessProps {
  onState: (s: TypewriterHeroViewProps) => void;
}

const Harness: React.FC<HarnessProps> = ({ onState }) => {
  const view = useTypewriterHero(SCENARIOS, {
    typeSpeedMs: TYPE_SPEED_MS,
    typingHoldMs: TYPING_HOLD_MS,
    fullTextHoldMs: FULL_TEXT_HOLD_MS,
    swapMs: SWAP_MS,
  });
  React.useEffect(() => {
    onState(view);
  });
  return null;
};

describe('useTypewriterHero', () => {
  let originalFonts: PropertyDescriptor | undefined;

  beforeEach(() => {
    jest.useFakeTimers();
    /* In jsdom, document.fonts may be missing or its `ready` may be a real
       Promise that never resolves under fake timers. Force document.fonts
       to undefined so the hook takes the synchronous-fallback branch
       (window.setTimeout(start, 200)) which jest fake timers can advance. */
    originalFonts = Object.getOwnPropertyDescriptor(document, 'fonts');
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: undefined,
    });
  });
  afterEach(() => {
    jest.useRealTimers();
    if (originalFonts) {
      Object.defineProperty(document, 'fonts', originalFonts);
    } else {
      delete (document as { fonts?: unknown }).fonts;
    }
  });

  test('regression (bug #1): next scenario card is NEVER visible at the swap → typing transition', () => {
    /* The bug: when the cycle advanced from one scenario to the next, the
       hidden card briefly rendered with the NEW image at full opacity for one
       frame before fading out. The visible "flash" Kate reported.

       Root cause: showCard was only set to false inside a useEffect listening
       on typingDone. When the swap-phase setTimeout fired, it batched state
       updates that flipped displayedIndex to NEW and reset typedCount=1
       (typingDone goes true→false). That render landed BEFORE the effect ran,
       so for one frame the new card image showed with cardVisible=true.

       Fix: setShowCard(false) is called synchronously inside the swap-phase
       callback in the same setState batch that flips displayedIndex.

       This test asserts the invariant: across the entire cycle, there is no
       observed render where the displayed image is scenario[1] AND
       cardVisible is true UNTIL after the second scenario has finished
       typing — i.e. the new card never pops in mid-typing. */
    const observed: TypewriterHeroViewProps[] = [];
    render(<Harness onState={(s) => observed.push(s)} />);

    /* Run enough virtual time to traverse: font-ready (200ms) + first
       scenario typing (2 chars * 10ms) + typingHold (30ms) + fullTextHold
       (40ms) + swap (20ms) + into next scenario typing. Total ~320ms. We
       step in 10ms increments because each timer callback enqueues the
       NEXT setTimeout, and advanceTimersByTime fires all timers within the
       window in one synchronous pass — but React state updates between
       them schedule new timers that need their own act flush. */
    for (let t = 0; t < 60; t++) {
      act(() => {
        jest.advanceTimersByTime(10);
      });
    }

    /* Find the first render where displayed image is scenario[1]. */
    const firstNewCardIdx = observed.findIndex(
      (s) => s.productCard.image === SCENARIOS[1].productImage,
    );
    expect(firstNewCardIdx).toBeGreaterThan(-1);

    /* From that render forward, until typing of the new scenario is done,
       cardVisible MUST stay false. The flash bug would show as a render
       where productCard.image === SCENARIOS[1] AND cardVisible === true AND
       typedCount < scenario[1].length (i.e. mid-typing of the new card). */
    const offendingRenders = observed.filter((s, i) => {
      if (i < firstNewCardIdx) return false;
      const showingNewCard = s.productCard.image === SCENARIOS[1].productImage;
      const stillTyping = s.typedCount < SCENARIOS[1].scenario.length;
      return showingNewCard && stillTyping && s.cardVisible;
    });
    expect(offendingRenders).toEqual([]);
  });

  test('first scenario card is visible at first paint (LCP optimization preserved)', () => {
    /* The fix must not break the existing LCP behavior: the very first card
       is shown immediately, before any cycling has happened. */
    const observed: TypewriterHeroViewProps[] = [];
    render(<Harness onState={(s) => observed.push(s)} />);
    expect(observed[0].cardVisible).toBe(true);
    expect(observed[0].productCard.image).toBe(SCENARIOS[0].productImage);
  });
});
