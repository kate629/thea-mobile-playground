/**
 * Scenarios + timing constants verbatim from sovrn:
 * 3-12-sovrn-launch-version/src/components/HeroHeader.tsx:18-80
 *
 * Local hero asset images live in thea-web/public/landing-assets/ — copied
 * from sovrn/src/assets. External CDN URLs (grandma, sister) point to the
 * same hosts the sovrn build uses.
 */
export interface ScenarioCard {
  scenario: string;
  productImage: string;
  productName?: string;
  brand?: string;
  peekImages?: [string, string];
  rotation: number;
}

export const SCENARIO_CARDS: ScenarioCard[] = [
  {
    scenario: 'Bookish friend who loves tea',
    productImage: '/landing-assets/gift-tea.jpg',
    productName: 'Literary Tea Collection Gift Tin',
    brand: 'Plum Deluxe',
    rotation: -3,
    peekImages: [
      'https://assets.wsimgs.com/wsimgs/ab/images/dp/wcm/202535/0022/img113z.jpg',
      'https://www.riverandstonetea.com/cdn/shop/files/original-B259FF4D-7BB5-4B1F-B602-6613AB85A767.png?v=1741372327',
    ],
  },
  {
    scenario: 'Grandma with great taste',
    rotation: 2,
    productImage:
      'https://cdn.shopify.com/s/files/1/1264/7617/files/4-round-disc_engraving-gif.gif?v=1758572579&width=1247&height=1247&crop=center',
    productName: 'Engraved Handwriting Disc Necklace',
    brand: 'Made by Mary',
  },
  {
    scenario: 'Grandson who loves art and trucks',
    rotation: -2,
    productImage: '/landing-assets/gift-trucks.jpg',
    productName: 'Construction Zone Colorable Pajamas',
    brand: 'Caden Lane',
  },
  {
    scenario: 'Boston sports nut husband',
    rotation: 3,
    productImage: '/landing-assets/gift-redsox.jpg',
    productName: 'Baseball History of Boston Red Sox',
    brand: 'Historic Newspapers',
  },
  {
    scenario: "Sister who's obsessed with her golden and cooking",
    rotation: -1.5,
    productImage:
      'https://i.etsystatic.com/10907262/r/il/635bbf/4333947994/il_1588xN.4333947994_dppk.jpg',
    productName: 'Custom Dog Photo Oven Mitt',
    brand: 'Etsy',
  },
  {
    scenario: 'Daughter who just bought her first home',
    rotation: 2.5,
    productImage: '/landing-assets/gift-firstplace.jpg',
    productName: 'Custom Address Stamp',
    brand: 'Etsy',
  },
];

export const TYPE_SPEED_MS = 55;
export const TYPING_HOLD_MS = 300;
export const FULL_TEXT_HOLD_MS = 2400;
export const SWAP_MS = 140;

export const HERO_COLOR = '#B56B58';
