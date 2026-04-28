import React from 'react';
import styled from 'styled-components';
import { SiteHeader } from '../SiteHeader';
import { HeroHeader } from './HeroHeader';
import { HeroHeaderAnimated } from './HeroHeaderAnimated';
import { ValuePropsCard, ValuePropItem } from './ValuePropsCard';
import { OccasionGrid, OCCASION_TILES, OccasionGridTile } from './OccasionGrid';
import { Footer } from './Footer';
import { SCENARIO_CARDS } from './scenarios';

export interface LandingPageProps {
  /** Pass a frozen HeroHeader for deterministic Happo snapshots. Defaults to
   *  HeroHeaderAnimated for the live experience. */
  heroSlot?: React.ReactNode;
  valuePropsHeading?: React.ReactNode;
  valuePropsItems?: ValuePropItem[];
  occasionsHeading?: string;
  occasionTiles?: OccasionGridTile[];
  onSignInClick?: () => void;
  onCtaClick?: () => void;
}

const Page = styled.div`
  min-height: 100vh;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  font-family: ${({ theme }) => theme.font.sans};
`;

const DEFAULT_VALUE_ITEMS: ValuePropItem[] = [
  {
    emoji: '💡',
    title: 'Tell us about them',
    body: "Share the little details that make them, them. We'll remember all of it.",
  },
  {
    emoji: '✨',
    title: 'Discover the magic',
    body: "We'll show you curated finds you'd never think to search for.",
  },
  {
    emoji: '🎉',
    title: 'Save now, send anytime',
    body: "Save your favorites. We'll remind you when it's time.",
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({
  heroSlot,
  valuePropsHeading = (
    <>
      You love them.
      <br />
      Let it show.
    </>
  ),
  valuePropsItems = DEFAULT_VALUE_ITEMS,
  occasionsHeading = 'Browse by occasion',
  occasionTiles = OCCASION_TILES,
  onSignInClick,
  onCtaClick,
}) => (
  <Page>
    <SiteHeader onSignInClick={onSignInClick} />
    {heroSlot ?? <HeroHeaderAnimated onCtaClick={onCtaClick} />}
    <ValuePropsCard heading={valuePropsHeading} items={valuePropsItems} />
    <OccasionGrid heading={occasionsHeading} tiles={occasionTiles} />
    <Footer />
  </Page>
);

/** Convenience export for stories: the View HeroHeader rendered with frozen
 *  props for the Nth scenario. Used by LandingPageFrozen.stories. */
export const FrozenHeroSlot: React.FC<{ scenarioIndex?: number }> = ({ scenarioIndex = 0 }) => {
  const s = SCENARIO_CARDS[scenarioIndex];
  return (
    <HeroHeader
      phrase={s.scenario}
      typedCount={s.scenario.length}
      cursorVisible={false}
      productCard={{
        image: s.productImage,
        name: s.productName,
        brand: s.brand,
        rotation: s.rotation,
      }}
      peekImages={s.peekImages}
      cardVisible
    />
  );
};
