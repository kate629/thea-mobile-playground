import { RELATIONSHIPS } from '../../components/landing/quiz/constants';
import type { ResultsProductCardItem } from '../../components/landing/results/types';
import type {
  CarouselSession,
  Recommendation,
  RecommendationProduct,
  TheaWebRelationshipEnum,
} from '../schemas';

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

export function carouselsToSections(session: CarouselSession): ResultsCarouselSection[] {
  return session.carouselOrder
    .filter((key) => key in session.carousels)
    .map((key) => {
      const c = session.carousels[key];
      return {
        id: key,
        title: c.displayName,
        products: c.products.map(productToCardItem),
      };
    });
}
