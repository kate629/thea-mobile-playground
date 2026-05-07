import type { CarouselSession, RecommendationCarousel } from '../../theaWeb/schemas';
import { MOCK_PRODUCTS } from './products';
import { getSessionState } from './playgroundConfig';

const COZY_HOME: RecommendationCarousel = {
  displayName: 'For the cozy homebody',
  products: ['p1', 'p2', 'p3', 'p11', 'p12']
    .map((id) => MOCK_PRODUCTS.find((p) => p.id === id)!)
    .filter(Boolean),
};

const EVERYDAY_LUXURIES: RecommendationCarousel = {
  displayName: 'Small everyday luxuries',
  products: ['p4', 'p8', 'p5', 'p9']
    .map((id) => MOCK_PRODUCTS.find((p) => p.id === id)!)
    .filter(Boolean),
};

const KITCHEN: RecommendationCarousel = {
  displayName: 'For the home cook',
  products: ['p10', 'p7', 'p12']
    .map((id) => MOCK_PRODUCTS.find((p) => p.id === id)!)
    .filter(Boolean),
};

const THOUGHTFUL: RecommendationCarousel = {
  displayName: 'Thoughtful + quiet',
  products: ['p6', 'p3', 'p9']
    .map((id) => MOCK_PRODUCTS.find((p) => p.id === id)!)
    .filter(Boolean),
};

export function buildMockCarouselSession(): CarouselSession {
  const state = getSessionState();
  if (state === 'processing') {
    return {
      status: 'PROCESSING',
      carousels: {
        cozy: { ...COZY_HOME, products: COZY_HOME.products.slice(0, 2) },
      },
      carouselOrder: ['cozy'],
    };
  }
  return {
    status: 'COMPLETED',
    carousels: {
      cozy: COZY_HOME,
      everyday: EVERYDAY_LUXURIES,
      kitchen: KITCHEN,
      thoughtful: THOUGHTFUL,
    },
    carouselOrder: ['cozy', 'everyday', 'kitchen', 'thoughtful'],
    pipelineTimingMs: 12_400,
  };
}
