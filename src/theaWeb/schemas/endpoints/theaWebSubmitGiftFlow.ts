// Hand-mirrored from `thea-shared-schemas/schemas/theaWeb/theaWebSubmitGiftFlowRequest.json`
// and `theaWebSubmitGiftFlowResponse.json`.
// Keep in sync. The JSON schemas are the source of truth for the cross-system contract.

import type {
  TheaWebGenderEnum,
  TheaWebOccasionEnum,
  TheaWebRecommendationModeEnum,
  TheaWebRelationshipEnum,
} from '../enums';

export interface TheaWebSubmitGiftFlowRecipientInput {
  // Omit to create a new recipient with auto-id; include to update existing.
  recipientId?: string;
  name: string;
  emoji?: string;
  relationship: TheaWebRelationshipEnum;
  gender?: TheaWebGenderEnum;
  age?: number;
  isMe?: boolean;
}

export interface TheaWebSubmitGiftFlowQuizInput {
  occasion: TheaWebOccasionEnum;
  // Required when `occasion === 'OTHER'`.
  occasionLabel?: string;
  interests: string[];
  freeform: string;
}

export interface TheaWebSubmitGiftFlowRequest {
  recipient: TheaWebSubmitGiftFlowRecipientInput;
  input: TheaWebSubmitGiftFlowQuizInput;
  mode: TheaWebRecommendationModeEnum;
  // Captured at first quiz submit; persists to theaWebUser.marketingOptIn.
  marketingOptIn?: boolean;
}

export interface TheaWebSubmitGiftFlowResponse {
  recipientId: string;
  recommendationId: string;
  status: 'PROCESSING';
}
