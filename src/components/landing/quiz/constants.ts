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
  /** Optional second line for the chip — kid chips use this for the
   *  age bracket so it sits on its own row and doesn't wrap. */
  sublabel?: string;
  emoji: string;
}

export const KID_AGE_CHIPS: AgeChip[] = [
  { value: 0.1, label: 'Newborn', sublabel: '0–3 months', emoji: '👶' },
  { value: 0.5, label: 'Baby', sublabel: '3–12 months', emoji: '🍼' },
  { value: 1.5, label: 'Toddler', sublabel: '1–2 years', emoji: '🖍️' },
  { value: 4, label: 'Preschool', sublabel: '3–5 years', emoji: '🎨' },
  { value: 8, label: 'Elementary School', sublabel: '6–10 years', emoji: '⚽' },
  { value: 12, label: 'Middle School', sublabel: '11–14 years', emoji: '🎒' },
  { value: 16, label: 'High School', sublabel: '14–18 years', emoji: '🎧' },
];

export const ADULT_AGE_CHIPS: AgeChip[] = [
  { value: 25, label: '20s', emoji: '🌱' },
  { value: 35, label: '30s', emoji: '🪴' },
  { value: 45, label: '40s', emoji: '🌿' },
  { value: 55, label: '50s', emoji: '🌻' },
  { value: 65, label: '60s', emoji: '🌳' },
  { value: 75, label: '70s+', emoji: '🌲' },
];

export const ALWAYS_ADULT_RELATIONSHIPS = ['Mom', 'Dad', 'Grandma', 'Grandpa', 'Partner', 'Me!'];

// Relationships that could be either an adult or a child — these get an
// extra step in the quiz that asks "adult or child?" before age. Sister
// and Brother are excluded by design (treated as always-adult; a kid
// sister would be picked as Daughter or via Other).
export const NEEDS_LIFESTAGE_RELATIONSHIPS = [
  'Son',
  'Daughter',
  'Granddaughter',
  'Grandson',
  'Friend',
  'Other',
];

export type LifeStage = 'adult' | 'child';

export type Gender = 'female' | 'male' | 'other';

export const getGenderFromRelationship = (rel: string): Gender => {
  const female = ['Mom', 'Sister', 'Daughter', 'Grandma', 'Granddaughter'];
  const male = ['Dad', 'Brother', 'Son', 'Grandpa', 'Grandson'];
  if (female.includes(rel)) return 'female';
  if (male.includes(rel)) return 'male';
  return 'other';
};
