import {
  CAROUSEL_TITLE_OVERRIDES,
  genderizeTitle,
  getRelationshipCarouselTitle,
  resolveDynamicCarouselTitle,
} from '../dynamicCarouselTitle';

// ---------------------------------------------------------------------------
// CAROUSEL_TITLE_OVERRIDES — the corpus
// ---------------------------------------------------------------------------

describe('CAROUSEL_TITLE_OVERRIDES', () => {
  test('contains the 19 entries from the OLD repo', () => {
    expect(Object.keys(CAROUSEL_TITLE_OVERRIDES).length).toBe(19);
  });

  test('every entry is a "For …" or similar curated title (no ALL CAPS, no chip-id verbatim)', () => {
    for (const [chip, title] of Object.entries(CAROUSEL_TITLE_OVERRIDES)) {
      expect(title).not.toBe(title.toUpperCase());
      expect(title.toLowerCase()).not.toBe(chip);
    }
  });

  test('keys are all lowercase (lookup normalizes input via .toLowerCase)', () => {
    for (const k of Object.keys(CAROUSEL_TITLE_OVERRIDES)) {
      expect(k).toBe(k.toLowerCase());
    }
  });

  test('contains the canonical examples Kate sampled', () => {
    expect(CAROUSEL_TITLE_OVERRIDES.books).toBe('For the bookworm');
    expect(CAROUSEL_TITLE_OVERRIDES.crafts).toBe('For the crafty one');
    expect(CAROUSEL_TITLE_OVERRIDES.sweets).toBe("For their sweet tooth");
    expect(CAROUSEL_TITLE_OVERRIDES.music).toBe('For the music lover');
    expect(CAROUSEL_TITLE_OVERRIDES.fitness).toBe("For their next workout");
    expect(CAROUSEL_TITLE_OVERRIDES.alcohol).toBe('For the home bar');
    expect(CAROUSEL_TITLE_OVERRIDES.travel).toBe('For the traveler');
  });
});

// ---------------------------------------------------------------------------
// getRelationshipCarouselTitle — special chips
// ---------------------------------------------------------------------------

describe('getRelationshipCarouselTitle', () => {
  test('wildcard → "Trending Favorites" regardless of relationship', () => {
    expect(getRelationshipCarouselTitle('wildcard', 'Mom')).toBe('Trending Favorites');
    expect(getRelationshipCarouselTitle('wildcard', undefined)).toBe('Trending Favorites');
  });

  test('date_night → "Perfect for {relationship}"', () => {
    expect(getRelationshipCarouselTitle('date_night', 'Partner')).toBe('Perfect for Partner');
    expect(getRelationshipCarouselTitle('date_night', undefined)).toBe('Perfect for them');
    expect(getRelationshipCarouselTitle('date_night', '')).toBe('Perfect for them');
  });

  test('sentimental → "Perfect for {relationship}"', () => {
    expect(getRelationshipCarouselTitle('sentimental', 'Mom')).toBe('Perfect for Mom');
  });

  test('case-insensitive on the chip key', () => {
    expect(getRelationshipCarouselTitle('WILDCARD', 'Friend')).toBe('Trending Favorites');
    expect(getRelationshipCarouselTitle('Date_Night', 'Sister')).toBe('Perfect for Sister');
  });

  test('any other chip returns null (caller falls through)', () => {
    expect(getRelationshipCarouselTitle('books', 'Mom')).toBeNull();
    expect(getRelationshipCarouselTitle('Cooking', 'Dad')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// genderizeTitle — pronoun substitution
// ---------------------------------------------------------------------------

describe('genderizeTitle', () => {
  test('female: their → her, They → She, them → her', () => {
    expect(genderizeTitle("For their sweet tooth", 'FEMALE')).toBe('For her sweet tooth');
    expect(genderizeTitle("They love games", 'FEMALE')).toBe('She love games');
    expect(genderizeTitle('Treat them well', 'FEMALE')).toBe('Treat her well');
  });

  test('male: their → his, They → He, them → him', () => {
    expect(genderizeTitle("For their sweet tooth", 'MALE')).toBe('For his sweet tooth');
    expect(genderizeTitle("They love games", 'MALE')).toBe('He love games');
    expect(genderizeTitle('Treat them well', 'MALE')).toBe('Treat him well');
  });

  test('NON_BINARY / PREFER_NOT_TO_SAY / undefined leave the title unchanged', () => {
    const t = "For their sweet tooth";
    expect(genderizeTitle(t, 'NON_BINARY')).toBe(t);
    expect(genderizeTitle(t, 'PREFER_NOT_TO_SAY')).toBe(t);
    expect(genderizeTitle(t, undefined)).toBe(t);
  });

  test('only whole-word matches (does not damage "themed" or "their\'s")', () => {
    expect(genderizeTitle('themed birthday', 'FEMALE')).toBe('themed birthday');
    expect(genderizeTitle('their next workout', 'FEMALE')).toBe('her next workout');
  });
});

// ---------------------------------------------------------------------------
// resolveDynamicCarouselTitle — orchestrates all 4 layers
// ---------------------------------------------------------------------------

describe('resolveDynamicCarouselTitle', () => {
  test('chip-keyed override wins over BE displayName', () => {
    expect(
      resolveDynamicCarouselTitle({
        chip: 'books',
        fallbackDisplayName: 'BACKYARD & BEYOND',
      }),
    ).toBe('For the bookworm');
  });

  test('lookup is case-insensitive on the chip', () => {
    expect(
      resolveDynamicCarouselTitle({
        chip: 'Cooking',
        fallbackDisplayName: 'whatever',
      }),
    ).toBe('For the home chef');
  });

  test('chip not in override map AND not special falls through to BE displayName', () => {
    expect(
      resolveDynamicCarouselTitle({
        chip: 'toys',
        fallbackDisplayName: 'Playtime',
      }),
    ).toBe('Playtime');
  });

  test('wildcard → Trending Favorites (regardless of BE displayName)', () => {
    expect(
      resolveDynamicCarouselTitle({
        chip: 'wildcard',
        fallbackDisplayName: 'Wild Card',
        relationshipDisplay: 'Mom',
      }),
    ).toBe('Trending Favorites');
  });

  test('date_night → "Perfect for X" using the relationshipDisplay arg', () => {
    expect(
      resolveDynamicCarouselTitle({
        chip: 'date_night',
        fallbackDisplayName: 'Date Night',
        relationshipDisplay: 'Partner',
      }),
    ).toBe('Perfect for Partner');
  });

  test('sentimental + Mom → "Perfect for Mom"', () => {
    expect(
      resolveDynamicCarouselTitle({
        chip: 'sentimental',
        fallbackDisplayName: "Get 'Em in the Feels",
        relationshipDisplay: 'Mom',
      }),
    ).toBe('Perfect for Mom');
  });

  test('genderize applies AFTER override map (sweets + female → "For her sweet tooth")', () => {
    expect(
      resolveDynamicCarouselTitle({
        chip: 'sweets',
        fallbackDisplayName: 'Something Sweet',
        gender: 'FEMALE',
      }),
    ).toBe('For her sweet tooth');
  });

  test('genderize applies to fallback titles too (BE displayName "Treat them" + male)', () => {
    expect(
      resolveDynamicCarouselTitle({
        chip: 'unknown_chip',
        fallbackDisplayName: 'Treat them right',
        gender: 'MALE',
      }),
    ).toBe('Treat him right');
  });

  test('grooming override: beauty + male → "For the grooming routine" (improves on OLD)', () => {
    expect(
      resolveDynamicCarouselTitle({
        chip: 'beauty',
        fallbackDisplayName: 'Glow Up',
        gender: 'MALE',
      }),
    ).toBe('For the grooming routine');
  });

  test('beauty + female → "For the beauty lover" (no grooming swap)', () => {
    expect(
      resolveDynamicCarouselTitle({
        chip: 'beauty',
        fallbackDisplayName: 'Glow Up',
        gender: 'FEMALE',
      }),
    ).toBe('For the beauty lover');
  });

  test('beauty + non-binary / unknown → "For the beauty lover" (no grooming swap)', () => {
    expect(
      resolveDynamicCarouselTitle({
        chip: 'beauty',
        fallbackDisplayName: 'Glow Up',
        gender: 'NON_BINARY',
      }),
    ).toBe('For the beauty lover');
    expect(
      resolveDynamicCarouselTitle({
        chip: 'beauty',
        fallbackDisplayName: 'Glow Up',
        // gender omitted entirely
      }),
    ).toBe('For the beauty lover');
  });

  test('genderize ALSO applies to special chips ("Perfect for them" + female → "Perfect for her")', () => {
    expect(
      resolveDynamicCarouselTitle({
        chip: 'date_night',
        fallbackDisplayName: 'Date Night',
        gender: 'FEMALE',
        // relationshipDisplay omitted → falls through to "them" which then
        // genderizes to "her"
      }),
    ).toBe('Perfect for her');
  });
});
