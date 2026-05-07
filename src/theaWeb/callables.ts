// PLAYGROUND STUB — replaces real callables with mocks that drive the
// in-memory giftActivityStore. Real version at upstream:src/theaWeb/callables.ts.
// Never port this back.

import { findProduct } from '../playground/mockData/products';
import {
  clearMockActivity,
  recordMockActivity,
} from '../playground/mockData/giftActivityStore';
import type {
  TheaWebLogEventsRequest,
  TheaWebLogEventsResponse,
  TheaWebMergeGiftFlowRequest,
  TheaWebMergeGiftFlowResponse,
  TheaWebMintMergeTokenRequest,
  TheaWebMintMergeTokenResponse,
  TheaWebRecordActivityRequest,
  TheaWebRecordActivityResponse,
  TheaWebSubmitGiftFlowRequest,
  TheaWebSubmitGiftFlowResponse,
  TheaWebUpdateRecipientRequest,
  TheaWebUpdateRecipientResponse,
} from './schemas';
import {
  MOCK_CAROUSEL_SESSION_ID,
  MOCK_RECIPIENT_ID,
  MOCK_RECOMMENDATION_ID,
} from '../playground/mockData/playgroundConfig';

interface CallableResult<T> {
  data: T;
}

export const submitGiftFlow = async (
  _payload: TheaWebSubmitGiftFlowRequest,
): Promise<CallableResult<TheaWebSubmitGiftFlowResponse>> => {
  await new Promise((r) => setTimeout(r, 200));
  return {
    data: {
      recipientId: MOCK_RECIPIENT_ID,
      recommendationId: MOCK_RECOMMENDATION_ID,
      carouselSessionId: MOCK_CAROUSEL_SESSION_ID,
      status: 'PROCESSING',
    },
  };
};

export const recordActivity = async (
  payload: TheaWebRecordActivityRequest,
): Promise<CallableResult<TheaWebRecordActivityResponse>> => {
  const product = findProduct(payload.productId);
  if (product) {
    if (payload.state === 'SAVED' || payload.state === 'PURCHASED' || payload.state === 'DISMISSED') {
      recordMockActivity(product, payload.state);
    }
  }
  return {
    data: {
      affiliateUrl: product?.affiliateUrl ?? product?.url ?? '',
      written: payload.recipientIds.map((rid) => ({
        recipientId: rid,
        productId: payload.productId,
        state: payload.state,
      })),
    },
  };
};

// Provided for parity with upstream callable surface; the playground
// re-uses recordActivity to clear save state when the user un-hearts.
export function clearMockActivityById(productId: string) {
  clearMockActivity(productId);
}

export const updateRecipient = async (
  _payload: TheaWebUpdateRecipientRequest,
): Promise<CallableResult<TheaWebUpdateRecipientResponse>> => ({
  data: { recipientId: MOCK_RECIPIENT_ID } as unknown as TheaWebUpdateRecipientResponse,
});

export const mergeGiftFlow = async (
  _payload: TheaWebMergeGiftFlowRequest,
): Promise<CallableResult<TheaWebMergeGiftFlowResponse>> => ({
  data: { status: 'OK' } as unknown as TheaWebMergeGiftFlowResponse,
});

export const mintMergeToken = async (
  _payload: TheaWebMintMergeTokenRequest,
): Promise<CallableResult<TheaWebMintMergeTokenResponse>> => ({
  data: { token: 'playground-token', expiresAtMs: Date.now() + 60_000 } as unknown as TheaWebMintMergeTokenResponse,
});

export const logEvents = async (
  _payload: TheaWebLogEventsRequest,
): Promise<CallableResult<TheaWebLogEventsResponse>> => ({
  data: { accepted: 0, rejected: 0 } as unknown as TheaWebLogEventsResponse,
});
