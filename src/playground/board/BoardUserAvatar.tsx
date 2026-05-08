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
}

export const BoardUserAvatar: React.FC<BoardUserAvatarProps> = ({
  initials,
  onMyPeople,
  onLogOut,
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
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {initials ? initials : <PersonIcon />}
      </Circle>
      {open && (
        <Menu role="menu">
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
