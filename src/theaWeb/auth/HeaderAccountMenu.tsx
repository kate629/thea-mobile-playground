import React, { useContext, useEffect, useReducer, useRef, useState } from 'react';
import styled from 'styled-components';
import { onAuthStateChanged, onIdTokenChanged, type Auth, type User } from 'firebase/auth';

import { useAuth } from '../firebase/FirebaseContext';
import { signOutUser } from './accountAuth';
import { AuthGateContext } from './AuthGateContext';

interface HeaderAccountMenuProps {
  /** Override the auth instance for tests/stories. Defaults to the FirebaseProvider's auth. */
  authInstance?: Auth;
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
  flex-shrink: 0;
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.clay};
    outline-offset: 2px;
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
  authInstance: authInstanceProp,
  userOverride,
  defaultMenuOpen = false,
}) => {
  // Default to the FirebaseProvider's auth; the prop override remains the
  // escape hatch for stories and tests that want to inject a stub directly.
  const ctxAuth = useAuth();
  const authInstance = authInstanceProp ?? ctxAuth;
  // Read the gate context safely so this component can render under hosts that
  // don't mount AuthGateProvider (e.g. Storybook, tests, isolated previews).
  // When absent, the Sign-in pill becomes a no-op rather than throwing.
  const gate = useContext(AuthGateContext);
  const requestSignIn = gate?.requestSignIn;
  // Force re-render via tick rather than `setState(user)` because Firebase
  // mutates the User object in place during `linkWithPopup` — so the listener
  // fires with the same reference React already has in state, and `setState`
  // bails out via `Object.is`. Reading `authInstance.currentUser` fresh on
  // each render avoids the bail-out entirely.
  const [, forceTick] = useReducer((x: number) => x + 1, 0);
  const [menuOpen, setMenuOpen] = useState(defaultMenuOpen);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (userOverride !== undefined) return; // story-driven; skip the listener.
    // Subscribe to BOTH listeners. `onIdTokenChanged` covers the in-place
    // anon→permanent link upgrade where the uid is preserved (and
    // `onAuthStateChanged` is silent). `onAuthStateChanged` covers cold-load
    // IndexedDB-restore on page refresh, which `onIdTokenChanged` sometimes
    // misses due to subscription timing during Auth init. Both feed the same
    // tick, and rendering reads `authInstance.currentUser` fresh below.
    const unsubAuth = onAuthStateChanged(authInstance, () => forceTick());
    const unsubToken = onIdTokenChanged(authInstance, () => forceTick());
    return () => {
      unsubAuth();
      unsubToken();
    };
  }, [authInstance, userOverride]);

  const user: User | null =
    userOverride !== undefined ? userOverride : authInstance.currentUser;

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
      <SignInButton
        type="button"
        onClick={() => requestSignIn?.({ mode: 'signin' })}
      >
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
        <span>{initialOf(u)}</span>
      </Avatar>
      {menuOpen && (
        <Dropdown role="menu">
          <DropdownHeader>
            <div className="name">{u.displayName || u.email || 'Signed in'}</div>
            {u.email && u.displayName && <div className="email">{u.email}</div>}
          </DropdownHeader>
          <DropdownItem type="button" role="menuitem" onClick={handleSignOut}>
            Log out
          </DropdownItem>
        </Dropdown>
      )}
    </Wrapper>
  );
};
