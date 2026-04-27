import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { onAuthStateChanged, type User } from 'firebase/auth';

import { auth as defaultAuth } from '../../firebaseConfig';
import { signOutUser } from './accountAuth';
import { useAuthGate } from './AuthGateContext';

interface HeaderAccountMenuProps {
  /** Override the auth instance for tests/stories. */
  authInstance?: typeof defaultAuth;
  /** Override the resolved user for stories — when set, skips the listener. */
  userOverride?: User | null;
  /** Force the dropdown open (Storybook variants). */
  defaultMenuOpen?: boolean;
}

const SignInButton = styled.button`
  display: inline-flex;
  align-items: center;
  height: 36px;
  padding: 0 16px;
  border-radius: 9999px;
  border: 1px solid ${({ theme }) => theme.color.warmBorder};
  background: #ffffff;
  color: ${({ theme }) => theme.color.clay};
  font-family: ${({ theme }) => theme.font.sans};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 150ms ease;
  &:hover { background: ${({ theme }) => theme.color.creamLight}; }
`;

const Avatar = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 9999px;
  border: 0;
  background: ${({ theme }) => theme.color.clay};
  color: #ffffff;
  font-family: ${({ theme }) => theme.font.sans};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.clay};
    outline-offset: 2px;
  }
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const Wrapper = styled.div`
  position: relative;
`;

const Dropdown = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 220px;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.color.warmBorder};
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  padding: 12px;
  z-index: 60;
`;

const DropdownHeader = styled.div`
  padding: 4px 8px 12px;
  border-bottom: 1px solid ${({ theme }) => theme.color.warmBorder};
  margin-bottom: 8px;
  .name {
    font-family: ${({ theme }) => theme.font.sans};
    font-size: 14px;
    font-weight: 600;
    color: hsl(var(--foreground));
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .email {
    font-family: ${({ theme }) => theme.font.sans};
    font-size: 12px;
    color: ${({ theme }) => theme.color.mutedText};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const DropdownItem = styled.button`
  width: 100%;
  text-align: left;
  padding: 8px;
  border: 0;
  background: transparent;
  font-family: ${({ theme }) => theme.font.sans};
  font-size: 14px;
  color: hsl(var(--foreground));
  border-radius: 8px;
  cursor: pointer;
  &:hover { background: ${({ theme }) => theme.color.creamLight}; }
`;

function initialOf(user: User): string {
  const source = user.displayName || user.email || '';
  const ch = source.trim().charAt(0);
  return ch ? ch.toUpperCase() : '?';
}

export const HeaderAccountMenu: React.FC<HeaderAccountMenuProps> = ({
  authInstance = defaultAuth,
  userOverride,
  defaultMenuOpen = false,
}) => {
  const { requestSignIn } = useAuthGate();
  const [user, setUser] = useState<User | null>(
    userOverride !== undefined ? userOverride : authInstance.currentUser,
  );
  const [menuOpen, setMenuOpen] = useState(defaultMenuOpen);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (userOverride !== undefined) return; // story-driven; skip the listener.
    const unsub = onAuthStateChanged(authInstance, (next) => setUser(next));
    return () => unsub();
  }, [authInstance, userOverride]);

  // Close on outside click.
  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuOpen]);

  const isPermanent = !!user && !user.isAnonymous;

  if (!isPermanent) {
    return (
      <SignInButton type="button" onClick={() => requestSignIn({ mode: 'signin' })}>
        Sign in
      </SignInButton>
    );
  }

  const u = user as User;
  const handleSignOut = async () => {
    setMenuOpen(false);
    try {
      await signOutUser(authInstance);
    } catch (err) {
      console.error('[HeaderAccountMenu] signOut failed:', err);
    }
  };

  return (
    <Wrapper ref={wrapperRef}>
      <Avatar
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label="Account menu"
      >
        {u.photoURL ? <img src={u.photoURL} alt="" /> : <span>{initialOf(u)}</span>}
      </Avatar>
      {menuOpen && (
        <Dropdown role="menu">
          <DropdownHeader>
            <div className="name">{u.displayName || u.email || 'Signed in'}</div>
            {u.email && u.displayName && <div className="email">{u.email}</div>}
          </DropdownHeader>
          <DropdownItem type="button" role="menuitem" onClick={handleSignOut}>
            Sign out
          </DropdownItem>
        </Dropdown>
      )}
    </Wrapper>
  );
};
