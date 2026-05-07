import type { CarouselSession, RecommendationCarousel } from '../../theaWeb/schemas';
import { CHIP_TAB_KEYS, CHIP_TAB_LABELS, productsByChip } from './products';
import { getSessionState } from './playgroundConfig';

// One carousel per chip-tab. Display name = the chip label so the playground
// BoardLayout can render the chip directly from the carousel `displayName`.
function carouselForChip(chip: typeof CHIP_TAB_KEYS[number]): RecommendationCarousel {
  return {
    displayName: CHIP_TAB_LABELS[chip],
    products: productsByChip(chip),
  };
}

export function buildMockCarouselSession(): CarouselSession {
  const state = getSessionState();
  if (state === 'processing') {
    // PROCESSING: only show the first chip's products, partial.
    const firstChip = CHIP_TAB_KEYS[0];
    return {
      status: 'PROCESSING',
      carousels: {
        [firstChip]: {
          ...carouselForChip(firstChip),
          products: carouselForChip(firstChip).products.slice(0, 2),
        },
      },
      carouselOrder: [firstChip],
    };
  }
  // COMPLETED: all chips populated.
  const carousels: Record<string, RecommendationCarousel> = {};
  for (const chip of CHIP_TAB_KEYS) {
    carousels[chip] = carouselForChip(chip);
  }
  return {
    status: 'COMPLETED',
    carousels,
    carouselOrder: [...CHIP_TAB_KEYS],
    pipelineTimingMs: 12_400,
  };
}
