/**
 * Per-recipient accent color, derived from the emoji they're tagged with
 * (which itself comes from RELATIONSHIPS in the quiz constants). Lets
 * each board have its own quiet visual signature without being so loud
 * it reduces the recipient to one note.
 *
 * Used in three places (subtle in all of them):
 *   - drop shadow tint on saved-tray thumbnails (clay → recipient-tinted)
 *   - halo color in the save-landing micro-animation
 *   - dotted-slot border in the empty state (faint accent)
 *
 * Keep tints SOFT — high lightness, low saturation. Anything stronger
 * starts feeling like a theme palette rather than a personal touch.
 */

export interface RecipientAccent {
  /** Soft tinted color for shadows, halos, hairlines. HSL, ~30% saturation. */
  soft: string;
  /** Slightly more saturated version for the halo's brightest moment. */
  glow: string;
}

const ACCENTS: Record<string, RecipientAccent> = {
  // Tulip / blossom / heart-coded — soft rose
  '🌷': { soft: 'hsl(348, 35%, 78%)', glow: 'hsl(348, 50%, 72%)' },
  '🌸': { soft: 'hsl(338, 35%, 80%)', glow: 'hsl(338, 50%, 74%)' },
  '🌺': { soft: 'hsl(338, 35%, 80%)', glow: 'hsl(338, 50%, 74%)' },
  '❤️': { soft: 'hsl(2, 35%, 78%)', glow: 'hsl(2, 50%, 70%)' },
  '🎀': { soft: 'hsl(338, 30%, 82%)', glow: 'hsl(338, 45%, 76%)' },
  // Butterflies / kids — amethyst
  '🦋': { soft: 'hsl(268, 30%, 80%)', glow: 'hsl(268, 45%, 74%)' },
  // Teddy / brown-coded — warm tan
  '🧸': { soft: 'hsl(28, 35%, 78%)', glow: 'hsl(28, 50%, 70%)' },
  // Star / golden
  '⭐': { soft: 'hsl(46, 50%, 76%)', glow: 'hsl(46, 70%, 64%)' },
  '✨': { soft: 'hsl(46, 50%, 76%)', glow: 'hsl(46, 70%, 64%)' },
  // Outdoorsy / golf / nature — sage
  '⛳': { soft: 'hsl(120, 22%, 78%)', glow: 'hsl(120, 35%, 70%)' },
  '🌳': { soft: 'hsl(120, 22%, 78%)', glow: 'hsl(120, 35%, 70%)' },
  // Coffee / quiet — warm taupe
  '☕': { soft: 'hsl(28, 28%, 75%)', glow: 'hsl(28, 40%, 66%)' },
  '🫖': { soft: 'hsl(20, 30%, 76%)', glow: 'hsl(20, 42%, 68%)' },
  // Sports — clay
  '🏀': { soft: 'hsl(20, 40%, 75%)', glow: 'hsl(20, 55%, 66%)' },
  // Hand / friend — soft sky
  '🤝': { soft: 'hsl(200, 28%, 78%)', glow: 'hsl(200, 42%, 70%)' },
  '🙋': { soft: 'hsl(200, 28%, 78%)', glow: 'hsl(200, 42%, 70%)' },
  // Twins / sister duo — coral
  '👯': { soft: 'hsl(8, 38%, 78%)', glow: 'hsl(8, 55%, 70%)' },
};

const DEFAULT_ACCENT: RecipientAccent = {
  // Warm clay — matches the brand and reads as "neutral but personal."
  soft: 'hsl(14, 32%, 78%)',
  glow: 'hsl(14, 50%, 68%)',
};

export function accentForEmoji(emoji: string | undefined): RecipientAccent {
  if (!emoji) return DEFAULT_ACCENT;
  return ACCENTS[emoji] ?? DEFAULT_ACCENT;
}
