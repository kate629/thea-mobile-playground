import type {
  TheaWebGenderEnum,
  TheaWebGiftFlowStepEnum,
  TheaWebOccasionEnum,
  TheaWebRelationshipEnum,
} from './enums';

// CLIENT-ONLY type — NEVER written to Firestore.
// Lives in a jotai atom backed by localStorage.
// Survives refresh; lost on tab close (acceptable — quiz takes ~30 seconds).

export interface GiftFlowDraftAnswers {
  recipientName?: string;
  recipientEmoji?: string;
  recipientRelationship?: TheaWebRelationshipEnum;
  recipientGender?: TheaWebGenderEnum;
  recipientAge?: number;
  recipientIsMe?: boolean;
  occasion?: TheaWebOccasionEnum;
  occasionLabel?: string;
  interests?: string[];
  freeform?: string;
}

export interface GiftFlowDraftLocal {
  currentStep: TheaWebGiftFlowStepEnum;
  answers: GiftFlowDraftAnswers;
  recipientId?: string;
}

export const LOCAL_STORAGE_KEY_GIFT_FLOW_DRAFT = 'theaWeb.giftFlowDraft.v1';
