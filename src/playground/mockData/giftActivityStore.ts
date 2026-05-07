import type { GiftActivityDetail } from '../../theaWeb/hooks/useGiftActivities';
import type { RecommendationProduct } from '../../theaWeb/schemas';

type State = 'SAVED' | 'DISMISSED' | 'PURCHASED';

interface Entry {
  productId: string;
  state: State;
  detail: GiftActivityDetail;
  /** Monotonically increasing — used to render newest-first in the saved area. */
  seq: number;
}

const entries = new Map<string, Entry>();
const listeners = new Set<() => void>();
let nextSeq = 1;

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

export function recordMockActivity(product: RecommendationProduct, state: State) {
  // Bump seq on every record so re-saving an item moves it back to the top
  // of the saved row (matches the user's mental model of "freshest pick").
  entries.set(product.id, {
    productId: product.id,
    state,
    detail: detailFromProduct(product),
    seq: nextSeq++,
  });
  emit();
}

export function clearMockActivity(productId: string) {
  if (entries.delete(productId)) emit();
}

export function readMockActivity(): {
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
  const sorted = Array.from(entries.values()).sort((a, b) => b.seq - a.seq);
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
