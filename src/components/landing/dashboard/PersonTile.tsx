import React from 'react';
import styled from 'styled-components';
import { PreviewCollage } from './PreviewCollage';

export interface PersonTileProps {
  id: string;
  name: string;
  emoji: string;
  /** Up to 4 image URLs. Empty + `loading=false` triggers the emoji fallback. */
  previewImages?: string[];
  /** True until the first preview snapshot resolves. Renders the shimmer block. */
  loading?: boolean;
  isMe?: boolean;
  onClick?: () => void;
}

const TileButton = styled.button`
  display: flex;
  flex-direction: column;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  border-radius: 16px;
  &:focus {
    outline: none;
  }
  &:focus-visible {
    box-shadow: 0 0 0 2px hsl(var(--primary));
  }
`;

const TileFrame = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 5;
  border-radius: 16px;
  overflow: hidden;
  background: hsl(var(--muted));
  border: 1px solid #e5e0d8;
`;

const TileLabel = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 8px;
  @media (min-width: 640px) {
    margin-top: 12px;
  }
`;

const LabelEmoji = styled.span`
  font-size: 18px;
  line-height: 1;
`;

const LabelName = styled.span`
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
  color: hsl(var(--foreground));
  @media (min-width: 640px) {
    font-size: 16px;
  }
`;

export const PersonTile: React.FC<PersonTileProps> = ({
  name,
  emoji,
  previewImages = [],
  loading = false,
  isMe = false,
  onClick,
}) => {
  const ariaLabel = isMe ? "Open your closet" : `Open ${name}'s closet`;
  return (
    <TileButton type="button" onClick={onClick} aria-label={ariaLabel}>
      <TileFrame>
        <PreviewCollage images={previewImages} fallbackEmoji={emoji} loading={loading} />
      </TileFrame>
      <TileLabel>
        <LabelEmoji aria-hidden>{emoji}</LabelEmoji>
        <LabelName>{name}</LabelName>
      </TileLabel>
    </TileButton>
  );
};
