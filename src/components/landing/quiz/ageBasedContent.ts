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
    minAge: 1.01,
    maxAge: 2,
    pills: orderPills([
      'Books', 'Toys', 'Clothes', 'Bath', 'Room decor', 'Kitchen', 'Arts & crafts', 'Music',
      'Animals', 'Dinosaurs', 'Sea life', 'Space', 'Fantasy', 'Vehicles', 'Dolls', 'Dress-up', 'Swim',
    ]),
    placeholders: {
      female: 'She loves coloring, sticker books, and helping her dad cook.',
      male: 'He loves animals, trucks, and helping his mom cook.',
      other: 'They love animals, sticker books, and helping their dad cook.',
    },
  },
  {
    minAge: 3,
    maxAge: 5,
    pills: orderPills([
      'Books', 'Games', 'Clothes', 'Accessories', 'Room decor', 'Kitchen', 'Arts & crafts',
      'Science', 'Music', 'Experiences', 'Animals', 'Dinosaurs', 'Sea life', 'Space',
      'Fantasy', 'Vehicles', 'Dolls', 'Dress-up', 'Swim',
    ]),
    placeholders: {
      female: "She's into painting, sticker books, and gardening. The family goes to the lake every summer.",
      male: "He's into music, cars, and gardening. The family goes to the lake every summer.",
      other: "They're into art, cars, and gardening. The family goes to the lake every summer.",
    },
  },
  {
    minAge: 6,
    maxAge: 10,
    pills: orderPills([
      'Books', 'Games', 'Clothes', 'Accessories', 'Room decor', 'Cooking', 'Arts & crafts',
      'Science', 'Music', 'Dance', 'Experiences', 'Sports', 'Outdoors', 'Magic', 'Mystery',
      'Space', 'Fantasy', 'Dolls', 'Dress-up', 'Swim',
    ]),
    placeholders: {
      female: "She's always drawing and making up her own stories. Her family travels often.",
      male: 'He plays basketball and loves learning about Japan. His family travels often.',
      other: "They're always drawing and making up their own stories. Their family travels often.",
    },
  },
  {
    minAge: 11,
    maxAge: 13,
    pills: orderPills([
      'Books', 'Games', 'Clothes', 'Accessories', 'Jewelry', 'Room decor', 'Cooking',
      'Arts & crafts', 'STEM', 'Music', 'Dance', 'Sports', 'Outdoors', 'Sweets', 'Swim',
    ]),
    placeholders: {
      female: "She's always drawing and making up her own stories. Her family travels often.",
      male: 'He plays basketball and loves learning about Japan. His family travels often.',
      other: "They're always drawing and making up their own stories. Their family travels often.",
    },
  },
  {
    minAge: 14,
    maxAge: 20,
    pills: orderPills([
      'Books', 'Games', 'Clothes', 'Accessories', 'Jewelry', 'Room decor', 'Cooking',
      'Arts & crafts', 'STEM', 'Music', 'Dance', 'Experiences', 'Sports', 'Outdoors',
      'Sweets', 'Swim',
    ]),
    placeholders: {
      female: "She's going to study business. I want to get her something fun and useful, maybe for her dorm.",
      male: "He's going to study business. I want to get him something fun and useful, maybe for his dorm.",
      other: "They're going to study business. I want to get them something fun and useful, maybe for their dorm.",
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
  Accessories: '🧣', Cooking: '🍲', Sports: '⚽', Magic: '🪄', Outdoors: '🏕️',
  Mystery: '🔍', STEM: '🧪', Sweets: '🍬', Jewelry: '✨', Fitness: '💪', Alcohol: '🍷',
  Beauty: '💄', Grooming: '💈', Decor: '🏠', Crafts: '🧶', Travel: '✈️', Plants: '🌿',
  Hosting: '🎉', Dance: '🪩',
};

export const getInterestEmoji = (interest: string, gender?: Gender): string => {
  const entry = INTEREST_EMOJIS[interest];
  if (!entry) return '';
  if (typeof entry === 'string') return entry + ' ';
  const g = gender || 'other';
  return entry[g] + ' ';
};
