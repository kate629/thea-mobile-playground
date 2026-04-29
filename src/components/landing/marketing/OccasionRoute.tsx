import React, { useCallback, useEffect } from 'react';
import { useParams, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { OccasionPage } from './OccasionPage';
import { MothersDayQuizBanner } from './MothersDayQuizBanner';
import { useAuthGate } from '../../../theaWeb/auth/AuthGateContext';
import type { QuizEntryPoint } from '../../../theaWeb/lib/gaPixel';
import { CarouselSectionData, SAMPLE_BIRTHDAY_SECTIONS } from './sampleBirthdayCarousels';
import { SAMPLE_MOTHERS_DAY_SECTIONS } from './sampleMothersDayCarousels';
import { SAMPLE_FATHERS_DAY_SECTIONS } from './sampleFathersDayCarousels';
import { SAMPLE_ANNIVERSARY_SECTIONS } from './sampleAnniversaryCarousels';
import { SAMPLE_HOUSEWARMING_SECTIONS } from './sampleHousewarmingCarousels';
import { SAMPLE_NEW_BABY_SECTIONS } from './sampleNewBabyCarousels';
import { SAMPLE_GRADUATION_SECTIONS } from './sampleGraduationCarousels';
import { CarouselProduct } from './CarouselSection';
import { openExternal } from '../../../theaWeb/lib/openExternal';

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
  const slug = id?.toLowerCase();
  const config = slug ? OCCASIONS[slug] : undefined;
  const { requestSignIn } = useAuthGate();
  const navigate = useNavigate();
  const location = useLocation();

  useLcpPreload(config);

  // CarouselSection now fires gaProductClick + Meta ViewContent internally
  // when the `occasion` prop is set; this handler is left to just open the
  // affiliate URL.
  const handleProductClick = useCallback((product: CarouselProduct) => {
    if (product.productUrl) {
      openExternal(product.productUrl);
    }
  }, []);

  const handleSignInClick = useCallback(
    () => requestSignIn({ mode: 'signin' }),
    [requestSignIn],
  );

  /* Pass the current path as `from` so the quiz's leave-warning modal returns
   *  the user here on confirm-leave instead of the homepage default. The
   *  entry_point distinguishes the two CTA surfaces on this page (sticky vs
   *  the MD banner) so the dashboard can compare per-surface drop-off. */
  const handleCtaClick = useCallback(
    (entryPoint: QuizEntryPoint) =>
      navigate('/quiz', { state: { from: location.pathname, entry_point: entryPoint } }),
    [navigate, location.pathname],
  );
  const handleStickyCtaClick = useCallback(
    () => handleCtaClick('sticky_occasion'),
    [handleCtaClick],
  );
  const handleBannerCtaClick = useCallback(
    () => handleCtaClick('banner_mothers_day'),
    [handleCtaClick],
  );

  if (!config) return <Navigate to="/" replace />;

  /* Mother's Day-only mid-page CTA banner. Inserted between carousels 2 and 3.
     Mirrors the banner pattern from preview.givethea.com — copy is gendered
     ("She's one of a kind.") so we don't reuse it across occasions. */
  const midCarouselSlot =
    slug === 'mothers_day' ? (
      <MothersDayQuizBanner onCtaClick={handleBannerCtaClick} />
    ) : undefined;

  return (
    <OccasionPage
      title={config.title}
      sections={config.sections}
      onProductClick={handleProductClick}
      onSignInClick={handleSignInClick}
      onCtaClick={handleStickyCtaClick}
      midCarouselSlot={midCarouselSlot}
      occasion={slug}
    />
  );
};
