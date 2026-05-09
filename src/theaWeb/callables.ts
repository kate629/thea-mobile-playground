// PLAYGROUND STUB — replaces real callables with mocks that drive the
// in-memory giftActivityStore. Real version at upstream:src/theaWeb/callables.ts.
// Never port this back.

import { findProduct } from '../playground/mockData/products';
import {
  clearMockActivity,
  recordMockActivity,
} from '../playground/mockData/giftActivityStore';
import { registerRecipient } from '../playground/mockData/recipientRegistry';
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
  MOCK_RECOMMENDATION_ID,
} from '../playground/mockData/playgroundConfig';

interface CallableResult<T> {
  data: T;
}

// Map of relationship enum → display emoji (mirrors the RELATIONSHIPS
// constant in the quiz). Used by the playground to pick a default emoji
// for a freshly submitted recipient. Inline rename can override later.
const RELATIONSHIP_EMOJI: Record<string, string> = {
  MOM: '🌷',
  DAD: '⛳',
  PARTNER: '❤️',
  SISTER: '👯',
  BROTHER: '🏀',
  DAUGHTER: '🌸',
  SON: '⭐',
  GRANDMA: '🫖',
  GRANDPA: '☕',
  GRANDDAUGHTER: '🎀',
  GRANDSON: '🧸',
  FRIEND: '🤝',
  ME: '🙋',
  OTHER: '✨',
};

export const submitGiftFlow = async (
  payload: TheaWebSubmitGiftFlowRequest,
): Promise<CallableResult<TheaWebSubmitGiftFlowResponse>> => {
  await new Promise((r) => setTimeout(r, 200));
  // Generate a fresh recipientId per submission so each quiz-take builds
  // a new board. Name + emoji come from the payload; default emoji from
  // the relationship enum when not provided.
  const recipientId = `mock-recipient-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const carouselSessionId = `${recipientId}_${MOCK_RECOMMENDATION_ID}`;
  const name = payload.recipient.name || payload.recipient.relationship;
  const emoji =
    payload.recipient.emoji ||
    RELATIONSHIP_EMOJI[payload.recipient.relationship] ||
    '✨';
  registerRecipient({ id: recipientId, name, emoji });
  return {
    data: {
      recipientId,
      recommendationId: MOCK_RECOMMENDATION_ID,
      carouselSessionId,
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
      recordMockActivity(product, payload.state, payload.recipientIds[0]);
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
  payload: TheaWebUpdateRecipientRequest,
): Promise<CallableResult<TheaWebUpdateRecipientResponse>> => ({
  data: {
    recipientId: payload.recipientId ?? '',
  } as unknown as TheaWebUpdateRecipientResponse,
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
