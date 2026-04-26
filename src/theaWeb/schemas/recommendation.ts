import type { Timestamp } from 'firebase/firestore';
import type {
  TheaWebOccasionEnum,
  TheaWebRecommendationModeEnum,
  TheaWebRecommendationStatusEnum,
} from './enums';
import type { RecipientSnapshot } from './recipient';

export interface RecommendationCarousel {
  displayName: string;
  productIds: string[];
}

// Frozen quiz snapshot at submit time.
export interface RecommendationInput {
  occasion: TheaWebOccasionEnum;
  occasionLabel?: string;
  interests: string[];
  freeform: string;
}

// Doc at `theaWebUser/{uid}/recipient/{recipientId}/recommendation/{ulid}`.
// One per generation. `isActive: true` for the current; flips to false on regenerate.
export interface Recommendation {
  recommendationId: string;
  isActive: boolean;
  displayName?: string;
  input: RecommendationInput;
  recipientSnapshot: RecipientSnapshot;
  status: TheaWebRecommendationStatusEnum;
  carousels: Record<string, RecommendationCarousel>;
  carouselOrder: string[];
  mode: TheaWebRecommendationModeEnum;
  pipelineTimingMs?: number;
  errorMessage?: string;
  _mergedFrom?: string;
  _schemaVersion: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
  archivedAt?: Timestamp;
}
