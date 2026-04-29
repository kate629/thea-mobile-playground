import React, { useEffect, useState } from 'react';
import styled, { css } from 'styled-components';
import { Button } from '../../ui/Button';

export interface StickyPrimaryCtaProps {
  /**
   * Element whose visibility controls the sticky chrome. Once this element
   * scrolls off-screen, the sticky shows; when it scrolls back on-screen, the
   * sticky hides. If omitted (or its `.current` is null), the sticky is always
   * visible.
   */
  triggerRef?: React.RefObject<HTMLElement | null>;
  /** Click handler for the primary CTA. Same action as the hero CTA. */
  onCtaClick?: () => void;
  /** CTA label. Defaults to "Find a gift". */
  ctaLabel?: string;
  /**
   * V2 (sign-in) slot. Intentionally unused in V1 — the visual + DOM hook is
   * here so the V2 PR is a one-line render addition, not a layout change.
   * TODO(v2 — bug #2/#3): render the secondary "Sign in" CTA here. The slot
   * sits to the right of the primary CTA on desktop, and stacks above it on
   * mobile (column-reverse) so the primary stays thumb-reachable.
   */
  signInSlot?: React.ReactNode;
}

/* --------- Mobile: fixed footer --------- */

const MobileFooter = styled.div<{ $visible: boolean }>`
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
  display: flex;
  flex-direction: column-reverse;
  align-items: stretch;
  gap: 8px;
  padding: 12px 16px calc(env(safe-area-inset-bottom, 0px) + 12px);
  background: hsl(var(--background));
  border-top: 1px solid ${({ theme }) => theme.color.warmBorder};
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.06);
  transform: translateY(${({ $visible }) => ($visible ? '0' : '100%')});
  transition: transform 200ms ease;
  pointer-events: ${({ $visible }) => ($visible ? 'auto' : 'none')};
  @media (min-width: 768px) {
    display: none;
  }
  /* Make the inner Button stretch full-width on mobile so the tap target
     spans the full row. */
  & button {
    width: 100%;
  }
`;

/* --------- Desktop: fixed top bar --------- */

const DesktopBar = styled.div<{ $visible: boolean }>`
  display: none;
  @media (min-width: 768px) {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
    padding: 12px 32px;
    background: hsl(var(--background));
    border-bottom: 1px solid ${({ theme }) => theme.color.warmBorder};
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
    transform: translateY(${({ $visible }) => ($visible ? '0' : '-100%')});
    transition: transform 200ms ease;
    pointer-events: ${({ $visible }) => ($visible ? 'auto' : 'none')};
  }
  @media (min-width: 1024px) {
    padding: 12px 64px;
  }
`;

/* The V2 sign-in slot lives next to the CTA on desktop, above on mobile.
   In V1 it renders nothing — kept as a styled wrapper so consumers can pass
   children later without touching this file's layout math. */
const SignInSlot = styled.div`
  display: flex;
  align-items: center;
`;

/* Primary CTA tappable size on mobile is driven by the parent flex; on desktop
   the Button's lg size is overkill for a header bar — drop to md. */
const PrimaryCtaWrap = styled.div<{ $sizeOverride?: 'lg' | 'md' }>`
  display: flex;
  ${({ $sizeOverride }) =>
    $sizeOverride === 'md'
      ? css`
          /* desktop: sit naturally inline */
        `
      : css`
          flex: 1;
        `}
`;

const useShowOnScrollPast = (
  triggerRef: React.RefObject<HTMLElement | null> | undefined,
): boolean => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = triggerRef?.current ?? null;
    if (!el) {
      // No trigger — show by default. Lets the sticky work on surfaces that
      // don't have an obvious "hero CTA" sentinel (e.g., occasion pages).
      setShow(true);
      return;
    }

    if (typeof IntersectionObserver === 'undefined') {
      // Fallback: assume scrolled-past. Better to over-show than to never show.
      setShow(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show when the trigger has scrolled OFF-screen — i.e., the user has
        // scrolled past it and lost access to the in-page CTA.
        setShow(!entry.isIntersecting);
      },
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [triggerRef]);

  return show;
};

export const StickyPrimaryCta: React.FC<StickyPrimaryCtaProps> = ({
  triggerRef,
  onCtaClick,
  ctaLabel = 'Find a gift',
  signInSlot,
}) => {
  const visible = useShowOnScrollPast(triggerRef);

  return (
    <>
      <MobileFooter
        $visible={visible}
        aria-hidden={!visible}
        data-testid="sticky-primary-cta-mobile"
      >
        <PrimaryCtaWrap>
          <Button
            label={ctaLabel}
            variant="primary"
            size="lg"
            onClick={onCtaClick}
            tabIndex={visible ? 0 : -1}
          />
        </PrimaryCtaWrap>
        {signInSlot ? <SignInSlot>{signInSlot}</SignInSlot> : null}
      </MobileFooter>
      <DesktopBar
        $visible={visible}
        aria-hidden={!visible}
        data-testid="sticky-primary-cta-desktop"
      >
        {signInSlot ? <SignInSlot>{signInSlot}</SignInSlot> : null}
        <PrimaryCtaWrap $sizeOverride="md">
          <Button
            label={ctaLabel}
            variant="primary"
            size="md"
            onClick={onCtaClick}
            tabIndex={visible ? 0 : -1}
          />
        </PrimaryCtaWrap>
      </DesktopBar>
    </>
  );
};

/**
 * Bottom padding spacer for surfaces that render the mobile sticky footer, so
 * the last row of content isn't hidden behind it. Desktop renders nothing
 * (the desktop sticky is at the top). Pages opt in by rendering this near the
 * end of the page tree.
 */
export const StickyPrimaryCtaMobileSpacer = styled.div`
  height: 0;
  @media (max-width: 767.98px) {
    height: calc(env(safe-area-inset-bottom, 0px) + 88px);
  }
`;
