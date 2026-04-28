import React, { useCallback, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { OccasionPage } from './OccasionPage';
import { useAuthGate } from '../../../theaWeb/auth/AuthGateContext';
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

/**
 * Inject high-priority preloads for the LCP image — the first card of the
 * first section. We can't do this statically in index.html because the LCP
 * varies per route. Each preload uses a `media` attribute that mirrors the
 * <picture> element's source selection in OccasionProductCard, so the browser
 * preloads exactly the variant the rendered <img> will pick (no double-fetch).
 *
 * Earlier version used imagesrcset/imagesizes, which caused the browser's
 * srcset math (412px CSS × 1.75 DPR ≈ 721px) to pick the 1200w orig variant
 * while the <picture> picked mobile via media query — wasting a fetch.
 */
const useLcpPreload = (config: OccasionConfig | undefined) => {
  useEffect(() => {
    const lcp = config?.sections[0]?.products[0];
    if (!lcp) return;

    const links: HTMLLinkElement[] = [];
    const addPreload = (href: string, media?: string) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = href;
      link.setAttribute('fetchpriority', 'high');
      if (media) link.media = media;
      if (href.includes('.webp')) link.type = 'image/webp';
      document.head.appendChild(link);
      links.push(link);
    };

    if (lcp.imageUrlCdnMobile && lcp.imageUrlCdn) {
      addPreload(lcp.imageUrlCdnMobile, '(max-width: 640px)');
      addPreload(lcp.imageUrlCdn, '(min-width: 641px)');
    } else if (lcp.imageUrlCdn) {
      addPreload(lcp.imageUrlCdn);
    } else if (lcp.imageUrlCdnMobile) {
      addPreload(lcp.imageUrlCdnMobile);
    } else if (lcp.imageUrl) {
      addPreload(lcp.imageUrl);
    }

    return () => {
      links.forEach((l) => l.remove());
    };
  }, [config]);
};

export const OccasionRoute: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const config = id ? OCCASIONS[id.toLowerCase()] : undefined;
  const { requestSignIn } = useAuthGate();
  const navigate = useNavigate();

  useLcpPreload(config);

  const handleProductClick = useCallback((product: CarouselProduct) => {
    if (product.productUrl) {
      window.open(product.productUrl, '_blank', 'noopener,noreferrer');
    }
  }, []);

  const handleSignInClick = useCallback(
    () => requestSignIn({ mode: 'signin' }),
    [requestSignIn],
  );

  const handleCtaClick = useCallback(() => navigate('/quiz'), [navigate]);

  if (!config) return <Navigate to="/" replace />;

  return (
    <OccasionPage
      title={config.title}
      sections={config.sections}
      onProductClick={handleProductClick}
      onSignInClick={handleSignInClick}
      onCtaClick={handleCtaClick}
    />
  );
};
