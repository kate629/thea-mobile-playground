import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ProfileDraft, ProfileSavedHints } from './types';
import {
  isAlgoDirty,
  isProfileDraftComplete,
  isRecipientOnlyDirty,
} from '../../../theaWeb/lib/profileDraftAdapter';
import { getGenderFromRelationship } from '../quiz/constants';
import { NEEDS_GENDER_RELATIONSHIPS } from '../quiz/useQuizFlow';

const SAVED_HINT_MS = 1500;

/**
 * Fields that flash a "saved" hint on edit. Restricted to the recipient
 * metadata fields users expect to auto-persist (`name`, `emoji`) plus
 * birthday — the others are algo-trigger or filter fields where the change
 * isn't actually saved until "Update picks" fires, so a "saved" indicator
 * would lie.
 */
const SAVED_HINT_FIELDS: ReadonlyArray<keyof ProfileDraft> = [
  'name',
  'emoji',
  'birthMonth',
  'birthDay',
];

export interface UseProfileDrawerOptions {
  initial: ProfileDraft;
  /** Called when the user taps "Update picks". */
  onCommit?: (next: ProfileDraft) => void;
  /**
   * Called when the drawer closes WITHOUT a commit (X / backdrop) AND the
   * user changed only recipient-metadata fields (`name`, `emoji`). Lets
   * callers persist those edits via `theaWebUpdateRecipient` so they aren't
   * lost — the "Update picks" CTA stays disabled for these fields per bug
   * #51, so on-close auto-save is the only persistence path.
   */
  onAutoSaveOnClose?: (next: ProfileDraft) => void;
}

export interface ProfileDrawerControlSlice {
  open: boolean;
  draft: ProfileDraft;
  savedHints: ProfileSavedHints;
  openDrawer: () => void;
  closeDrawer: () => void;
  setField: <K extends keyof ProfileDraft>(field: K, value: ProfileDraft[K]) => void;
  commit: () => void;
  /**
   * True when at least one algo-triggering field (gender, age, interests,
   * freeform, relationship, occasion, vibes) differs from the initial draft.
   * Net-zero edits return false — toggling an interest off and back on does
   * not enable the button (bug #51).
   */
  isDirty: boolean;
  /**
   * True when `isDirty` AND the draft has all the inputs the algo needs
   * (≥2 interests, relationship/gender/age/occasion all set). Drives the
   * "Update picks" enabled state — clearing a required field disables the
   * button even if other algo-triggers changed (bug #51).
   */
  canCommit: boolean;
}

export function useProfileDrawer({
  initial,
  onCommit,
  onAutoSaveOnClose,
}: UseProfileDrawerOptions): ProfileDrawerControlSlice {
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
    setDraft((prev) => {
      // Auto-derive gender on unambiguous relationship changes (Mom→female,
      // Brother→male, etc.) — mirrors the quiz's NEEDS_GENDER gating so the
      // drawer matches the same step-skipping logic. The user never sees
      // the gender field for these relationships (see ProfileDrawer), so
      // we have to set it under the hood. Ambiguous relationships
      // (Partner/Friend/Me!/Other) leave gender alone — the drawer surfaces
      // the picker and the user makes the call. Bug #51 followup.
      if (field === 'relationship' && typeof value === 'string' && value.length > 0) {
        const next: ProfileDraft = { ...prev, relationship: value };
        if (!NEEDS_GENDER_RELATIONSHIPS.includes(value)) {
          next.gender = getGenderFromRelationship(value);
        }
        return next;
      }
      return { ...prev, [field]: value };
    });
    if (SAVED_HINT_FIELDS.includes(field)) {
      flashHint(field);
    }
  }, [flashHint]);

  const isDirty = useMemo(() => isAlgoDirty(initial, draft), [initial, draft]);
  const canCommit = useMemo(
    () => isDirty && isProfileDraftComplete(draft),
    [isDirty, draft],
  );

  const commit = useCallback(() => {
    onCommit?.(draft);
    setOpen(false);
  }, [draft, onCommit]);

  const closeDrawer = useCallback(() => {
    // Auto-save recipient-only edits (name / emoji) on close. The "Update
    // picks" CTA only triggers regenerate, so without this hook those edits
    // would be silently dropped.
    if (onAutoSaveOnClose && !isAlgoDirty(initial, draft) && isRecipientOnlyDirty(initial, draft)) {
      onAutoSaveOnClose(draft);
    }
    setOpen(false);
  }, [draft, initial, onAutoSaveOnClose]);

  return {
    open,
    draft,
    savedHints,
    openDrawer: () => setOpen(true),
    closeDrawer,
    setField,
    commit,
    isDirty,
    canCommit,
  };
}
