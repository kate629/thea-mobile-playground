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
}

// Keyed by `${recipientId}::${productId}` so the same product can be saved
// under multiple recipients independently. Falls back to bare productId
// when recipientId is not provided (legacy/seed paths).
const entries = new Map<string, Entry>();
const listeners = new Set<() => void>();
let nextSeq = 1;

function entryKey(productId: string, recipientId?: string): string {
  return recipientId ? `${recipientId}::${productId}` : productId;
}

function emit() {
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
) {
  // Bump seq on every record so re-saving an item moves it back to the top
  // of the saved row (matches the user's mental model of "freshest pick").
  entries.set(entryKey(product.id, recipientId), {
    productId: product.id,
    recipientId,
    state,
    detail: detailFromProduct(product),
    seq: nextSeq++,
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
export function lastSavedSeqByRecipient(recipientId: string): number {
  let max = 0;
  entries.forEach((e) => {
    if (e.state === 'SAVED' && e.recipientId === recipientId && e.seq > max) {
      max = e.seq;
    }
  });
  return max;
}
