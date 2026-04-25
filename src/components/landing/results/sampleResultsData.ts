import { ResultsCarouselSection, ResultsProductCardItem } from './types';
import { SAMPLE_AMBIENT_IMAGES } from '../quiz/sampleAmbientImages';

const URLS = SAMPLE_AMBIENT_IMAGES.map((s) => s.original);

const product = (
  id: string,
  imageUrl: string,
  title: string,
  brand: string,
  price: number,
): ResultsProductCardItem => ({ id, imageUrl, title, brand, price });

export const SAMPLE_RESULTS_CAROUSELS: ResultsCarouselSection[] = [
  {
    id: 'cooking',
    title: 'KITCHEN PICKS WORTH REACHING FOR',
    products: [
      product('c1', URLS[0], 'Personalized Recipe Book', 'Artifact Uprising', 45),
      product('c2', URLS[1], 'Gourmet Spice Collection', 'Diaspora Co', 65),
      product('c3', URLS[2], 'Cast-Iron Skillet', 'Field Company', 125),
      product('c4', URLS[3], 'Wooden Cutting Board', 'Boos', 89),
      product('c5', URLS[4], 'Olive Oil Sampler', 'Brightland', 78),
      product('c6', URLS[5], 'Salt Pig Set', 'Year & Day', 42),
    ],
  },
  {
    id: 'travel',
    title: 'CARRY-ON–WORTHY TRAVEL PICKS',
    products: [
      product('t1', URLS[6], 'Leather Passport Wallet', 'Cuyana', 95),
      product('t2', URLS[7], 'Packing Cubes Set', 'Béis', 68),
      product('t3', URLS[0], 'Cashmere Travel Wrap', 'Naadam', 175),
      product('t4', URLS[1], 'Refillable Toiletries Kit', 'Cadence', 75),
      product('t5', URLS[2], 'Travel Journal', 'Shinola', 78),
      product('t6', URLS[3], 'Compact Speaker', 'JBL', 79),
    ],
  },
  {
    id: 'sister-favorites',
    title: 'GIFTS THAT SISTERS LOVE',
    products: [
      product('s1', URLS[4], 'Gold Pendant Necklace', 'Mejuri', 139),
      product('s2', URLS[5], 'Cashmere Throw Blanket', 'Brooklinen', 199),
      product('s3', URLS[6], 'Skincare Essentials Set', 'Glossier', 68),
      product('s4', URLS[7], 'Indoor Herb Garden Kit', 'Click & Grow', 99),
      product('s5', URLS[0], 'Premium Tea Collection', 'T2', 58),
      product('s6', URLS[1], 'Artisan Chocolate Box', 'Compartés', 48),
    ],
  },
];

export const SAMPLE_SAVED_ITEMS: ResultsProductCardItem[] = [
  product('sv1', URLS[2], 'Personalized Recipe Book', 'Artifact Uprising', 45),
  product('sv2', URLS[3], 'Gold Pendant Necklace', 'Mejuri', 139),
  product('sv3', URLS[4], 'Cashmere Throw Blanket', 'Brooklinen', 199),
];

export const SAMPLE_PURCHASED_ITEMS: ResultsProductCardItem[] = [
  product('p1', URLS[5], 'Leather Passport Wallet', 'Cuyana', 95),
  product('p2', URLS[6], 'Premium Tea Collection', 'T2', 58),
];
