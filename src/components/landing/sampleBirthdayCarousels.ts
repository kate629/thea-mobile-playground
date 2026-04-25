import { CarouselProduct } from './CarouselSection';

/**
 * Sample data for visual stories. Subset of
 * 3-12-sovrn-launch-version/src/components/BirthdayCarousels.tsx — preserved
 * verbatim so Storybook renders the same imagery as preview.givethea.com/occasion/birthday.
 *
 * Image URLs point at the production Firebase Storage bucket; they're public
 * CDN URLs and safe to reference from another origin.
 */

export interface CarouselSectionData {
  title: string;
  shortTitle?: string;
  slug: string;
  products: CarouselProduct[];
}

const fb = (id: string) =>
  `https://firebasestorage.googleapis.com/v0/b/thea-643b1.firebasestorage.app/o/products%2F${id}/?alt=media`;

export const SAMPLE_BIRTHDAY_SECTIONS: CarouselSectionData[] = [
  {
    title: 'For the one with a sweet tooth',
    shortTitle: 'For a sweet tooth',
    slug: 'sweet-tooth',
    products: [
      {
        id: 'magnolia-confetti',
        title: 'Magnolia Bakery confetti cake',
        brand: 'Goldbelly',
        price: 62,
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/thea-643b1.firebasestorage.app/o/products%2FpQMcAiTdF639PKJRmbzY%2F68f2b130c0ea23ac_orig.webp?alt=media&token=39ae7f24-c4f6-4736-a338-d3fe77fc0c08',
      },
      {
        id: 'happy-birthday-chocolate-box',
        title: 'Personalized Happy Birthday chocolate box',
        brand: 'Uncommon Goods',
        price: 56,
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/thea-643b1.firebasestorage.app/o/products%2FU2fnqRKyBkIHSBNBnGGm%2Fb7b1557be51afa71_orig.webp?alt=media&token=93aa5972-b6e5-428a-8cb9-be6f938d0a22',
      },
      {
        id: 'birthday-cookie-bundle',
        title: 'Birthday cookie bundle',
        brand: 'Levain Bakery',
        price: 75,
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/thea-643b1.firebasestorage.app/o/products%2FyRoYhfjBhCxEnD69u1Ug%2Faab216d7f6edb0fb_orig.webp?alt=media&token=4b6c1239-47d3-40bc-8715-2a1453a254a3',
      },
      {
        id: 'walnut-protein-brownies',
        title: 'Walnut protein brownies',
        brand: "Sweet Addison's",
        price: 36,
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/thea-643b1.firebasestorage.app/o/products%2FvqeYukrsFh2tdfuL8okN%2Fb7530aba38d131c7_orig.webp?alt=media&token=6237a1de-f4d2-4134-84e7-08631c8dba9e',
      },
      {
        id: 'princess-cake',
        title: 'Signature princess cake',
        brand: 'Goldbelly',
        price: 110,
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/thea-643b1.firebasestorage.app/o/products%2FuSYGqWLCmTbMFhsXOLfP%2F49d5e13608f43034_orig.webp?alt=media&token=d6a203e9-0d38-438c-b690-e618599b0f0b',
      },
      {
        id: 'rainbow-explosion',
        title: 'Rainbow explosion cake kit',
        brand: 'Williams Sonoma',
        price: 60,
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/thea-643b1.firebasestorage.app/o/products%2FEjRTNntna8eHIBCZhcSD%2Fb8b15f29e5951f7a_orig.webp?alt=media&token=eea96c16-4775-4997-8582-ee0783058dec',
      },
      {
        id: 'pink-champagne-cake',
        title: 'Pink champagne cake',
        brand: 'Goldbelly',
        price: 70,
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/thea-643b1.firebasestorage.app/o/products%2FMXMgfwGR4jUEEqwBCSFZ%2Ff6e9c2ccdcf14675_orig.webp?alt=media&token=ebbd57cf-db26-451f-9dd1-27a3770d45fc',
      },
      {
        id: 'bday-truffles',
        title: "B'Day cake truffles",
        brand: 'Milk Bar',
        price: 40,
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/thea-643b1.firebasestorage.app/o/products%2Fh2otRghHrLPQ7jBNz6LB%2Fc12d3e1eefc34f92_orig.webp?alt=media&token=ebdf0f5a-7410-40b9-81e8-787b82ee7cde',
      },
    ],
  },
  {
    title: 'Just add guests',
    shortTitle: 'Just add guests',
    slug: 'just-add-guests',
    products: [
      {
        id: 'wine-and-champagne',
        title: 'Personalized Birthday wine and champagne',
        brand: 'Williams Sonoma',
        price: 60,
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/thea-643b1.firebasestorage.app/o/products%2F599ShBIuJAeL6sIHYHco%2Fe5733fdfade1e525_orig.webp?alt=media&token=cd48a3e5-64f0-4c6b-aeda-b73cb264509a',
      },
      {
        id: 'birthday-in-a-bag',
        title: 'Birthday in a Bag',
        brand: 'Knot & Bow',
        price: 28,
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/thea-643b1.firebasestorage.app/o/products%2F1onFYMeXeEusnnKjXgYP%2Fd8792f9b85d6620e_orig.webp?alt=media&token=871d7265-5f6a-4b59-93d0-491bbb30653d',
      },
      {
        id: 'pinatagram',
        title: 'Confetti birthday pinatagram',
        brand: 'Pinatagrams',
        price: 35,
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/thea-643b1.firebasestorage.app/o/products%2FNzD9LEHbqOn2UlPhzCjZ%2Faff1bc97f620fbc5_orig.webp?alt=media&token=a1cc05bd-cd5f-4e36-9c8f-61041991f967',
      },
      {
        id: 'cocktail-kit',
        title: 'Birthday cocktail kit',
        brand: 'Etsy',
        price: 13,
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/thea-643b1.firebasestorage.app/o/products%2F5MvaXBp3uyAWZSO1oEy8%2F8cf79213a60c06c3_orig.webp?alt=media&token=c0ca115a-bcb8-4631-ade3-a8f54e6b3633',
      },
      {
        id: 'serving-stand',
        title: 'Scalloped glass serving stand',
        brand: 'Anthropologie',
        price: 58,
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/thea-643b1.firebasestorage.app/o/products%2FUuYcyjkPG3ueabX4fVus%2F79aa20e9b2250384_orig.webp?alt=media&token=5eb46467-77dd-406f-99ef-f77b152bdd81',
      },
      {
        id: 'martini-candle',
        title: 'Dirty martini glass candle',
        brand: 'Anthropologie',
        price: 35,
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/thea-643b1.firebasestorage.app/o/products%2FOKj8IaTJMahpbVpS4hYC%2F52a524aa60bd2a1f_orig.webp?alt=media&token=86ae6e7b-c20c-4b05-b07a-231707eb4139',
      },
      {
        id: 'compliment-napkins',
        title: 'Compliment Quotes Napkin Pack',
        brand: 'Minted',
        price: 13,
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/thea-643b1.firebasestorage.app/o/products%2FOLVDWp5a2vIIaKDLkkas%2Fe2051fe83242e429_orig.webp?alt=media&token=e08a57c8-e4e3-4971-959c-91e5407a6731',
      },
      {
        id: 'bday-candle',
        title: 'Happy Birthday candle',
        brand: 'Etsy',
        price: 30,
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/thea-643b1.firebasestorage.app/o/products%2FRWtKKlxEv79pnyGRKfkZ%2F08cdb8da18bb7719_orig.webp?alt=media&token=48473928-8614-4593-b1d6-78a034237ceb',
      },
    ],
  },
  {
    title: 'For the year ahead',
    shortTitle: 'For the year ahead',
    slug: 'year-ahead',
    products: [
      {
        id: 'bucket-list',
        title: 'The bucket list hardcover book',
        brand: 'Amazon',
        price: 19,
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/thea-643b1.firebasestorage.app/o/products%2FNuSImyBTkyNVICNsiuft%2F7c6ea43eb84524f9_orig.webp?alt=media&token=1a8507d9-8dc6-4c9f-88f7-743b598e6d97',
      },
      {
        id: 'screenfree-camera',
        title: 'Screen-free digital camera',
        brand: 'Camp Snap',
        price: 70,
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/thea-643b1.firebasestorage.app/o/products%2FDStXsZ6YMW8YRG36TgHn%2F456a4490a71aa9cb_orig.webp?alt=media&token=00f802a9-40fe-4721-a474-353d3862d145',
      },
      {
        id: 'adventure-scrapbook',
        title: 'The Adventure Challenge Scrapbook',
        brand: 'Uncommon Goods',
        price: 40,
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/thea-643b1.firebasestorage.app/o/products%2Fj5Y0AAAZAqvP0Dk1gAne%2F1bca5fc1480379e2_orig.webp?alt=media&token=ddfc5954-9b9b-4e4d-b9d6-718e5d1e3f02',
      },
      {
        id: 'year-of-connection',
        title: 'A Year of Connection',
        brand: 'Uncommon Goods',
        price: 30,
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/thea-643b1.firebasestorage.app/o/products%2FghmefDSZfo39JGUxTmgU%2F1bdd0a21503ac87a_orig.webp?alt=media&token=28eff89c-ba65-4cdc-8858-01f965e5e55a',
      },
      {
        id: 'vision-board',
        title: 'Make a vision board',
        brand: 'Freshie & Zero',
        price: 20,
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/thea-643b1.firebasestorage.app/o/products%2FV584nTyOYm8uwnMoM58V%2F53b696642f358197_orig.webp?alt=media&token=f1a52622-fdf9-4817-a1cc-3718b5b56d83',
      },
      {
        id: 'photo-printer',
        title: 'Canon Ivy 2 Mini Photo Printer',
        brand: 'Amazon',
        price: 110,
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/thea-643b1.firebasestorage.app/o/products%2FsTY1KqUMQLrZPO0UAB3E%2F8c280abbda71d0f7_orig.webp?alt=media&token=7220c894-ab25-4889-9e00-a5e1e5fff5af',
      },
      {
        id: 'time-to-shine',
        title: 'Time to Shine Gift Set',
        brand: 'Papier',
        price: 55,
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/thea-643b1.firebasestorage.app/o/products%2F6XMhvFBEZ83AYLSTzwkm%2Fde25aaf120133ad4_orig.webp?alt=media&token=f35ff70b-bce9-4013-8412-fd67d8f2ed2d',
      },
      {
        id: 'habit-journal',
        title: 'Habit Journal',
        brand: 'Evergreen Journals',
        price: 28,
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/thea-643b1.firebasestorage.app/o/products%2FqeEN02AT73tPn05JLTxT%2F9c2802d490d1502a_orig.webp?alt=media&token=fb098591-454a-4da8-a155-2bc59080ffc0',
      },
    ],
  },
];

// Silence the unused helper (kept for symmetry with sovrn's file).
void fb;
