import React from 'react';
import styled from 'styled-components';
import { fadeIn } from '../../../animations';

export type QuizStepKey = 'kidOrAdult' | 'age' | 'interests';

export interface QuizCardProps {
  /** Optional back button. Hidden on the first interactive step (relationship). */
  onBack?: () => void;
  /** Visible step dots. Pass empty array to hide. */
  dots?: { key: QuizStepKey; state: 'completed' | 'current' | 'upcoming' }[];
  /** Animation key — bump to retrigger fade-in when the step swaps. */
  stepKey?: string;
  children: React.ReactNode;
}

const Outer = styled.div`
  max-width: 768px;
  margin: 0 auto;
  padding: 0 16px 32px;
  @media (min-width: 1024px) {
    padding: 0 32px 56px;
  }
`;

const Card = styled.div`
  background: #ffffff;
  border: 1px solid #e8e5e0;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 300ms ease-out;
`;

const Body = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  min-height: 420px;
  @media (min-width: 640px) {
    padding: 32px;
  }
`;

const StepFrame = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 20px;
  animation: ${fadeIn} 240ms ease-out;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  margin: -4px 0 -8px -4px;
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: hsl(var(--muted-foreground) / 0.6);
  cursor: pointer;
  transition: color 150ms ease;
  align-self: flex-start;
  &:hover {
    color: hsl(var(--foreground));
  }
  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px hsl(var(--ring) / 0.3);
    border-radius: 4px;
  }
`;

const Dots = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding-top: 8px;
  margin-top: auto;
`;

const Dot = styled.span<{ $state: 'completed' | 'current' | 'upcoming' }>`
  display: inline-block;
  width: 32px;
  height: 8px;
  border-radius: 9999px;
  background: ${({ $state }) =>
    $state === 'current' ? '#92ADA4' : $state === 'completed' ? '#B3D9E0' : '#e5e7eb'};
  transition: background-color 200ms ease;
`;

const ChevronLeft: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

export const QuizCard: React.FC<QuizCardProps> = ({ onBack, dots, stepKey, children }) => (
  <Outer>
    <Card>
      <Body>
        <StepFrame key={stepKey}>
          {onBack && (
            <BackButton onClick={onBack} aria-label="Go back">
              <ChevronLeft />
            </BackButton>
          )}
          {children}
          {dots && dots.length > 0 && (
            <Dots role="progressbar" aria-label="Quiz progress">
              {dots.map((d) => (
                <Dot key={d.key} $state={d.state} />
              ))}
            </Dots>
          )}
        </StepFrame>
      </Body>
    </Card>
  </Outer>
);
