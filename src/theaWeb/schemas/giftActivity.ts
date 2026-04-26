import type { Timestamp } from 'firebase/firestore';
import type {
  TheaWebActivitySourceEnum,
  TheaWebGiftActivityStateEnum,
} from './enums';

// Frozen at first action (heart or dismiss). Survives if `product/{id}` is later updated/deleted.
export interface ProductSnapshot {
  title: string;
  brand?: string;
  price?: number;
  imageUrl?: string;
  url: string;
}

// Only populated when state === 'PURCHASED'.
export interface PurchaseDetails {
  price?: number;
  purchaseDate?: Timestamp;
}

// Doc at `theaWebUser/{uid}/recipient/{recipientId}/giftActivity/{productId}`.
// Doc id equals productId — natural idempotency on re-saves.
// Single subcollection with a `state` field; transitions are field updates, not document moves.
export interface GiftActivity {
  productId: string;
  state: TheaWebGiftActivityStateEnum;
  productSnapshot: ProductSnapshot;
  affiliateUrl: string;
  source: TheaWebActivitySourceEnum;
  savedAt?: Timestamp;
  dismissedAt?: Timestamp;
  purchasedAt?: Timestamp;
  purchaseDetails?: PurchaseDetails;
  _mergedFrom?: string;
  _schemaVersion: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
