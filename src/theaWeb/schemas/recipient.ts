import type { Timestamp } from 'firebase/firestore';
import type { TheaWebGenderEnum, TheaWebRelationshipEnum } from './enums';

// Frozen on each recommendation doc at submit time.
// Editing the parent recipient does NOT rewrite past snapshots.
export interface RecipientSnapshot {
  name: string;
  emoji?: string;
  relationship: TheaWebRelationshipEnum;
  gender?: TheaWebGenderEnum;
  age?: number;
  isMe: boolean;
}

// Doc at `theaWebUser/{uid}/recipient/{recipientId}`.
export interface Recipient {
  recipientId: string;
  name: string;
  emoji?: string;
  relationship: TheaWebRelationshipEnum;
  gender?: TheaWebGenderEnum;
  age?: number;
  isMe: boolean;
  currentRecommendationId?: string;
  archivedAt?: Timestamp;
  _mergedFrom?: string;
  _schemaVersion: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
