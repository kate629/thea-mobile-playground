// Hand-mirrored from `thea-shared-schemas/schemas/theaWeb/theaWebMergeGiftFlowRequest.json`
// and `theaWebMergeGiftFlowResponse.json`.

import type { TheaWebMergeStatusEnum } from '../enums';

export interface TheaWebMergeGiftFlowRequest {
  // Anonymous uid being merged FROM (will be deleted post-merge).
  fromUid: string;
  // Short-lived merge token signed as `fromUid`. Server verifies signer + freshness.
  token: string;
}

export interface TheaWebMergeGiftFlowCounts {
  recipients: number;
  recommendations: number;
  giftActivities: number;
}

export interface TheaWebMergeGiftFlowResponse {
  status: TheaWebMergeStatusEnum;
  // Present when status !== 'NOOP'.
  auditId?: string;
  counts?: TheaWebMergeGiftFlowCounts;
}
