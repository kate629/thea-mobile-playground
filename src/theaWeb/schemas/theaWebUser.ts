import type { Timestamp } from 'firebase/firestore';

// Top-level doc at `theaWebUser/{uid}` — doc id equals the Firebase Auth uid.
// Subtree parent for recipient/recommendation/giftActivity.
export interface TheaWebUser {
  uid: string;
  isAnonymous: boolean;
  marketingOptIn: boolean;
  lastSeenAt: Timestamp;
  _mergedFrom?: string;
  _schemaVersion: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
