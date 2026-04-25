import React from 'react';
import styled from 'styled-components';

export interface ProductImage {
  original: string;
  cdn?: string;
  cdnMobile?: string;
}

export interface AmbientSlot {
  image: ProductImage | null;
  visible: boolean;
}

export interface AmbientProductScrollProps {
  /** Per-slot rendering state. Should match POSITIONS length (6). Slots
   *  with `image: null` render nothing — useful before any images arrive. */
  slots: AmbientSlot[];
}

/** 6 ring positions around the centered logo — verbatim from sovrn source. */
export const AMBIENT_POSITIONS: React.CSSProperties[] = [
  { top: '8%', left: '15%' },
  { top: '5%', left: '65%' },
  { top: '42%', left: '3%' },
  { top: '42%', left: '78%' },
  { bottom: '12%', left: '18%' },
  { bottom: '10%', left: '62%' },
];

const Stage = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
`;

const Slot = styled.div<{ $visible: boolean }>`
  position: absolute;
  transition: opacity 300ms ease;
  opacity: ${({ $visible }) => ($visible ? 0.75 : 0)};
`;

const SlotImg = styled.img`
  width: 80px;
  height: 80px;
  border-radius: 12px;
  object-fit: cover;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
`;

export const AmbientProductScroll: React.FC<AmbientProductScrollProps> = ({ slots }) => (
  <Stage aria-hidden="true">
    {slots.map((slot, i) => {
      if (!slot.image) return null;
      const pos = AMBIENT_POSITIONS[i] ?? AMBIENT_POSITIONS[0];
      return (
        <Slot key={i} $visible={slot.visible} style={pos}>
          <picture>
            {slot.image.cdnMobile && (
              <source srcSet={slot.image.cdnMobile} media="(max-width: 640px)" type="image/webp" />
            )}
            {slot.image.cdn && <source srcSet={slot.image.cdn} type="image/webp" />}
            <SlotImg
              src={slot.image.original}
              alt=""
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </picture>
        </Slot>
      );
    })}
  </Stage>
);
