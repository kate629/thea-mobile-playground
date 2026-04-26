import type { Timestamp } from 'firebase/firestore';
import type { TheaWebMergeStatusEnum } from './enums';

export interface TheaWebMergeAuditCounts {
  recipients: number;
  recommendations: number;
  giftActivities: number;
}

// Top-level doc at `theaWebMergeAudit/{auditId}`.
// Append-only audit row written by the `theaWebMergeGiftFlow` callable.
// Readable by either side of the merge; writes are server-only.
export interface TheaWebMergeAudit {
  auditId: string;
  fromUid: string;
  toUid: string;
  counts: TheaWebMergeAuditCounts;
  status: TheaWebMergeStatusEnum;
  tokenJti?: string;
  mergedAt: Timestamp;
  _schemaVersion: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
