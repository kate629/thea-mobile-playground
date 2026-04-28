import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

/**
 * Merge-state machine for the anon → permanent migration that runs after
 * sign-in. Surfaces a single string consumers can branch on.
 *
 * Lifecycle:
 *   idle  ──setStatus('merging')──▶ merging  ──setStatus('merged'|'failed')──▶ terminal
 *
 * 'merging' triggers a 15s safety timeout — if the caller never reports
 * completion (network drop, callable hang) we auto-flip to 'failed' so
 * downstream listeners can resume rather than hold a loading state forever.
 *
 * Sheet bug #58: useRecommendationDoc reads this status and holds its
 * previous doc state during 'merging' instead of re-subscribing at the
 * fresh permanent-uid path (which is empty until mergeGiftFlow completes).
 * Without the gate, the page briefly renders "we couldn't find this
 * recommendation" between auth-flip and merge-complete.
 */
export type MergeStatus = 'idle' | 'merging' | 'merged' | 'failed';

interface MergeStateValue {
  status: MergeStatus;
  setStatus: (status: MergeStatus) => void;
}

const MergeStateContext = createContext<MergeStateValue | null>(null);

const MERGE_SAFETY_TIMEOUT_MS = 15_000;

export const MergeStateProvider: React.FC<{
  children: React.ReactNode;
  /** Override the safety-timeout for tests. Production callers omit. */
  safetyTimeoutMs?: number;
}> = ({ children, safetyTimeoutMs = MERGE_SAFETY_TIMEOUT_MS }) => {
  const [status, setStatusState] = useState<MergeStatus>('idle');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSafetyTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const setStatus = useCallback(
    (next: MergeStatus) => {
      clearSafetyTimeout();
      setStatusState(next);
      if (next === 'merging') {
        timeoutRef.current = setTimeout(() => {
          // Caller never reported completion — flip to 'failed' so listeners
          // unblock. The merge may still complete BE-side; the user just
          // gets the post-merge UI a beat later than the happy path.
          setStatusState('failed');
          timeoutRef.current = null;
        }, safetyTimeoutMs);
      }
    },
    [clearSafetyTimeout, safetyTimeoutMs],
  );

  useEffect(() => () => clearSafetyTimeout(), [clearSafetyTimeout]);

  const value = useMemo(() => ({ status, setStatus }), [status, setStatus]);

  return (
    <MergeStateContext.Provider value={value}>
      {children}
    </MergeStateContext.Provider>
  );
};

/** Read-only access to the current merge status. Defaults to 'idle' when no
 *  provider is mounted (tests, isolated stories). */
export function useMergeStatus(): MergeStatus {
  const ctx = useContext(MergeStateContext);
  return ctx?.status ?? 'idle';
}

/** Setter exposed for the sign-in flow to drive the state machine. Returns
 *  a no-op if no provider is mounted. */
export function useSetMergeStatus(): (status: MergeStatus) => void {
  const ctx = useContext(MergeStateContext);
  return ctx?.setStatus ?? (() => undefined);
}
