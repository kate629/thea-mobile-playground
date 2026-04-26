// Hand-mirrored from `thea-shared-schemas/schemas/theaWeb/theaWebRecordActivityRequest.json`
// and `theaWebRecordActivityResponse.json`.

import type {
  TheaWebActivitySourceEnum,
  TheaWebGiftActivityStateEnum,
} from '../enums';

export interface TheaWebRecordActivityPurchaseDetails {
  price?: number;
  // ISO date-time string; serializes cleanly across the wire.
  purchaseDate?: string;
}

export interface TheaWebRecordActivityRequest {
  productId: string;
  state: TheaWebGiftActivityStateEnum;
  source: TheaWebActivitySourceEnum;
  // 1+ recipients; supports multi-recipient save fan-out in a single call.
  recipientIds: string[];
  purchaseDetails?: TheaWebRecordActivityPurchaseDetails;
}

export interface TheaWebRecordActivityWritten {
  recipientId: string;
  productId: string;
  state: TheaWebGiftActivityStateEnum;
}

export interface TheaWebRecordActivityResponse {
  // Server-resolved Sovrn affiliate URL (or passthrough plain URL for v1).
  affiliateUrl: string;
  written: TheaWebRecordActivityWritten[];
}
