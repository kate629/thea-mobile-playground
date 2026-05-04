import { CarouselProduct } from './CarouselSection';

/**
 * Sample data for /occasion/teacher_appreciation. Unlike other occasion
 * guides this page is a single vertical grid (no horizontal carousels), so
 * the export is a flat product list rather than `CarouselSectionData[]`.
 *
 * Affiliate URLs are pre-wrapped with the Sovrn redirect (key
 * 9517d72dee2e8e6a77f8f01ced0f35f0) — same key used in the other
 * `sample*Carousels.ts` files. CDN WebP variants are added by the nightly
 * `backfill_image_cdn.py` job; entries here use retailer URLs only until
 * that runs.
 */
export const SAMPLE_TEACHER_APPRECIATION_PRODUCTS: CarouselProduct[] = [
  {
    id: 'andy-warhol-soup-can-crayons',
    title: 'Andy Warhol Soup Can Crayons + Sharpener',
    brand: 'Ban.do',
    price: 19.99,
    productUrl: 'https://redirect.viglink.com?key=9517d72dee2e8e6a77f8f01ced0f35f0&u=https%3A%2F%2Fwww.bando.com%2Fcollections%2Fwriting-supplies%2Fproducts%2Fandy-warhol-soup-can-crayons-sharpener',
    imageUrl: 'https://www.bando.com/cdn/shop/files/bando-3p-chronicle-andy-warhol-soup-can-crayons-sharpener-02.jpg?v=1769098451',
  },
  {
    id: 'a-poem-to-read-aloud-every-day',
    title: 'A Poem to Read Aloud Every Day of the Year',
    brand: 'Amazon',
    price: 24.59,
    productUrl: 'https://redirect.viglink.com?key=9517d72dee2e8e6a77f8f01ced0f35f0&u=https%3A%2F%2Fwww.amazon.com%2Fdp%2F1849948461',
    imageUrl: 'https://m.media-amazon.com/images/I/61p8ntkT6EL._SL1417_.jpg',
  },
  {
    id: 'personalized-teacher-pennant',
    title: 'Personalized teacher pennant',
    brand: 'Etsy',
    price: 22,
    productUrl: 'https://redirect.viglink.com?key=9517d72dee2e8e6a77f8f01ced0f35f0&u=https%3A%2F%2Fwww.etsy.com%2Flisting%2F1618952837%2Fpersonalized-teacher-pennant-teacher',
    imageUrl: 'https://i.etsystatic.com/32887498/r/il/75caa0/6864715039/il_1588xN.6864715039_dlwj.jpg',
  },
  {
    id: 'pollinator-seed-pops',
    title: 'Pollinator seed pops',
    brand: 'Modern Sprout',
    price: 6.99,
    productUrl: 'https://redirect.viglink.com?key=9517d72dee2e8e6a77f8f01ced0f35f0&u=https%3A%2F%2Fmodernsprout.com%2Fproducts%2Fseed-pops-pollinator',
    imageUrl: 'https://modernsprout.com/cdn/shop/files/POPS_2023_POLL-GR-BKG_1300x.jpg?v=1760721491',
  },
  {
    id: 'personalized-teacher-gift-bag',
    title: 'Personalized teacher gift bag',
    brand: 'Etsy',
    price: 3.5,
    productUrl: 'https://redirect.viglink.com?key=9517d72dee2e8e6a77f8f01ced0f35f0&u=https%3A%2F%2Fwww.etsy.com%2Flisting%2F1627718189%2Fpersonalized-teacher-gift-kids-gift-bag',
    imageUrl: 'https://i.etsystatic.com/37254899/r/il/7c6d22/5618883033/il_1588xN.5618883033_6x4f.jpg',
  },
  {
    id: 'great-gatsby-painted-edition',
    title: 'The Great Gatsby: painted edition classic book',
    brand: 'Heirloom Art Co',
    price: 34.99,
    productUrl: 'https://redirect.viglink.com?key=9517d72dee2e8e6a77f8f01ced0f35f0&u=https%3A%2F%2Fwww.heirloomartco.com%2Fproducts%2Fthe-great-gatsby-2%3Fvariant%3D43550107664558',
    imageUrl: 'https://www.heirloomartco.com/cdn/shop/products/IMG_7975_1296x.jpg?v=1761599331',
  },
  {
    id: 'little-treat-big-thanks-cookies',
    title: 'Little Treat Big Thanks Shortbread Cookies',
    brand: 'Anthropologie',
    price: 44.5,
    productUrl: 'https://redirect.viglink.com?key=9517d72dee2e8e6a77f8f01ced0f35f0&u=https%3A%2F%2Fwww.anthropologie.com%2Fshop%2Fhybrid%2Fdelight-patisserie-little-treat-big-thanks-shortbread-cookies',
    imageUrl: 'https://images.urbndata.com/is/image/Anthropologie/86312931_012_m?$a15-pdp-detail-shot$&fit=constrain&fmt=webp&qlt=80&wid=1314',
  },
  {
    id: 'writing-dice',
    title: 'Writing Dice: storytelling inspiration',
    brand: 'Etsy',
    price: 19.95,
    productUrl: 'https://redirect.viglink.com?key=9517d72dee2e8e6a77f8f01ced0f35f0&u=https%3A%2F%2Fwww.etsy.com%2Flisting%2F1528263259%2Fwriting-dice-storytelling-inspiration',
    imageUrl: 'https://i.etsystatic.com/9116811/r/il/5afcc3/7290573978/il_1588xN.7290573978_ldt8.jpg',
  },
  {
    id: 'mini-flower-press',
    title: 'Mini flower press',
    brand: 'The Floral Society',
    price: 25,
    productUrl: 'https://redirect.viglink.com?key=9517d72dee2e8e6a77f8f01ced0f35f0&u=https%3A%2F%2Fwww.thefloralsociety.com%2Fproducts%2Fmini-flower-press-forget-me-not',
    imageUrl: 'https://www.thefloralsociety.com/cdn/shop/files/YellowButtercupFlowerPressMini2_88997fb7-632e-44b8-b64e-9722153a731a_2048x.webp?v=1756169957',
  },
  {
    id: 'mini-paint-by-numbers-lush-garden',
    title: 'Mini Paint-By-Numbers: Lush Garden',
    brand: 'Ban.do',
    price: 32,
    productUrl: 'https://redirect.viglink.com?key=9517d72dee2e8e6a77f8f01ced0f35f0&u=https%3A%2F%2Fwww.bando.com%2Fcollections%2Fgames-activities%2Fproducts%2Fmini-unframed-paint-by-numbers-lush-garden',
    imageUrl: 'https://www.bando.com/cdn/shop/files/bando-3p-paint-anywhere-mini-unframed-paint-by-numbers-lush-garden-01.jpg?v=1765567850',
  },
  {
    id: 'personalized-teacher-gift-candle',
    title: 'Personalized teacher gift candle',
    brand: 'Etsy',
    price: 31.47,
    productUrl: 'https://redirect.viglink.com?key=9517d72dee2e8e6a77f8f01ced0f35f0&u=https%3A%2F%2Fwww.etsy.com%2Flisting%2F1015529077%2Fpersonalised-teacher-gift-candle-pink',
    imageUrl: 'https://i.etsystatic.com/21554180/r/il/e66294/3116098503/il_1588xN.3116098503_l9v1.jpg',
  },
  {
    id: 'im-busy-reading-kit',
    title: "I'm Busy Reading kit",
    brand: 'Ban.do',
    price: 18.95,
    productUrl: 'https://redirect.viglink.com?key=9517d72dee2e8e6a77f8f01ced0f35f0&u=https%3A%2F%2Fwww.bando.com%2Fproducts%2Freading-kit-im-busy-reading',
    imageUrl: 'https://www.bando.com/cdn/shop/files/252138-WEB-reading-kit-im-busy-reading-02.jpg?v=1742485024',
  },
  {
    id: 'must-read-books-bucket-list-puzzle',
    title: '50 Must-Read Books Bucket List 1000-Piece Puzzle',
    brand: 'Amazon',
    price: 24.1,
    productUrl: 'https://redirect.viglink.com?key=9517d72dee2e8e6a77f8f01ced0f35f0&u=https%3A%2F%2Fwww.amazon.com%2FRidleys-Must-Read-Bucket-1000-Piece-Puzzle%2Fdp%2FB09FQ8CLZC%2F',
    imageUrl: 'https://m.media-amazon.com/images/I/91xcC03-5UL._AC_SL1500_.jpg',
  },
  {
    id: 'custom-teacher-tote-handwritten',
    title: 'Custom teacher tote with handwritten student names',
    brand: 'Etsy',
    price: 38,
    productUrl: 'https://redirect.viglink.com?key=9517d72dee2e8e6a77f8f01ced0f35f0&u=https%3A%2F%2Fwww.etsy.com%2Flisting%2F4298584746%2Fnavy-deluxe-large-kids-custom-drawn-tote',
    imageUrl: 'https://i.etsystatic.com/14356305/r/il/2d0206/7840298546/il_1588xN.7840298546_eao6.jpg',
  },
  {
    id: 'corduroy-custom-teacher-tote',
    title: 'Corduroy custom teacher tote',
    brand: 'Etsy',
    price: 9.92,
    productUrl: 'https://redirect.viglink.com?key=9517d72dee2e8e6a77f8f01ced0f35f0&u=https%3A%2F%2Fwww.etsy.com%2Flisting%2F4393862616%2Fteacher-tote-zipper-custom-corduroy-bag',
    imageUrl: 'https://i.etsystatic.com/18676214/r/il/69476b/7328088830/il_1588xN.7328088830_qphl.jpg',
  },
  {
    id: 'scandi-taper-candles',
    title: 'Scandi taper candles: set of 2',
    brand: 'Anthropologie',
    price: 24,
    productUrl: 'https://redirect.viglink.com?key=9517d72dee2e8e6a77f8f01ced0f35f0&u=https%3A%2F%2Fwww.anthropologie.com%2Fshop%2Fscandi-tapers-set-of-2%3Fcolor%3D040',
    imageUrl: 'https://images.urbndata.com/is/image/Anthropologie/105612964_040_b10?$a15-pdp-detail-shot$&fit=constrain&fmt=webp&qlt=80&wid=1314',
  },
  {
    id: 'bow-book-stamp',
    title: 'Bow book stamp',
    brand: 'Etsy',
    price: 11.98,
    productUrl: 'https://redirect.viglink.com?key=9517d72dee2e8e6a77f8f01ced0f35f0&u=https%3A%2F%2Fwww.etsy.com%2Flisting%2F1874251764%2Fbow-book-stamp-ex-libris-stamp-coquette',
    imageUrl: 'https://i.etsystatic.com/29239325/r/il/39d1a3/6716702234/il_1588xN.6716702234_13oa.jpg',
  },
  {
    id: 'classroom-notes-stationery',
    title: 'Personalized stationery: classroom notes',
    brand: 'Minted',
    price: 60,
    productUrl: 'https://redirect.viglink.com?key=9517d72dee2e8e6a77f8f01ced0f35f0&u=https%3A%2F%2Fwww.minted.com%2Fproduct%2Fpersonalized-stationery-thank-you-cards%2FMIN-9L1-PST%2Fclassroom-notes%3Fcolor%3DD',
    imageUrl: 'https://assets.minted.com/image/fetch/c_scale,f_auto,q_auto,w_540,dpr_2.0/https://cdn3.minted.com/files/mintedProductsImages/MIN/PST/9L1/MIN-9L1-PST-001_D_PZ.jpg?mntd_prf=Pdp:HeroImage',
  },
  {
    id: 'bite-sized-mini-sticky-tabs',
    title: 'Bite-sized mini sticky tabs',
    brand: 'Ban.do',
    price: 18,
    productUrl: 'https://redirect.viglink.com?key=9517d72dee2e8e6a77f8f01ced0f35f0&u=https%3A%2F%2Fwww.bando.com%2Fcollections%2Fdesk-accessories%2Fproducts%2Fbite-sized-mini-sticky-tabs',
    imageUrl: 'https://www.bando.com/cdn/shop/files/bando-3p-mel-andrel-bite-sized-mini-sticky-tabs-01.jpg?v=1759334001',
  },
  {
    id: 'retro-pen-set',
    title: 'Retro pen set',
    brand: 'Ban.do',
    price: 15.95,
    productUrl: 'https://redirect.viglink.com?key=9517d72dee2e8e6a77f8f01ced0f35f0&u=https%3A%2F%2Fwww.bando.com%2Fcollections%2Fwriting-supplies%2Fproducts%2Fretro-pen-set',
    imageUrl: 'https://www.bando.com/cdn/shop/files/252139-WEB-retro-pen-set-01.jpg?v=1741363143',
  },
  {
    id: 'school-teacher-bracelet',
    title: 'School teacher bracelet',
    brand: 'Etsy',
    price: 10,
    productUrl: 'https://redirect.viglink.com?key=9517d72dee2e8e6a77f8f01ced0f35f0&u=https%3A%2F%2Fwww.etsy.com%2Flisting%2F1768557321%2Fschool-teacher-bracelet-teacher-gift',
    imageUrl: 'https://i.etsystatic.com/16937663/r/il/824844/6200555867/il_1588xN.6200555867_9u44.jpg',
  },
];
