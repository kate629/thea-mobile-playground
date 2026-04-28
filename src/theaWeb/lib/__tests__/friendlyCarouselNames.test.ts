import {
  CURATED_NAMES,
  CURATED_NAMES_COUNT,
  pickFriendlyName,
} from '../friendlyCarouselNames';
import type {
  RecommendationCarousel,
  RecommendationInput,
  RecommendationProduct,
} from '../../schemas/recommendation';
import type { RecipientSnapshot } from '../../schemas/recipient';
import type {
  TheaWebOccasionEnum,
  TheaWebRelationshipEnum,
} from '../../schemas/enums';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeProduct(tags: string[], id = 'p'): RecommendationProduct {
  return {
    id,
    title: 'T',
    price: 10,
    carousel_tags: tags,
  };
}

function makeCarousel(
  displayName: string,
  productTags: string[][],
): RecommendationCarousel {
  return {
    displayName,
    products: productTags.map((tags, i) => makeProduct(tags, `p${i}`)),
  };
}

function makeInput(
  occasion: TheaWebOccasionEnum,
  interests: string[] = [],
): RecommendationInput {
  return { occasion, interests, freeform: '' };
}

function makeSnapshot(
  relationship: TheaWebRelationshipEnum,
  isMe = false,
): RecipientSnapshot {
  return { name: 'X', relationship, isMe };
}

// Convenience for "input → expected curated name" assertions.
function expectName(
  carousel: RecommendationCarousel,
  input: RecommendationInput,
  snapshot: RecipientSnapshot,
  expected: string,
) {
  expect(pickFriendlyName(carousel, input, snapshot)).toBe(expected);
}

// ---------------------------------------------------------------------------
// Catalog integrity
// ---------------------------------------------------------------------------

describe('CURATED_NAMES catalog', () => {
  test('has exactly 42 entries', () => {
    expect(Object.keys(CURATED_NAMES)).toHaveLength(CURATED_NAMES_COUNT);
    expect(CURATED_NAMES_COUNT).toBe(42);
  });

  test('every value is unique (no accidental duplicates)', () => {
    const values = Object.values(CURATED_NAMES);
    expect(new Set(values).size).toBe(values.length);
  });

  test('contains the exact verbatim strings from the old repo', () => {
    // Spot-checks against /tmp/old-carousel-names-exact.md — these strings
    // are the ones Kate flagged as the only legal outputs for bug #17.
    const required = [
      "For the mom who's a bookworm",
      'For the mama with a green thumb',
      'For the crafty mama',
      'For the cutie workout mama',
      'When you want to treat her like the queen she is',
      "For the mama who's a tea drinker",
      'For the mom with a tiny fan club',
      'For the sentimental grandma',
      'For the Dad who loves his morning joe',
      "For the Dad who's a golfer",
      'For the Dad with a tiny fan club',
      'For the Mountain Man Dad',
      'For the Home Mixologist',
      'For the one with a sweet tooth',
      'Just add guests',
      'For the year ahead',
      'Something to look forward to',
      'For the couple dreaming up their next adventure',
      'For the couple who appreciates the classics',
      'For the couple who loves a cozy date night in',
      "For the couple who's going to get cute and wrinkly together",
      'For the couple whose love is extra sweet',
      "This one's personal",
      'For the homeowner who cooks with the good stuff',
      'For the homeowner who loves the details',
      'For the homeowner who pours a good one',
      "For the homeowner who's getting cozy",
      'For the host who makes it look easy',
      'For the chef',
      'For the grad who reps their school',
      'For the grad who wants to wear their moment',
      "For the grad who's going places",
      "For the grad who's setting up shop",
      "For the grad who's treating themselves",
      "Baby's first library",
      "Baby's first memories",
      "Baby's first outfits",
      "For baby's first nursery",
      'For the baby with a pet',
      'For the future foodie baby',
      'For the future waterbug baby',
      'New baby essentials',
    ];
    expect(required).toHaveLength(42);
    const values = new Set(Object.values(CURATED_NAMES));
    for (const r of required) {
      expect(values.has(r)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Mother's Day — full set reachable
// ---------------------------------------------------------------------------

describe("pickFriendlyName — Mother's Day", () => {
  const input = (interests: string[] = []) => makeInput('MOTHERS_DAY', interests);
  const mom = makeSnapshot('MOM');
  const grandma = makeSnapshot('GRANDMA');

  test('mom + books → bookworm', () => {
    expectName(
      makeCarousel('LOVES TO READ', [['books'], ['reading']]),
      input(['books']),
      mom,
      "For the mom who's a bookworm",
    );
  });

  test('mom + plants → green thumb', () => {
    expectName(
      makeCarousel('GARDEN VIBES', [['plants'], ['garden']]),
      input(['plants']),
      mom,
      'For the mama with a green thumb',
    );
  });

  test('mom + crafts → crafty mama', () => {
    expectName(
      makeCarousel('MAKER MOOD', [['crafts'], ['diy']]),
      input(['crafts']),
      mom,
      'For the crafty mama',
    );
  });

  test('mom + fitness → cutie workout mama', () => {
    expectName(
      makeCarousel('GET MOVING', [['fitness'], ['yoga']]),
      input(['fitness']),
      mom,
      'For the cutie workout mama',
    );
  });

  test('mom + jewelry → queen', () => {
    expectName(
      makeCarousel('SHINY THINGS', [['jewelry'], ['necklace']]),
      input(['jewelry']),
      mom,
      'When you want to treat her like the queen she is',
    );
  });

  test('mom + tea → tea drinker', () => {
    expectName(
      makeCarousel('TEA TIME', [['tea'], ['matcha']]),
      input(['tea']),
      mom,
      "For the mama who's a tea drinker",
    );
  });

  test('mom + family/kids → tiny fan club', () => {
    expectName(
      makeCarousel('THE LITTLES', [['family'], ['kids']]),
      input(['family']),
      mom,
      'For the mom with a tiny fan club',
    );
  });

  test('grandma + sentimental → sentimental grandma', () => {
    expectName(
      makeCarousel('KEEPSAKES', [['sentimental'], ['keepsakes']]),
      input(['sentimental']),
      grandma,
      'For the sentimental grandma',
    );
  });

  test('mom relationship-only fallback → tiny fan club', () => {
    // No interest tags overlap; just relationship + occasion. Falls through
    // to BY_OCCASION_RELATIONSHIP default for MOM.
    expectName(
      makeCarousel('Some Theme', [[]]),
      input([]),
      mom,
      'For the mom with a tiny fan club',
    );
  });
});

// ---------------------------------------------------------------------------
// Father's Day — full set reachable
// ---------------------------------------------------------------------------

describe("pickFriendlyName — Father's Day", () => {
  const input = (interests: string[] = []) => makeInput('FATHERS_DAY', interests);
  const dad = makeSnapshot('DAD');

  test('dad + coffee → morning joe', () => {
    expectName(
      makeCarousel('CAFFEINE', [['coffee'], ['espresso']]),
      input(['coffee']),
      dad,
      'For the Dad who loves his morning joe',
    );
  });

  test('dad + sports/golf → golfer', () => {
    expectName(
      makeCarousel('LINKS', [['golf'], ['sports']]),
      input(['sports']),
      dad,
      "For the Dad who's a golfer",
    );
  });

  test('dad + family → tiny fan club', () => {
    expectName(
      makeCarousel('KIDDOS', [['family']]),
      input(['family']),
      dad,
      'For the Dad with a tiny fan club',
    );
  });

  test('dad + outdoors → mountain man', () => {
    expectName(
      makeCarousel('GREAT OUTDOORS', [['outdoors'], ['hiking']]),
      input(['outdoors']),
      dad,
      'For the Mountain Man Dad',
    );
  });

  test('dad + alcohol → home mixologist', () => {
    expectName(
      makeCarousel('BAR CART', [['cocktails'], ['whiskey']]),
      input(['alcohol']),
      dad,
      'For the Home Mixologist',
    );
  });
});

// ---------------------------------------------------------------------------
// Birthday — full set reachable (relationship-agnostic)
// ---------------------------------------------------------------------------

describe('pickFriendlyName — Birthday', () => {
  const input = (interests: string[] = []) => makeInput('BIRTHDAY', interests);
  const friend = makeSnapshot('FRIEND');

  test('sweets → sweet tooth', () => {
    expectName(
      makeCarousel('SUGAR', [['sweets'], ['chocolate']]),
      input(['sweets']),
      friend,
      'For the one with a sweet tooth',
    );
  });

  test('hosting → just add guests', () => {
    expectName(
      makeCarousel('PARTY', [['hosting']]),
      input(['hosting']),
      friend,
      'Just add guests',
    );
  });

  test('memories/journal → year ahead', () => {
    expectName(
      makeCarousel('REFLECT', [['journal'], ['memories']]),
      input(['memories']),
      friend,
      'For the year ahead',
    );
  });

  test('travel → look forward', () => {
    expectName(
      makeCarousel('WANDERLUST', [['travel'], ['experiences']]),
      input(['travel']),
      friend,
      'Something to look forward to',
    );
  });
});

// ---------------------------------------------------------------------------
// Anniversary — full set reachable (PARTNER)
// ---------------------------------------------------------------------------

describe('pickFriendlyName — Anniversary', () => {
  const input = (interests: string[] = []) => makeInput('ANNIVERSARY', interests);
  const partner = makeSnapshot('PARTNER');

  test('travel → next adventure', () => {
    expectName(
      makeCarousel('TRIP', [['travel']]),
      input(['travel']),
      partner,
      'For the couple dreaming up their next adventure',
    );
  });

  test('classics → appreciates the classics', () => {
    expectName(
      makeCarousel('CLASSIC', [['classics'], ['vinyl']]),
      input(['classics']),
      partner,
      'For the couple who appreciates the classics',
    );
  });

  test('cozy → cozy date night', () => {
    expectName(
      makeCarousel('STAY IN', [['cozy'], ['blanket']]),
      input(['cozy']),
      partner,
      'For the couple who loves a cozy date night in',
    );
  });

  test('sentimental → cute and wrinkly', () => {
    expectName(
      makeCarousel('FOREVER', [['sentimental']]),
      input(['sentimental']),
      partner,
      "For the couple who's going to get cute and wrinkly together",
    );
  });

  test('sweets → extra sweet', () => {
    expectName(
      makeCarousel('TREATS', [['sweets']]),
      input(['sweets']),
      partner,
      'For the couple whose love is extra sweet',
    );
  });

  test('jewelry → personal', () => {
    expectName(
      makeCarousel('GLITTER', [['jewelry']]),
      input(['jewelry']),
      partner,
      "This one's personal",
    );
  });
});

// ---------------------------------------------------------------------------
// Housewarming — full set reachable (relationship-agnostic)
// ---------------------------------------------------------------------------

describe('pickFriendlyName — Housewarming', () => {
  const input = (interests: string[] = []) => makeInput('HOUSEWARMING', interests);
  const friend = makeSnapshot('FRIEND');

  test('cooking → cooks with the good stuff', () => {
    expectName(
      makeCarousel('KITCHEN', [['cooking']]),
      input(['cooking']),
      friend,
      'For the homeowner who cooks with the good stuff',
    );
  });

  test('decor → loves the details', () => {
    expectName(
      makeCarousel('DETAILS', [['decor']]),
      input(['decor']),
      friend,
      'For the homeowner who loves the details',
    );
  });

  test('alcohol → pours a good one', () => {
    expectName(
      makeCarousel('CELLAR', [['wine']]),
      input(['alcohol']),
      friend,
      'For the homeowner who pours a good one',
    );
  });

  test('cozy → getting cozy', () => {
    expectName(
      makeCarousel('SNUG', [['cozy']]),
      input(['cozy']),
      friend,
      "For the homeowner who's getting cozy",
    );
  });

  test('hosting → host who makes it look easy', () => {
    expectName(
      makeCarousel('PARTY', [['hosting']]),
      input(['hosting']),
      friend,
      'For the host who makes it look easy',
    );
  });

  test('general fallback → for the chef', () => {
    // No matching interest, no relationship default for HOUSEWARMING:
    // BY_OCCASION_GENERAL covers this with the chef default.
    expectName(
      makeCarousel('Some Random Theme', [['unmapped_tag']]),
      input([]),
      friend,
      'For the chef',
    );
  });
});

// ---------------------------------------------------------------------------
// Graduation — full set reachable
// ---------------------------------------------------------------------------

describe('pickFriendlyName — Graduation', () => {
  const input = (interests: string[] = []) => makeInput('GRADUATION', interests);
  const friend = makeSnapshot('FRIEND');

  test('school spirit → reps their school', () => {
    expectName(
      makeCarousel('ALMA MATER', [['school'], ['collegiate']]),
      input(['school']),
      friend,
      'For the grad who reps their school',
    );
  });

  test('clothes → wear their moment', () => {
    expectName(
      makeCarousel('LOOKS', [['clothes'], ['fashion']]),
      input(['clothes']),
      friend,
      'For the grad who wants to wear their moment',
    );
  });

  test('travel → going places', () => {
    expectName(
      makeCarousel('NEXT STOP', [['travel']]),
      input(['travel']),
      friend,
      "For the grad who's going places",
    );
  });

  test('decor → setting up shop', () => {
    expectName(
      makeCarousel('NEW PLACE', [['decor']]),
      input(['decor']),
      friend,
      "For the grad who's setting up shop",
    );
  });

  test('beauty/luxury → treating themselves', () => {
    expectName(
      makeCarousel('TREAT YO SELF', [['beauty'], ['luxury']]),
      input(['beauty']),
      friend,
      "For the grad who's treating themselves",
    );
  });
});

// ---------------------------------------------------------------------------
// New Baby — full set reachable
// ---------------------------------------------------------------------------

describe('pickFriendlyName — New Baby', () => {
  const input = (interests: string[] = []) => makeInput('NEW_BABY', interests);
  const friend = makeSnapshot('FRIEND');

  test('books → first library', () => {
    expectName(
      makeCarousel('STORYTIME', [['books']]),
      input(['books']),
      friend,
      "Baby's first library",
    );
  });

  test('memories → first memories', () => {
    expectName(
      makeCarousel('PHOTOS', [['memories'], ['photo']]),
      input(['memories']),
      friend,
      "Baby's first memories",
    );
  });

  test('clothes → first outfits', () => {
    expectName(
      makeCarousel('TINY FITS', [['clothes']]),
      input(['clothes']),
      friend,
      "Baby's first outfits",
    );
  });

  test('decor → first nursery', () => {
    expectName(
      makeCarousel('NURSERY', [['decor']]),
      input(['decor']),
      friend,
      "For baby's first nursery",
    );
  });

  test('pets → baby with a pet', () => {
    expectName(
      makeCarousel('FUR FAMILY', [['pets']]),
      input(['pets']),
      friend,
      'For the baby with a pet',
    );
  });

  test('cooking → future foodie baby', () => {
    expectName(
      makeCarousel('FOODIE', [['food'], ['cooking']]),
      input(['cooking']),
      friend,
      'For the future foodie baby',
    );
  });

  test('water/bath → future waterbug', () => {
    expectName(
      makeCarousel('SPLASH', [['bath'], ['swim']]),
      input(['water']),
      friend,
      'For the future waterbug baby',
    );
  });

  test('general fallback → new baby essentials', () => {
    expectName(
      makeCarousel('Some Theme', [['unmapped']]),
      input([]),
      friend,
      'New baby essentials',
    );
  });
});

// ---------------------------------------------------------------------------
// Fallback chain — agent name title-case + pass-through
// ---------------------------------------------------------------------------

describe('pickFriendlyName — fallback chain', () => {
  test('title-cases an ALL CAPS agent name when no curated match exists', () => {
    // JUST_BECAUSE has no curated entries at all. Empty user interests +
    // unmapped product tag → no catalog hit. Falls through to title-case.
    const result = pickFriendlyName(
      makeCarousel('BACKYARD & BEYOND', [['unmapped_tag']]),
      makeInput('JUST_BECAUSE', []),
      makeSnapshot('FRIEND'),
    );
    expect(result).toBe('Backyard & Beyond');
  });

  test('passes through an already nicely-cased agent name', () => {
    const result = pickFriendlyName(
      makeCarousel('Cozy Sunday Mornings', [['unmapped_tag']]),
      makeInput('JUST_BECAUSE', []),
      makeSnapshot('FRIEND'),
    );
    expect(result).toBe('Cozy Sunday Mornings');
  });

  test('passes through empty agent name as empty string (last resort)', () => {
    const result = pickFriendlyName(
      makeCarousel('', [['unmapped_tag']]),
      makeInput('JUST_BECAUSE', []),
      makeSnapshot('FRIEND'),
    );
    expect(result).toBe('');
  });

  test('non-string tags do not crash (real BE has dirty data)', () => {
    const carousel: RecommendationCarousel = {
      displayName: 'Plant Vibes',
      products: [
        {
          id: 'p',
          title: 'T',
          price: 1,
          // @ts-expect-error — defensive: BE has been seen returning nulls in tag arrays
          carousel_tags: ['plants', null, undefined, 42],
          interests: ['plants'],
        },
      ],
    };
    expect(() =>
      pickFriendlyName(
        carousel,
        makeInput('MOTHERS_DAY', ['plants']),
        makeSnapshot('MOM'),
      ),
    ).not.toThrow();
    expect(
      pickFriendlyName(
        carousel,
        makeInput('MOTHERS_DAY', ['plants']),
        makeSnapshot('MOM'),
      ),
    ).toBe('For the mama with a green thumb');
  });
});

// ---------------------------------------------------------------------------
// Catalog coverage — every curated name is reachable from SOME valid input
// ---------------------------------------------------------------------------

describe('pickFriendlyName — every curated name is reachable', () => {
  // For each of the 42 names, exercise a (carousel, input, snapshot) tuple
  // that should produce it. This is the core invariant for bug #17: we never
  // ship a name that isn't reachable from real quiz data.
  const cases: Array<[
    string,
    RecommendationCarousel,
    RecommendationInput,
    RecipientSnapshot,
  ]> = [
    // Mother's Day
    [CURATED_NAMES.MOM_TINY_FAN_CLUB, makeCarousel('X', [['family']]), makeInput('MOTHERS_DAY', ['family']), makeSnapshot('MOM')],
    [CURATED_NAMES.GRANDMA_SENTIMENTAL, makeCarousel('X', [['sentimental']]), makeInput('MOTHERS_DAY', ['sentimental']), makeSnapshot('GRANDMA')],
    [CURATED_NAMES.MOM_GREEN_THUMB, makeCarousel('X', [['plants']]), makeInput('MOTHERS_DAY', ['plants']), makeSnapshot('MOM')],
    [CURATED_NAMES.MOM_BOOKWORM, makeCarousel('X', [['books']]), makeInput('MOTHERS_DAY', ['books']), makeSnapshot('MOM')],
    [CURATED_NAMES.MOM_QUEEN, makeCarousel('X', [['jewelry']]), makeInput('MOTHERS_DAY', ['jewelry']), makeSnapshot('MOM')],
    [CURATED_NAMES.MOM_TEA_DRINKER, makeCarousel('X', [['tea']]), makeInput('MOTHERS_DAY', ['tea']), makeSnapshot('MOM')],
    [CURATED_NAMES.MOM_CRAFTY, makeCarousel('X', [['crafts']]), makeInput('MOTHERS_DAY', ['crafts']), makeSnapshot('MOM')],
    [CURATED_NAMES.MOM_WORKOUT, makeCarousel('X', [['fitness']]), makeInput('MOTHERS_DAY', ['fitness']), makeSnapshot('MOM')],
    // Father's Day
    [CURATED_NAMES.DAD_MORNING_JOE, makeCarousel('X', [['coffee']]), makeInput('FATHERS_DAY', ['coffee']), makeSnapshot('DAD')],
    [CURATED_NAMES.DAD_GOLFER, makeCarousel('X', [['golf']]), makeInput('FATHERS_DAY', ['sports']), makeSnapshot('DAD')],
    [CURATED_NAMES.DAD_TINY_FAN_CLUB, makeCarousel('X', [['family']]), makeInput('FATHERS_DAY', ['family']), makeSnapshot('DAD')],
    [CURATED_NAMES.DAD_MOUNTAIN_MAN, makeCarousel('X', [['outdoors']]), makeInput('FATHERS_DAY', ['outdoors']), makeSnapshot('DAD')],
    [CURATED_NAMES.DAD_HOME_MIXOLOGIST, makeCarousel('X', [['cocktails']]), makeInput('FATHERS_DAY', ['alcohol']), makeSnapshot('DAD')],
    // Birthday
    [CURATED_NAMES.BDAY_SWEET_TOOTH, makeCarousel('X', [['sweets']]), makeInput('BIRTHDAY', ['sweets']), makeSnapshot('FRIEND')],
    [CURATED_NAMES.BDAY_JUST_ADD_GUESTS, makeCarousel('X', [['hosting']]), makeInput('BIRTHDAY', ['hosting']), makeSnapshot('FRIEND')],
    [CURATED_NAMES.BDAY_YEAR_AHEAD, makeCarousel('X', [['memories']]), makeInput('BIRTHDAY', ['memories']), makeSnapshot('FRIEND')],
    [CURATED_NAMES.BDAY_LOOK_FORWARD, makeCarousel('X', [['travel']]), makeInput('BIRTHDAY', ['travel']), makeSnapshot('FRIEND')],
    // Anniversary
    [CURATED_NAMES.ANNIV_NEXT_ADVENTURE, makeCarousel('X', [['travel']]), makeInput('ANNIVERSARY', ['travel']), makeSnapshot('PARTNER')],
    [CURATED_NAMES.ANNIV_CLASSICS, makeCarousel('X', [['classics']]), makeInput('ANNIVERSARY', ['classics']), makeSnapshot('PARTNER')],
    [CURATED_NAMES.ANNIV_COZY_DATE_NIGHT, makeCarousel('X', [['cozy']]), makeInput('ANNIVERSARY', ['cozy']), makeSnapshot('PARTNER')],
    [CURATED_NAMES.ANNIV_CUTE_AND_WRINKLY, makeCarousel('X', [['sentimental']]), makeInput('ANNIVERSARY', ['sentimental']), makeSnapshot('PARTNER')],
    [CURATED_NAMES.ANNIV_EXTRA_SWEET, makeCarousel('X', [['sweets']]), makeInput('ANNIVERSARY', ['sweets']), makeSnapshot('PARTNER')],
    [CURATED_NAMES.ANNIV_PERSONAL, makeCarousel('X', [['jewelry']]), makeInput('ANNIVERSARY', ['jewelry']), makeSnapshot('PARTNER')],
    // Housewarming
    [CURATED_NAMES.HW_GOOD_STUFF, makeCarousel('X', [['cooking']]), makeInput('HOUSEWARMING', ['cooking']), makeSnapshot('FRIEND')],
    [CURATED_NAMES.HW_DETAILS, makeCarousel('X', [['decor']]), makeInput('HOUSEWARMING', ['decor']), makeSnapshot('FRIEND')],
    [CURATED_NAMES.HW_POURS, makeCarousel('X', [['wine']]), makeInput('HOUSEWARMING', ['alcohol']), makeSnapshot('FRIEND')],
    [CURATED_NAMES.HW_COZY, makeCarousel('X', [['cozy']]), makeInput('HOUSEWARMING', ['cozy']), makeSnapshot('FRIEND')],
    [CURATED_NAMES.HW_HOST, makeCarousel('X', [['hosting']]), makeInput('HOUSEWARMING', ['hosting']), makeSnapshot('FRIEND')],
    [CURATED_NAMES.HW_CHEF, makeCarousel('X', [['unmapped']]), makeInput('HOUSEWARMING', []), makeSnapshot('FRIEND')],
    // Graduation
    [CURATED_NAMES.GRAD_REPS_SCHOOL, makeCarousel('X', [['school']]), makeInput('GRADUATION', ['school']), makeSnapshot('FRIEND')],
    [CURATED_NAMES.GRAD_WEAR_MOMENT, makeCarousel('X', [['clothes']]), makeInput('GRADUATION', ['clothes']), makeSnapshot('FRIEND')],
    [CURATED_NAMES.GRAD_GOING_PLACES, makeCarousel('X', [['travel']]), makeInput('GRADUATION', ['travel']), makeSnapshot('FRIEND')],
    [CURATED_NAMES.GRAD_SETTING_UP_SHOP, makeCarousel('X', [['decor']]), makeInput('GRADUATION', ['decor']), makeSnapshot('FRIEND')],
    [CURATED_NAMES.GRAD_TREATING_THEMSELVES, makeCarousel('X', [['beauty']]), makeInput('GRADUATION', ['beauty']), makeSnapshot('FRIEND')],
    // New Baby
    [CURATED_NAMES.BABY_LIBRARY, makeCarousel('X', [['books']]), makeInput('NEW_BABY', ['books']), makeSnapshot('FRIEND')],
    [CURATED_NAMES.BABY_MEMORIES, makeCarousel('X', [['memories']]), makeInput('NEW_BABY', ['memories']), makeSnapshot('FRIEND')],
    [CURATED_NAMES.BABY_OUTFITS, makeCarousel('X', [['clothes']]), makeInput('NEW_BABY', ['clothes']), makeSnapshot('FRIEND')],
    [CURATED_NAMES.BABY_NURSERY, makeCarousel('X', [['decor']]), makeInput('NEW_BABY', ['decor']), makeSnapshot('FRIEND')],
    [CURATED_NAMES.BABY_PET, makeCarousel('X', [['pets']]), makeInput('NEW_BABY', ['pets']), makeSnapshot('FRIEND')],
    [CURATED_NAMES.BABY_FOODIE, makeCarousel('X', [['food']]), makeInput('NEW_BABY', ['cooking']), makeSnapshot('FRIEND')],
    [CURATED_NAMES.BABY_WATERBUG, makeCarousel('X', [['bath']]), makeInput('NEW_BABY', ['water']), makeSnapshot('FRIEND')],
    [CURATED_NAMES.BABY_ESSENTIALS, makeCarousel('X', [['unmapped']]), makeInput('NEW_BABY', []), makeSnapshot('FRIEND')],
  ];

  test('test list covers all 42 curated names', () => {
    const expected = new Set(Object.values(CURATED_NAMES));
    const exercised = new Set(cases.map(([name]) => name));
    expect(exercised.size).toBe(expected.size);
    for (const e of expected) {
      expect(exercised.has(e)).toBe(true);
    }
  });

  test.each(cases)('input → %s', (expected, carousel, input, snapshot) => {
    const result = pickFriendlyName(carousel, input, snapshot);
    expect(result).toBe(expected);
    // Critical invariant: result is one of the 42 OR a passthrough. Here we
    // know the test case was constructed to hit a curated entry, so enforce
    // the stricter check.
    expect(new Set(Object.values(CURATED_NAMES)).has(result as never)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Bug #17 invariant — no invented names
// ---------------------------------------------------------------------------

describe('bug #17 invariant', () => {
  test('the catalog only contains the 42 verbatim old-app strings', () => {
    // If a future edit adds an "invented" name to the catalog, this test
    // fails — even before running the full reachability suite. We hard-code
    // the count here as a tripwire.
    expect(Object.values(CURATED_NAMES)).toHaveLength(42);
  });

  test('result is always either a curated name or a passthrough of the agent name', () => {
    // A handful of representative inputs — assert the result is either in
    // the 42-name set OR equals/title-cases the agent's displayName.
    const curated = new Set(Object.values(CURATED_NAMES));
    const samples: Array<[
      RecommendationCarousel,
      RecommendationInput,
      RecipientSnapshot,
    ]> = [
      [makeCarousel('Already Nice', [['unmapped']]), makeInput('JUST_BECAUSE', []), makeSnapshot('FRIEND')],
      [makeCarousel('SHOUTY NAME', [['unmapped']]), makeInput('THANK_YOU', []), makeSnapshot('FRIEND')],
      [makeCarousel('X', [['plants']]), makeInput('MOTHERS_DAY', ['plants']), makeSnapshot('MOM')],
    ];
    for (const [carousel, input, snapshot] of samples) {
      const result = pickFriendlyName(carousel, input, snapshot);
      const titleCased = carousel.displayName
        .toLowerCase()
        .replace(/(^|[\s\-/&])(\p{L})/gu, (_, sep, ch) => sep + ch.toUpperCase());
      const isCurated = curated.has(result as never);
      const isPassthrough = result === carousel.displayName || result === titleCased;
      expect(isCurated || isPassthrough).toBe(true);
    }
  });
});
