import React from 'react';
import styled from 'styled-components';

export interface OccasionTileProps {
  imageUrl: string;
  title: string;
  href: string;
  /** Firebase Storage WebP original (images_cdn[0]). */
  cdnUrl?: string;
  /** Firebase Storage WebP mobile variant (~600px wide; images_cdn_mobile[0]). */
  cdnMobileUrl?: string;
}

const Root = styled.a`
  display: flex;
  flex-direction: column;
  text-decoration: none;
  border-radius: 16px;
  outline: none;
  &:focus-visible {
    box-shadow: 0 0 0 2px hsl(var(--ring));
  }
`;

const ImageFrame = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 5;
  border-radius: 16px;
  overflow: hidden;
  background: hsl(var(--muted));
`;

const Img = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const Label = styled.span`
  display: block;
  text-align: center;
  margin-top: 8px;
  font-size: 14px;
  font-weight: 600;
  color: hsl(var(--foreground));
  @media (min-width: 640px) {
    font-size: 16px;
    margin-top: 12px;
  }
`;

export const OccasionTile: React.FC<OccasionTileProps> = ({
  imageUrl,
  title,
  href,
  cdnUrl,
  cdnMobileUrl,
}) => (
  <Root href={href}>
    <ImageFrame>
      <picture>
        {cdnMobileUrl && (
          <source media="(max-width: 640px)" type="image/webp" srcSet={cdnMobileUrl} />
        )}
        {cdnUrl && <source type="image/webp" srcSet={cdnUrl} />}
        <Img src={imageUrl} alt={title} loading="lazy" decoding="async" />
      </picture>
    </ImageFrame>
    <Label>{title}</Label>
  </Root>
);
