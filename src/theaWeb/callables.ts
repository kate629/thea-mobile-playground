import { httpsCallable, type HttpsCallable } from 'firebase/functions';

import { functions } from '../firebaseFunctions';
import {
  THEA_WEB_CALLABLES,
  type TheaWebLogEventsRequest,
  type TheaWebLogEventsResponse,
  type TheaWebMergeGiftFlowRequest,
  type TheaWebMergeGiftFlowResponse,
  type TheaWebMintMergeTokenRequest,
  type TheaWebMintMergeTokenResponse,
  type TheaWebRecordActivityRequest,
  type TheaWebRecordActivityResponse,
  type TheaWebSubmitGiftFlowRequest,
  type TheaWebSubmitGiftFlowResponse,
  type TheaWebUpdateRecipientRequest,
  type TheaWebUpdateRecipientResponse,
} from './schemas';

// Submit returns synchronously after queuing the recommendation pipeline; long
// AI work runs in async triggers, so 60s is the wire ceiling not the work ceiling.
export const submitGiftFlow: HttpsCallable<
  TheaWebSubmitGiftFlowRequest,
  TheaWebSubmitGiftFlowResponse
> = httpsCallable(functions, THEA_WEB_CALLABLES.submitGiftFlow, { timeout: 60_000 });

export const recordActivity: HttpsCallable<
  TheaWebRecordActivityRequest,
  TheaWebRecordActivityResponse
> = httpsCallable(functions, THEA_WEB_CALLABLES.recordActivity, { timeout: 30_000 });

export const updateRecipient: HttpsCallable<
  TheaWebUpdateRecipientRequest,
  TheaWebUpdateRecipientResponse
> = httpsCallable(functions, THEA_WEB_CALLABLES.updateRecipient, { timeout: 30_000 });

// Merge fans out a WriteBatch across recipients/recommendations/giftActivities
// then deletes the source — generous timeout matches the worst-case fan-out.
export const mergeGiftFlow: HttpsCallable<
  TheaWebMergeGiftFlowRequest,
  TheaWebMergeGiftFlowResponse
> = httpsCallable(functions, THEA_WEB_CALLABLES.mergeGiftFlow, { timeout: 120_000 });

// Mints a single-use, 60s-TTL merge token while the caller is still anon.
// The returned token is paired with the anon uid in `mergeGiftFlow({fromUid, token})`
// after the caller authenticates as the surviving permanent uid.
export const mintMergeToken: HttpsCallable<
  TheaWebMintMergeTokenRequest,
  TheaWebMintMergeTokenResponse
> = httpsCallable(functions, THEA_WEB_CALLABLES.mintMergeToken, { timeout: 30_000 });

// First-party telemetry sink for the product-ranker training pipeline.
// Tolerant by design — never blocks user actions, drops invalid events
// silently. See `lib/eventSink.ts` for the batcher that calls this.
export const logEvents: HttpsCallable<
  TheaWebLogEventsRequest,
  TheaWebLogEventsResponse
> = httpsCallable(functions, THEA_WEB_CALLABLES.logEvents, { timeout: 15_000 });
