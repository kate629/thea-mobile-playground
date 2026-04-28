import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'styled-components';
import { theme } from '../../../theme';
import { StickyPrimaryCta } from './StickyPrimaryCta';

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

/**
 * Capture the most recently constructed IntersectionObserver instance + its
 * registered callback so tests can drive its state. Mirrors the pattern used
 * in the sovrn FE for hooks that depend on IO.
 */
type IoCallback = (entries: Array<Pick<IntersectionObserverEntry, 'isIntersecting'>>) => void;

let lastObserverCallback: IoCallback | null = null;
let lastObserverDisconnect: jest.Mock | null = null;

class MockIntersectionObserver {
  constructor(cb: IoCallback) {
    lastObserverCallback = cb;
    lastObserverDisconnect = jest.fn();
  }
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = (...args: unknown[]) => lastObserverDisconnect && lastObserverDisconnect(...args);
  takeRecords = () => [];
  root = null;
  rootMargin = '';
  thresholds: number[] = [];
}

beforeEach(() => {
  lastObserverCallback = null;
  lastObserverDisconnect = null;
  // @ts-expect-error overwrite for test
  global.IntersectionObserver = MockIntersectionObserver;
});

describe('StickyPrimaryCta', () => {
  it('renders the primary CTA label on both surfaces', () => {
    renderWithTheme(<StickyPrimaryCta />);
    // jsdom honors `display: none` from styled-components so only the mobile
    // surface is in the a11y tree. Query each surface's button by walking the
    // testid roots — both should contain the label.
    const mobile = screen.getByTestId('sticky-primary-cta-mobile');
    const desktop = screen.getByTestId('sticky-primary-cta-desktop');
    expect(mobile.querySelector('button')).toHaveTextContent('Find a gift');
    expect(desktop.querySelector('button')).toHaveTextContent('Find a gift');
  });

  it('uses the provided label override', () => {
    renderWithTheme(<StickyPrimaryCta ctaLabel="Get gift ideas" />);
    const mobile = screen.getByTestId('sticky-primary-cta-mobile');
    const desktop = screen.getByTestId('sticky-primary-cta-desktop');
    expect(mobile.querySelector('button')).toHaveTextContent('Get gift ideas');
    expect(desktop.querySelector('button')).toHaveTextContent('Get gift ideas');
  });

  it('calls onCtaClick when the primary CTA is pressed', async () => {
    const onCtaClick = jest.fn();
    renderWithTheme(<StickyPrimaryCta onCtaClick={onCtaClick} />);
    await userEvent.click(screen.getByRole('button', { name: 'Find a gift' }));
    expect(onCtaClick).toHaveBeenCalledTimes(1);
  });

  it('is hidden until the trigger element scrolls off-screen', () => {
    const TriggerHarness = () => {
      const ref = React.useRef<HTMLDivElement | null>(null);
      return (
        <>
          <div ref={ref} data-testid="trigger" />
          <StickyPrimaryCta triggerRef={ref} />
        </>
      );
    };

    renderWithTheme(<TriggerHarness />);
    const mobile = screen.getByTestId('sticky-primary-cta-mobile');

    // Initial: no IO callback fired yet → defaults to hidden when a trigger
    // ref is supplied.
    expect(mobile).toHaveAttribute('aria-hidden', 'true');

    // Trigger leaves viewport (user scrolled past hero CTA).
    act(() => {
      lastObserverCallback?.([{ isIntersecting: false }]);
    });
    expect(mobile).toHaveAttribute('aria-hidden', 'false');

    // Trigger scrolls back into view (user scrolled back to hero).
    act(() => {
      lastObserverCallback?.([{ isIntersecting: true }]);
    });
    expect(mobile).toHaveAttribute('aria-hidden', 'true');
  });

  it('shows by default when no triggerRef is supplied', () => {
    renderWithTheme(<StickyPrimaryCta />);
    expect(screen.getByTestId('sticky-primary-cta-mobile')).toHaveAttribute(
      'aria-hidden',
      'false',
    );
  });

  it('does not render the V2 sign-in slot when signInSlot is omitted', () => {
    renderWithTheme(<StickyPrimaryCta />);
    // The V1 spec ships without a sign-in CTA. Asserting "Sign in" is absent
    // is the regression-test hook for "did we accidentally turn V2 on?"
    expect(screen.queryByRole('button', { name: 'Sign in' })).not.toBeInTheDocument();
  });
});
