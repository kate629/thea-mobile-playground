import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { Alert, Spinner } from 'react-bootstrap';

import { ResultsPage } from '../../components/landing/results/ResultsPage';
import { ResultsDiscoverTab } from '../../components/landing/results/ResultsDiscoverTab';
import { ResultsCarouselAnimated } from '../../components/landing/results/ResultsCarouselAnimated';
import { SkeletonResultsCarousel } from '../../components/landing/results/ResultsCarousel';
import { ResultsSavedGrid } from '../../components/landing/results/ResultsSavedGrid';
import { ResultsPurchasedGrid } from '../../components/landing/results/ResultsPurchasedGrid';
import type {
  ResultsProductCardItem,
  ResultsTabKey,
} from '../../components/landing/results/types';

import { recordActivity } from '../callables';
import { useCarouselSession } from '../hooks/useCarouselSession';
import { useExitAnimationQueue } from '../hooks/useExitAnimationQueue';
import { useGiftActivities } from '../hooks/useGiftActivities';
import { useRecommendationDoc } from '../hooks/useRecommendationDoc';
import {
  carouselsToSections,
  recipientHeaderProps,
} from '../lib/resultsAdapters';
import { useAuthGate } from '../auth/AuthGateContext';
import { HeaderAccountMenu } from '../auth/HeaderAccountMenu';
import { auth } from '../../firebaseConfig';

const ProcessingHint = styled.p`
  text-align: center;
  font-size: 16px;
  color: hsl(var(--muted-foreground));
  padding: 32px 16px;
`;

// Width of the slide-out animation owned by ResultsCarousel — keep in sync
// with the styled-components transition there (750ms transform + 320ms delay
// ≈ 1100ms total before the slot can stop rendering).
const EXIT_ANIMATION_MS = 1100;

const RecommendationResultsPage: React.FC = () => {
  const { recipientId, recommendationId } = useParams<{
    recipientId: string;
    recommendationId: string;
  }>();
  const { doc, loading: docLoading, error: docError } = useRecommendationDoc(
    recipientId,
    recommendationId,
  );
  const { session, error: sessionError } = useCarouselSession(doc?.carouselSessionId);
  const { liked, dismissed, purchased, hydrated } = useGiftActivities(recipientId);

  const [activeTab, setActiveTab] = useState<ResultsTabKey>('recommended');
  const exitingIds = useExitAnimationQueue(liked, hydrated, EXIT_ANIMATION_MS);

  // Optimistic heart fill: between click and the BE listener pushing the
  // SAVED state (~500ms round-trip), the heart would otherwise stay empty
  // and the card would just disappear with no red-heart moment. Stage the
  // id locally on click so the heart fills instantly; clear it once the
  // BE-truth `liked` Set catches up.
  const [pendingLikedIds, setPendingLikedIds] = useState<Set<string>>(() => new Set());

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

  // Carousel sections come from the session — reuse the adapter so the
  // mapping (image preference order, product → card item) lives in one place
  // and is independently unit-tested.
  const sections = useMemo(
    () => (session ? carouselsToSections(session) : []),
    [session],
  );

  // Flat lookup of every card item by id so the Saved + Purchased grids can
  // hydrate from the BE Sets without re-walking the carousels each render.
  const itemById = useMemo(() => {
    const map = new Map<string, ResultsProductCardItem>();
    for (const section of sections) {
      for (const item of section.products) map.set(item.id, item);
    }
    return map;
  }, [sections]);

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
        // Drop the pending entry on failure so the heart doesn't stay
        // optimistically filled with no BE-truth backing. The Firestore
        // listener remains the source of truth for what the heart shows.
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

  const handleSaveClick = useCallback(
    (item: ResultsProductCardItem) => {
      // No UNSAVED state on the BE — un-save is a follow-up endpoint. Until
      // then, a second click on an already-liked product is a no-op.
      if (liked.has(item.id)) return;

      if (auth.currentUser?.isAnonymous !== false) {
        requestSignIn({
          mode: 'signup',
          onAuthed: () => fireActivity(item.id, 'SAVED'),
        });
        return;
      }
      fireActivity(item.id, 'SAVED');
    },
    [liked, fireActivity, requestSignIn],
  );

  const handleDismissFinalize = useCallback(
    (item: ResultsProductCardItem) => {
      fireActivity(item.id, 'DISMISSED');
    },
    [fireActivity],
  );

  const handleMarkPurchased = useCallback(
    (item: ResultsProductCardItem) => {
      fireActivity(item.id, 'PURCHASED');
    },
    [fireActivity],
  );

  const isLiked = useCallback((id: string) => liked.has(id), [liked]);
  const isDismissed = useCallback((id: string) => dismissed.has(id), [dismissed]);
  const isPurchased = useCallback((id: string) => purchased.has(id), [purchased]);
  // The carousel filter still uses `isLiked` (BE truth) so the card stays in
  // place during the optimistic window; only the heart-icon fill flips early.
  const isHeartFilled = useCallback(
    (id: string) => liked.has(id) || pendingLikedIds.has(id),
    [liked, pendingLikedIds],
  );

  const savedItems = useMemo(
    () =>
      Array.from(liked)
        .map((id) => itemById.get(id))
        .filter((x): x is ResultsProductCardItem => Boolean(x)),
    [liked, itemById],
  );
  const purchasedItems = useMemo(
    () =>
      Array.from(purchased)
        .map((id) => itemById.get(id))
        .filter((x): x is ResultsProductCardItem => Boolean(x)),
    [purchased, itemById],
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

  if (docLoading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: 300 }}
      >
        <Spinner animation="border" role="status" />
      </div>
    );
  }

  if (!doc) {
    // BE listener resolved with no doc at this path. Either the recommendation
    // doesn't exist, or the user is on a different uid than the one that
    // created it (e.g. signed out, or session was lost before the
    // `auth.authStateReady` guard shipped). Show a real message instead of
    // hanging on a spinner.
    return (
      <Alert variant="warning" className="mt-4">
        We couldn't find this recommendation. It may have been removed, or you
        may be signed into a different account than when it was created.{' '}
        <Alert.Link href="/">Back to home</Alert.Link>.
      </Alert>
    );
  }

  const headerProps = recipientHeaderProps(doc);
  const status = session?.status ?? doc.status;
  const errorMessage = session?.errorMessage ?? doc.errorMessage;

  const discoverBody = (
    <>
      {status === 'FAILED' && (
        <Alert variant="danger">
          Something went wrong: {errorMessage || 'unknown error'}
        </Alert>
      )}
      {sessionError && status !== 'FAILED' && (
        <Alert variant="warning">
          Lost connection to live updates: {sessionError.message}
        </Alert>
      )}
      {status === 'COMPLETED' && sections.length === 0 ? (
        <ProcessingHint>
          No recommendations were generated for this submission.
        </ProcessingHint>
      ) : status === 'PROCESSING' && sections.length === 0 ? (
        <ResultsDiscoverTab
          summary={{ saves: liked.size, dismissed: dismissed.size }}
          onRefresh={() => {}}
        >
          {Array.from({ length: 3 }, (_, i) => (
            <SkeletonResultsCarousel key={`skel-row-${i}`} />
          ))}
        </ResultsDiscoverTab>
      ) : (
        <ResultsDiscoverTab
          summary={{ saves: liked.size, dismissed: dismissed.size }}
          // TODO: wire to a dedicated regenerate callable; for now the
          // button is decorative and resolves to a no-op.
          onRefresh={() => {}}
        >
          {sections.map((section, i) => (
            <ResultsCarouselAnimated
              key={section.id}
              title={section.title}
              products={section.products}
              isFirstCarousel={i === 0}
              isLiked={isLiked}
              isHeartFilled={isHeartFilled}
              isDismissed={isDismissed}
              isPurchased={isPurchased}
              exitingIds={exitingIds}
              onSaveClick={handleSaveClick}
              onDismissFinalize={handleDismissFinalize}
              onMarkPurchased={handleMarkPurchased}
            />
          ))}
        </ResultsDiscoverTab>
      )}
    </>
  );

  return (
    <ResultsPage
      {...headerProps}
      // TODO: open a profile drawer that wires to updateRecipient.
      onProfilePillClick={() => {}}
      rightActions={<HeaderAccountMenu />}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      likedCount={liked.size}
      purchasedCount={purchased.size}
    >
      {activeTab === 'recommended' && discoverBody}
      {activeTab === 'liked' && (
        <ResultsSavedGrid
          items={savedItems}
          personName={headerProps.personName}
          onUnsave={(item) => handleSaveClick(item)}
        />
      )}
      {activeTab === 'purchased' && (
        <ResultsPurchasedGrid items={purchasedItems} personName={headerProps.personName} />
      )}
    </ResultsPage>
  );
};

export default RecommendationResultsPage;
