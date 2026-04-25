import React from 'react';
import styled, { css } from 'styled-components';
import { cursorBlink } from '../../animations';
import { Button } from '../ui/Button';
import { SCENARIO_CARDS, HERO_COLOR } from './scenarios';

export interface HeroHeaderProps {
  /** The scenario string being typed. */
  phrase: string;
  /** Number of characters revealed (0..phrase.length). */
  typedCount: number;
  /** Whether the cursor is visible (typically `!typingDone`). */
  cursorVisible: boolean;
  /** The card on display. The Hook updates this on the rising edge of typingDone. */
  productCard: { image: string; name?: string; brand?: string; rotation: number };
  /** Optional left/right peek cards behind the active card. */
  peekImages?: [string, string];
  /** Whether the card layer is visible (hidden during initial load + swap fade). */
  cardVisible: boolean;
  /** CTA label. Defaults to "Find a gift". */
  ctaLabel?: string;
  /** CTA click handler. */
  onCtaClick?: () => void;
}

/* Layout — translated from
   3-12-sovrn-launch-version/src/components/HeroHeader.tsx:161-302. */
const Section = styled.section`
  width: 100%;
  overflow: hidden;
`;

const Inner = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  padding: 28px 16px 16px;
  @media (min-width: 640px) { padding: 28px 32px 16px; }
  @media (min-width: 768px) { padding: 0 32px 32px; }
  @media (min-width: 1024px) { padding: 4px 64px 32px; }
`;

const Row = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  min-height: 420px;
  @media (min-width: 768px) {
    flex-direction: row;
    gap: 56px;
    min-height: 480px;
  }
`;

const TextCol = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  text-align: center;
  width: 100%;
  @media (min-width: 768px) {
    text-align: left;
  }
`;

const Prefix = styled.p`
  font-size: 24px;
  font-weight: 600;
  color: #3D3530;
  margin: 0 0 8px 0;
  @media (min-width: 768px) {
    font-size: 34px;
  }
`;

const PhraseStage = styled.div`
  position: relative;
`;

/* Invisible grid stack — reserves the tallest scenario's height to prevent
   layout shift between phrases. Source: HeroHeader.tsx:174-185. */
const InvisibleStack = styled.div`
  visibility: hidden;
  pointer-events: none;
  display: grid;
`;

const StackedPhrase = styled.p`
  grid-area: 1 / 1;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.1;
  margin: 0;
  @media (min-width: 768px) {
    font-size: 52px;
  }
`;

const VisiblePhrase = styled.p`
  position: absolute;
  inset: 0;
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.1;
  color: ${HERO_COLOR};
  @media (min-width: 768px) {
    font-size: 52px;
  }
`;

const CursorWrap = styled.span`
  display: inline-block;
  width: 0;
  height: 1em;
  vertical-align: baseline;
  position: relative;
`;

const CursorBar = styled.span<{ $visible: boolean }>`
  position: absolute;
  left: 2px;
  top: 0;
  width: 3px;
  height: 100%;
  background-color: ${HERO_COLOR};
  ${({ $visible }) => $visible
    ? css`animation: ${cursorBlink} 1.06s steps(1, end) infinite;`
    : css`opacity: 0;`}
`;

const InvisibleTail = styled.span`
  visibility: hidden;
`;

const CtaWrap = styled.div<{ $mobile?: boolean }>`
  display: ${({ $mobile }) => ($mobile ? 'none' : 'block')};
  margin-top: 24px;
  text-align: center;
  @media (min-width: 768px) {
    display: ${({ $mobile }) => ($mobile ? 'none' : 'block')};
    margin-top: 32px;
    text-align: left;
  }
  ${({ $mobile }) => $mobile && css`
    display: block;
    text-align: center;
    @media (min-width: 768px) { display: none; }
  `}
`;

const CardArea = styled.div`
  position: relative;
  width: 260px;
  height: 320px;
  flex-shrink: 0;
  @media (min-width: 768px) {
    width: 340px;
    height: 400px;
  }
`;

const CardLayer = styled.div<{ $visible: boolean }>`
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 300ms ease-out;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
`;

const PeekCard = styled.div<{ $side: 'left' | 'right'; $visible: boolean }>`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 260px;
  height: 290px;
  border-radius: 16px;
  border: 1px solid hsl(var(--border) / 0.4);
  overflow: hidden;
  background: hsl(var(--card));
  opacity: ${({ $visible }) => ($visible ? 0.6 : 0)};
  transform: ${({ $side }) =>
    $side === 'left'
      ? 'translate(-54%, -48%) scale(0.96)'
      : 'translate(-46%, -52%) scale(0.96)'};
  @media (min-width: 768px) {
    width: 340px;
    height: 370px;
  }
`;

const PeekInner = styled.div`
  padding: 16px;
  height: 100%;
`;

const PeekImageFrame = styled.div`
  border-radius: 12px;
  overflow: hidden;
  height: 100%;
`;

const PeekImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ActiveCard = styled.div<{ $rotation: number }>`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 260px;
  border-radius: 16px;
  overflow: hidden;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border) / 0.6);
  box-shadow: ${({ theme }) => theme.shadow.lg};
  transform: ${({ $rotation }) => `translate(-50%, -50%) rotate(${$rotation}deg)`};
  @media (min-width: 768px) {
    width: 340px;
  }
`;

const ActiveInner = styled.div`
  padding: 16px;
`;

const ActiveImageFrame = styled.div`
  aspect-ratio: 1 / 1;
  border-radius: 12px;
  overflow: hidden;
  background: hsl(var(--muted));
`;

const ActiveImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const ProductMeta = styled.div`
  margin-top: 8px;
  padding: 0 2px;
`;

const ProductName = styled.p`
  font-size: 16px;
  font-weight: 500;
  color: hsl(var(--foreground) / 0.8);
  text-align: left;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ProductBrand = styled.p`
  font-size: 14px;
  color: hsl(var(--muted-foreground) / 0.7);
  text-align: left;
  margin: 2px 0 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const HeroHeader: React.FC<HeroHeaderProps> = ({
  phrase,
  typedCount,
  cursorVisible,
  productCard,
  peekImages,
  cardVisible,
  ctaLabel = 'Find a gift',
  onCtaClick,
}) => {
  return (
    <Section>
      <Inner>
        <Row>
          <TextCol>
            <Prefix>Find gift ideas for</Prefix>
            <PhraseStage>
              <InvisibleStack aria-hidden="true">
                {SCENARIO_CARDS.map((card, i) => (
                  <StackedPhrase key={i}>{card.scenario}</StackedPhrase>
                ))}
              </InvisibleStack>
              <VisiblePhrase>
                <span>{phrase.slice(0, typedCount)}</span>
                <CursorWrap>
                  <CursorBar $visible={cursorVisible} />
                </CursorWrap>
                <InvisibleTail>{phrase.slice(typedCount)}</InvisibleTail>
              </VisiblePhrase>
            </PhraseStage>
            <CtaWrap>
              <Button label={ctaLabel} variant="primary" size="lg" onClick={onCtaClick} />
            </CtaWrap>
          </TextCol>

          <CardArea>
            <CardLayer $visible={cardVisible}>
              <PeekCard $side="left" $visible={Boolean(peekImages?.[0])}>
                <PeekInner>
                  <PeekImageFrame>
                    {peekImages?.[0] && <PeekImg src={peekImages[0]} alt="" />}
                  </PeekImageFrame>
                </PeekInner>
              </PeekCard>
              <PeekCard $side="right" $visible={Boolean(peekImages?.[1])}>
                <PeekInner>
                  <PeekImageFrame>
                    {peekImages?.[1] && <PeekImg src={peekImages[1]} alt="" />}
                  </PeekImageFrame>
                </PeekInner>
              </PeekCard>
              <ActiveCard $rotation={productCard.rotation}>
                <ActiveInner>
                  <ActiveImageFrame>
                    <ActiveImg src={productCard.image} alt={phrase} />
                  </ActiveImageFrame>
                  {productCard.name && (
                    <ProductMeta>
                      <ProductName>{productCard.name}</ProductName>
                      {productCard.brand && <ProductBrand>{productCard.brand}</ProductBrand>}
                    </ProductMeta>
                  )}
                </ActiveInner>
              </ActiveCard>
            </CardLayer>
          </CardArea>

          <CtaWrap $mobile>
            <Button label={ctaLabel} variant="primary" size="lg" onClick={onCtaClick} />
          </CtaWrap>
        </Row>
      </Inner>
    </Section>
  );
};
