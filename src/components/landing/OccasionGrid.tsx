import React from 'react';
import styled from 'styled-components';
import { OccasionTile } from '../ui/OccasionTile';

export interface OccasionGridTile {
  event: string;
  title: string;
  imageUrl: string;
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
        {tiles.map((t) => (
          <OccasionTile
            key={t.event}
            href={`/occasion/${t.event.toLowerCase()}`}
            title={t.title}
            imageUrl={t.imageUrl}
          />
        ))}
      </Grid>
    </GridWrap>
  </>
);

/* Hardcoded image URLs from sovrn's GiftGuides.tsx:20-28 (heroOverrides). */
export const OCCASION_TILES: OccasionGridTile[] = [
  {
    event: 'MOTHERS_DAY',
    title: "Mother's Day",
    imageUrl: 'https://furbishstudio.com/cdn/shop/files/244A4176_2048x.jpg?v=1762389625',
  },
  {
    event: 'FATHERS_DAY',
    title: "Father's Day",
    imageUrl: 'https://sandgrainstudio.com/cdn/shop/files/Old_Fashioned_Cocktail_poster.png?v=1762465279&width=1500',
  },
  {
    event: 'BIRTHDAY',
    title: 'Birthday',
    imageUrl: 'https://www.knotandbow.com/cdn/shop/products/BirthdayBag_087_1024x1024.jpg?v=1622925697',
  },
  {
    event: 'ANNIVERSARY',
    title: 'Anniversary',
    imageUrl: 'https://goldbelly.imgix.net/uploads/showcase_media_asset/image/157107/Montilio_s-Baking-Company-JFK-Wedding-Cake-1.14.21-104-Edit-72ppi-1x1.jpg?ixlib=react-9.10.0&ar=1%3A1&fit=crop&w=1920&auto=format',
  },
  {
    event: 'HOUSEWARMING',
    title: 'Housewarming',
    imageUrl: 'https://weezietowels.com/cdn/shop/files/blue-and-white-stripe-1.jpg?v=1761056566&width=1080',
  },
  {
    event: 'NEW_BABY',
    title: 'New Baby',
    imageUrl: 'https://assets.pkimgs.com/pkimgs/ab/images/dp/wcm/202537/0009/img312xl.jpg',
  },
  {
    event: 'GRADUATION',
    title: 'Graduation',
    imageUrl: 'https://assets.mgimgs.com/mgimgs/rk/images/dp/wcm/202526/0005/canvas-overnighter-z.jpg',
  },
];
