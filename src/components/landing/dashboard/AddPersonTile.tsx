import React from 'react';
import styled from 'styled-components';

export interface AddPersonTileProps {
  label?: string;
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
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.color.creamLight};
  border: 1.5px dashed #e5e0d8;
`;

const Plus = styled.span`
  font-size: 64px;
  line-height: 1;
  color: ${({ theme }) => theme.color.clay};
`;

const Label = styled.span`
  display: block;
  text-align: center;
  margin-top: 8px;
  font-size: 14px;
  font-weight: 600;
  color: hsl(var(--foreground));
  @media (min-width: 640px) {
    margin-top: 12px;
    font-size: 16px;
  }
`;

export const AddPersonTile: React.FC<AddPersonTileProps> = ({
  label = 'Add someone',
  onClick,
}) => (
  <TileButton type="button" onClick={onClick} aria-label={label}>
    <TileFrame>
      <Plus aria-hidden>+</Plus>
    </TileFrame>
    <Label>{label}</Label>
  </TileButton>
);
