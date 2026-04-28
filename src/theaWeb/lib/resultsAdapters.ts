import { RELATIONSHIPS } from '../../components/landing/quiz/constants';
import type { ResultsProductCardItem } from '../../components/landing/results/types';
import type {
  CarouselSession,
  Recommendation,
  RecipientSnapshot,
  RecommendationInput,
  RecommendationProduct,
  TheaWebRelationshipEnum,
} from '../schemas';
import { pickFriendlyName } from './friendlyCarouselNames';

// Wire-enum → display label, mirroring `quizAnswersToRequest`. Used to find
// the matching emoji entry in `RELATIONSHIPS` when the recipient snapshot
// doesn't carry one (the quiz doesn't set `recipientSnapshot.emoji` today).
const DISPLAY_BY_RELATIONSHIP: Partial<Record<TheaWebRelationshipEnum, string>> = {
  MOM: 'Mom',
  DAD: 'Dad',
  PARTNER: 'Partner',
  SISTER: 'Sister',
  BROTHER: 'Brother',
  DAUGHTER: 'Daughter',
  SON: 'Son',
  GRANDMA: 'Grandma',
  GRANDPA: 'Grandpa',
  GRANDDAUGHTER: 'Granddaughter',
  GRANDSON: 'Grandson',
  FRIEND: 'Friend',
  OTHER: 'Other',
};

const FALLBACK_EMOJI = '✨';

function emojiForRelationship(rel: TheaWebRelationshipEnum, isMe: boolean): string {
  if (isMe) {
    return RELATIONSHIPS.find((r) => r.value === 'Me!')?.emoji ?? FALLBACK_EMOJI;
  }
  const display = DISPLAY_BY_RELATIONSHIP[rel];
  return RELATIONSHIPS.find((r) => r.value === display)?.emoji ?? FALLBACK_EMOJI;
}

const titleCase = (s: string) =>
  s.length === 0 ? s : s[0].toUpperCase() + s.slice(1).toLowerCase();

function formatInterestsLabel(interests: readonly string[]): string {
  if (interests.length === 0) return 'No interests yet';
  if (interests.length <= 2) return interests.map(titleCase).join(', ');
  const head = interests.slice(0, 2).map(titleCase).join(', ');
  return `${head} +${interests.length - 2}`;
}

export interface RecipientHeaderProps {
  personEmoji: string;
  personName: string;
  interestsLabel: string;
}

export function recipientHeaderProps(doc: Recommendation): RecipientHeaderProps {
  const { recipientSnapshot, input } = doc;
  return {
    personEmoji:
      recipientSnapshot.emoji ??
      emojiForRelationship(recipientSnapshot.relationship, recipientSnapshot.isMe),
    personName: recipientSnapshot.name,
    interestsLabel: formatInterestsLabel(input.interests),
  };
}

export function productToCardItem(p: RecommendationProduct): ResultsProductCardItem {
  // Prefer mobile CDN webp, then desktop CDN, then raw scrape URL. ResultsProductCard
  // doesn't yet take separate desktop/mobile srcsets, so we pick the first usable.
  const imageUrl =
    p.images_cdn_mobile?.[0] ?? p.images_cdn?.[0] ?? p.images?.[0] ?? '';
  return {
    id: p.id,
    imageUrl,
    title: p.title,
    brand: p.brand,
    price: p.price,
    productUrl: p.url,
  };
}

export interface ResultsCarouselSection {
  id: string;
  title: string;
  products: ResultsProductCardItem[];
}

// Convert the `CarouselSession` document into the carousel-section view
// model the results page renders. The `recipientInput` and
// `recipientSnapshot` are passed through to `pickFriendlyName` so the
// section title matches one of the 42 curated old-app names whenever the
// (occasion, relationship, dominant interest) tuple matches the catalog —
// bug #17 in Kate's 4/27 bug-bash. Callers that don't yet have the
// recipient context (older call sites + tests) can omit them; the title
// will then fall through to the agent's `displayName`.
export function carouselsToSections(
  session: CarouselSession,
  recipientInput?: RecommendationInput,
  recipientSnapshot?: RecipientSnapshot,
): ResultsCarouselSection[] {
  return session.carouselOrder
    .filter((key) => key in session.carousels)
    .map((key) => {
      const c = session.carousels[key];
      const title =
        recipientInput && recipientSnapshot
          ? pickFriendlyName(c, recipientInput, recipientSnapshot)
          : c.displayName;
      return {
        id: key,
        title,
        products: c.products.map(productToCardItem),
      };
    });
}
