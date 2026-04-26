import React, { useCallback } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { OccasionPage } from './OccasionPage';
import { CarouselSectionData, SAMPLE_BIRTHDAY_SECTIONS } from './sampleBirthdayCarousels';
import { SAMPLE_MOTHERS_DAY_SECTIONS } from './sampleMothersDayCarousels';
import { SAMPLE_FATHERS_DAY_SECTIONS } from './sampleFathersDayCarousels';
import { SAMPLE_ANNIVERSARY_SECTIONS } from './sampleAnniversaryCarousels';
import { SAMPLE_HOUSEWARMING_SECTIONS } from './sampleHousewarmingCarousels';
import { SAMPLE_NEW_BABY_SECTIONS } from './sampleNewBabyCarousels';
import { SAMPLE_GRADUATION_SECTIONS } from './sampleGraduationCarousels';
import { CarouselProduct } from './CarouselSection';

interface OccasionConfig {
  title: string;
  sections: CarouselSectionData[];
}

/* Keys are the lowercase event slugs that OccasionGrid renders into the
   tile hrefs. Title strings match sovrn's per-occasion H1. */
const OCCASIONS: Record<string, OccasionConfig> = {
  birthday: { title: 'Birthday Gifts', sections: SAMPLE_BIRTHDAY_SECTIONS },
  mothers_day: { title: "Mother's Day Gifts", sections: SAMPLE_MOTHERS_DAY_SECTIONS },
  fathers_day: { title: "Father's Day Gifts", sections: SAMPLE_FATHERS_DAY_SECTIONS },
  anniversary: { title: 'Anniversary Gifts', sections: SAMPLE_ANNIVERSARY_SECTIONS },
  housewarming: { title: 'Housewarming Gifts', sections: SAMPLE_HOUSEWARMING_SECTIONS },
  new_baby: { title: 'New Baby Gifts', sections: SAMPLE_NEW_BABY_SECTIONS },
  graduation: { title: 'Graduation Gifts', sections: SAMPLE_GRADUATION_SECTIONS },
};

export const OccasionRoute: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const config = id ? OCCASIONS[id.toLowerCase()] : undefined;

  const handleProductClick = useCallback((product: CarouselProduct) => {
    if (product.productUrl) {
      window.open(product.productUrl, '_blank', 'noopener,noreferrer');
    }
  }, []);

  if (!config) return <Navigate to="/" replace />;

  return (
    <OccasionPage
      title={config.title}
      sections={config.sections}
      onProductClick={handleProductClick}
    />
  );
};
