import React from 'react';
import styled from 'styled-components';
import { Textarea } from '../../ui/Textarea';
import { QuizNextButton } from './QuizNextButton';

export interface QuizInterestPill {
  label: string;
  emoji: string; // already includes trailing space (per getInterestEmoji)
}

export interface QuizStepInterestsProps {
  /** Pre-resolved title (varies by gender + age). */
  title: string;
  pills: QuizInterestPill[];
  selectedInterests: string[];
  onToggleInterest: (interest: string) => void;
  textareaValue: string;
  textareaPlaceholder: string;
  onTextareaChange: (value: string) => void;
  onSubmit: () => void;
  /** Submit-disabled rule comes from container; View just renders. */
  canSubmit: boolean;
  /** Defaults to a pronoun-aware "Build their board ✨". Container can
   *  override if it has gender context. */
  submitLabel?: string;
}

const Title = styled.h2`
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  line-height: 1.3;
  color: hsl(var(--foreground));
`;

const PillRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  /* Bug #13: tighter gap so more chips fit per row and the CTA stays above the fold. */
  gap: 6px;
`;

const Pill = styled.button<{ $selected: boolean }>`
  /*
   * Bug #13: horizontal padding reduced 16px -> 10px so more chips fit per row at
   * 375px width. Vertical padding kept the same (touch target ~36px). Pill design
   * (rounded full, emoji+label) is unchanged.
   */
  padding: 8px 10px;
  border-radius: 9999px;
  font-family: inherit;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 150ms ease, color 150ms ease, border-color 150ms ease;
  background: ${({ $selected }) => ($selected ? '#2D2D2D' : '#F0EEEB')};
  color: ${({ $selected }) => ($selected ? '#ffffff' : 'hsl(var(--foreground))')};
  border: 1px solid ${({ $selected }) => ($selected ? '#2D2D2D' : '#E8E5E0')};
  &:hover {
    border-color: ${({ $selected }) => ($selected ? '#2D2D2D' : 'hsl(var(--foreground) / 0.3)')};
  }
  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px hsl(var(--ring) / 0.3);
  }
`;

const TextareaLabel = styled.label`
  font-size: 16px;
  font-weight: 500;
  color: hsl(var(--foreground));
  display: block;
  margin-bottom: 12px;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

// Sticky-bottom CTA wrapper. Hugs the viewport bottom across the entire
// quiz card so users don't have to hunt for the action — particularly
// important for the interests step where the chip list + textarea push
// it well below the fold. Uses a soft fade-out so chips/textarea
// scrolling under it don't bump abruptly.
const StickyCtaWrap = styled.div`
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  margin: 16px -16px -16px;
  padding: 16px 16px calc(16px + env(safe-area-inset-bottom, 0px));
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0) 0%,
    #ffffff 30%,
    #ffffff 100%
  );
  display: flex;
  justify-content: center;
  z-index: 5;
`;

// Tiny helper line below the chips. Italic-ish gray so it reads as a
// hint, not a label.
const InterestsHelper = styled.p`
  margin: -4px 0 0 0;
  font-size: 13px;
  color: hsl(var(--muted-foreground));
  line-height: 1.4;
`;

export const QuizStepInterests: React.FC<QuizStepInterestsProps> = ({
  title,
  pills,
  selectedInterests,
  onToggleInterest,
  textareaValue,
  textareaPlaceholder,
  onTextareaChange,
  onSubmit,
  canSubmit,
  submitLabel = 'Build their board ✨',
}) => (
  <>
    <Title>{title}</Title>
    <Section>
      <PillRow>
        {pills.map((p) => {
          const isSelected = selectedInterests.includes(p.label);
          return (
            <Pill
              key={p.label}
              type="button"
              $selected={isSelected}
              onClick={() => onToggleInterest(p.label)}
              aria-pressed={isSelected}
            >
              {p.emoji}{p.label}
            </Pill>
          );
        })}
      </PillRow>
      <InterestsHelper>Pick at least two.</InterestsHelper>
    </Section>
    <Section>
      <TextareaLabel htmlFor="quiz-more-about">Go ahead, tell us everything.</TextareaLabel>
      <Textarea
        id="quiz-more-about"
        value={textareaValue}
        onChange={(e) => onTextareaChange(e.target.value)}
        placeholder={textareaPlaceholder}
        style={{
          minHeight: 100,
          resize: 'none',
          background: '#fff',
          // 16px reads more comfortably than the shared Textarea default
          // (14px) on the quiz step, AND avoids iOS Safari's
          // zoom-on-focus behavior for sub-16px form fields. Applied
          // inline so other Textarea consumers are unaffected.
          fontSize: 16,
        }}
      />
    </Section>
    <StickyCtaWrap>
      <QuizNextButton label={submitLabel} disabled={!canSubmit} onClick={onSubmit} />
    </StickyCtaWrap>
  </>
);
