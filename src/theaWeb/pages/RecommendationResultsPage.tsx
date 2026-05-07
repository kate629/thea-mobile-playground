import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Spinner } from 'react-bootstrap';

import { ProfileDrawer } from '../../components/landing/results/ProfileDrawer';
import { useProfileDrawer } from '../../components/landing/results/useProfileDrawer';
import type { ResultsProductCardItem } from '../../components/landing/results/types';
import { getInterestPills } from '../../components/landing/quiz/ageBasedContent';
import { getQuizPlaceholder } from '../../components/landing/quiz/useQuizFlow';

import { recordActivity, updateRecipient } from '../callables';
import { openExternal } from '../lib/openExternal';
import { useCarouselSession } from '../hooks/useCarouselSession';
import { useGiftActivities, type GiftActivityDetail } from '../hooks/useGiftActivities';
import { useRecommendationDoc } from '../hooks/useRecommendationDoc';
import { useRegenerate } from '../hooks/useRegenerate';
import { buildPreferenceSignals } from '../lib/preferenceSignals';
import { productToCardItem } from '../lib/resultsAdapters';
import {
  recommendationToProfileDraft,
  profileDraftToUpdateRecipient,
  profileDraftToRegenerateRequest,
} from '../lib/profileDraftAdapter';
import { useAuthGate } from '../auth/AuthGateContext';
import { HeaderAccountMenu } from '../auth/HeaderAccountMenu';
import { useAuth } from '../firebase/FirebaseContext';

import { BoardLayout, type BoardChipSection } from '../../playground/board/BoardLayout';

const EMPTY_DRAFT: import('../../components/landing/results/types').ProfileDraft = {
  emoji: '✨',
  name: '',
  priceMin: 25,
  priceMax: 200,
  interests: [],
  vibes: [],
  moreAbout: '',
};

const RecommendationResultsPage: React.FC = () => {
  const auth = useAuth();
  const { recipientId, recommendationId } = useParams<{
    recipientId: string;
    recommendationId: string;
  }>();
  const { doc, loading: docLoading, error: docError } = useRecommendationDoc(
    recipientId,
    recommendationId,
  );
  const { session } = useCarouselSession(doc?.carouselSessionId);
  const {
    liked,
    likedDetails,
    dismissedDetails,
    purchasedDetails,
  } = useGiftActivities(recipientId);
  const navigate = useNavigate();
  const { regenerate } = useRegenerate();

  const preferenceSignals = useMemo(
    () => buildPreferenceSignals(likedDetails, dismissedDetails, purchasedDetails),
    [likedDetails, dismissedDetails, purchasedDetails],
  );

  // Optimistic heart fill: stage immediately, clear once the BE-truth `liked`
  // Set catches up. Same pattern as upstream RecommendationResultsPage.
  const [pendingLikedIds, setPendingLikedIds] = useState<Set<string>>(() => new Set());

  // Items mid-flight to the saved panel. Kept in the feed (with fade-out
  // styling in BoardFeed) until the animation completes, so the clone isn't
  // flying through empty space after the layout shifts.
  const [departingIds, setDepartingIds] = useState<Set<string>>(() => new Set());
  const FLIGHT_DURATION_MS = 700;
  useEffect(() => {
    setPendingLikedIds((prev) => {
      if (prev.size === 0) return prev;
      let changed = false;
      const next = new Set(prev);
      prev.forEach((id) => {
        if (liked.has(id)) {
          next.delete(id);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [liked]);

  const fireActivity = useCallback(
    (productId: string, state: 'SAVED' | 'DISMISSED' | 'PURCHASED') => {
      if (!recipientId) return;
      if (state === 'SAVED') {
        setPendingLikedIds((prev) => {
          if (prev.has(productId)) return prev;
          const next = new Set(prev);
          next.add(productId);
          return next;
        });
      }
      recordActivity({
        productId,
        state,
        source: 'RESULTS_PAGE',
        recipientIds: [recipientId],
      }).catch(() => {
        if (state === 'SAVED') {
          setPendingLikedIds((prev) => {
            if (!prev.has(productId)) return prev;
            const next = new Set(prev);
            next.delete(productId);
            return next;
          });
        }
      });
    },
    [recipientId],
  );

  const { requestSignIn } = useAuthGate();

  // ProfileDrawer wiring kept intact so the recipient pencil → drawer flow
  // stays usable while we iterate on the board layout.
  const initialDraft = useMemo(
    () => (doc ? recommendationToProfileDraft(doc) : EMPTY_DRAFT),
    [doc],
  );

  const handleUpdatePicks = useCallback(
    (next: typeof initialDraft) => {
      if (!recipientId || !doc) return;
      const requestOverride = profileDraftToRegenerateRequest(next, recipientId, doc);
      regenerate({ recipientId, recommendation: doc, requestOverride, preferenceSignals })
        .then((res) => {
          navigate(`/quiz/results/${res.recipientId}/${res.recommendationId}`);
        })
        .catch(() => {});
    },
    [recipientId, doc, regenerate, navigate, preferenceSignals],
  );

  const handleAutoSaveOnClose = useCallback(
    (next: typeof initialDraft) => {
      if (!recipientId) return;
      const req = profileDraftToUpdateRecipient(next, recipientId);
      if (Object.keys(req).length <= 1) return;
      updateRecipient(req).catch((err) => {
        console.error('updateRecipient failed', err);
      });
    },
    [recipientId],
  );

  const drawer = useProfileDrawer({
    initial: initialDraft,
    onCommit: handleUpdatePicks,
    onAutoSaveOnClose: handleAutoSaveOnClose,
  });

  const liveAge = drawer.draft.age ?? 30;
  const liveGender = drawer.draft.gender ?? 'other';
  const liveRelationship = drawer.draft.relationship ?? '';
  const interestPills = useMemo(
    () => getInterestPills(liveAge, liveGender),
    [liveAge, liveGender],
  );
  const freeformPlaceholder = useMemo(
    () => getQuizPlaceholder(liveGender, liveRelationship),
    [liveGender, liveRelationship],
  );

  // Build chipSections directly from session.carousels — bypass the dynamic-
  // title resolver in resultsAdapters so the chip labels stay simple ("Cozy",
  // "Kitchen") rather than "For the beauty lover" / "For the bookworm" etc.
  //
  // Filter: hide products that are saved AND no longer in flight. Items
  // currently departing (in flight to the saved panel) stay rendered so
  // BoardFeed can fade them out, keeping the visual hand-off coherent.
  const chipSections: BoardChipSection[] = useMemo(() => {
    if (!session) return [];
    return session.carouselOrder
      .filter((key) => key in session.carousels)
      .map((key) => {
        const c = session.carousels[key];
        const products = c.products.map(productToCardItem).filter((item) => {
          const isSaved = liked.has(item.id) || pendingLikedIds.has(item.id);
          return !isSaved || departingIds.has(item.id);
        });
        return {
          key,
          label: c.displayName,
          products,
        };
      });
  }, [session, liked, pendingLikedIds, departingIds]);

  // Saved-items hydration: prefer the in-memory card item from chipSections;
  // fall back to the frozen productSnapshot when an activity's product is no
  // longer in the current chips (e.g. after a regenerate).
  const itemById = useMemo(() => {
    const map = new Map<string, ResultsProductCardItem>();
    for (const section of chipSections) {
      for (const item of section.products) map.set(item.id, item);
    }
    return map;
  }, [chipSections]);

  const detailById = useMemo(() => {
    const map = new Map<string, GiftActivityDetail>();
    for (const detail of likedDetails) map.set(detail.id, detail);
    for (const detail of purchasedDetails) map.set(detail.id, detail);
    return map;
  }, [likedDetails, purchasedDetails]);

  const fromSnapshot = useCallback(
    (id: string): ResultsProductCardItem | undefined => {
      const detail = detailById.get(id);
      if (!detail) return undefined;
      return {
        id: detail.id,
        title: detail.title,
        imageUrl: detail.imageUrl ?? '',
        brand: detail.brand,
        price: detail.price,
        productUrl: detail.productUrl,
      };
    },
    [detailById],
  );

  const savedItems = useMemo(
    () =>
      Array.from(liked)
        .map((id) => itemById.get(id) ?? fromSnapshot(id))
        .filter((x): x is ResultsProductCardItem => Boolean(x)),
    [liked, itemById, fromSnapshot],
  );

  const handleSaveClick = useCallback(
    (item: ResultsProductCardItem) => {
      if (liked.has(item.id)) return;
      // Mark the card as departing so it stays in the feed (with fade-out
      // styling) while the flight animation runs. Without this the card
      // would unmount immediately and the flying clone would travel through
      // empty space after the layout reflows.
      setDepartingIds((prev) => {
        const next = new Set(prev);
        next.add(item.id);
        return next;
      });
      fireActivity(item.id, 'SAVED');
      window.setTimeout(() => {
        setDepartingIds((prev) => {
          if (!prev.has(item.id)) return prev;
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
      }, FLIGHT_DURATION_MS);
      if (auth.currentUser?.isAnonymous !== false) {
        requestSignIn({ mode: 'signup' });
      }
    },
    [liked, fireActivity, requestSignIn, auth],
  );

  const handleProductClick = useCallback((item: ResultsProductCardItem) => {
    if (item.productUrl) openExternal(item.productUrl);
  }, []);

  const handleMarkPurchased = useCallback(
    (item: ResultsProductCardItem) => {
      fireActivity(item.id, 'PURCHASED');
    },
    [fireActivity],
  );

  const isLikedById = useCallback(
    (id: string) => liked.has(id) || pendingLikedIds.has(id),
    [liked, pendingLikedIds],
  );

  if (!recipientId || !recommendationId) {
    return (
      <Alert variant="danger" className="mt-4">
        Missing recipient or recommendation in URL.
      </Alert>
    );
  }

  if (docError) {
    return (
      <Alert variant="danger" className="mt-4">
        Couldn't load this recommendation: {docError.message}
      </Alert>
    );
  }

  if (docLoading || !doc) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: 300 }}
      >
        <Spinner animation="border" role="status" />
      </div>
    );
  }

  const recipientEmoji = doc.recipientSnapshot.emoji ?? '✨';
  const recipientName = doc.recipientSnapshot.name ?? '';
  const interests = doc.input.interests ?? [];
  const interestsLabel =
    interests.length === 0
      ? ''
      : interests.length <= 2
      ? interests.map((i) => i.charAt(0).toUpperCase() + i.slice(1)).join(', ')
      : `${interests
          .slice(0, 2)
          .map((i) => i.charAt(0).toUpperCase() + i.slice(1))
          .join(', ')} +${interests.length - 2}`;
  const occasionLabel =
    doc.input.occasionLabel ??
    (
      {
        BIRTHDAY: 'Birthday',
        MOTHERS_DAY: "Mother's Day",
        FATHERS_DAY: "Father's Day",
        ANNIVERSARY: 'Anniversary',
        GRADUATION: 'Graduation',
        WEDDING: 'Wedding',
        NEW_BABY: 'New baby',
        HOUSEWARMING: 'Housewarming',
        THANK_YOU: 'Thank you',
        JUST_BECAUSE: 'Just because',
        CHRISTMAS: 'Christmas',
        HANUKKAH: 'Hanukkah',
        VALENTINES_DAY: "Valentine's Day",
        OTHER: 'Other',
      } as Record<string, string>
    )[doc.input.occasion] ??
    '';

  return (
    <>
      <BoardLayout
        recipientName={recipientName}
        recipientEmoji={recipientEmoji}
        interestsLabel={interestsLabel}
        occasionLabel={occasionLabel}
        rightActions={<HeaderAccountMenu />}
        onLogoClick={() => navigate('/')}
        onPillClick={drawer.openDrawer}
        chipSections={chipSections}
        savedItems={savedItems}
        departingIds={departingIds}
        isLiked={isLikedById}
        onSaveClick={handleSaveClick}
        onProductClick={handleProductClick}
        onMarkPurchased={handleMarkPurchased}
        onSavedItemClick={handleProductClick}
      />
      <ProfileDrawer
        open={drawer.open}
        onClose={drawer.closeDrawer}
        isMe={doc.recipientSnapshot.isMe}
        draft={drawer.draft}
        savedHints={drawer.savedHints}
        interestPills={interestPills}
        freeformPlaceholder={freeformPlaceholder}
        onChange={drawer.setField}
        onUpdatePicks={drawer.commit}
        updatePicksDisabled={!drawer.canCommit}
      />
    </>
  );
};

export default RecommendationResultsPage;
