// PLAYGROUND-ONLY — never ports back. The real product reads recipients
// from Firestore (theaWebUser/{uid}/recipient/*). This in-memory registry
// is what the People page uses to render tiles for everyone the user has
// quizzed for.

import {
  lastSavedSeqByRecipient,
  readSavedImagesByRecipient,
} from './giftActivityStore';

export interface RecipientEntry {
  id: string;
  name: string;
  emoji: string;
  /** Wall-clock at registration; used as the tile-sort fallback when the
   *  recipient has zero saves. */
  registeredAt: number;
}

const STORAGE_KEY = 'thea-playground:recipients:v1';

function hydrate(): Map<string, RecipientEntry> {
  if (typeof window === 'undefined') return new Map();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Map();
    const parsed = JSON.parse(raw) as RecipientEntry[];
    return new Map(parsed.map((r) => [r.id, r]));
  } catch {
    return new Map();
  }
}

function persist() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(Array.from(recipients.values())),
    );
  } catch {
    // Quota / disabled — fall back to in-memory only.
  }
}

const recipients = hydrate();
const listeners = new Set<() => void>();

function emit() {
  persist();
  listeners.forEach((l) => l());
}

export function registerRecipient(entry: Omit<RecipientEntry, 'registeredAt'>) {
  const existing = recipients.get(entry.id);
  recipients.set(entry.id, {
    ...entry,
    registeredAt: existing?.registeredAt ?? Date.now(),
  });
  emit();
}

export function renameRecipient(
  id: string,
  newName: string,
  newEmoji?: string,
) {
  const existing = recipients.get(id);
  if (!existing) return;
  const trimmedName = newName.trim();
  const trimmedEmoji = newEmoji?.trim();
  const nextName = trimmedName || existing.name;
  const nextEmoji = trimmedEmoji || existing.emoji;
  if (nextName === existing.name && nextEmoji === existing.emoji) return;
  recipients.set(id, { ...existing, name: nextName, emoji: nextEmoji });
  emit();
}

export function readRecipients(): RecipientEntry[] {
  // Sort: most-recently-saved-into first. Recipients with zero saves fall
  // through to registration time (newest registered first).
  return Array.from(recipients.values()).sort((a, b) => {
    const sa = lastSavedSeqByRecipient(a.id);
    const sb = lastSavedSeqByRecipient(b.id);
    if (sa !== sb) return sb - sa;
    return b.registeredAt - a.registeredAt;
  });
}

export function subscribeRecipients(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** Top-N saved image URLs for a recipient — re-exported from the
 *  activity store so consumers only import from one module. */
export { readSavedImagesByRecipient };

// ─── No seed data ────────────────────────────────────────────────────
//
// Earlier playground iterations seeded Mom + Maya + Dad + Sis with
// pre-populated collages so the People page wasn't empty. Removed
// 2026-05-09: the prototype should reflect what a real new user sees
// — an empty "My people" surface with only the "Add someone" tile,
// until they take the quiz. Recipients are populated on submit (see
// `submitGiftFlow` in `theaWeb/callables.ts`).
