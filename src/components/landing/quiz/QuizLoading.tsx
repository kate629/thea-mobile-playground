import React from 'react';
import styled, { keyframes } from 'styled-components';

export interface QuizLoadingProps {
  /** The currently-typed slice of the active loading message. */
  text: string;
  /** Whether the trailing typewriter cursor should render. */
  showCursor: boolean;
  /** Optional overlay slot for ambient product image scrolling. */
  ambient?: React.ReactNode;
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

const LogoBubble = styled.div`
  width: 112px;
  height: 112px;
  border-radius: 9999px;
  background: #f4e9e4;
  box-shadow: 0 0 0 18px rgba(181, 107, 88, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
`;

const LogoGlyph = styled.span`
  font-family: 'Albert Sans', system-ui, serif;
  font-style: italic;
  font-weight: 400;
  font-size: 60px;
  line-height: 1;
  color: #b56b58;
  animation: ${pulse} 2s ease-in-out infinite;
`;

const TextRow = styled.div`
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Message = styled.p`
  margin: 0;
  font-size: 14px;
  color: hsl(var(--muted-foreground));
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

export const QuizLoading: React.FC<QuizLoadingProps> = ({ text, showCursor, ambient }) => (
  <Page>
    {ambient}
    <CenterCol>
      <LogoBubble>
        <LogoGlyph aria-hidden="true">t</LogoGlyph>
      </LogoBubble>
      <TextRow>
        <Message>
          <span>{text}</span>
          {showCursor && <Cursor aria-hidden="true" />}
        </Message>
      </TextRow>
    </CenterCol>
  </Page>
);
