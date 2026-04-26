import React from 'react';
import styled, { css, keyframes } from 'styled-components';

export interface PreviewCollageProps {
  /** Up to 4 image URLs. Anything beyond index 3 is ignored. */
  images: string[];
  /** Renders centered when `images` is empty AND `loading` is false. Source uses 64–88px. */
  fallbackEmoji: string;
  /** True until the first preview snapshot resolves; renders a shimmer block. */
  loading: boolean;
}

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const fillAbsolute = css`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
`;

const Shimmer = styled.div`
  ${fillAbsolute};
  background: linear-gradient(
    90deg,
    hsl(var(--muted)) 0%,
    hsl(var(--muted) / 0.6) 50%,
    hsl(var(--muted)) 100%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1400ms ease-in-out infinite;
`;

const EmojiFallback = styled.div`
  ${fillAbsolute};
  display: flex;
  align-items: center;
  justify-content: center;
  background: hsl(var(--muted));
`;

const FallbackGlyph = styled.span`
  font-size: 64px;
  line-height: 1;
  @media (min-width: 640px) {
    font-size: 88px;
  }
`;

const SingleImage = styled.img`
  ${fillAbsolute};
  object-fit: cover;
`;

const Grid2 = styled.div`
  ${fillAbsolute};
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
`;

const Grid2x2 = styled.div`
  ${fillAbsolute};
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 1px;
`;

const Tile = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

export const PreviewCollage: React.FC<PreviewCollageProps> = ({
  images,
  fallbackEmoji,
  loading,
}) => {
  if (loading) return <Shimmer aria-hidden />;

  const pics = images.slice(0, 4);

  if (pics.length === 0) {
    return (
      <EmojiFallback>
        <FallbackGlyph aria-hidden>{fallbackEmoji}</FallbackGlyph>
      </EmojiFallback>
    );
  }

  if (pics.length === 1) {
    return <SingleImage src={pics[0]} alt="" aria-hidden loading="lazy" />;
  }

  if (pics.length === 2) {
    return (
      <Grid2>
        {pics.map((src, i) => (
          <Tile key={i} src={src} alt="" aria-hidden loading="lazy" />
        ))}
      </Grid2>
    );
  }

  return (
    <Grid2x2>
      {pics.map((src, i) => (
        <Tile key={i} src={src} alt="" aria-hidden loading="lazy" />
      ))}
    </Grid2x2>
  );
};
