// PLAYGROUND-ONLY — never ports back. The real product reads recipients
// from Firestore (theaWebUser/{uid}/recipient/*). This in-memory registry
// is what the People page uses to render tiles for everyone the user has
// quizzed for.

import { MOCK_PRODUCTS } from './products';
import {
  recordMockActivity,
  lastSavedSeqByRecipient,
  readSavedImagesByRecipient,
} from './giftActivityStore';
import { MOCK_RECIPIENT_ID } from './playgroundConfig';

export interface RecipientEntry {
  id: string;
  name: string;
  emoji: string;
  /** Wall-clock at registration; used as the tile-sort fallback when the
   *  recipient has zero saves. */
  registeredAt: number;
}

const recipients = new Map<string, RecipientEntry>();
const listeners = new Set<() => void>();

function emit() {
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

// ─── Seed data ───────────────────────────────────────────────────────
//
// Pre-populate the registry with the active "Mom" recipient + a couple
// of others so the People page is not empty on first load. Each seeded
// non-active recipient gets a few mock saves so their tile collage is
// populated rather than falling back to the empty-emoji placeholder.

// Prefixes in MOCK_PRODUCTS: b=beauty, c=cooking, d=decor, k=books.
const SEEDED = [
  { id: MOCK_RECIPIENT_ID, name: 'Mom', emoji: '🌷', seedProductIds: [] },
  { id: 'mock-recipient-maya', name: 'Maya', emoji: '🦋', seedProductIds: ['k1', 'b2', 'c3', 'd4'] },
  { id: 'mock-recipient-dad', name: 'Dad', emoji: '⛳', seedProductIds: ['c1', 'k3', 'd9', 'b3'] },
  { id: 'mock-recipient-sis', name: 'Sis', emoji: '👯', seedProductIds: ['d2', 'b1', 'k2'] },
] as const;

let seeded = false;

export function seedRecipientRegistry() {
  if (seeded) return;
  seeded = true;
  SEEDED.forEach((r) => {
    registerRecipient({ id: r.id, name: r.name, emoji: r.emoji });
    r.seedProductIds.forEach((pid) => {
      const product = MOCK_PRODUCTS.find((p) => p.id === pid);
      if (product) recordMockActivity(product, 'SAVED', r.id);
    });
  });
}

// Auto-seed on first import — happens once per page load before any
// component renders, so the People page sees a populated registry.
seedRecipientRegistry();
