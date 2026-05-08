import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

// Auto-advance dwell — how long each card holds in the center before
// the carousel scrolls to the next one. User-initiated scroll resets
// the timer for the newly-centered card.
const DWELL_MS = 5000;

export interface Testimonial {
  quote: string;
  attribution: string;
}

const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    quote:
      'My grandson called me today with the biggest smile on his face. I updated his interests to taekwondo and puzzles, and the ideas were so spot on. He thinks I’m the coolest grandma.',
    attribution: 'Susan',
  },
  {
    quote:
      'Thea suggested an at-home pottery date night kit for my wife. We haven’t laughed that hard together in months. Already planning the next one.',
    attribution: 'Ben R.',
  },
  {
    quote:
      'I give way more "just because" gifts now. Sent my best friend a dried flower bouquet last week and she called me crying. We’d been out of touch for a while.',
    attribution: 'Anika S.',
  },
  {
    quote:
      'I started a board just for myself — a little treat-yourself wishlist. Honestly, it’s made me better at knowing what I actually want, which helps everyone around me too.',
    attribution: 'Priya D.',
  },
];

const OuterWrap = styled.section`
  max-width: 1280px;
  margin: 0 auto;
  padding: 64px 0 0;
  @media (min-width: 768px) {
    padding: 88px 0 0;
  }
`;

const Heading = styled.h2`
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.025em;
  color: hsl(var(--foreground));
  text-align: center;
  margin: 0 0 32px 0;
  line-height: 1.1;
  padding: 0 16px;
  @media (min-width: 768px) {
    font-size: 40px;
    margin: 0 0 48px 0;
  }
`;

// Horizontal scroll track. Snap-mandatory so each card lands centered;
// scrollbar hidden because the dot indicator below shows position. The
// generous side padding is what creates the peekaboo — the active card
// sits centered while neighbors poke in from the edges.
const Track = styled.div`
  display: flex;
  gap: 16px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  padding: 8px 12% 16px;
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar { display: none; }
  @media (min-width: 768px) {
    gap: 24px;
    padding: 8px 22% 24px;
  }
  @media (min-width: 1280px) {
    padding: 8px 28% 24px;
  }
`;

const Card = styled.article`
  scroll-snap-align: center;
  flex: 0 0 76%;
  background: #ffffff;
  border: 1px solid ${({ theme }) => theme.color.warmBorder};
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  padding: 28px 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 20px;
  min-height: 220px;
  @media (min-width: 768px) {
    flex-basis: 56%;
    padding: 36px 32px;
    min-height: 240px;
  }
  @media (min-width: 1280px) {
    flex-basis: 44%;
  }
`;

const Quote = styled.p`
  margin: 0;
  font-family: ${({ theme }) => theme.font.serif};
  font-size: 18px;
  line-height: 1.5;
  color: hsl(var(--foreground));
  font-style: italic;
  @media (min-width: 768px) {
    font-size: 20px;
  }
`;

const Attribution = styled.p`
  margin: 0;
  font-family: ${({ theme }) => theme.font.sans};
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: hsl(var(--muted-foreground));
`;

const Dots = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
`;

const Dot = styled.button<{ $active: boolean }>`
  appearance: none;
  border: none;
  padding: 0;
  cursor: pointer;
  width: ${({ $active }) => ($active ? '28px' : '8px')};
  height: 8px;
  border-radius: 9999px;
  background: ${({ $active, theme }) =>
    $active ? theme.color.clay : 'hsl(var(--border))'};
  transition: width 220ms ease, background 220ms ease;
  &:hover {
    background: ${({ $active, theme }) =>
      $active ? theme.color.clay : 'hsl(var(--muted-foreground) / 0.5)'};
  }
  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px hsl(var(--ring) / 0.3);
  }
`;

export interface TestimonialsCarouselProps {
  heading?: string;
  items?: Testimonial[];
}

export const TestimonialsCarousel: React.FC<TestimonialsCarouselProps> = ({
  heading = 'What people are saying',
  items = DEFAULT_TESTIMONIALS,
}) => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // Programmatic scrolls fire IntersectionObserver entries that look
  // identical to user scrolls. We track when WE initiated a scroll so
  // the "scroll happened" signal doesn't reset the timer mid-flight.
  const programmaticScrollUntilRef = useRef(0);

  const scrollToIndex = useCallback((index: number) => {
    const track = trackRef.current;
    const el = cardRefs.current[index];
    if (!track || !el) return;
    programmaticScrollUntilRef.current = Date.now() + 800;
    // Compute the horizontal offset that centers the target card inside
    // the track and scroll the TRACK only — not the page. Using
    // `el.scrollIntoView` here causes browsers to also scroll the
    // viewport vertically to bring the carousel into view, which on
    // page load (auto-advance fires after dwell) would yank the user
    // down to the testimonials section unbidden.
    const targetLeft =
      el.offsetLeft - track.clientWidth / 2 + el.clientWidth / 2;
    track.scrollTo({ left: targetLeft, behavior: 'smooth' });
  }, []);

  // Track which card is most-centered via IntersectionObserver. The
  // entry with the highest intersection ratio wins.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length === 0) return;
        const winner = visible[0];
        const idx = cardRefs.current.findIndex((el) => el === winner.target);
        if (idx >= 0) setActiveIndex(idx);
      },
      {
        root: track,
        threshold: [0.4, 0.6, 0.8, 1],
      },
    );
    cardRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [items.length]);

  // Auto-advance: 5s after the active card stabilizes, scroll to the
  // next one. Resets whenever activeIndex changes (user scrolls, or our
  // own programmatic scroll lands on a new card). Pauses when the user
  // is hovering the carousel so they can read in peace.
  useEffect(() => {
    if (paused) return;
    if (items.length <= 1) return;
    const t = window.setTimeout(() => {
      const next = (activeIndex + 1) % items.length;
      scrollToIndex(next);
    }, DWELL_MS);
    return () => window.clearTimeout(t);
  }, [activeIndex, items.length, paused, scrollToIndex]);

  return (
    <OuterWrap aria-label="Testimonials">
      <Heading>{heading}</Heading>
      <Track
        ref={trackRef}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        {items.map((t, i) => (
          <Card
            key={i}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            aria-roledescription="testimonial"
            aria-label={`Testimonial ${i + 1} of ${items.length}, by ${t.attribution}`}
          >
            <Quote>“{t.quote}”</Quote>
            <Attribution>— {t.attribution}</Attribution>
          </Card>
        ))}
      </Track>
      <Dots role="tablist" aria-label="Testimonial selection">
        {items.map((_, i) => (
          <Dot
            key={i}
            $active={i === activeIndex}
            type="button"
            role="tab"
            aria-selected={i === activeIndex}
            aria-label={`Go to testimonial ${i + 1}`}
            onClick={() => scrollToIndex(i)}
          />
        ))}
      </Dots>
    </OuterWrap>
  );
};
