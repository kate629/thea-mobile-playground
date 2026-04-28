// Override the BE agent's `displayName` on the results page with one of
// EXACTLY 42 curated carousel titles lifted verbatim from the OLD
// givethea.com app (kate629/3-12-sovrn-launch-version). See bug #17 from
// Kate's 4/27 bug-bash: PR #44's previous attempt INVENTED warmer-sounding
// titles, but Kate's invariant is that we only ship strings that already
// appeared in the old corpus. This module replaces that catalog wholesale.
//
// The catalog is indexed by (occasion, relationship?, interest_tag) and the
// matching algorithm is:
//
//   1. Look up (occasion, relationship, dominant_interest_tag) — return if hit
//   2. Look up (occasion, dominant_interest_tag) — return if hit
//   3. Look up (occasion, relationship) — return if hit
//   4. Title-case the agent's `displayName` (so ALL CAPS becomes Title Case)
//   5. Last resort: pass the agent's `displayName` through as-is
//
// We NEVER invent a name. The only strings this module returns are:
//   - one of the 42 curated names below, OR
//   - the agent's name (title-cased or as-is).
//
// Pure function. No side effects. Easy to test.

import type {
  RecommendationCarousel,
  RecommendationInput,
  RecommendationProduct,
} from '../schemas/recommendation';
import type { RecipientSnapshot } from '../schemas/recipient';
import type {
  TheaWebOccasionEnum,
  TheaWebRelationshipEnum,
} from '../schemas/enums';

// ---------------------------------------------------------------------------
// THE 42 CURATED NAMES — exact strings from old repo. Do not edit.
// ---------------------------------------------------------------------------

export const CURATED_NAMES = {
  // Mother's Day (8)
  MOM_TINY_FAN_CLUB: 'For the mom with a tiny fan club',
  GRANDMA_SENTIMENTAL: 'For the sentimental grandma',
  MOM_GREEN_THUMB: 'For the mama with a green thumb',
  MOM_BOOKWORM: "For the mom who's a bookworm",
  MOM_QUEEN: 'When you want to treat her like the queen she is',
  MOM_TEA_DRINKER: "For the mama who's a tea drinker",
  MOM_CRAFTY: 'For the crafty mama',
  MOM_WORKOUT: 'For the cutie workout mama',

  // Father's Day (5)
  DAD_MORNING_JOE: 'For the Dad who loves his morning joe',
  DAD_GOLFER: "For the Dad who's a golfer",
  DAD_TINY_FAN_CLUB: 'For the Dad with a tiny fan club',
  DAD_MOUNTAIN_MAN: 'For the Mountain Man Dad',
  DAD_HOME_MIXOLOGIST: 'For the Home Mixologist',

  // Birthday (4)
  BDAY_SWEET_TOOTH: 'For the one with a sweet tooth',
  BDAY_JUST_ADD_GUESTS: 'Just add guests',
  BDAY_YEAR_AHEAD: 'For the year ahead',
  BDAY_LOOK_FORWARD: 'Something to look forward to',

  // Anniversary (6)
  ANNIV_NEXT_ADVENTURE: 'For the couple dreaming up their next adventure',
  ANNIV_CLASSICS: 'For the couple who appreciates the classics',
  ANNIV_COZY_DATE_NIGHT: 'For the couple who loves a cozy date night in',
  ANNIV_CUTE_AND_WRINKLY: "For the couple who's going to get cute and wrinkly together",
  ANNIV_EXTRA_SWEET: 'For the couple whose love is extra sweet',
  ANNIV_PERSONAL: "This one's personal",

  // Housewarming (6)
  HW_GOOD_STUFF: 'For the homeowner who cooks with the good stuff',
  HW_DETAILS: 'For the homeowner who loves the details',
  HW_POURS: 'For the homeowner who pours a good one',
  HW_COZY: "For the homeowner who's getting cozy",
  HW_HOST: 'For the host who makes it look easy',
  HW_CHEF: 'For the chef',

  // Graduation (5)
  GRAD_REPS_SCHOOL: 'For the grad who reps their school',
  GRAD_WEAR_MOMENT: 'For the grad who wants to wear their moment',
  GRAD_GOING_PLACES: "For the grad who's going places",
  GRAD_SETTING_UP_SHOP: "For the grad who's setting up shop",
  GRAD_TREATING_THEMSELVES: "For the grad who's treating themselves",

  // New Baby (8)
  BABY_LIBRARY: "Baby's first library",
  BABY_MEMORIES: "Baby's first memories",
  BABY_OUTFITS: "Baby's first outfits",
  BABY_NURSERY: "For baby's first nursery",
  BABY_PET: 'For the baby with a pet',
  BABY_FOODIE: 'For the future foodie baby',
  BABY_WATERBUG: 'For the future waterbug baby',
  BABY_ESSENTIALS: 'New baby essentials',
} as const;

export type CuratedName = (typeof CURATED_NAMES)[keyof typeof CURATED_NAMES];

// Number of curated names. Hard-coded so a regression test can assert this
// stays at 42 — bug #17 was caused by inventing names beyond the corpus.
export const CURATED_NAMES_COUNT = 42;

// ---------------------------------------------------------------------------
// Tag canonicalization — map every product/quiz tag we've ever seen to a
// short list of canonical "interest" keys we look up in the catalog.
// ---------------------------------------------------------------------------

// Canonical interest tag keys used by the catalog index. Any input tag that
// isn't already one of these flows through TAG_ALIASES first.
type InterestKey =
  | 'books'
  | 'plants'
  | 'crafts'
  | 'fitness'
  | 'jewelry'
  | 'family'
  | 'sentimental'
  | 'tea'
  | 'coffee'
  | 'sports'
  | 'outdoors'
  | 'alcohol'
  | 'sweets'
  | 'hosting'
  | 'cooking'
  | 'travel'
  | 'cozy'
  | 'decor'
  | 'classics'
  | 'romance'
  | 'school_spirit'
  | 'clothes'
  | 'beauty'
  | 'memories'
  | 'pets'
  | 'water';

const TAG_ALIASES: Record<string, InterestKey> = {
  // books
  books: 'books',
  book: 'books',
  reading: 'books',
  literature: 'books',
  novels: 'books',

  // plants
  plants: 'plants',
  plant: 'plants',
  garden: 'plants',
  gardening: 'plants',
  succulent: 'plants',
  flowers: 'plants',

  // crafts
  crafts: 'crafts',
  craft: 'crafts',
  diy: 'crafts',
  arts_and_crafts: 'crafts',
  'arts-and-crafts': 'crafts',
  knitting: 'crafts',
  sewing: 'crafts',

  // fitness
  fitness: 'fitness',
  workout: 'fitness',
  exercise: 'fitness',
  gym: 'fitness',
  athletic: 'fitness',
  running: 'fitness',
  yoga: 'fitness',
  pilates: 'fitness',

  // jewelry
  jewelry: 'jewelry',
  jewellery: 'jewelry',
  necklace: 'jewelry',
  earrings: 'jewelry',
  bracelet: 'jewelry',
  ring: 'jewelry',

  // family / kids
  family: 'family',
  kids: 'family',
  children: 'family',
  parenting: 'family',

  // sentimental / keepsakes
  sentimental: 'sentimental',
  keepsake: 'sentimental',
  keepsakes: 'sentimental',
  heirloom: 'sentimental',
  personalized: 'sentimental',
  personalised: 'sentimental',

  // tea
  tea: 'tea',
  matcha: 'tea',

  // coffee
  coffee: 'coffee',
  espresso: 'coffee',

  // sports / golf
  sports: 'sports',
  sport: 'sports',
  golf: 'sports',
  golfer: 'sports',
  golfing: 'sports',
  tennis: 'sports',
  athletics: 'sports',

  // outdoors
  outdoors: 'outdoors',
  outdoor: 'outdoors',
  hiking: 'outdoors',
  camping: 'outdoors',
  adventure: 'outdoors',
  nature: 'outdoors',
  fishing: 'outdoors',
  mountain: 'outdoors',

  // alcohol / cocktails
  alcohol: 'alcohol',
  wine: 'alcohol',
  beer: 'alcohol',
  cocktail: 'alcohol',
  cocktails: 'alcohol',
  spirits: 'alcohol',
  liquor: 'alcohol',
  bar: 'alcohol',
  bartender: 'alcohol',
  mixology: 'alcohol',
  whiskey: 'alcohol',
  bourbon: 'alcohol',

  // sweets
  sweets: 'sweets',
  candy: 'sweets',
  chocolate: 'sweets',
  dessert: 'sweets',
  desserts: 'sweets',
  baking: 'sweets',
  bakery: 'sweets',

  // hosting
  hosting: 'hosting',
  host: 'hosting',
  hostess: 'hosting',
  entertaining: 'hosting',

  // cooking / chef
  cooking: 'cooking',
  cook: 'cooking',
  kitchen: 'cooking',
  chef: 'cooking',
  culinary: 'cooking',
  food: 'cooking',

  // travel / experiences
  travel: 'travel',
  passport: 'travel',
  trip: 'travel',
  luggage: 'travel',
  vacation: 'travel',
  experiences: 'travel',
  experience: 'travel',

  // cozy / loungewear
  cozy: 'cozy',
  loungewear: 'cozy',
  blanket: 'cozy',
  blankets: 'cozy',
  pajamas: 'cozy',
  candles: 'cozy',

  // decor / home
  decor: 'decor',
  home: 'decor',
  home_decor: 'decor',
  'home-decor': 'decor',
  homeware: 'decor',
  details: 'decor',

  // classics (anniversary intent — books/records/whiskey lean)
  classic: 'classics',
  classics: 'classics',
  vintage: 'classics',
  records: 'classics',
  vinyl: 'classics',

  // romance / sweet
  romance: 'romance',
  romantic: 'romance',
  love: 'romance',
  date_night: 'cozy',
  'date-night': 'cozy',

  // school spirit (graduation)
  school: 'school_spirit',
  school_spirit: 'school_spirit',
  alma_mater: 'school_spirit',
  collegiate: 'school_spirit',

  // clothes (graduation "wear their moment")
  clothes: 'clothes',
  clothing: 'clothes',
  apparel: 'clothes',
  fashion: 'clothes',
  outfits: 'clothes',
  style: 'clothes',
  accessories: 'clothes',
  bag: 'clothes',
  bags: 'clothes',

  // beauty / luxury (graduation "treating themselves")
  beauty: 'beauty',
  luxury: 'beauty',
  skincare: 'beauty',
  makeup: 'beauty',
  cosmetics: 'beauty',
  spa: 'beauty',
  grooming: 'beauty',

  // memories (new baby photo)
  memories: 'memories',
  photo: 'memories',
  photos: 'memories',
  photography: 'memories',
  album: 'memories',
  journal: 'memories',
  journaling: 'memories',

  // pets
  pets: 'pets',
  pet: 'pets',
  dog: 'pets',
  cat: 'pets',

  // water / bath (new baby waterbug)
  water: 'water',
  bath: 'water',
  swim: 'water',
  swimming: 'water',
  pool: 'water',
};

function canonicalize(tag: unknown): InterestKey | null {
  // BE data has been observed to contain non-string entries (null/undefined)
  // in product.carousel_tags / product.interests despite the TS type. Guard.
  if (typeof tag !== 'string') return null;
  const lower = tag.trim().toLowerCase();
  if (lower.length === 0) return null;
  return TAG_ALIASES[lower] ?? null;
}

// ---------------------------------------------------------------------------
// Catalog: occasion + (relationship?) + interest → curated name.
// Every entry maps to one of the 42 strings above. The structure encodes the
// fallback chain naturally — exact (occasion+relationship+interest) lives in
// `byOccasionRelationshipInterest`, the looser fallbacks live in their own
// tables.
// ---------------------------------------------------------------------------

type OccasionRelInterestMap = Partial<
  Record<
    TheaWebOccasionEnum,
    Partial<Record<TheaWebRelationshipEnum, Partial<Record<InterestKey, CuratedName>>>>
  >
>;

type OccasionInterestMap = Partial<
  Record<TheaWebOccasionEnum, Partial<Record<InterestKey, CuratedName>>>
>;

type OccasionRelMap = Partial<
  Record<TheaWebOccasionEnum, Partial<Record<TheaWebRelationshipEnum, CuratedName>>>
>;

const C = CURATED_NAMES;

// Mother's Day grandma + sentimental is the only cross-relationship special.
// Everything else is keyed by interest within the occasion.
const BY_OCCASION_RELATIONSHIP_INTEREST: OccasionRelInterestMap = {
  MOTHERS_DAY: {
    GRANDMA: {
      sentimental: C.GRANDMA_SENTIMENTAL,
      memories: C.GRANDMA_SENTIMENTAL,
    },
    MOM: {
      family: C.MOM_TINY_FAN_CLUB,
      books: C.MOM_BOOKWORM,
      plants: C.MOM_GREEN_THUMB,
      crafts: C.MOM_CRAFTY,
      fitness: C.MOM_WORKOUT,
      jewelry: C.MOM_QUEEN,
      tea: C.MOM_TEA_DRINKER,
    },
  },
  FATHERS_DAY: {
    DAD: {
      coffee: C.DAD_MORNING_JOE,
      sports: C.DAD_GOLFER,
      family: C.DAD_TINY_FAN_CLUB,
      outdoors: C.DAD_MOUNTAIN_MAN,
      alcohol: C.DAD_HOME_MIXOLOGIST,
    },
  },
  ANNIVERSARY: {
    PARTNER: {
      travel: C.ANNIV_NEXT_ADVENTURE,
      classics: C.ANNIV_CLASSICS,
      books: C.ANNIV_CLASSICS,
      cozy: C.ANNIV_COZY_DATE_NIGHT,
      decor: C.ANNIV_COZY_DATE_NIGHT,
      sentimental: C.ANNIV_CUTE_AND_WRINKLY,
      sweets: C.ANNIV_EXTRA_SWEET,
      romance: C.ANNIV_EXTRA_SWEET,
      jewelry: C.ANNIV_PERSONAL,
    },
  },
};

// Relationship-agnostic — most occasions live here.
const BY_OCCASION_INTEREST: OccasionInterestMap = {
  BIRTHDAY: {
    sweets: C.BDAY_SWEET_TOOTH,
    hosting: C.BDAY_JUST_ADD_GUESTS,
    cooking: C.BDAY_JUST_ADD_GUESTS,
    memories: C.BDAY_YEAR_AHEAD,
    travel: C.BDAY_LOOK_FORWARD,
  },
  HOUSEWARMING: {
    cooking: C.HW_GOOD_STUFF,
    decor: C.HW_DETAILS,
    alcohol: C.HW_POURS,
    cozy: C.HW_COZY,
    hosting: C.HW_HOST,
  },
  GRADUATION: {
    school_spirit: C.GRAD_REPS_SCHOOL,
    clothes: C.GRAD_WEAR_MOMENT,
    travel: C.GRAD_GOING_PLACES,
    decor: C.GRAD_SETTING_UP_SHOP,
    beauty: C.GRAD_TREATING_THEMSELVES,
  },
  NEW_BABY: {
    books: C.BABY_LIBRARY,
    memories: C.BABY_MEMORIES,
    clothes: C.BABY_OUTFITS,
    decor: C.BABY_NURSERY,
    pets: C.BABY_PET,
    cooking: C.BABY_FOODIE,
    sweets: C.BABY_FOODIE,
    water: C.BABY_WATERBUG,
  },
  // Mother's Day relationship-agnostic fallbacks (when relationship is e.g.
  // OTHER but the carousel's interest is recognizable). Only the
  // relationship-neutral curated names from the Mother's Day set go here —
  // the seven mom-tagged ones require relationship=MOM to fire.
  MOTHERS_DAY: {
    sentimental: C.GRANDMA_SENTIMENTAL,
  },
};

// Relationship-only fallback per occasion (no interest match). Picks a
// "default for this person + occasion" curated name. Conservative — only
// fills in for cases where the old corpus had a clear "default" intent.
const BY_OCCASION_RELATIONSHIP: OccasionRelMap = {
  MOTHERS_DAY: {
    MOM: C.MOM_TINY_FAN_CLUB,
    GRANDMA: C.GRANDMA_SENTIMENTAL,
  },
  FATHERS_DAY: {
    DAD: C.DAD_TINY_FAN_CLUB,
  },
  NEW_BABY: {
    // No relationship-keyed default; New Baby uses the "essentials" general
    // fallback below.
  },
};

// Per-occasion "general" fallback when even relationship doesn't match. Only
// used when the catalog has a sensible "default" per the old corpus —
// otherwise we let title-case-the-agent-name handle it.
const BY_OCCASION_GENERAL: Partial<Record<TheaWebOccasionEnum, CuratedName>> = {
  NEW_BABY: C.BABY_ESSENTIALS,
  HOUSEWARMING: C.HW_CHEF, // "For the chef" reads as a strong housewarming default
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

interface TagFrequency {
  tag: InterestKey;
  count: number;
}

// Tally a {tag → count} map across all of a carousel's products. Looks at
// both `carousel_tags` and `interests` since the BE doesn't always populate
// both. Returns sorted descending by count for "dominant tag" lookup.
function rankTags(products: RecommendationProduct[]): TagFrequency[] {
  const counts = new Map<InterestKey, number>();
  for (const p of products) {
    const tags = [...(p.carousel_tags ?? []), ...(p.interests ?? [])];
    for (const t of tags) {
      const canon = canonicalize(t);
      if (!canon) continue;
      counts.set(canon, (counts.get(canon) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

// Best canonical interest for this carousel: prefer a tag that overlaps with
// what the user picked, else the most-frequent tag with a catalog entry, else
// any user interest that has a catalog entry.
function findInterest(
  rankedTags: TagFrequency[],
  userInterestKeys: ReadonlySet<InterestKey>,
): InterestKey | null {
  // Pass 1: dominant carousel tag that the user also picked.
  for (const { tag } of rankedTags) {
    if (userInterestKeys.has(tag)) return tag;
  }
  // Pass 2: dominant carousel tag with any canonical match.
  if (rankedTags.length > 0) return rankedTags[0].tag;
  // Pass 3: any user interest at all.
  const userKeyList = Array.from(userInterestKeys);
  if (userKeyList.length > 0) return userKeyList[0];
  return null;
}

function userInterestKeySet(interests: readonly string[]): Set<InterestKey> {
  const out = new Set<InterestKey>();
  for (const i of interests) {
    const k = canonicalize(i);
    if (k) out.add(k);
  }
  return out;
}

function lookupCurated(
  occasion: TheaWebOccasionEnum,
  relationship: TheaWebRelationshipEnum | undefined,
  interest: InterestKey | null,
): CuratedName | null {
  // 1. (occasion, relationship, interest)
  if (relationship && interest) {
    const hit = BY_OCCASION_RELATIONSHIP_INTEREST[occasion]?.[relationship]?.[interest];
    if (hit) return hit;
  }
  // 2. (occasion, interest) — relationship-agnostic
  if (interest) {
    const hit = BY_OCCASION_INTEREST[occasion]?.[interest];
    if (hit) return hit;
  }
  // 3. (occasion, relationship) — interest-agnostic
  if (relationship) {
    const hit = BY_OCCASION_RELATIONSHIP[occasion]?.[relationship];
    if (hit) return hit;
  }
  // 4. (occasion) — general default for the occasion
  const hit = BY_OCCASION_GENERAL[occasion];
  if (hit) return hit;
  return null;
}

// Convert "BACKYARD & BEYOND" → "Backyard & Beyond". Only acts on names that
// are essentially shouting (all-caps letters); otherwise pass through.
function titleCaseAgentName(name: string): string {
  return name
    .toLowerCase()
    .replace(/(^|[\s\-/&])(\p{L})/gu, (_, sep, ch) => sep + ch.toUpperCase());
}

function isAllCapsShout(name: string): boolean {
  const letters = name.replace(/[^A-Za-z]/g, '');
  if (letters.length === 0) return false;
  return letters === letters.toUpperCase();
}

export function pickFriendlyName(
  carousel: RecommendationCarousel,
  recipientInput: RecommendationInput,
  recipientSnapshot: RecipientSnapshot,
): string {
  const occasion = recipientInput.occasion;
  const relationship = recipientSnapshot.relationship;

  const rankedTags = rankTags(carousel.products);
  const userKeys = userInterestKeySet(recipientInput.interests);
  const interest = findInterest(rankedTags, userKeys);

  const curated = lookupCurated(occasion, relationship, interest);
  if (curated) return curated;

  // Fallback: title-case the agent's name if it's shouty, otherwise pass
  // through. We never invent a new name here.
  const agentName = (carousel.displayName ?? '').trim();
  if (agentName.length === 0) return carousel.displayName ?? '';
  if (isAllCapsShout(agentName)) return titleCaseAgentName(agentName);
  return agentName;
}
