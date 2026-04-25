import { useCallback, useEffect, useRef, useState } from 'react';
import { ProfileDraft, ProfileSavedHints } from './types';

const SAVED_HINT_MS = 1500;

export interface UseProfileDrawerOptions {
  initial: ProfileDraft;
  /** Called when the user taps "Update picks". */
  onCommit?: (next: ProfileDraft) => void;
}

export interface ProfileDrawerControlSlice {
  open: boolean;
  draft: ProfileDraft;
  savedHints: ProfileSavedHints;
  openDrawer: () => void;
  closeDrawer: () => void;
  setField: <K extends keyof ProfileDraft>(field: K, value: ProfileDraft[K]) => void;
  commit: () => void;
}

export function useProfileDrawer({ initial, onCommit }: UseProfileDrawerOptions): ProfileDrawerControlSlice {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ProfileDraft>(initial);
  const [savedHints, setSavedHints] = useState<ProfileSavedHints>({});
  const timersRef = useRef<Map<keyof ProfileDraft, ReturnType<typeof setTimeout>>>(new Map());

  // Reset draft when `initial` reference changes (e.g. switching person).
  useEffect(() => {
    setDraft(initial);
    setSavedHints({});
  }, [initial]);

  // Clean up flash timers on unmount.
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  const flashHint = useCallback((field: keyof ProfileDraft) => {
    const existing = timersRef.current.get(field);
    if (existing) clearTimeout(existing);
    setSavedHints((prev) => ({ ...prev, [field]: true }));
    const t = setTimeout(() => {
      setSavedHints((prev) => ({ ...prev, [field]: false }));
      timersRef.current.delete(field);
    }, SAVED_HINT_MS);
    timersRef.current.set(field, t);
  }, []);

  const setField = useCallback(<K extends keyof ProfileDraft>(field: K, value: ProfileDraft[K]) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
    flashHint(field);
  }, [flashHint]);

  const commit = useCallback(() => {
    onCommit?.(draft);
    setOpen(false);
  }, [draft, onCommit]);

  return {
    open,
    draft,
    savedHints,
    openDrawer: () => setOpen(true),
    closeDrawer: () => setOpen(false),
    setField,
    commit,
  };
}
