import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onIdTokenChanged } from 'firebase/auth';

import { useAuth } from '../firebase/FirebaseContext';

export interface LeaveWarningOptions {
  /**
   * When `true`, `requestLeave()` skips the dialog entirely for signed-in
   * (non-anonymous) users and navigates straight to `to`. Use on surfaces
   * where the user's data is already persisted to their account, so the
   * "you'll lose your results" copy is wrong (bug #46).
   *
   * Anonymous users still see the dialog regardless.
   */
  skipWhenSignedIn?: boolean;
}

export interface LeaveWarning {
  /** True when the warning dialog should render. */
  open: boolean;
  /**
   * Open the warning dialog (does not navigate). Wire to logo / back-button
   * clicks. When `skipWhenSignedIn` is set and the user is non-anonymous,
   * this navigates immediately instead of opening the dialog.
   */
  requestLeave: () => void;
  /** Close the dialog and navigate to `to` (default `/`). Wire to the dialog's primary action. */
  confirmLeave: () => void;
  /** Close the dialog without navigating. Wire to the dialog's secondary action + backdrop close. */
  cancelLeave: () => void;
}

/**
 * Logo / back-button "are you sure you want to leave?" dialog state machine.
 *
 * Used on `RecommendationResultsPage` to guard against accidental nav away
 * from in-flight quiz results (the rec doc is preserved server-side, but
 * reaching it again requires re-quizzing for anon users). Mirrors the OLD
 * givethea.com pattern. Also useful any time we want to gate `navigate(...)`
 * behind a confirmation prompt.
 *
 * Pass `{ skipWhenSignedIn: true }` to skip the dialog for signed-in users
 * (their results are persisted to their account, so the warning copy is
 * misleading — bug #46).
 *
 * @param to Destination path. Defaults to home (`/`).
 * @param options See {@link LeaveWarningOptions}.
 */
export function useLeaveWarning(
  to: string = '/',
  options: LeaveWarningOptions = {},
): LeaveWarning {
  const { skipWhenSignedIn = false } = options;
  const auth = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // Track signed-in (non-anonymous) status reactively. We use
  // `onIdTokenChanged` rather than `onAuthStateChanged` because
  // `linkWithPopup` (the anon -> signed-in upgrade path) keeps the same uid,
  // so `onAuthStateChanged` does NOT fire — but the id token changes, so
  // `onIdTokenChanged` does. This matches the auth-fix pattern used
  // elsewhere in theaWeb.
  const [isSignedIn, setIsSignedIn] = useState<boolean>(
    () => auth.currentUser?.isAnonymous === false,
  );
  useEffect(() => {
    return onIdTokenChanged(auth, (user) => {
      setIsSignedIn(user?.isAnonymous === false);
    });
  }, [auth]);

  const requestLeave = useCallback(() => {
    if (skipWhenSignedIn && isSignedIn) {
      // Signed-in users have their data persisted to their account — the
      // "you'll lose your results" copy is wrong, so just navigate.
      navigate(to);
      return;
    }
    setOpen(true);
  }, [skipWhenSignedIn, isSignedIn, navigate, to]);

  const confirmLeave = useCallback(() => {
    setOpen(false);
    navigate(to);
  }, [navigate, to]);

  const cancelLeave = useCallback(() => setOpen(false), []);

  return { open, requestLeave, confirmLeave, cancelLeave };
}
