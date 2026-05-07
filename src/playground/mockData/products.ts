import type { RecommendationProduct } from '../../theaWeb/schemas';

const img = (id: string, w = 800) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop`;

type ChipKey = 'decor' | 'cooking' | 'beauty' | 'books';

function p(
  id: string,
  title: string,
  brand: string,
  price: number,
  imgId: string,
  chip: ChipKey,
  description?: string,
): RecommendationProduct {
  return {
    id,
    title,
    price,
    brand,
    images: [img(imgId)],
    images_cdn: [img(imgId)],
    images_cdn_mobile: [img(imgId, 480)],
    description: description ?? '',
    url: `https://example.com/${id}`,
    affiliateUrl: `https://example.com/${id}?aff=playground`,
    interests: [chip],
  };
}

// ─── Decor (~20) ─────────────────────────────────────────────────────
const DECOR: RecommendationProduct[] = [
  p('d1', 'Hand-thrown ceramic coffee mug, speckled cream', 'East Fork', 38, '1577937927133-66ef06acdf18', 'decor'),
  p('d2', 'Linen-blend throw blanket, sage', 'Parachute', 89, '1522771739844-6a9f6d5f14af', 'decor'),
  p('d3', 'Beeswax candle pair, unscented', 'Big Dipper Wax Works', 24, '1602874801007-bd35bd9a93e6', 'decor'),
  p('d4', 'Hand-woven Turkish hand towels (set of 2)', 'Olive & Linen', 36, '1556228453-efd6c1ff04f6', 'decor'),
  p('d5', 'Stoneware fruit bowl, oat', 'Year & Day', 64, '1493663284031-b7e3aefcae8e', 'decor'),
  p('d6', 'Oversized linen pillow cover, oatmeal', 'Hawkins New York', 78, '1505691938895-1758d7feb511', 'decor'),
  p('d7', 'Hand-blown glass vase, smoked', 'Henry Dean', 110, '1485955900006-10f4d324d411', 'decor'),
  p('d8', 'Wool area rug, runner 2x6', 'Lulu and Georgia', 195, '1505691938895-1758d7feb511', 'decor'),
  p('d9', 'Botanical print, framed 11x14', 'Society6', 58, '1513519245088-0e12902e5a38', 'decor'),
  p('d10', 'Walnut catchall tray', 'Earlywood', 42, '1556228453-efd6c1ff04f6', 'decor'),
  p('d11', 'Linen tablecloth, sand', 'Lost & Found', 88, '1543351611-58f69d7c1781', 'decor'),
  p('d12', 'Soy candle, amber + neroli', 'P.F. Candle Co.', 32, '1602874801007-bd35bd9a93e6', 'decor'),
  p('d13', 'Cotton waffle bath mat', 'Coyuchi', 48, '1556228453-efd6c1ff04f6', 'decor'),
  p('d14', 'Brass picture frame, 5x7', 'CB2', 28, '1513519245088-0e12902e5a38', 'decor'),
  p('d15', 'Ribbed glass tumbler set (4)', 'Williams Sonoma', 44, '1495474472287-4d71bcdd2085', 'decor'),
  p('d16', 'Ceramic planter, terracotta', 'Bloomscape', 35, '1485955900006-10f4d324d411', 'decor'),
  p('d17', 'Mohair throw, dove', 'The Citizenry', 245, '1522771739844-6a9f6d5f14af', 'decor'),
  p('d18', 'Marble cheese board with knife', 'Schoolhouse', 68, '1607344645866-009c320c5ab8', 'decor'),
  p('d19', 'Linen napkin set (4), olive', 'Rough Linen', 52, '1543351611-58f69d7c1781', 'decor'),
  p('d20', 'Ceramic vase trio, ivory', 'Jenni Kayne', 95, '1485955900006-10f4d324d411', 'decor'),
];

// ─── Cooking (~20) ───────────────────────────────────────────────────
const COOKING: RecommendationProduct[] = [
  p('c1', 'Espresso glass set, weighted bottoms (set of 4)', 'Notneutral', 52, '1495474472287-4d71bcdd2085', 'cooking'),
  p('c2', 'Cast iron skillet, pre-seasoned 10"', 'Lodge', 35, '1574071318508-1cdbab80d002', 'cooking'),
  p('c3', 'Walnut serving board with handle', 'Earlywood', 78, '1607344645866-009c320c5ab8', 'cooking'),
  p('c4', 'Olive wood spoon set (3)', 'Berard', 32, '1556909114-f6e7ad7d3136', 'cooking'),
  p('c5', 'Hand-pounded pepper grinder', 'Crate & Barrel', 48, '1495474472287-4d71bcdd2085', 'cooking'),
  p('c6', 'Pour-over coffee dripper', 'Hario V60', 28, '1495474472287-4d71bcdd2085', 'cooking'),
  p('c7', 'Enameled Dutch oven, 5.5qt', 'Le Creuset', 380, '1574071318508-1cdbab80d002', 'cooking'),
  p('c8', 'Ceramic soup bowl set (4)', 'Heath Ceramics', 220, '1493663284031-b7e3aefcae8e', 'cooking'),
  p('c9', 'Bench scraper, stainless', 'Made In', 22, '1556909114-f6e7ad7d3136', 'cooking'),
  p('c10', 'Microplane zester, classic', 'Microplane', 18, '1556909114-f6e7ad7d3136', 'cooking'),
  p('c11', 'Apron, cross-back canvas', 'Hedley & Bennett', 95, '1556909114-f6e7ad7d3136', 'cooking'),
  p('c12', 'Cookbook: Salt Fat Acid Heat', 'Simon & Schuster', 35, '1544947950-fa07a98d237f', 'cooking'),
  p('c13', 'Mortar and pestle, granite', 'Sur La Table', 58, '1556909114-f6e7ad7d3136', 'cooking'),
  p('c14', 'Stoneware mixing bowl set', 'Mason Cash', 88, '1493663284031-b7e3aefcae8e', 'cooking'),
  p('c15', 'Linen tea towel set (4), striped', 'Heirloomed', 34, '1543351611-58f69d7c1781', 'cooking'),
  p('c16', 'Stovetop espresso maker, 6-cup', 'Bialetti', 42, '1495474472287-4d71bcdd2085', 'cooking'),
  p('c17', 'Carbon steel chef knife, 8"', 'Misen', 75, '1556909114-f6e7ad7d3136', 'cooking'),
  p('c18', 'Bamboo cooking utensils (5pc)', 'Bambu', 42, '1556909114-f6e7ad7d3136', 'cooking'),
  p('c19', 'Cast iron griddle, 12" round', 'Lodge', 49, '1574071318508-1cdbab80d002', 'cooking'),
  p('c20', 'Sea salt sampler, 4 jars', 'Maldon', 38, '1556909114-f6e7ad7d3136', 'cooking'),
];

// ─── Beauty (~20) ────────────────────────────────────────────────────
const BEAUTY: RecommendationProduct[] = [
  p('b1', 'Sterling silver small hoop earrings', 'Mejuri', 62, '1535632787350-4e68ef0ac584', 'beauty'),
  p('b2', 'Embroidered linen tote bag', 'Lake', 45, '1591561954557-26941169b49e', 'beauty'),
  p('b3', 'Tatcha Indigo Body Butter', 'Tatcha', 58, '1556228720-195a672e8a03', 'beauty'),
  p('b4', 'Vintage Y2K satin scrunchies (3)', 'Set Active', 18, '1591561954557-26941169b49e', 'beauty'),
  p('b5', 'Aesop hand cream, geranium', 'Aesop', 39, '1556228720-195a672e8a03', 'beauty'),
  p('b6', 'Silk pillowcase, ivory', 'Slip', 89, '1505691938895-1758d7feb511', 'beauty'),
  p('b7', 'Le Labo Santal 33 candle', 'Le Labo', 84, '1602874801007-bd35bd9a93e6', 'beauty'),
  p('b8', 'Diptyque Roses candle, 6.5oz', 'Diptyque', 78, '1602874801007-bd35bd9a93e6', 'beauty'),
  p('b9', 'Maude shave gel + razor set', 'Maude', 36, '1556228720-195a672e8a03', 'beauty'),
  p('b10', 'Glossier Boy Brow', 'Glossier', 18, '1556228720-195a672e8a03', 'beauty'),
  p('b11', 'Linen robe, sand', 'Lunya', 168, '1591561954557-26941169b49e', 'beauty'),
  p('b12', 'Wool felt slippers, charcoal', 'Glerups', 95, '1591561954557-26941169b49e', 'beauty'),
  p('b13', 'Cashmere ear warmer headband', 'Naadam', 52, '1591561954557-26941169b49e', 'beauty'),
  p('b14', 'Necklace, 14k gold pendant', 'Catbird', 145, '1535632787350-4e68ef0ac584', 'beauty'),
  p('b15', 'Tortoise shell hair claw', 'Kitsch', 14, '1591561954557-26941169b49e', 'beauty'),
  p('b16', 'Lip balm trio, beeswax', 'Burt\'s Bees', 12, '1556228720-195a672e8a03', 'beauty'),
  p('b17', 'Aromatherapy roll-on, calm', 'Saje', 22, '1602874801007-bd35bd9a93e6', 'beauty'),
  p('b18', 'Hand-woven straw sun hat', 'Lack of Color', 89, '1591561954557-26941169b49e', 'beauty'),
  p('b19', 'Silk hair scarf, rose print', 'Hermes Vintage', 220, '1591561954557-26941169b49e', 'beauty'),
  p('b20', 'Bath salt blend, eucalyptus', 'Herbivore', 28, '1602874801007-bd35bd9a93e6', 'beauty'),
];

// ─── Books (~20) ─────────────────────────────────────────────────────
const BOOKS: RecommendationProduct[] = [
  p('k1', 'Hardcover poetry collection — Mary Oliver', 'Penguin', 18, '1544947950-fa07a98d237f', 'books'),
  p('k2', 'Field Notes pocket notebooks (3-pack)', 'Field Notes', 13, '1517842645767-c639042777db', 'books'),
  p('k3', 'The Overstory — Richard Powers', 'W.W. Norton', 22, '1544947950-fa07a98d237f', 'books'),
  p('k4', 'A Gentleman in Moscow', 'Penguin Random House', 18, '1544947950-fa07a98d237f', 'books'),
  p('k5', 'Linen-bound journal, A5', 'Moleskine', 28, '1517842645767-c639042777db', 'books'),
  p('k6', 'Tomato Days reading lamp', 'Pablo Designs', 195, '1513519245088-0e12902e5a38', 'books'),
  p('k7', 'Bookends, brass curve (pair)', 'Schoolhouse', 88, '1513519245088-0e12902e5a38', 'books'),
  p('k8', 'Crossword puzzle book vol. 12', 'NYT Books', 12, '1544947950-fa07a98d237f', 'books'),
  p('k9', 'Devotions: Mary Oliver poems', 'Penguin Press', 24, '1544947950-fa07a98d237f', 'books'),
  p('k10', 'Linen book sleeve, oat', 'Cuyana', 48, '1591561954557-26941169b49e', 'books'),
  p('k11', 'Reading pillow, velvet', 'West Elm', 78, '1505691938895-1758d7feb511', 'books'),
  p('k12', 'Bookmark set, brass leaf (4)', 'Studio Carta', 22, '1517842645767-c639042777db', 'books'),
  p('k13', 'The New Yorker subscription, year', 'The New Yorker', 169, '1544947950-fa07a98d237f', 'books'),
  p('k14', 'Modern Library deluxe edition', 'Modern Library', 28, '1544947950-fa07a98d237f', 'books'),
  p('k15', 'Watercolor sketchbook + pencils', 'Strathmore', 32, '1517842645767-c639042777db', 'books'),
  p('k16', 'Letter paper set, 25 sheets', 'Crane', 38, '1517842645767-c639042777db', 'books'),
  p('k17', 'Hardcover dictionary, Oxford', 'Oxford University Press', 65, '1544947950-fa07a98d237f', 'books'),
  p('k18', 'Library subscription, 1 year', 'Bookshop.org', 99, '1544947950-fa07a98d237f', 'books'),
  p('k19', 'Reading glasses, tortoise', 'Warby Parker', 95, '1591561954557-26941169b49e', 'books'),
  p('k20', 'Linen library card, embroidered', 'Etsy maker', 18, '1517842645767-c639042777db', 'books'),
];

export const MOCK_PRODUCTS: RecommendationProduct[] = [
  ...DECOR,
  ...COOKING,
  ...BEAUTY,
  ...BOOKS,
];

export function findProduct(id: string): RecommendationProduct | undefined {
  return MOCK_PRODUCTS.find((p) => p.id === id);
}

// The chip-tab labels in the order they appear. Keys match the canonical
// SearchPill interest pills (decor / cooking / beauty / books) so the same
// values drive both the chip-tab feed grouping AND the LIKES segment of
// the search pill.
export const CHIP_TAB_KEYS = ['decor', 'cooking', 'beauty', 'books'] as const;
export type ChipTabKey = (typeof CHIP_TAB_KEYS)[number];

export const CHIP_TAB_LABELS: Record<ChipTabKey, string> = {
  decor: 'Decor',
  cooking: 'Cooking',
  beauty: 'Beauty',
  books: 'Books',
};

export function productsByChip(chip: ChipTabKey): RecommendationProduct[] {
  return MOCK_PRODUCTS.filter((p) => p.interests?.includes(chip));
}
