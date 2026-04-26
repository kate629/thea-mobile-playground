// Hand-mirrored from `thea-shared-schemas/schemas/theaWeb/theaWebUpdateRecipientRequest.json`
// and `theaWebUpdateRecipientResponse.json`.
//
// Partial update — only present fields are written.

import type {
  TheaWebGenderEnum,
  TheaWebRelationshipEnum,
} from '../enums';

export interface TheaWebUpdateRecipientRequest {
  recipientId: string;
  name?: string;
  emoji?: string;
  relationship?: TheaWebRelationshipEnum;
  gender?: TheaWebGenderEnum;
  age?: number;
  // True sets `archivedAt = serverTimestamp`. False clears it.
  archive?: boolean;
}

export interface TheaWebUpdateRecipientResponse {
  recipientId: string;
  // ISO date-time string of the resulting `updatedAt`.
  updatedAt: string;
}
