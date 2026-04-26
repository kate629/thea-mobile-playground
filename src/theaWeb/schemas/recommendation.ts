import type { Timestamp } from 'firebase/firestore';
import type {
  TheaWebOccasionEnum,
  TheaWebRecommendationModeEnum,
  TheaWebRecommendationStatusEnum,
} from './enums';
import type { RecipientSnapshot } from './recipient';

// Snapshot of a product as written by the recommendation pipeline.
// Mirrors carousel_agent._serialize_product_for_firestore (BE-side trimmer).
// Inline in the recommendation doc — no second fetch needed to render.
export interface RecommendationProduct {
  id: string;
  title: string;
  price: number;
  brand?: string;
  images?: string[];
  // CDN variants for fast first paint (populated by nightly backfill).
  images_cdn?: string[];
  images_cdn_mobile?: string[];
  gift_gender?: string;
  interests?: string[];
  description?: string;
  url?: string;
  agent_why?: string;
  carousel_tags?: string[];
}

export interface RecommendationCarousel {
  displayName: string;
  products: RecommendationProduct[];
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
