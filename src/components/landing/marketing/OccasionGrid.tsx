import React from 'react';
import styled from 'styled-components';
import { OccasionTile } from '../../ui/OccasionTile';
import { gaOccasionCardClick } from '../../../theaWeb/lib/gaPixel';

export interface OccasionGridTile {
  event: string;
  title: string;
  imageUrl: string;
  cdnUrl?: string;
  cdnMobileUrl?: string;
}

export interface OccasionGridProps {
  heading?: string;
  tiles: OccasionGridTile[];
}

const HeadingWrap = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  padding: 56px 16px 8px;
  @media (min-width: 640px) { padding: 56px 32px 8px; }
  @media (min-width: 1024px) { padding: 56px 64px 8px; }
`;

const Heading = styled.h2`
  font-size: 28px;
  font-weight: 700;
  color: hsl(var(--foreground));
  text-align: center;
  margin: 0;
  line-height: 1.1;
  @media (min-width: 768px) {
    font-size: 52px;
  }
`;

const GridWrap = styled.section`
  max-width: 1400px;
  margin: 0 auto;
  padding: 48px 16px;
  @media (min-width: 640px) { padding: 48px 32px; }
  @media (min-width: 1024px) { padding: 64px 64px; }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  @media (min-width: 640px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 32px;
  }
  @media (min-width: 1024px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
`;

export const OccasionGrid: React.FC<OccasionGridProps> = ({
  heading = 'Browse by occasion',
  tiles,
}) => (
  <>
    <HeadingWrap>
      <Heading>{heading}</Heading>
    </HeadingWrap>
    <GridWrap>
      <Grid>
        {tiles.map((t) => {
          const slug = t.event.toLowerCase();
          return (
            <OccasionTile
              key={t.event}
              href={`/occasion/${slug}`}
              title={t.title}
              imageUrl={t.imageUrl}
              cdnUrl={t.cdnUrl}
              cdnMobileUrl={t.cdnMobileUrl}
              onClick={() => gaOccasionCardClick({ occasion: slug })}
            />
          );
        })}
      </Grid>
    </GridWrap>
  </>
);

/* Hardcoded image URLs from sovrn's GiftGuides.tsx:20-28 (heroOverrides).
   cdnUrl / cdnMobileUrl point at the Firebase Storage WebP variants
   produced by kate629/thea-fast-feed nightly backfill_image_cdn.py. The
   retailer URL stays as the <img> fallback for browsers without WebP and
   so source-of-truth doesn't drift if a CDN token is invalidated. */
export const OCCASION_TILES: OccasionGridTile[] = [
  {
    event: 'MOTHERS_DAY',
    title: "Mother's Day",
    imageUrl: 'https://furbishstudio.com/cdn/shop/files/244A4176_2048x.jpg?v=1762389625',
    cdnUrl: 'https://firebasestorage.googleapis.com/v0/b/thea-643b1.firebasestorage.app/o/products%2Fd5iqmjRUnHj7ghRlwzqX%2F5c5c15ffbcafb784_orig.webp?alt=media&token=2fe38b28-fb04-4f6c-9279-e8df30b19f99',
    cdnMobileUrl: 'https://firebasestorage.googleapis.com/v0/b/thea-643b1.firebasestorage.app/o/products%2Fd5iqmjRUnHj7ghRlwzqX%2F5c5c15ffbcafb784_mobile.webp?alt=media&token=1cc6a357-39ca-47d3-af66-0f66dca143da',
  },
  {
    event: 'FATHERS_DAY',
    title: "Father's Day",
    imageUrl: 'https://sandgrainstudio.com/cdn/shop/files/Old_Fashioned_Cocktail_poster.png?v=1762465279&width=1500',
    cdnUrl: 'https://firebasestorage.googleapis.com/v0/b/thea-643b1.firebasestorage.app/o/products%2FVVy2A8nvnOxqI8OGIoit%2F360177949d7d60bf_orig.webp?alt=media&token=127facf1-9ce1-483d-8896-b7955fd21e8b',
    cdnMobileUrl: 'https://firebasestorage.googleapis.com/v0/b/thea-643b1.firebasestorage.app/o/products%2FVVy2A8nvnOxqI8OGIoit%2F360177949d7d60bf_mobile.webp?alt=media&token=f1e7484a-f465-4836-b86c-e269e8d4140f',
  },
  {
    event: 'BIRTHDAY',
    title: 'Birthday',
    imageUrl: 'https://www.knotandbow.com/cdn/shop/products/BirthdayBag_087_1024x1024.jpg?v=1622925697',
    cdnUrl: 'https://firebasestorage.googleapis.com/v0/b/thea-643b1.firebasestorage.app/o/products%2F1onFYMeXeEusnnKjXgYP%2Fd8792f9b85d6620e_orig.webp?alt=media&token=871d7265-5f6a-4b59-93d0-491bbb30653d',
    cdnMobileUrl: 'https://firebasestorage.googleapis.com/v0/b/thea-643b1.firebasestorage.app/o/products%2F1onFYMeXeEusnnKjXgYP%2Fd8792f9b85d6620e_mobile.webp?alt=media&token=ece4f50f-a45f-424e-aad1-6225b2d7a90f',
  },
  {
    event: 'ANNIVERSARY',
    title: 'Anniversary',
    imageUrl: 'https://goldbelly.imgix.net/uploads/showcase_media_asset/image/157107/Montilio_s-Baking-Company-JFK-Wedding-Cake-1.14.21-104-Edit-72ppi-1x1.jpg?ixlib=react-9.10.0&ar=1%3A1&fit=crop&w=1920&auto=format',
    cdnUrl: 'https://firebasestorage.googleapis.com/v0/b/thea-643b1.firebasestorage.app/o/products%2FB0s7xtqGxGWuUF4t3rKi%2F3fda718d941e1ffb_orig.webp?alt=media&token=559b0b56-4e67-4709-be77-e55e3443707e',
    cdnMobileUrl: 'https://firebasestorage.googleapis.com/v0/b/thea-643b1.firebasestorage.app/o/products%2FB0s7xtqGxGWuUF4t3rKi%2F3fda718d941e1ffb_mobile.webp?alt=media&token=ff20d5d4-cf5e-4f49-a2ba-181681f151f3',
  },
  {
    event: 'HOUSEWARMING',
    title: 'Housewarming',
    imageUrl: 'https://weezietowels.com/cdn/shop/files/blue-and-white-stripe-1.jpg?v=1761056566&width=1080',
    cdnUrl: 'https://firebasestorage.googleapis.com/v0/b/thea-643b1.firebasestorage.app/o/products%2FkiVf2Q4Z3QWyfAzGu2Sd%2F3cf5ec7cccc39169_orig.webp?alt=media&token=274573eb-d186-4217-ba4d-0a59563478b1',
    cdnMobileUrl: 'https://firebasestorage.googleapis.com/v0/b/thea-643b1.firebasestorage.app/o/products%2FkiVf2Q4Z3QWyfAzGu2Sd%2F3cf5ec7cccc39169_mobile.webp?alt=media&token=89cc4238-cc29-4b0a-abfd-10f6cdcbd6a3',
  },
  {
    event: 'NEW_BABY',
    title: 'New Baby',
    imageUrl: 'https://assets.pkimgs.com/pkimgs/ab/images/dp/wcm/202537/0009/img312xl.jpg',
    cdnUrl: 'https://firebasestorage.googleapis.com/v0/b/thea-643b1.firebasestorage.app/o/products%2FSRbfKRPlan3tJ16sLTLk%2F2db8d3f7d71c5ea1_orig.webp?alt=media&token=1781b55d-2341-4a72-9d21-4afa05c6f6e9',
    cdnMobileUrl: 'https://firebasestorage.googleapis.com/v0/b/thea-643b1.firebasestorage.app/o/products%2FSRbfKRPlan3tJ16sLTLk%2F2db8d3f7d71c5ea1_mobile.webp?alt=media&token=9d491489-c7f7-443f-b830-3d0b6df22a6f',
  },
  {
    event: 'GRADUATION',
    title: 'Graduation',
    imageUrl: 'https://assets.mgimgs.com/mgimgs/rk/images/dp/wcm/202526/0005/canvas-overnighter-z.jpg',
    cdnUrl: 'https://firebasestorage.googleapis.com/v0/b/thea-643b1.firebasestorage.app/o/products%2FKprZFh7sY56rcOSbicRq%2Fdac45baa70a51015_orig.webp?alt=media&token=e9c08bed-de04-4c2f-bd40-48ce3be7e9f7',
    cdnMobileUrl: 'https://firebasestorage.googleapis.com/v0/b/thea-643b1.firebasestorage.app/o/products%2FKprZFh7sY56rcOSbicRq%2Fdac45baa70a51015_mobile.webp?alt=media&token=67a2bdef-99ce-4dc5-9c06-cb35a4065b73',
  },
  {
    event: 'TEACHER_APPRECIATION',
    title: 'Teacher Appreciation',
    imageUrl: 'https://www.bando.com/cdn/shop/files/bando-3p-chronicle-andy-warhol-soup-can-crayons-sharpener-02.jpg?v=1769098451',
  },
];
