export interface RelationshipOption {
  value: string;
  emoji: string;
}

export const RELATIONSHIPS: RelationshipOption[] = [
  { value: 'Mom', emoji: '🌷' },
  { value: 'Dad', emoji: '⛳' },
  { value: 'Partner', emoji: '❤️' },
  { value: 'Sister', emoji: '👯' },
  { value: 'Brother', emoji: '🏀' },
  { value: 'Daughter', emoji: '🌸' },
  { value: 'Son', emoji: '⭐' },
  { value: 'Grandma', emoji: '🫖' },
  { value: 'Grandpa', emoji: '☕' },
  { value: 'Granddaughter', emoji: '🎀' },
  { value: 'Grandson', emoji: '🧸' },
  { value: 'Friend', emoji: '🤝' },
  { value: 'Me!', emoji: '🙋' },
  { value: 'Other', emoji: '✨' },
];

export interface AgeChip {
  value: number;
  label: string;
  emoji: string;
}

export const KID_AGE_CHIPS: AgeChip[] = [
  { value: 0.5, label: 'Baby (0–12 months)', emoji: '👶' },
  { value: 1.5, label: '1–2 years', emoji: '🖍️' },
  { value: 4, label: '3–5 years', emoji: '🎨' },
  { value: 8, label: '6–10 years', emoji: '⚽' },
  { value: 12, label: '11–13 years', emoji: '🧩' },
  { value: 16, label: '14–17 years', emoji: '🎧' },
];

export const ADULT_AGE_CHIPS: AgeChip[] = [
  { value: 25, label: '20s', emoji: '🌱' },
  { value: 35, label: '30s', emoji: '🪴' },
  { value: 45, label: '40s', emoji: '🌿' },
  { value: 55, label: '50s', emoji: '🌻' },
  { value: 65, label: '60s', emoji: '🌸' },
  { value: 75, label: '70s', emoji: '🌺' },
];

export const ALWAYS_ADULT_RELATIONSHIPS = ['Mom', 'Dad', 'Grandma', 'Grandpa', 'Partner', 'Me!'];

export type Gender = 'female' | 'male' | 'other';

export const getGenderFromRelationship = (rel: string): Gender => {
  const female = ['Mom', 'Sister', 'Daughter', 'Grandma', 'Granddaughter'];
  const male = ['Dad', 'Brother', 'Son', 'Grandpa', 'Grandson'];
  if (female.includes(rel)) return 'female';
  if (male.includes(rel)) return 'male';
  return 'other';
};
