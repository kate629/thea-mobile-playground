import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export interface LeaveWarning {
  /** True when the warning dialog should render. */
  open: boolean;
  /** Open the warning dialog (does not navigate). Wire to logo / back-button clicks. */
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
 * @param to Destination path. Defaults to home (`/`).
 */
export function useLeaveWarning(to: string = '/'): LeaveWarning {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const requestLeave = useCallback(() => setOpen(true), []);
  const confirmLeave = useCallback(() => {
    setOpen(false);
    navigate(to);
  }, [navigate, to]);
  const cancelLeave = useCallback(() => setOpen(false), []);
  return { open, requestLeave, confirmLeave, cancelLeave };
}
