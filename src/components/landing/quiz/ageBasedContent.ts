import { Gender } from './constants';

interface AgeGroup {
  minAge: number;
  maxAge: number;
  pills: string[];
  placeholders: { female: string; male: string; other: string };
}

const REMOVE_PILLS = ['Baking', 'Coffee', 'Tea', 'Swim', 'Experiences', 'Dogs', 'Cats'];

function orderPills(pills: string[]): string[] {
  const filtered = pills.filter((p) => !REMOVE_PILLS.includes(p));
  const withoutAcc = filtered.filter((p) => p !== 'Accessories');
  const clothesIdx = withoutAcc.indexOf('Clothes');
  if (clothesIdx !== -1 && filtered.includes('Accessories')) {
    withoutAcc.splice(clothesIdx + 1, 0, 'Accessories');
  } else if (filtered.includes('Accessories')) {
    withoutAcc.push('Accessories');
  }
  return withoutAcc;
}

const AGE_GROUPS: AgeGroup[] = [
  {
    minAge: 0,
    maxAge: 0.25,
    pills: orderPills(['Books', 'Toys', 'Clothes', 'Nursery decor', 'Essentials']),
    placeholders: {
      female: "Her dad loves basketball. They live in Chicago. It's their first baby.",
      male: "His dad loves basketball. They live in Chicago. It's their first baby.",
      other: "Their dad loves basketball. They live in Chicago. It's their first baby.",
    },
  },
  {
    minAge: 0.26,
    maxAge: 1,
    pills: orderPills(['Books', 'Toys', 'Clothes', 'Nursery decor', 'Essentials']),
    placeholders: {
      female: 'Her dad loves basketball. Her mom is an artist. They live in Chicago.',
      male: 'His dad loves basketball. Her mom is an artist. They live in Chicago.',
      other: 'Their dad loves basketball. Her mom is an artist. They live in Chicago.',
    },
  },
  {
    // Toddler (1–2 years). Kid pills bypass `orderPills` so 'Swim' (in
    // the global REMOVE_PILLS filter for adults) actually renders.
    minAge: 1.01,
    maxAge: 2,
    pills: [
      'Books', 'Toys', 'Clothes', 'Arts & crafts', 'Bath', 'Room decor',
      'Animals', 'Vehicles', 'Dinosaurs', 'Music', 'Space', 'Kitchen',
      'Sea life', 'Fantasy', 'Dolls', 'Dress-up', 'Swim',
    ],
    placeholders: {
      female: 'She loves coloring, sticker books, and helping her dad cook.',
      male: 'He loves animals, trucks, and helping his mom cook.',
      other: 'They love animals, sticker books, and helping their dad cook.',
    },
  },
  {
    // Preschool (3–5 years).
    minAge: 3,
    maxAge: 5,
    pills: [
      'Books', 'Games', 'Arts & crafts', 'Science', 'Clothes', 'Accessories',
      'Room decor', 'Animals', 'Vehicles', 'Dinosaurs', 'Music', 'Space',
      'Kitchen', 'Sea life', 'Fantasy', 'Dolls', 'Dress-up', 'Swim',
    ],
    placeholders: {
      female: "She's into painting, sticker books, and gardening. The family goes to the lake every summer.",
      male: "He's into music, cars, and gardening. The family goes to the lake every summer.",
      other: "They're into art, cars, and gardening. The family goes to the lake every summer.",
    },
  },
  {
    // Elementary School (6–10). Magic + Mystery dropped per the
    // documented rule (Magic → Fantasy, Mystery → Games).
    minAge: 6,
    maxAge: 10,
    pills: [
      'Books', 'Games', 'Arts & crafts', 'Science', 'Cooking', 'Clothes',
      'Accessories', 'Room decor', 'Sports', 'Outdoors', 'Music', 'Space',
      'Fantasy', 'Dolls', 'Dress-up', 'Swim', 'Dance',
    ],
    placeholders: {
      female: "She's always drawing and making up her own stories. Her family travels often.",
      male: 'He plays basketball and loves learning about Japan. His family travels often.',
      other: "They're always drawing and making up their own stories. Their family travels often.",
    },
  },
  {
    // Middle School (11–13).
    minAge: 11,
    maxAge: 13,
    pills: [
      'Books', 'Games', 'Arts & crafts', 'STEM', 'Cooking', 'Clothes',
      'Room decor', 'Dance', 'Sports', 'Music', 'Outdoors', 'Sweets',
      'Jewelry', 'Accessories', 'Swim',
    ],
    placeholders: {
      female: "She's always drawing and making up her own stories. Her family travels often.",
      male: 'He plays basketball and loves learning about Japan. His family travels often.',
      other: "They're always drawing and making up their own stories. Their family travels often.",
    },
  },
  {
    // High School (14–18). Same pill list as Middle School per the
    // current spec; placeholder mirrors Middle/Elementary copy.
    minAge: 14,
    maxAge: 20,
    pills: [
      'Books', 'Games', 'Arts & crafts', 'STEM', 'Cooking', 'Clothes',
      'Room decor', 'Dance', 'Sports', 'Music', 'Outdoors', 'Sweets',
      'Jewelry', 'Accessories', 'Swim',
    ],
    placeholders: {
      female: "She's always drawing and making up her own stories. Her family travels often.",
      male: 'He plays basketball and loves learning about Japan. His family travels often.',
      other: "They're always drawing and making up their own stories. Their family travels often.",
    },
  },
  {
    minAge: 21,
    maxAge: 24,
    pills: orderPills([
      'Books', 'Games', 'Clothes', 'Accessories', 'Jewelry', 'Decor', 'Cooking', 'Baking',
      'Crafts', 'Music', 'Experiences', 'Fitness', 'Sports', 'Outdoors', 'Beauty', 'Sweets',
      'Alcohol', 'Dogs', 'Cats', 'Travel', 'Plants', 'Coffee', 'Tea', 'Hosting', 'Swim',
    ]),
    placeholders: {
      female: "She's going to work as a nurse in Nashville. I want to get her something fun and useful, maybe for her first apartment.",
      male: "He's going to work as a nurse in Nashville. I want to get him something fun and useful, maybe for his first apartment.",
      other: "They're going to work as a nurse in Nashville. I want to get them something fun and useful, maybe for their first apartment.",
    },
  },
  {
    minAge: 25,
    maxAge: Infinity,
    pills: orderPills([
      'Books', 'Games', 'Clothes', 'Accessories', 'Jewelry', 'Decor', 'Cooking', 'Baking',
      'Crafts', 'Music', 'Experiences', 'Fitness', 'Sports', 'Outdoors', 'Beauty', 'Sweets',
      'Alcohol', 'Dogs', 'Cats', 'Travel', 'Plants', 'Coffee', 'Tea', 'Hosting', 'Swim',
    ]),
    placeholders: {
      female: "She's going to work as a nurse in Nashville. I want to get her something fun, maybe for her apartment.",
      male: "He's going to work as a nurse in Nashville. I want to get him something fun, maybe for his apartment.",
      other: "They're going to work as a nurse in Nashville. I want to get them something fun, maybe for their apartment.",
    },
  },
];

const DEFAULT_GROUP = AGE_GROUPS[AGE_GROUPS.length - 1];

const getAgeGroup = (age: number): AgeGroup => {
  if (age <= 0) return DEFAULT_GROUP;
  return AGE_GROUPS.find((g) => age >= g.minAge && age <= g.maxAge) || DEFAULT_GROUP;
};

export const getInterestPills = (age: number, gender?: Gender): string[] => {
  const pills = getAgeGroup(age).pills;
  if (gender === 'male') return pills.map((p) => (p === 'Beauty' ? 'Grooming' : p));
  return pills;
};

export const getPlaceholderText = (gender: Gender, age: number): string => {
  return getAgeGroup(age).placeholders[gender];
};

type EmojiEntry = string | { female: string; male: string; other: string };

const INTEREST_EMOJIS: Record<string, EmojiEntry> = {
  Books: '📚', Toys: '🧸', Clothes: '👕', 'Nursery decor': '🌙', Essentials: '🧴',
  'Arts & crafts': '✂️', Bath: '🛁', 'Room decor': '🖼️', Animals: '🐾', Vehicles: '🚗',
  Dinosaurs: '🦕', Music: '🎵', Space: '🚀', Kitchen: '🥣', 'Sea life': '🐳',
  Fantasy: '🪄', Dolls: '🎀', 'Dress-up': '✨', Games: '🧩', Art: '🎨', Science: '🧪',
  Accessories: '🧣', Cooking: '🍳', Sports: '⚽', Magic: '🪄', Outdoors: '🏕️',
  Mystery: '🔍', STEM: '🧪', Sweets: '🍬', Jewelry: '✨', Fitness: '💪', Alcohol: '🍷',
  Beauty: '💄', Grooming: '💈', Decor: '🏠', Crafts: '🧶', Travel: '✈️', Plants: '🌿',
  Hosting: '🎉', Dance: '🪩', Swim: '🌊',
};

// Per-kid emoji overrides — same chip label, different glyph when the
// recipient is a kid. Accessories swaps from a scarf to a backpack;
// Room decor swaps from a framed picture to a bed.
const KID_EMOJI_OVERRIDES: Record<string, string> = {
  Accessories: '🎒',
  'Room decor': '🛏️',
};

export const getInterestEmoji = (
  interest: string,
  gender?: Gender,
  isKid?: boolean,
): string => {
  if (isKid) {
    const kidGlyph = KID_EMOJI_OVERRIDES[interest];
    if (kidGlyph) return kidGlyph + ' ';
  }
  const entry = INTEREST_EMOJIS[interest];
  if (!entry) return '';
  if (typeof entry === 'string') return entry + ' ';
  const g = gender || 'other';
  return entry[g] + ' ';
};
