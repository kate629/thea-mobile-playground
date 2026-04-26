import type { Timestamp } from 'firebase/firestore';
import type {
  TheaWebOccasionEnum,
  TheaWebRecommendationModeEnum,
  TheaWebRecommendationStatusEnum,
} from './enums';
import type { RecipientSnapshot } from './recipient';

// Snapshot of a product as written by the recommendation pipeline.
// Mirrors carousel_agent._serialize_product_for_firestore (BE-side trimmer).
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
//
// Carousel data is NOT here — it lives in carouselSessions/{carouselSessionId}
// (written by the existing /feed agent). Subscribe to that doc separately for
// progressive paint.
export interface Recommendation {
  recommendationId: string;
  isActive: boolean;
  displayName?: string;
  input: RecommendationInput;
  recipientSnapshot: RecipientSnapshot;
  status: TheaWebRecommendationStatusEnum;
  mode: TheaWebRecommendationModeEnum;
  carouselSessionId: string;
  pipelineTimingMs?: number;
  errorMessage?: string;
  _mergedFrom?: string;
  _schemaVersion: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
  archivedAt?: Timestamp;
}

// Shape of carouselSessions/{id} after normalizeCarouselSession() runs. The
// agent writes snake_case to that doc; the munger maps to the camelCase shape
// the components consume so component code stays idiomatic.
export interface CarouselSession {
  status: TheaWebRecommendationStatusEnum;
  carousels: Record<string, RecommendationCarousel>;
  carouselOrder: string[];
  errorMessage?: string;
  pipelineTimingMs?: number;
}
