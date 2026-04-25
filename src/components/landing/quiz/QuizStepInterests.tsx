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
  /** Defaults to "Get ideas". */
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
  gap: 8px;
`;

const Pill = styled.button<{ $selected: boolean }>`
  padding: 8px 16px;
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

const SubmitWrap = styled.div`
  margin: 0 auto;
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
  submitLabel = 'Get ideas',
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
    </Section>
    <Section>
      <TextareaLabel htmlFor="quiz-more-about">Go ahead, tell us everything.</TextareaLabel>
      <Textarea
        id="quiz-more-about"
        value={textareaValue}
        onChange={(e) => onTextareaChange(e.target.value)}
        placeholder={textareaPlaceholder}
        style={{ minHeight: 100, resize: 'none', background: '#fff' }}
      />
    </Section>
    <SubmitWrap>
      <QuizNextButton label={submitLabel} disabled={!canSubmit} onClick={onSubmit} />
    </SubmitWrap>
  </>
);
