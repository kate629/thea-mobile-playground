import type { GiftActivityDetail } from '../../theaWeb/hooks/useGiftActivities';
import type { RecommendationProduct } from '../../theaWeb/schemas';

type State = 'SAVED' | 'DISMISSED' | 'PURCHASED';

interface Entry {
  productId: string;
  /** Recipient this activity belongs to. Optional only for legacy entries
   *  that predate per-recipient scoping; new code always sets it. */
  recipientId?: string;
  state: State;
  detail: GiftActivityDetail;
  /** Monotonically increasing — used to render newest-first in the saved area. */
  seq: number;
  /** True for entries inserted by the seed (Maya/Dad/Sis pre-populated
   *  collages). Excluded from the "user has liked >= 3 things" threshold
   *  so the save-prompt dot doesn't fire on a fresh load. */
  seeded?: boolean;
}

// Keyed by `${recipientId}::${productId}` so the same product can be saved
// under multiple recipients independently. Falls back to bare productId
// when recipientId is not provided (legacy/seed paths).
const STORAGE_KEY = 'thea-playground:activity:v1';

interface SerializedActivity {
  entries: [string, Entry][];
  nextSeq: number;
}

function hydrate(): { entries: Map<string, Entry>; nextSeq: number } {
  if (typeof window === 'undefined') return { entries: new Map(), nextSeq: 1 };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { entries: new Map(), nextSeq: 1 };
    const parsed = JSON.parse(raw) as SerializedActivity;
    return { entries: new Map(parsed.entries), nextSeq: parsed.nextSeq ?? 1 };
  } catch {
    return { entries: new Map(), nextSeq: 1 };
  }
}

function persist() {
  if (typeof window === 'undefined') return;
  try {
    const payload: SerializedActivity = {
      entries: Array.from(entries.entries()),
      nextSeq,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Quota exceeded or storage disabled — in-memory state still works.
  }
}

const _hydrated = hydrate();
const entries = _hydrated.entries;
const listeners = new Set<() => void>();
let nextSeq = _hydrated.nextSeq;

function entryKey(productId: string, recipientId?: string): string {
  return recipientId ? `${recipientId}::${productId}` : productId;
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

function detailFromProduct(p: RecommendationProduct): GiftActivityDetail {
  const detail: GiftActivityDetail = { id: p.id, title: p.title };
  if (p.brand) detail.brand = p.brand;
  if (typeof p.price === 'number') detail.price = p.price;
  const img = p.images_cdn_mobile?.[0] ?? p.images_cdn?.[0] ?? p.images?.[0];
  if (img) detail.imageUrl = img;
  if (p.url) detail.productUrl = p.url;
  return detail;
}

export function recordMockActivity(
  product: RecommendationProduct,
  state: State,
  recipientId?: string,
  opts?: { seeded?: boolean },
) {
  // Bump seq on every record so re-saving an item moves it back to the top
  // of the saved row (matches the user's mental model of "freshest pick").
  entries.set(entryKey(product.id, recipientId), {
    productId: product.id,
    recipientId,
    state,
    detail: detailFromProduct(product),
    seq: nextSeq++,
    seeded: opts?.seeded,
  });
  emit();
}

export function clearMockActivity(productId: string, recipientId?: string) {
  // When recipientId is given, only clear that recipient's entry. Without
  // it, fall back to scanning all entries for the productId (legacy path).
  if (recipientId) {
    if (entries.delete(entryKey(productId, recipientId))) emit();
    return;
  }
  let changed = false;
  Array.from(entries.entries()).forEach(([key, e]) => {
    if (e.productId === productId) {
      entries.delete(key);
      changed = true;
    }
  });
  if (changed) emit();
}

export function readMockActivity(scopeRecipientId?: string): {
  liked: Set<string>;
  dismissed: Set<string>;
  purchased: Set<string>;
  likedDetails: GiftActivityDetail[];
  dismissedDetails: GiftActivityDetail[];
  purchasedDetails: GiftActivityDetail[];
} {
  const liked = new Set<string>();
  const dismissed = new Set<string>();
  const purchased = new Set<string>();
  // Sort newest first (descending seq) so caller arrays render newest-first.
  // When a scope is given, ignore entries belonging to other recipients.
  const sorted = Array.from(entries.values())
    .filter((e) => !scopeRecipientId || e.recipientId === scopeRecipientId)
    .sort((a, b) => b.seq - a.seq);
  const likedDetails: GiftActivityDetail[] = [];
  const dismissedDetails: GiftActivityDetail[] = [];
  const purchasedDetails: GiftActivityDetail[] = [];
  sorted.forEach((e) => {
    if (e.state === 'SAVED') {
      liked.add(e.productId);
      likedDetails.push(e.detail);
    } else if (e.state === 'DISMISSED') {
      dismissed.add(e.productId);
      dismissedDetails.push(e.detail);
    } else if (e.state === 'PURCHASED') {
      purchased.add(e.productId);
      purchasedDetails.push(e.detail);
    }
  });
  return { liked, dismissed, purchased, likedDetails, dismissedDetails, purchasedDetails };
}

export function subscribeMockActivity(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** Top-N saved image URLs for a recipient, newest-first. Powers the
 *  per-recipient collage on the People page. */
export function readSavedImagesByRecipient(
  recipientId: string,
  limit = 4,
): string[] {
  return Array.from(entries.values())
    .filter((e) => e.state === 'SAVED' && e.recipientId === recipientId)
    .sort((a, b) => b.seq - a.seq)
    .slice(0, limit)
    .map((e) => e.detail.imageUrl)
    .filter((u): u is string => Boolean(u));
}

/** Highest seq of any SAVED entry for this recipient — used to sort the
 *  People page tiles "most-recently-saved-first." Returns 0 when the
 *  recipient has no saves yet. */
/** Total user-liked count across all recipients, excluding seed entries.
 *  Drives the "save your boards" alert dot threshold (≥3 → show). */
export function getUserLikedCount(): number {
  let count = 0;
  entries.forEach((e) => {
    if (e.state === 'SAVED' && !e.seeded) count++;
  });
  return count;
}

export function lastSavedSeqByRecipient(recipientId: string): number {
  let max = 0;
  entries.forEach((e) => {
    if (e.state === 'SAVED' && e.recipientId === recipientId && e.seq > max) {
      max = e.seq;
    }
  });
  return max;
}
