import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

/**
 * User avatar circle in the board header. Tapping opens a small popover
 * with two actions: "My people" (jumps to the saved-recipients hub) and
 * "Log out". Anonymous users see a generic person icon; signed-in users
 * see their initials. The popover is dismissed by tapping outside or
 * picking an item.
 */

const Wrap = styled.div`
  position: relative;
  display: inline-flex;
`;

// Small heads-up dot pinned to the top-right of the avatar. Red so it
// visually correlates with the matching dot on the "Sign in to keep
// your boards" item inside the dropdown — the user sees the dot,
// opens the menu, and the same red dot points at what triggered it.
// Only rendered when the user has liked 3+ items and is still anon.
const AlertDot = styled.span`
  position: absolute;
  top: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  border-radius: 9999px;
  background: #d94c4c;
  border: 2px solid #ffffff;
  pointer-events: none;
`;

// Alert-styled menu item that explains the WHY of signing in. Pairs
// with the red dot on the avatar — same dot is rendered inline so the
// user can correlate "the heads-up I saw on the avatar" with "this is
// the item it pointed at." Sits BELOW the standard "Sign in" item, not
// above, so the plain action is the first thing the user reads.
const AlertSignInItem = styled.button`
  appearance: none;
  background: ${({ theme }) => theme.color.cream};
  border: none;
  border-radius: 8px;
  padding: 10px 12px;
  margin-top: 2px;
  text-align: left;
  cursor: pointer;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 8px;
  transition: background 120ms ease;
  &:hover { background: ${({ theme }) => theme.color.warmBorder}; }
  &:active { transform: scale(0.99); }
`;

const InlineAlertDot = styled.span`
  flex: 0 0 auto;
  width: 8px;
  height: 8px;
  margin-top: 6px;
  border-radius: 9999px;
  background: #d94c4c;
`;

const AlertItemTextStack = styled.span`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const AlertItemPrimary = styled.span`
  font-family: ${({ theme }) => theme.font.sans};
  font-size: 14px;
  font-weight: 600;
  color: hsl(var(--foreground));
`;

const AlertItemSubline = styled.span`
  font-family: ${({ theme }) => theme.font.sans};
  font-size: 12px;
  font-weight: 400;
  color: hsl(var(--muted-foreground));
  line-height: 1.35;
`;

const Circle = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 9999px;
  border: 1px solid ${({ theme }) => theme.color.warmBorder};
  background: #ffffff;
  color: hsl(var(--foreground));
  font-family: ${({ theme }) => theme.font.sans};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 150ms ease, transform 150ms ease;
  &:hover { background: ${({ theme }) => theme.color.cream}; }
  &:active { transform: scale(0.96); }
  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px hsl(var(--ring) / 0.3);
  }
`;

const Menu = styled.div`
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 140px;
  background: #ffffff;
  border: 1px solid ${({ theme }) => theme.color.warmBorder};
  border-radius: 12px;
  box-shadow: ${({ theme }) => theme.shadow.lg};
  padding: 6px;
  z-index: 30;
  display: flex;
  flex-direction: column;
`;

const MenuItem = styled.button`
  appearance: none;
  background: transparent;
  border: none;
  padding: 10px 12px;
  border-radius: 8px;
  font-family: ${({ theme }) => theme.font.sans};
  font-size: 14px;
  font-weight: 500;
  color: hsl(var(--foreground));
  text-align: left;
  cursor: pointer;
  transition: background 120ms ease;
  &:hover { background: ${({ theme }) => theme.color.cream}; }
  &:active { transform: scale(0.99); }
`;

const PersonIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

interface BoardUserAvatarProps {
  initials?: string;
  onMyPeople?: () => void;
  onLogOut?: () => void;
  /** When true, render the heads-up dot on the avatar AND surface a
   *  prominent "Sign in to keep your boards" item at the top of the
   *  dropdown menu. Driven by the parent's threshold logic
   *  (anon user with 3+ likes anywhere). */
  showSaveAlert?: boolean;
  /** Number of items the user has liked — shown in the menu item's
   *  subline so the explanation is concrete ("You've liked 5 things"). */
  likedCount?: number;
  /** Sign-in click. Closes the menu before firing. */
  onSignInClick?: () => void;
}

export const BoardUserAvatar: React.FC<BoardUserAvatarProps> = ({
  initials,
  onMyPeople,
  onLogOut,
  showSaveAlert = false,
  likedCount = 0,
  onSignInClick,
}) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click. Pointerdown beats click so the menu dismisses
  // before the underlying surface receives the event.
  useEffect(() => {
    if (!open) return;
    const onDocDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onDocDown);
    return () => document.removeEventListener('pointerdown', onDocDown);
  }, [open]);

  // Esc dismisses too — keeps keyboard parity with the rest of the app.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const pick = (handler?: () => void) => () => {
    setOpen(false);
    handler?.();
  };

  return (
    <Wrap ref={wrapRef}>
      <Circle
        type="button"
        aria-label={
          showSaveAlert
            ? 'Account menu — sign in to keep your boards'
            : 'Account menu'
        }
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {initials ? initials : <PersonIcon />}
        {showSaveAlert && <AlertDot aria-hidden />}
      </Circle>
      {open && (
        <Menu role="menu">
          {/* Plain Sign in: always shown for anon users (signaled by an
              onSignInClick handler being passed in). Sits at the top so
              the standard action is the first thing the user reads. */}
          {onSignInClick && (
            <MenuItem role="menuitem" onClick={pick(onSignInClick)}>
              Sign in
            </MenuItem>
          )}
          {/* Alert variant: same destination as plain Sign in, with a
              red dot + explanatory subline. Only shown once the user
              has crossed the like threshold so they understand what
              the avatar dot is pointing at. */}
          {showSaveAlert && onSignInClick && (
            <AlertSignInItem role="menuitem" onClick={pick(onSignInClick)}>
              <InlineAlertDot aria-hidden />
              <AlertItemTextStack>
                <AlertItemPrimary>Sign in to keep your boards</AlertItemPrimary>
                <AlertItemSubline>
                  You&rsquo;ve liked {likedCount} {likedCount === 1 ? 'thing' : 'things'} —
                  they&rsquo;ll save to your account
                </AlertItemSubline>
              </AlertItemTextStack>
            </AlertSignInItem>
          )}
          <MenuItem role="menuitem" onClick={pick(onMyPeople)}>
            My people
          </MenuItem>
          <MenuItem role="menuitem" onClick={pick(onLogOut)}>
            Log out
          </MenuItem>
        </Menu>
      )}
    </Wrap>
  );
};
