import React from 'react';
import styled from 'styled-components';

/**
 * Replaces the legacy "Sign in" button with a user avatar circle. Tap
 * navigates to "Your people" — for v1 this is the homepage (stub). Real
 * implementation would route to a /people view that lists all the user's
 * recipient boards.
 *
 * For anonymous users, falls back to a generic person icon (no initials
 * to extract). The whole avatar is the affordance for opening the people
 * surface, regardless of auth state.
 */

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

const PersonIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

interface BoardUserAvatarProps {
  initials?: string;
  onClick?: () => void;
}

export const BoardUserAvatar: React.FC<BoardUserAvatarProps> = ({ initials, onClick }) => (
  <Circle
    type="button"
    aria-label="Your people"
    onClick={onClick}
  >
    {initials ? initials : <PersonIcon />}
  </Circle>
);
