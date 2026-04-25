/** Per-product item used in carousels and grids. */
export interface ResultsProductCardItem {
  id: string;
  imageUrl: string;
  title: string;
  brand?: string;
  price?: number;
  productUrl?: string;
}

/** Visual state of a card in the carousel. The carousel slot animates
 *  the card based on this; the card itself doesn't own state. */
export type ResultsProductCardState = 'idle' | 'exiting' | 'dismissing';

/** A named, ordered list of products — one carousel row in the Discover tab. */
export interface ResultsCarouselSection {
  id: string;
  title: string;
  products: ResultsProductCardItem[];
}

/** Tab keys, matching the source identifiers. */
export type ResultsTabKey = 'recommended' | 'liked' | 'purchased';

/** Editable profile draft owned by `useProfileDrawer`. */
export interface ProfileDraft {
  emoji: string;
  name: string;
  birthMonth?: number;
  birthDay?: number;
  gender?: 'female' | 'male' | 'other';
  relationship?: string;
  age?: number;
  occasion?: string;
  priceMin: number;
  priceMax: number;
  interests: string[];
  vibes: string[];
  moreAbout: string;
}

/** Saved-hint flash flags emitted by useProfileDrawer to highlight
 *  recently-edited fields. The View renders a small "Saved" pill next
 *  to whichever fields are flagged. */
export type ProfileSavedHints = Partial<Record<keyof ProfileDraft, boolean>>;
