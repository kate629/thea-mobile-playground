import React from 'react';
import styled from 'styled-components';

export interface QuizThemeLogoProps {
  /** Click handler. Wired to the leave-warning `requestLeave` from QuizPage. */
  onClick: () => void;
}

const Wrap = styled.div`
  max-width: 768px;
  margin: 0 auto;
  padding: 16px 16px 0;
  display: flex;
  justify-content: center;
  @media (min-width: 1024px) {
    padding: 16px 32px 0;
  }
`;

// Mirror SiteHeader's `Wordmark` styling so the quiz logo reads as the same
// brand mark (italic serif, primary clay color, hover-fade). Rendered as a
// <button> rather than an <a> because the click triggers a leave-warning
// modal — actual nav happens after user confirms inside the dialog.
const Wordmark = styled.button`
  background: none;
  border: none;
  padding: 0;
  font-family: ${({ theme }) => theme.font.serif};
  font-style: italic;
  letter-spacing: 0.025em;
  color: hsl(var(--primary));
  font-size: 28px;
  cursor: pointer;
  transition: opacity 200ms ease;
  &:hover {
    opacity: 0.8;
  }
  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px hsl(var(--ring) / 0.3);
    border-radius: 4px;
  }
`;

/**
 * Persistent Thea logo for the quiz surface (bug #7).
 *
 * Provides a way back to home mid-quiz. Clicking does NOT navigate directly —
 * it pops a leave-warning AlertDialog (owned by QuizPage). Mirrors the brand
 * wordmark from `SiteHeader` (italic serif "thea" in primary clay).
 */
export const QuizThemeLogo: React.FC<QuizThemeLogoProps> = ({ onClick }) => (
  <Wrap>
    <Wordmark type="button" onClick={onClick} aria-label="Home">
      thea
    </Wordmark>
  </Wrap>
);
