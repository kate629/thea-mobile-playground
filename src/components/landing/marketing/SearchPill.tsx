import React, { useCallback, useEffect, useRef } from 'react';
import styled, { css } from 'styled-components';
import { Chip } from '../../ui/Chip';
import { useSearchPillState, SearchPillSegment } from '../../../theaWeb/hooks/useSearchPillState';
import type { QuizAnswers } from '../quiz/useQuizFlow';

/**
 * Top-of-homepage search pill (signed-in surface).
 *
 * Three clickable segments — WHO / WHAT / LIKES — followed by a clay sparkles
 * button. Each segment opens an inline dropdown anchored to the pill; picking
 * a value updates the segment text, and (where single-select) auto-closes
 * the dropdown.
 *
 * The dynamic option logic (gendered occasions, age-bucketed interest pills,
 * relationship-aware placeholder copy) lives in `useSearchPillState`, which
 * mirrors `useQuizFlow.ts` exactly so a Mom recipient yields Mother's Day in
 * the WHAT options, etc.
 *
 * The sparkles button fires `onSubmit(answers)` — the integrating page wires
 * this to `useSubmitGiftFlow` (same as the quiz).
 */

export interface SearchPillProps {
  /** Called with `QuizAnswers` when the user clicks the sparkles button. */
  onSubmit?: (answers: QuizAnswers) => void;
  /** Optional initial state for stories / tests. */
  initialOpenSegment?: SearchPillSegment | null;
  /** When true, skips the outside-click handler — useful in stories that pin a dropdown open. */
  disableOutsideClick?: boolean;
  className?: string;
}

// --- Styled --------------------------------------------------------------

const Wrap = styled.div`
  position: relative;
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
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

const SegmentButton = styled.button<{ $active: boolean; $hasValue: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 2px;
  padding: 10px 18px;
  background: transparent;
  border: none;
  border-radius: 9999px;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  position: relative;
  transition: background 150ms ease;

  &:hover {
    background: ${({ theme }) => theme.color.cream};
  }

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
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: hsl(var(--muted-foreground));
  line-height: 1;
`;

const SegmentValue = styled.span<{ $placeholder: boolean }>`
  font-size: 14px;
  font-weight: 500;
  line-height: 1.2;
  color: ${({ $placeholder }) =>
    $placeholder ? 'hsl(var(--muted-foreground))' : 'hsl(var(--foreground))'};
  display: inline-flex;
  align-items: center;
  gap: 6px;
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
  margin-left: 4px;
  cursor: pointer;
  color: hsl(var(--muted-foreground));
  border-radius: 9999px;
  width: 16px;
  height: 16px;
  &:hover { color: hsl(var(--foreground)); background: ${({ theme }) => theme.color.warmBorder}; }
`;

const SparklesButton = styled.button<{ $disabled: boolean }>`
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 9999px;
  border: none;
  margin: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #ffffff;
  background: ${({ theme }) => theme.gradient.cta};
  transition: transform 150ms ease, box-shadow 150ms ease, opacity 150ms ease;

  ${({ $disabled }) =>
    $disabled &&
    css`
      opacity: 0.5;
      cursor: not-allowed;
    `}

  &:hover:not(:disabled) {
    transform: scale(1.05);
    box-shadow: ${({ theme }) => theme.shadow.lg};
  }
  &:active:not(:disabled) {
    transform: scale(0.97);
  }
  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px hsl(var(--ring) / 0.4);
  }
`;

const Dropdown = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: #ffffff;
  border: 1px solid ${({ theme }) => theme.color.warmBorder};
  border-radius: 16px;
  box-shadow: ${({ theme }) => theme.shadow.lg};
  padding: 20px;
  z-index: 20;
`;

const DropdownHeading = styled.h4`
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: hsl(var(--foreground));
`;

const DropdownSection = styled.section`
  & + & { margin-top: 20px; }
`;

const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const FreeformTextarea = styled.textarea`
  width: 100%;
  min-height: 72px;
  padding: 12px;
  border: 1px solid ${({ theme }) => theme.color.warmBorder};
  border-radius: 12px;
  font-family: inherit;
  font-size: 14px;
  resize: vertical;
  background: ${({ theme }) => theme.color.cream};
  margin-top: 12px;
  color: hsl(var(--foreground));

  &::placeholder {
    color: hsl(var(--muted-foreground));
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.color.clay};
    background: #ffffff;
  }
`;

// --- Icons ---------------------------------------------------------------

const SparklesIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3l1.6 4.6L18 9l-4.4 1.4L12 15l-1.6-4.6L6 9l4.4-1.4L12 3z" />
    <path d="M19 14l.7 1.8L21.5 16l-1.8.7L19 18.5l-.7-1.8L16.5 16l1.8-.7L19 14z" />
    <path d="M5 16l.5 1.3L6.7 18l-1.3.5L5 19.7l-.5-1.3L3.3 18l1.3-.5L5 16z" />
  </svg>
);

const XIcon: React.FC = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// --- Component -----------------------------------------------------------

export const SearchPill: React.FC<SearchPillProps> = ({
  onSubmit,
  initialOpenSegment = null,
  disableOutsideClick = false,
  className,
}) => {
  const state = useSearchPillState();
  const wrapRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  // Apply initialOpenSegment once on mount (story support).
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    if (initialOpenSegment) {
      state.openDropdown(initialOpenSegment);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Outside-click closes any open dropdown.
  useEffect(() => {
    if (disableOutsideClick) return;
    if (!state.openSegment) return;
    const handler = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) {
        state.closeDropdown();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [state, disableOutsideClick]);

  const handleRelationshipPick = useCallback(
    (rel: string) => {
      state.setRelationship(rel);
      // Auto-close WHO once both relationship + age are set.
      if (state.age > 0) {
        state.closeDropdown();
      }
    },
    [state],
  );

  const handleAgePick = useCallback(
    (ageValue: number) => {
      state.setAge(ageValue);
      if (state.relationship) {
        state.closeDropdown();
      }
    },
    [state],
  );

  const handleSubmit = useCallback(() => {
    if (!state.canSubmit) return;
    onSubmit?.(state.toQuizAnswers());
  }, [state, onSubmit]);

  return (
    <Wrap ref={wrapRef} className={className}>
      <Pill>
        <SegmentButton
          type="button"
          $active={state.openSegment === 'who'}
          $hasValue={Boolean(state.whoDisplay)}
          aria-expanded={state.openSegment === 'who'}
          aria-haspopup="dialog"
          onClick={() => state.toggleDropdown('who')}
        >
          <SegmentLabel>Who</SegmentLabel>
          <SegmentValue $placeholder={!state.whoDisplay}>
            {state.whoDisplay ? (
              <>
                {state.whoEmoji && <span aria-hidden="true">{state.whoEmoji}</span>}
                <span>{state.whoDisplay}</span>
                <ClearButton
                  type="button"
                  aria-label="Clear who"
                  onClick={(e) => {
                    e.stopPropagation();
                    state.clearWho();
                  }}
                >
                  <XIcon />
                </ClearButton>
              </>
            ) : (
              'Relationship, age'
            )}
          </SegmentValue>
        </SegmentButton>

        <SegmentButton
          type="button"
          $active={state.openSegment === 'what'}
          $hasValue={Boolean(state.whatDisplay)}
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

        <SegmentButton
          type="button"
          $active={state.openSegment === 'likes'}
          $hasValue={state.interests.length > 0}
          aria-expanded={state.openSegment === 'likes'}
          aria-haspopup="dialog"
          onClick={() => state.toggleDropdown('likes')}
        >
          <SegmentLabel>Likes</SegmentLabel>
          <SegmentValue $placeholder={state.interests.length === 0}>
            {state.interests.length > 0 ? (
              <>
                <span>{state.likesDisplay}</span>
                <ClearButton
                  type="button"
                  aria-label="Clear interests"
                  onClick={(e) => {
                    e.stopPropagation();
                    state.clearLikes();
                  }}
                >
                  <XIcon />
                </ClearButton>
              </>
            ) : (
              'Interests'
            )}
          </SegmentValue>
        </SegmentButton>

        <SparklesButton
          type="button"
          aria-label="Find a gift"
          $disabled={!state.canSubmit}
          disabled={!state.canSubmit}
          onClick={handleSubmit}
        >
          <SparklesIcon />
        </SparklesButton>
      </Pill>

      {state.openSegment === 'who' && (
        <Dropdown role="dialog" aria-label="Who are you shopping for?">
          <DropdownSection>
            <DropdownHeading>Who are you shopping for?</DropdownHeading>
            <ChipRow>
              {state.relationshipOptions.map((rel) => (
                <Chip
                  key={rel.value}
                  selected={state.relationship === rel.value}
                  leading={<span aria-hidden="true">{rel.emoji}</span>}
                  onClick={() => handleRelationshipPick(rel.value)}
                >
                  {rel.value}
                </Chip>
              ))}
            </ChipRow>
          </DropdownSection>
          <DropdownSection>
            <DropdownHeading>Age</DropdownHeading>
            <ChipRow>
              {state.ageChips.map((chip) => (
                <Chip
                  key={chip.value}
                  selected={state.age === chip.value}
                  leading={<span aria-hidden="true">{chip.emoji}</span>}
                  onClick={() => handleAgePick(chip.value)}
                >
                  {chip.label}
                </Chip>
              ))}
            </ChipRow>
          </DropdownSection>
        </Dropdown>
      )}

      {state.openSegment === 'what' && (
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
          </DropdownSection>
        </Dropdown>
      )}

      {state.openSegment === 'likes' && (
        <Dropdown role="dialog" aria-label="What do they like?">
          <DropdownSection>
            <DropdownHeading>What do they like?</DropdownHeading>
            <ChipRow>
              {state.interestPills.map((pill) => (
                <Chip
                  key={pill.label}
                  selected={state.interests.includes(pill.label)}
                  leading={pill.emoji ? <span aria-hidden="true">{pill.emoji}</span> : undefined}
                  onClick={() => state.toggleInterest(pill.label)}
                >
                  {pill.label}
                </Chip>
              ))}
            </ChipRow>
            <FreeformTextarea
              value={state.freeform}
              onChange={(e) => state.setFreeform(e.target.value)}
              placeholder={state.freeformPlaceholder}
              aria-label="Tell us more"
            />
          </DropdownSection>
        </Dropdown>
      )}
    </Wrap>
  );
};
