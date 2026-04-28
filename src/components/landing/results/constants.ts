export const VIBE_OPTIONS = [
  'Practical', 'Sentimental', 'Funny', 'Luxury', 'Handmade',
  'Outdoorsy', 'Chic', 'Sporty', 'Boho', 'Modern', 'Colorful', 'Cozy', 'Classic',
];

/** Vibes shown by default before "Show more" expansion. */
export const VIBE_DEFAULT_VISIBLE_COUNT = 6;

export const GENDER_OPTIONS = [
  { value: 'female', label: 'Female', emoji: '♀️' },
  { value: 'male', label: 'Male', emoji: '♂️' },
  { value: 'other', label: 'Other', emoji: '✨' },
] as const;

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const OCCASION_OPTIONS = [
  { value: 'Birthday', emoji: '🎂' },
  { value: 'Anniversary', emoji: '💕' },
  { value: "Mother's Day", emoji: '🌷' },
  { value: "Father's Day", emoji: '👔' },
  { value: 'Graduation', emoji: '🎓' },
  { value: 'Housewarming', emoji: '🏡' },
  { value: 'New Baby', emoji: '🍼' },
  { value: 'Wedding', emoji: '💍' },
  { value: 'Thank You', emoji: '🙏' },
  { value: 'Just Because', emoji: '🥰' },
  { value: 'Other', emoji: '✨' },
];

export const ADULT_AGE_BUCKETS = [
  { value: 25, label: '20s' },
  { value: 35, label: '30s' },
  { value: 45, label: '40s' },
  { value: 55, label: '50s' },
  { value: 65, label: '60s' },
  { value: 75, label: '70s+' },
];

export const EMOJI_GRID = [
  '🌶️', '🦋', '🍷', '🌻', '🎪', '🧁',
  '🔥', '🌊', '🎯', '🍕', '🦩', '🌈',
  '🫧', '🎸', '🍋', '🪩', '🐝', '🌮',
  '💎', '🧸', '🌴', '🎠', '🪻', '⭐',
];

export const daysInMonth = (monthIdx1: number): number => {
  if (!monthIdx1) return 31;
  return new Date(2024, monthIdx1, 0).getDate();
};
