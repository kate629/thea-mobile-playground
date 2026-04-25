/**
 * Mirror of the CSS custom properties in src/index.css.
 *
 * Components consume tokens via the CSS-var indirection (`hsl(var(--primary))`)
 * so they line up 1:1 with the sovrn source. This theme object exists for
 * styled-components consumers who'd rather read theme values via the
 * `${({ theme }) => theme.color.primary}` idiom.
 */
export const theme = {
  color: {
    background: 'hsl(var(--background))',
    foreground: 'hsl(var(--foreground))',
    card: 'hsl(var(--card))',
    cardForeground: 'hsl(var(--card-foreground))',
    primary: 'hsl(var(--primary))',
    primaryForeground: 'hsl(var(--primary-foreground))',
    secondary: 'hsl(var(--secondary))',
    secondaryForeground: 'hsl(var(--secondary-foreground))',
    muted: 'hsl(var(--muted))',
    mutedForeground: 'hsl(var(--muted-foreground))',
    accent: 'hsl(var(--accent))',
    accentForeground: 'hsl(var(--accent-foreground))',
    liked: 'hsl(var(--liked))',
    likedForeground: 'hsl(var(--liked-foreground))',
    destructive: 'hsl(var(--destructive))',
    border: 'hsl(var(--border))',
    input: 'hsl(var(--input))',
    ring: 'hsl(var(--ring))',
    /* Brand constants pulled from sovrn inline styles. Pinned because they
       appear hard-coded in the source (HeroHeader.tsx, SiteHeader.tsx) rather
       than read from a CSS var. */
    clay: '#B56B58',
    inkSoft: '#3D3530',
    cream: '#F5F0EB',
    /* Lighter cream used as the Results-page sticky-header background
       (ResultsPageAuth.tsx, CREAM constant). Distinct from `cream`. */
    creamLight: '#FAF7F2',
    /* Warm border used on the profile pill + tab strip divider
       (ResultsPageAuth.tsx:1370). */
    warmBorder: '#E8E5E0',
  },
  shadow: {
    soft: 'var(--shadow-soft)',
    card: 'var(--shadow-card)',
    lg: 'var(--shadow-lg)',
    xl: 'var(--shadow-xl)',
  },
  gradient: {
    primary: 'var(--gradient-primary)',
    card: 'var(--gradient-card)',
    /* The HeroHeader CTA uses an inline gradient, not the --gradient-primary
       var (different stops). Surfacing it here so the Button primary variant
       can read it without re-deriving. */
    cta: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.78))',
  },
  radius: {
    sm: 'calc(var(--radius) - 4px)',
    md: 'calc(var(--radius) - 2px)',
    lg: 'var(--radius)',
    xl: '12px',
    '2xl': '16px',
    '3xl': '24px',
    pill: '9999px',
  },
  font: {
    sans: "'Albert Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    serif: "'Source Serif 4', Georgia, 'Times New Roman', serif",
  },
  breakpoint: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const;

export type Theme = typeof theme;

declare module 'styled-components' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface DefaultTheme extends Theme {}
}
