// Dynamic carousel title resolver for the quiz-results page.
//
// Verbatim port of the OLD repo's logic (kate629/3-12-sovrn-launch-version,
// `src/lib/firestore.ts` + `src/pages/ResultsPage.tsx`). Four layers, applied
// in order:
//
//   1. BE's `displayName` is the default starting point (whatever the agent
//      wrote to carouselSessions/{...}/carousels[chip].displayName).
//   2. `CAROUSEL_TITLE_OVERRIDES` map: 19 chip → curated title overrides.
//      Lookup is `chip.trim().toLowerCase()`; any miss falls through.
//   3. Special chips (`getRelationshipCarouselTitle`):
//        - `wildcard` → "Trending Favorites"
//        - `date_night` or `sentimental` → "Perfect for {relationship}"
//      The relationship string is the human-readable display form ("Mom",
//      "Dad", "Friend"). Caller is responsible for converting from the
//      TheaWebRelationshipEnum.
//   4. Pronoun genderize: "their"→"her"/"his", "They"→"She"/"He",
//      "them"→"her"/"him". Applied AFTER the override map, so titles like
//      "For their sweet tooth" come out as "For her sweet tooth" for female
//      recipients.
//
// One small improvement over OLD: when chip === "beauty" AND gender === MALE,
// return "For the grooming routine" instead of the OLD's "For the beauty lover"
// (which reads female-coded). The pill UI already swaps "Beauty" → "Grooming"
// for male recipients in the quiz; the carousel title now follows suit.

import type { TheaWebGenderEnum } from '../schemas/enums';

/**
 * 19-entry chip → curated title override map. Keys are lowercase chip ids.
 * The BE may emit chips with various casings (`"Cooking"` capitalized for
 * interest chips, `"date_night"` lowercase for auto-triggered) — the lookup
 * normalizes via `chip.trim().toLowerCase()` so both shapes hit.
 */
export const CAROUSEL_TITLE_OVERRIDES: Record<string, string> = {
  books: 'For the bookworm',
  games: 'For game night',
  clothes: "For their new favorite outfit",
  accessories: 'For the accessory lover',
  jewelry: 'For a little sparkle',
  cooking: 'For the home chef',
  hosting: 'For the host with the most',
  homedecor: 'For a cozy home',
  decor: 'For a cozy home',
  beauty: 'For the beauty lover',
  fitness: "For their next workout",
  sports: 'For the sports fan',
  outdoors: 'For the outdoorsy one',
  music: 'For the music lover',
  travel: 'For the traveler',
  plants: 'For the plant lover',
  alcohol: 'For the home bar',
  sweets: "For their sweet tooth",
  crafts: 'For the crafty one',
};

/**
 * Special chips that ignore the BE's `displayName` AND the override map.
 * Returns null when no special handling applies.
 */
export function getRelationshipCarouselTitle(
  chip: string,
  relationshipDisplay: string | undefined,
): string | null {
  const c = chip.trim().toLowerCase();
  if (c === 'wildcard') return 'Trending Favorites';
  if (c === 'date_night' || c === 'sentimental') {
    const label = relationshipDisplay?.trim() || 'them';
    return `Perfect for ${label}`;
  }
  return null;
}

/**
 * Pronoun substitution for gendered recipients. Verbatim port of the OLD
 * repo's `genderizeTitle`: only swaps "their"/"They"/"them" pronouns. Any
 * title that doesn't contain those pronouns is returned unchanged. Gender
 * `NON_BINARY`, `PREFER_NOT_TO_SAY`, or unknown all leave the title as-is.
 */
export function genderizeTitle(
  title: string,
  gender?: TheaWebGenderEnum,
): string {
  if (gender === 'FEMALE') {
    return title
      .replace(/\btheir\b/g, 'her')
      .replace(/\bThey\b/g, 'She')
      .replace(/\bthem\b/g, 'her');
  }
  if (gender === 'MALE') {
    return title
      .replace(/\btheir\b/g, 'his')
      .replace(/\bThey\b/g, 'He')
      .replace(/\bthem\b/g, 'him');
  }
  return title;
}

export interface ResolveDynamicCarouselTitleArgs {
  /** The carousel key from `carouselSessions/{sessionId}/carousels[chip]` —
   *  the BE's chip id. Casing varies (capitalized for interest chips,
   *  lowercase for auto-triggered); we normalize internally. */
  chip: string;
  /** What the BE wrote as `displayName` on the carousel. Used as the
   *  fallback when no override matches. */
  fallbackDisplayName: string;
  /** Recipient gender, for pronoun substitution. */
  gender?: TheaWebGenderEnum;
  /** Recipient relationship in display form (e.g. "Mom", "Dad"). Caller is
   *  responsible for converting from TheaWebRelationshipEnum. Used only by
   *  the `date_night` / `sentimental` "Perfect for X" chips. */
  relationshipDisplay?: string;
}

/**
 * Resolve the user-facing carousel title for the quiz-results page.
 * Orchestrates all four layers; pure function, easy to test.
 */
export function resolveDynamicCarouselTitle({
  chip,
  fallbackDisplayName,
  gender,
  relationshipDisplay,
}: ResolveDynamicCarouselTitleArgs): string {
  const c = chip.trim().toLowerCase();

  // Layer 3: special chips (wildcard, date_night, sentimental).
  const special = getRelationshipCarouselTitle(chip, relationshipDisplay);
  if (special !== null) {
    return genderizeTitle(special, gender);
  }

  // Grooming-specific override: when male recipient + beauty chip, use a
  // gender-appropriate phrasing. Improves on OLD which left it as "For the
  // beauty lover" for males.
  if (c === 'beauty' && gender === 'MALE') {
    return 'For the grooming routine';
  }

  // Layer 2: chip-keyed override map.
  const override = CAROUSEL_TITLE_OVERRIDES[c];
  const baseTitle = override ?? fallbackDisplayName;

  // Layer 4: pronoun genderize.
  return genderizeTitle(baseTitle, gender);
}
