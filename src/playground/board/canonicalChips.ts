/**
 * Master list of canonical interest chips available for any recipient's
 * board. Used in two places:
 *   1. The chip-tab strip — only chips currently in `selectedChipKeys`
 *      render as tabs.
 *   2. The "+ More" edit panel — all chips render here; tap toggles
 *      selection.
 *
 * Source of truth for chip key + label + emoji. Real upstream uses
 * `getInterestPills(age, gender)` which returns age-bucketed pills; the
 * playground keeps a flat list for simplicity.
 */

export interface CanonicalChip {
  key: string;
  label: string;
  emoji: string;
}

export const CANONICAL_CHIPS: CanonicalChip[] = [
  { key: 'decor', label: 'Decor', emoji: '🏡' },
  { key: 'cooking', label: 'Cooking', emoji: '🍳' },
  { key: 'beauty', label: 'Beauty', emoji: '💄' },
  { key: 'books', label: 'Books', emoji: '📚' },
  { key: 'plants', label: 'Plants', emoji: '🌿' },
  { key: 'jewelry', label: 'Jewelry', emoji: '✨' },
  { key: 'clothes', label: 'Clothes', emoji: '👕' },
  { key: 'accessories', label: 'Accessories', emoji: '🧣' },
  { key: 'crafts', label: 'Crafts', emoji: '🧶' },
  { key: 'music', label: 'Music', emoji: '🎵' },
  { key: 'fitness', label: 'Fitness', emoji: '🏋️' },
  { key: 'sports', label: 'Sports', emoji: '⚽' },
  { key: 'outdoors', label: 'Outdoors', emoji: '🏞️' },
  { key: 'sweets', label: 'Sweets', emoji: '🍬' },
  { key: 'alcohol', label: 'Alcohol', emoji: '🍷' },
  { key: 'travel', label: 'Travel', emoji: '✈️' },
  { key: 'hosting', label: 'Hosting', emoji: '🎉' },
  { key: 'games', label: 'Games', emoji: '🧩' },
];

const BY_KEY = new Map(CANONICAL_CHIPS.map((c) => [c.key, c]));

export function getChipMeta(key: string): CanonicalChip | undefined {
  return BY_KEY.get(key);
}
