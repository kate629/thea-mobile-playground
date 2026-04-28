import React, { useEffect } from 'react';
import { SearchPill } from './SearchPill';
import type { SearchPillSegment } from '../../../theaWeb/hooks/useSearchPillState';

export default {
  title: 'Surfaces/Marketing/SearchPill',
  component: SearchPill,
  parameters: {
    happo: { targets: ['chrome-large', 'chrome-small'] },
    layout: 'padded',
  },
};

const PaddedFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ background: '#FAF7F2', padding: '64px 16px', minHeight: '600px' }}>
    {children}
  </div>
);

/**
 * Empty state — all three segments show placeholder copy. Sparkles disabled.
 */
export const Closed = {
  render: () => (
    <PaddedFrame>
      <SearchPill />
    </PaddedFrame>
  ),
};

/**
 * WHO dropdown open. Shows the full relationship grid + age chips.
 */
export const WhoOpen = {
  render: () => (
    <PaddedFrame>
      <SearchPill initialOpenSegment="who" disableOutsideClick />
    </PaddedFrame>
  ),
};

/**
 * WHAT dropdown open with no relationship picked — shows base occasions only
 * (no Mother's Day / Father's Day yet).
 */
export const WhatOpenNoRelationship = {
  render: () => (
    <PaddedFrame>
      <SearchPill initialOpenSegment="what" disableOutsideClick />
    </PaddedFrame>
  ),
};

/**
 * LIKES dropdown open with default (age=0) interest pills + freeform textarea.
 */
export const LikesOpen = {
  render: () => (
    <PaddedFrame>
      <SearchPill initialOpenSegment="likes" disableOutsideClick />
    </PaddedFrame>
  ),
};

/**
 * Story-only driver: mounts SearchPill, then synthetically clicks segments and
 * chips to reach a populated state without exposing a controlled API on the
 * production component. Uses programmatic clicks rather than wiring an
 * imperative handle (kept simple for visual coverage).
 */
const SeededPill: React.FC<{
  relationship?: string;
  age?: number;
  occasion?: string;
  interests?: string[];
  finalOpen?: SearchPillSegment | null;
}> = ({ relationship, age, occasion, interests = [], finalOpen = null }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const seededRef = React.useRef(false);

  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;
    const root = containerRef.current;
    if (!root) return;
    const click = (selector: string) => {
      const el = root.querySelector(selector) as HTMLButtonElement | null;
      if (el) el.click();
    };
    const clickByText = (text: string, scope: HTMLElement = root) => {
      const buttons = Array.from(scope.querySelectorAll('button')) as HTMLButtonElement[];
      const match = buttons.find((b) => b.textContent?.trim() === text);
      if (match) match.click();
    };

    // 1. Open WHO + pick relationship + age
    if (relationship || age) {
      click('[aria-haspopup="dialog"]'); // first segment = WHO
      const dropdown = root.querySelector('[role="dialog"]') as HTMLElement | null;
      if (dropdown) {
        if (relationship) clickByText(relationship, dropdown);
        if (age) {
          const ageLabel = { 25: '20s', 35: '30s', 45: '40s', 55: '50s', 65: '60s', 75: '70s' }[age];
          if (ageLabel) clickByText(ageLabel, dropdown);
        }
      }
    }

    // 2. Open WHAT + pick occasion
    if (occasion) {
      const segments = root.querySelectorAll('[aria-haspopup="dialog"]');
      const what = segments[1] as HTMLButtonElement | undefined;
      what?.click();
      const dropdown = root.querySelector('[role="dialog"]') as HTMLElement | null;
      if (dropdown) clickByText(occasion, dropdown);
    }

    // 3. Open LIKES + toggle interests
    if (interests.length > 0) {
      const segments = root.querySelectorAll('[aria-haspopup="dialog"]');
      const likes = segments[2] as HTMLButtonElement | undefined;
      likes?.click();
      const dropdown = root.querySelector('[role="dialog"]') as HTMLElement | null;
      if (dropdown) interests.forEach((i) => clickByText(i, dropdown));
    }

    // 4. Reach finalOpen state
    const segments = root.querySelectorAll('[aria-haspopup="dialog"]');
    const idxByName: Record<SearchPillSegment, number> = { who: 0, what: 1, likes: 2 };
    // Close any currently open dropdown first.
    const currentlyOpen = Array.from(segments).find(
      (s) => s.getAttribute('aria-expanded') === 'true',
    ) as HTMLButtonElement | undefined;
    if (currentlyOpen) currentlyOpen.click();
    if (finalOpen) {
      (segments[idxByName[finalOpen]] as HTMLButtonElement).click();
    }
  }, [relationship, age, occasion, interests, finalOpen]);

  return (
    <div ref={containerRef}>
      <SearchPill disableOutsideClick />
    </div>
  );
};

/**
 * Mom + 30s + Mother's Day + Cooking, Books, Plants — fully populated, sparkles enabled.
 */
export const FullyPopulated = {
  render: () => (
    <PaddedFrame>
      <SeededPill
        relationship="Mom"
        age={35}
        occasion="Mother's Day"
        interests={['Cooking', 'Books', 'Plants']}
      />
    </PaddedFrame>
  ),
};

/**
 * Dad + 60s + WHAT open — confirms Father's Day appears as the leading occasion
 * option (gendered occasion logic mirrored from useQuizFlow).
 */
export const DadWhatOpen = {
  render: () => (
    <PaddedFrame>
      <SeededPill relationship="Dad" age={65} finalOpen="what" />
    </PaddedFrame>
  ),
};

/**
 * Mom + 30s + LIKES open — confirms age-bucketed interests render with the
 * relationship-aware freeform placeholder ("She's been getting into mahjong").
 */
export const MomLikesOpen = {
  render: () => (
    <PaddedFrame>
      <SeededPill relationship="Mom" age={35} finalOpen="likes" />
    </PaddedFrame>
  ),
};

/**
 * Friend + WHO open — confirms the Gender section appears for relationships
 * that don't presume a gender (sheet bug #54). Visual baseline for the
 * Female / Male / Other chip row sandwiched between Relationship and Age.
 */
export const FriendWhoOpenWithGender = {
  render: () => (
    <PaddedFrame>
      <SeededPill relationship="Friend" finalOpen="who" />
    </PaddedFrame>
  ),
};

/**
 * Mobile-viewport happy path — empty state at 375x667.
 */
export const ClosedMobile = {
  parameters: { viewport: { defaultViewport: 'mobile' } },
  render: () => (
    <PaddedFrame>
      <SearchPill />
    </PaddedFrame>
  ),
};

