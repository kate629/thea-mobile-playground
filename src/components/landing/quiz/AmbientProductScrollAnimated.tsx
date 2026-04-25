import React from 'react';
import { AmbientProductScroll, ProductImage } from './AmbientProductScroll';
import { useAmbientScroll } from './useAmbientScroll';

export interface AmbientProductScrollAnimatedProps {
  images: ProductImage[];
}

export const AmbientProductScrollAnimated: React.FC<AmbientProductScrollAnimatedProps> = ({ images }) => {
  const slots = useAmbientScroll(images);
  return <AmbientProductScroll slots={slots} />;
};
