// Pure helpers for deriving ambient-ring inputs from a live CarouselSession.
// Used by QuizPage post-submit (bug #57: feed real recommended products into
// the loading-state ring) and as the source for the image-preload gate
// (bug #50: don't transition out of the loading state until those images
// are decoded into the browser cache).

import type { ProductImage } from '../../components/landing/quiz/AmbientProductScroll';
import type { CarouselSession, TheaWebOccasionEnum } from '../schemas';
import { SAMPLE_ANNIVERSARY_SECTIONS } from '../../components/landing/marketing/sampleAnniversaryCarousels';
import { SAMPLE_BIRTHDAY_SECTIONS } from '../../components/landing/marketing/sampleBirthdayCarousels';
import { SAMPLE_FATHERS_DAY_SECTIONS } from '../../components/landing/marketing/sampleFathersDayCarousels';
import { SAMPLE_GRADUATION_SECTIONS } from '../../components/landing/marketing/sampleGraduationCarousels';
import { SAMPLE_HOUSEWARMING_SECTIONS } from '../../components/landing/marketing/sampleHousewarmingCarousels';
import { SAMPLE_MOTHERS_DAY_SECTIONS } from '../../components/landing/marketing/sampleMothersDayCarousels';
import { SAMPLE_NEW_BABY_SECTIONS } from '../../components/landing/marketing/sampleNewBabyCarousels';
import type { CarouselSectionData } from '../../components/landing/marketing/sampleBirthdayCarousels';

// Flatten all products from all carousels into a `ProductImage[]` for the
// ambient ring. Walks `carouselOrder` so the first carousel's products
// appear first in the queue (matches the order the user will see when they
// land on the results page).
export function liveImagesFromSession(
  session: CarouselSession | null | undefined,
): ProductImage[] {
  if (!session) return [];
  const out: ProductImage[] = [];
  for (const key of session.carouselOrder) {
    const c = session.carousels[key];
    if (!c) continue;
    for (const p of c.products) {
      const cdn = p.images_cdn?.[0];
      const cdnMobile = p.images_cdn_mobile?.[0];
      const original = p.images?.[0] ?? cdn ?? cdnMobile;
      if (!original) continue;
      out.push({ original, cdn, cdnMobile });
    }
  }
  return out;
}

// Quiz display strings → TheaWebOccasionEnum, mirroring the chip values
// in `BASE_OCCASION_OPTIONS` / `GENDERED_OCCASIONS` in `useQuizFlow.ts`.
// Duplicates the same map in `quizAnswersToRequest.ts` — worth deduping
// in a small follow-up cleanup PR. Both copies should stay in sync until
// then; if you add a new chip in `useQuizFlow.ts`, add it here AND there.
const OCCASION_BY_QUIZ_DISPLAY: Record<string, TheaWebOccasionEnum> = {
  Birthday: 'BIRTHDAY',
  "Mother's Day": 'MOTHERS_DAY',
  "Father's Day": 'FATHERS_DAY',
  'Just Because': 'JUST_BECAUSE',
  'Thank You': 'THANK_YOU',
  Housewarming: 'HOUSEWARMING',
  'New Baby': 'NEW_BABY',
  Wedding: 'WEDDING',
  Graduation: 'GRADUATION',
  Other: 'OTHER',
  Anniversary: 'ANNIVERSARY',
};

export function quizDisplayOccasionToEnum(display: string | undefined): TheaWebOccasionEnum | undefined {
  if (!display) return undefined;
  return OCCASION_BY_QUIZ_DISPLAY[display];
}

// Per-occasion curated sample-carousel data (verbatim ports of the OLD
// givethea.com per-occasion gift guides). Used as the ambient-ring feed
// during the post-submit / pre-real-products window: the user sees
// thumbnails relevant to their selected occasion instead of an unrelated
// hardcoded sample set (bug #57).
const SAMPLE_SECTIONS_BY_OCCASION: Partial<Record<TheaWebOccasionEnum, CarouselSectionData[]>> = {
  ANNIVERSARY: SAMPLE_ANNIVERSARY_SECTIONS,
  BIRTHDAY: SAMPLE_BIRTHDAY_SECTIONS,
  FATHERS_DAY: SAMPLE_FATHERS_DAY_SECTIONS,
  GRADUATION: SAMPLE_GRADUATION_SECTIONS,
  HOUSEWARMING: SAMPLE_HOUSEWARMING_SECTIONS,
  MOTHERS_DAY: SAMPLE_MOTHERS_DAY_SECTIONS,
  NEW_BABY: SAMPLE_NEW_BABY_SECTIONS,
};

// Flatten an occasion's curated sample carousels into the `ProductImage[]`
// shape the ambient ring expects. Returns `[]` when the occasion has no
// curated set (e.g. JUST_BECAUSE, CHRISTMAS, OTHER) — caller falls back to
// whatever default it prefers.
export function occasionSampleImages(
  occasion: TheaWebOccasionEnum | undefined,
): ProductImage[] {
  if (!occasion) return [];
  const sections = SAMPLE_SECTIONS_BY_OCCASION[occasion];
  if (!sections) return [];
  const out: ProductImage[] = [];
  for (const s of sections) {
    for (const p of s.products) {
      const original = p.imageUrlCdn ?? p.imageUrl;
      if (!original) continue;
      out.push({
        original,
        cdn: p.imageUrlCdn,
        cdnMobile: p.imageUrlCdnMobile,
      });
    }
  }
  return out;
}

// Image URLs the FE will actually render for the first carousel's first N
// products. Uses the same `images_cdn_mobile -> images_cdn -> images`
// preference order as `productToCardItem` so the preload fetches exactly
// the variant the result card will display.
export function firstCarouselImageUrls(
  session: CarouselSession | null | undefined,
  n: number,
): string[] {
  if (!session) return [];
  const firstKey = session.carouselOrder[0];
  if (!firstKey) return [];
  const products = session.carousels[firstKey]?.products ?? [];
  return products
    .slice(0, n)
    .map((p) => p.images_cdn_mobile?.[0] ?? p.images_cdn?.[0] ?? p.images?.[0] ?? '')
    .filter(Boolean);
}
