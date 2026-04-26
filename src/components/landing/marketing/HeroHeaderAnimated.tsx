import React from 'react';
import { HeroHeader, HeroHeaderProps } from './HeroHeader';
import { useTypewriterHero, TypewriterHeroOptions } from './useTypewriterHero';
import { SCENARIO_CARDS, ScenarioCard } from './scenarios';

export interface HeroHeaderAnimatedProps
  extends Pick<HeroHeaderProps, 'ctaLabel' | 'onCtaClick'> {
  /** Override the default scenario list. Defaults to SCENARIO_CARDS. */
  scenarios?: ScenarioCard[];
  /** Override timing or disable motion. */
  options?: TypewriterHeroOptions;
}

/**
 * Smart wrapper around the presentational HeroHeader. Drives the typewriter
 * state machine via useTypewriterHero, then spreads the resulting props onto
 * the View. Consumers pick the View when they want to drive state from
 * elsewhere; pick this when they want default behavior.
 */
export const HeroHeaderAnimated: React.FC<HeroHeaderAnimatedProps> = ({
  scenarios = SCENARIO_CARDS,
  options,
  ctaLabel,
  onCtaClick,
}) => {
  const viewProps = useTypewriterHero(scenarios, options);
  return <HeroHeader {...viewProps} ctaLabel={ctaLabel} onCtaClick={onCtaClick} />;
};
