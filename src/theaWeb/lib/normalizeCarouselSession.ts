import type {
  CarouselSession,
  RecommendationCarousel,
  TheaWebRecommendationStatusEnum,
} from '../schemas';

// Maps the agent's lowercase status (`processing` | `searching` | `curating` |
// `finalizing` | `complete` | `error`) to the theaWeb uppercase enum the rest
// of the FE consumes. Unknown values fall through to PROCESSING — better to
// keep showing the spinner than hide carousels that are still streaming.
function normalizeStatus(raw: unknown): TheaWebRecommendationStatusEnum {
  if (raw === 'complete') return 'COMPLETED';
  if (raw === 'error') return 'FAILED';
  return 'PROCESSING';
}

interface RawCarousel {
  display_name?: string;
  displayName?: string;
  products?: unknown;
}

function normalizeCarousel(raw: unknown): RecommendationCarousel {
  const c = (raw ?? {}) as RawCarousel;
  return {
    displayName: c.displayName ?? c.display_name ?? '',
    products: Array.isArray(c.products) ? (c.products as RecommendationCarousel['products']) : [],
  };
}

interface RawSession {
  status?: unknown;
  carousels?: Record<string, unknown>;
  carousel_order?: unknown;
  carouselOrder?: unknown;
  error_message?: string;
  errorMessage?: string;
  pipeline_timing?: { total_ms?: number };
  pipelineTimingMs?: number;
}

// Pure function — no I/O. Maps the agent's snake_case carouselSessions doc to
// the camelCase shape the components consume. One chokepoint between Firestore
// data and typed TS so component code never touches the snake_case shape.
export function normalizeCarouselSession(raw: unknown): CarouselSession | null {
  if (!raw) return null;
  const r = raw as RawSession;

  const carouselsIn = r.carousels ?? {};
  const carousels: Record<string, RecommendationCarousel> = {};
  for (const [key, value] of Object.entries(carouselsIn)) {
    carousels[key] = normalizeCarousel(value);
  }

  const orderRaw = r.carouselOrder ?? r.carousel_order;
  const carouselOrder = Array.isArray(orderRaw) ? (orderRaw.filter((k): k is string => typeof k === 'string')) : [];

  const session: CarouselSession = {
    status: normalizeStatus(r.status),
    carousels,
    carouselOrder,
  };

  const errorMessage = r.errorMessage ?? r.error_message;
  if (errorMessage) session.errorMessage = errorMessage;

  const totalMs = r.pipelineTimingMs ?? r.pipeline_timing?.total_ms;
  if (typeof totalMs === 'number') session.pipelineTimingMs = totalMs;

  return session;
}
