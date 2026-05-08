import React from 'react';
import styled, { keyframes } from 'styled-components';

export interface QuizLoadingProps {
  /** The currently-typed slice of the active loading message. */
  text: string;
  /** Whether the trailing typewriter cursor should render. */
  showCursor: boolean;
  /** Optional overlay slot for ambient product image scrolling. */
  ambient?: React.ReactNode;
  /** Renders the message as a large multi-line block (e.g. an intro
   *  testimonial superimposed over the ambient scroll). Defaults to the
   *  small single-line typewriter style. */
  largeText?: boolean;
}

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const Page = styled.div`
  position: relative;
  min-height: 100vh;
  background: #faf6f3;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 24px;
  overflow: hidden;
`;

const CenterCol = styled.div`
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 672px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const TextRow = styled.div<{ $large: boolean }>`
  height: ${({ $large }) => ($large ? 'auto' : '40px')};
  min-height: ${({ $large }) => ($large ? '160px' : '0')};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Message = styled.p<{ $large: boolean }>`
  margin: 0;
  ${({ $large }) =>
    $large
      ? `
        font-size: 22px;
        line-height: 1.45;
        font-weight: 500;
        color: hsl(var(--foreground));
        white-space: pre-wrap;
        max-width: 28ch;
        letter-spacing: -0.01em;
        /* Translucent shim behind the testimonial so the text stays
           readable while the ambient product scroll keeps animating
           visibly through the gaps. Soft cream tint + small blur so
           it reads as a paper-card without going full opaque. */
        background: rgba(250, 246, 243, 0.78);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        padding: 24px 22px;
        border-radius: 16px;
        box-shadow: 0 6px 24px rgba(0, 0, 0, 0.06);
      `
      : `
        font-size: 14px;
        color: hsl(var(--muted-foreground));
      `}
`;

const Cursor = styled.span`
  display: inline-block;
  width: 2px;
  height: 1em;
  background: hsl(var(--muted-foreground) / 0.5);
  vertical-align: middle;
  margin-left: 2px;
  animation: ${pulse} 1.06s ease-in-out infinite;
`;

export const QuizLoading: React.FC<QuizLoadingProps> = ({
  text,
  showCursor,
  ambient,
  largeText = false,
}) => (
  <Page>
    {ambient}
    <CenterCol>
      <TextRow $large={largeText}>
        <Message $large={largeText}>
          <span>{text}</span>
          {showCursor && <Cursor aria-hidden="true" />}
        </Message>
      </TextRow>
    </CenterCol>
  </Page>
);
