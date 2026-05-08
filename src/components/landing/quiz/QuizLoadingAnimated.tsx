import React, { useEffect, useMemo, useState } from 'react';
import { AmbientProductScrollAnimated } from './AmbientProductScrollAnimated';
import { ProductImage } from './AmbientProductScroll';
import { QuizLoading } from './QuizLoading';
import { buildLoadingMessages } from './loadingMessages';
import { useQuizLoadingTypewriter } from './useQuizLoadingTypewriter';

export interface QuizLoadingAnimatedProps {
  /** Quiz answers — drives the rotating typewriter copy. */
  interests?: string[];
  relationship?: string;
  /** Live-arriving product images, for the ambient ring around the logo. */
  images?: ProductImage[];
}

// Opening testimonial — held on screen for INTRO_HOLD_MS before the
// rotating typewriter messages take over. Reads as social proof while
// the algo spins up.
const INTRO_QUOTE =
  '"Thea helps me find things that I wouldn\'t have thought to search for. I love being able to pull up my granddaughter\'s board, find unique ideas, and send when the time is right."\n— Nora T.';
const INTRO_HOLD_MS = 6000;

export const QuizLoadingAnimated: React.FC<QuizLoadingAnimatedProps> = ({
  interests,
  relationship,
  images = [],
}) => {
  const messages = useMemo(
    () => buildLoadingMessages(interests, relationship),
    [interests, relationship],
  );
  // Two-phase: render the intro quote whole, then after INTRO_HOLD_MS
  // hand off to the rotating typewriter. The typewriter only mounts in
  // phase 2 so its hold/cycle timers don't run during the intro.
  const [phase, setPhase] = useState<'intro' | 'typewriter'>('intro');
  useEffect(() => {
    if (phase !== 'intro') return;
    const t = window.setTimeout(() => setPhase('typewriter'), INTRO_HOLD_MS);
    return () => window.clearTimeout(t);
  }, [phase]);

  return phase === 'intro' ? (
    <QuizLoading
      text={INTRO_QUOTE}
      showCursor={false}
      largeText
      ambient={<AmbientProductScrollAnimated images={images} />}
    />
  ) : (
    <TypewriterMessages messages={messages} images={images} />
  );
};

const TypewriterMessages: React.FC<{
  messages: string[];
  images: ProductImage[];
}> = ({ messages, images }) => {
  const slice = useQuizLoadingTypewriter(messages);
  return (
    <QuizLoading
      text={slice.text}
      showCursor={slice.showCursor}
      ambient={<AmbientProductScrollAnimated images={images} />}
    />
  );
};
