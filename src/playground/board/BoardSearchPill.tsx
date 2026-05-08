import React, { useEffect, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import { Chip } from '../../components/ui/Chip';
import {
  useSearchPillState,
  type SearchPillSegment,
} from '../../theaWeb/hooks/useSearchPillState';
import type { Gender } from '../../components/landing/quiz/constants';

/**
 * Board-surface fork of `src/components/landing/marketing/SearchPill.tsx`.
 *
 * Same visual + dropdown-interaction shape as the logged-in homepage pill:
 * tap a segment → inline dropdown for that section (NOT a full edit drawer).
 *
 * Differences from the homepage version:
 *   1. Accepts `initialValues` and seeds the underlying `useSearchPillState`
 *      on mount via the existing setters, then closes any auto-opened
 *      dropdown so the pill renders quietly with the recipient's values.
 *   2. Sparkles button fires `onSparklesClick` (callback) instead of
 *      submitting a fresh quiz flow — the board's parent page wires this
 *      to whatever "regenerate with new values" path it wants.
 *
 * Intentionally a full copy of SearchPill's JSX rather than a wrapper —
 * the homepage component embeds `useSearchPillState()` internally with no
 * way to inject seed values, and Kate's port-back rule says don't touch
 * shared upstream components from the playground.
 */

export interface BoardSearchPillInitialValues {
  /** Display string from RELATIONSHIPS (e.g. "Mom", "Granddaughter"). */
  relationship?: string;
  /** ADULT_AGE_CHIPS bucket value (25/35/45/55/65/75) or KID_AGE_CHIPS value. */
  age?: number;
  gender?: Gender;
  /** Display string from BASE_OCCASION_OPTIONS (e.g. "Mother's Day"). */
  occasion?: string;
  /** Capitalized chip labels (e.g. ["Cozy", "Kitchen"]). */
  interests?: string[];
  freeform?: string;
}

export interface BoardSearchPillProps {
  initialValues?: BoardSearchPillInitialValues;
  initialOpenSegment?: SearchPillSegment | null;
  /** Click handler for the clay sparkles button. Receives the live state's
   *  display values so the parent can decide what to do. */
  onSparklesClick?: () => void;
  className?: string;
}

// ─── Styled (verbatim from SearchPill.tsx, scaled for board surface) ──────

const Wrap = styled.div`
  position: relative;
  width: 100%;
`;

const Pill = styled.div`
  display: flex;
  align-items: stretch;
  background: #ffffff;
  border-radius: 9999px;
  border: 1px solid ${({ theme }) => theme.color.warmBorder};
  box-shadow: ${({ theme }) => theme.shadow.card};
  padding: 4px;
  gap: 0;
`;

const SegmentButton = styled.button<{ $active: boolean; $hasValue: boolean; $compact?: boolean }>`
  flex: ${({ $compact }) => ($compact ? '0 0 auto' : '1')};
  ${({ $compact }) => $compact && 'min-width: 110px; max-width: 50%;'}
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 2px;
  padding: 8px 10px;
  background: transparent;
  border: none;
  border-radius: 9999px;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  position: relative;
  transition: background 150ms ease;
  min-width: 0;

  &:hover { background: ${({ theme }) => theme.color.cream}; }

  ${({ $active, theme }) =>
    $active &&
    css`
      background: ${theme.color.cream};
    `}

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px hsl(var(--ring) / 0.3);
  }

  & + & {
    border-left: 1px solid ${({ theme }) => theme.color.warmBorder};
  }
`;

const SegmentLabel = styled.span`
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: hsl(var(--muted-foreground));
  line-height: 1;
`;

const SegmentValue = styled.span<{ $placeholder: boolean }>`
  font-size: 13px;
  font-weight: 500;
  line-height: 1.2;
  color: ${({ $placeholder }) =>
    $placeholder ? 'hsl(var(--muted-foreground))' : 'hsl(var(--foreground))'};
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
`;

const ClearButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  padding: 0;
  margin-left: 2px;
  cursor: pointer;
  color: hsl(var(--muted-foreground));
  border-radius: 9999px;
  width: 14px;
  height: 14px;
  &:hover {
    color: hsl(var(--foreground));
    background: ${({ theme }) => theme.color.warmBorder};
  }
`;

const SearchButton = styled.button<{ $disabled: boolean }>`
  margin-top: 16px;
  width: 100%;
  height: 44px;
  border-radius: 9999px;
  border: none;
  font-family: ${({ theme }) => theme.font.sans};
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  background: ${({ theme }) => theme.gradient.cta};
  cursor: pointer;
  transition: transform 150ms ease, box-shadow 150ms ease, opacity 150ms ease;
  ${({ $disabled }) =>
    $disabled &&
    `
      opacity: 0.45;
      cursor: not-allowed;
    `}
  &:hover:not(:disabled) { box-shadow: ${({ theme }) => theme.shadow.lg}; }
  &:active:not(:disabled) { transform: scale(0.99); }
`;

const Dropdown = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  /* Extend slightly past the pill so the dropdown reaches near the
     viewport edges — gives chips room for ~4 per row and lets the Search
     CTA sit above the fold without scrolling. The pill row no longer
     contains the back button, so this needs less left-extension than the
     prior version. */
  left: -8px;
  right: -8px;
  background: #ffffff;
  border: 1px solid ${({ theme }) => theme.color.warmBorder};
  border-radius: 16px;
  box-shadow: ${({ theme }) => theme.shadow.lg};
  padding: 16px;
  z-index: 30;
  max-height: 78vh;
  overflow-y: auto;
`;

const DropdownHeading = styled.h4`
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: hsl(var(--foreground));
`;

const DropdownSection = styled.section`
  & + & { margin-top: 18px; }
`;

const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const FreeformTextarea = styled.textarea`
  width: 100%;
  min-height: 64px;
  padding: 10px;
  border: 1px solid ${({ theme }) => theme.color.warmBorder};
  border-radius: 12px;
  font-family: inherit;
  font-size: 14px;
  resize: vertical;
  background: ${({ theme }) => theme.color.cream};
  margin-top: 12px;
  color: hsl(var(--foreground));
  /* Sample-text vibe: lighter gray + italic so users read it as an
     example, not a label. Placeholder strings should start with "E.g., ". */
  &::placeholder {
    color: hsl(var(--muted-foreground) / 0.65);
    font-style: italic;
  }
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.color.clay};
    background: #ffffff;
  }
`;

// ─── Icons ───────────────────────────────────────────────────────────────

const XIcon: React.FC = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ─── Component ───────────────────────────────────────────────────────────

export const BoardSearchPill: React.FC<BoardSearchPillProps> = ({
  initialValues,
  initialOpenSegment = null,
  onSparklesClick,
  className,
}) => {
  const state = useSearchPillState();
  const wrapRef = useRef<HTMLDivElement>(null);
  const seededRef = useRef(false);
  // Freeform label for the "Other" occasion. Not piped through the hook —
  // playground-local since the real schema's occasionLabel only matters at
  // submit time.
  const [otherLabel, setOtherLabel] = useState('');

  // Seed state from initialValues on mount. The setters in useSearchPillState
  // have auto-advance side effects (each one may call setOpenSegment), but
  // React batches the setState calls inside this effect — so the final state
  // after `closeDropdown` is { ...seeded values, openSegment: null }.
  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;
    if (!initialValues) {
      if (initialOpenSegment) state.openDropdown(initialOpenSegment);
      return;
    }
    if (initialValues.relationship) state.setRelationship(initialValues.relationship);
    if (initialValues.age) state.setAge(initialValues.age);
    if (initialValues.gender) state.setGender(initialValues.gender);
    if (initialValues.occasion) state.setOccasion(initialValues.occasion);
    if (initialValues.interests && initialValues.interests.length > 0) {
      initialValues.interests.forEach((i) => state.toggleInterest(i));
    }
    if (initialValues.freeform) state.setFreeform(initialValues.freeform);
    // Override the auto-advance from the setters above so the pill renders
    // closed by default. If the caller passed initialOpenSegment, honor it
    // after the seed.
    if (initialOpenSegment) {
      state.openDropdown(initialOpenSegment);
    } else {
      state.closeDropdown();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Outside-click closes any open dropdown.
  useEffect(() => {
    if (!state.openSegment) return;
    const handler = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) {
        state.closeDropdown();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [state]);

  // Kid recipients don't have an "occasion" in the meaningful adult sense
  // (Mother's Day / Anniversary / etc. don't apply, and we already
  // pre-select "Just Because" upstream). Hide the WHAT segment + its
  // dropdown so the pill is just the freeform "More" field.
  const isKid =
    typeof initialValues?.age === 'number' && initialValues.age < 18;

  return (
    <Wrap ref={wrapRef} className={className}>
      <Pill>
        {/* WHO segment intentionally hidden on the board surface — the
            recipient is anchored by the avatar header above the pill, so
            the pill is just for refining WHAT + LIKES. The hook is still
            seeded with relationship/age/gender so the WHAT options stay
            gender-aware (e.g. Mother's Day shows for female recipients) and
            the LIKES interest pills are age-bucketed. */}
        {!isKid && (
          <SegmentButton
            type="button"
            $active={state.openSegment === 'what'}
            $hasValue={Boolean(state.whatDisplay)}
            $compact
            aria-expanded={state.openSegment === 'what'}
            aria-haspopup="dialog"
            onClick={() => state.toggleDropdown('what')}
          >
            <SegmentLabel>What</SegmentLabel>
            <SegmentValue $placeholder={!state.whatDisplay}>
              {state.whatDisplay ? (
                <>
                  <span>{state.whatDisplay}</span>
                  <ClearButton
                    type="button"
                    aria-label="Clear occasion"
                    onClick={(e) => {
                      e.stopPropagation();
                      state.clearWhat();
                    }}
                  >
                    <XIcon />
                  </ClearButton>
                </>
              ) : (
                'Occasion'
              )}
            </SegmentValue>
          </SegmentButton>
        )}

        <SegmentButton
          type="button"
          $active={state.openSegment === 'likes'}
          $hasValue={Boolean(state.freeform.trim())}
          aria-expanded={state.openSegment === 'likes'}
          aria-haspopup="dialog"
          onClick={() => state.toggleDropdown('likes')}
        >
          <SegmentLabel>More</SegmentLabel>
          <SegmentValue $placeholder={!state.freeform.trim()}>
            {state.freeform.trim() ? (
              <>
                <span>{state.freeform}</span>
                <ClearButton
                  type="button"
                  aria-label="Clear note"
                  onClick={(e) => {
                    e.stopPropagation();
                    state.setFreeform('');
                  }}
                >
                  <XIcon />
                </ClearButton>
              </>
            ) : (
              'Anything else?'
            )}
          </SegmentValue>
        </SegmentButton>

      </Pill>

      {!isKid && state.openSegment === 'what' && (
        <Dropdown role="dialog" aria-label="What's the occasion?">
          <DropdownSection>
            <DropdownHeading>What's the occasion?</DropdownHeading>
            <ChipRow>
              {state.occasionOptions.map((opt) => (
                <Chip
                  key={opt.value}
                  selected={state.occasion === opt.value}
                  leading={<span aria-hidden="true">{opt.emoji}</span>}
                  onClick={() => state.setOccasion(opt.value)}
                >
                  {opt.label}
                </Chip>
              ))}
            </ChipRow>
            {state.occasion === 'Other' && (
              <>
                <FreeformTextarea
                  value={otherLabel}
                  onChange={(e) => setOtherLabel(e.target.value)}
                  placeholder="E.g., housewarming, retirement, just because"
                  aria-label="Describe the occasion"
                  autoFocus
                />
                <SearchButton
                  type="button"
                  $disabled={!otherLabel.trim()}
                  disabled={!otherLabel.trim()}
                  onClick={() => state.openDropdown('likes')}
                >
                  Continue
                </SearchButton>
              </>
            )}
          </DropdownSection>
        </Dropdown>
      )}

      {state.openSegment === 'likes' && (
        <Dropdown role="dialog" aria-label="Anything else?">
          <DropdownSection>
            <DropdownHeading>Anything else about {state.relationship || 'them'}?</DropdownHeading>
            <FreeformTextarea
              value={state.freeform}
              onChange={(e) => state.setFreeform(e.target.value)}
              placeholder={
                state.freeformPlaceholder
                  ? `E.g., ${state.freeformPlaceholder}`
                  : 'E.g., what they love right now, what they already have'
              }
              aria-label="Tell us more"
              autoFocus
            />
            <SearchButton
              type="button"
              $disabled={false}
              onClick={() => {
                state.closeDropdown();
                onSparklesClick?.();
              }}
            >
              Search
            </SearchButton>
          </DropdownSection>
        </Dropdown>
      )}
    </Wrap>
  );
};
