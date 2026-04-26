import React, { useRef } from 'react';
import styled from 'styled-components';
import { HeartButton } from './HeartButton';
import { isImageCached, markImageLoaded, useInViewportOnce } from './imageCache';

export interface OccasionProductCardProps {
  /** Retailer URL (or other public CDN). Used as the <img> src and <picture> fallback. */
  imageUrl: string;
  /** Firebase Storage WebP original (images_cdn[0]). */
  imageUrlCdn?: string;
  /** Firebase Storage WebP mobile variant (~600px wide; images_cdn_mobile[0]). */
  imageUrlCdnMobile?: string;
  title: string;
  brand?: string;
  price?: number;
  productUrl?: string;
  liked?: boolean;
  onSaveClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onClick?: () => void;
  /** Render the card with rounded surface + shadow (used in standalone contexts). */
  asCard?: boolean;
  /** Eager-load the image (e.g. first card on the page for LCP). */
  priority?: boolean;
}

const Root = styled.div<{ $asCard: boolean }>`
  position: relative;
  ${({ $asCard }) =>
    $asCard
      ? `
        border-radius: 16px;
        background: hsl(var(--card));
        box-shadow: var(--shadow-card);
        overflow: hidden;
      `
      : ''}
`;

const Inner = styled.div`
  cursor: pointer;
  transition: transform 150ms ease;
  &:active { transform: scale(0.97); }
`;

const ImageFrame = styled.div`
  aspect-ratio: 4 / 5;
  border-radius: 16px;
  overflow: hidden;
  background: #f5f0eb;
  position: relative;
`;

const Img = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const Meta = styled.div<{ $asCard: boolean }>`
  margin-top: 12px;
  padding: ${({ $asCard }) => ($asCard ? '0 16px 16px' : '0 4px')};
`;

const Title = styled.p`
  font-size: 18px;
  font-weight: 600;
  color: hsl(var(--foreground));
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.3;
  @media (min-width: 768px) {
    font-size: 20px;
  }
`;

const Brand = styled.p`
  font-size: 16px;
  color: hsl(var(--muted-foreground));
  margin: 2px 0 0 0;
  @media (min-width: 768px) {
    font-size: 18px;
    margin-top: 4px;
  }
`;

const Price = styled.p`
  font-size: 16px;
  font-weight: 500;
  color: hsl(var(--muted-foreground));
  margin: 2px 0 0 0;
  @media (min-width: 768px) {
    font-size: 18px;
    margin-top: 4px;
  }
`;

export const OccasionProductCard: React.FC<OccasionProductCardProps> = ({
  imageUrl,
  imageUrlCdn,
  imageUrlCdnMobile,
  title,
  brand,
  price,
  liked = false,
  onSaveClick,
  onClick,
  asCard = false,
  priority = false,
}) => {
  const frameRef = useRef<HTMLDivElement>(null);
  const inViewport = useInViewportOnce(frameRef);
  const shouldLoad = priority || isImageCached(imageUrl) || inViewport;

  return (
    <Root $asCard={asCard}>
      <Inner onClick={onClick}>
        <ImageFrame ref={frameRef}>
          {shouldLoad && (
            <picture>
              {imageUrlCdnMobile && (
                <source media="(max-width: 640px)" type="image/webp" srcSet={imageUrlCdnMobile} />
              )}
              {imageUrlCdn && <source type="image/webp" srcSet={imageUrlCdn} />}
              <Img
                src={imageUrl}
                alt={title}
                loading={priority ? 'eager' : 'lazy'}
                decoding="async"
                onLoad={() => markImageLoaded(imageUrl)}
              />
            </picture>
          )}
        </ImageFrame>
        <Meta $asCard={asCard}>
          <Title>{title}</Title>
          {brand && <Brand>{brand}</Brand>}
          {price != null && <Price>${Math.ceil(price)}</Price>}
        </Meta>
      </Inner>
      <HeartButton
        liked={liked}
        onClick={(e) => {
          e.stopPropagation();
          onSaveClick?.(e);
        }}
      />
    </Root>
  );
};
