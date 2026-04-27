import React, { useCallback, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { Alert, Spinner } from 'react-bootstrap';

import { ResultsPage } from '../../components/landing/results/ResultsPage';
import { ResultsDiscoverTab } from '../../components/landing/results/ResultsDiscoverTab';
import { ResultsCarouselAnimated } from '../../components/landing/results/ResultsCarouselAnimated';
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

const StatusBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: hsl(var(--muted-foreground));
  margin-bottom: 16px;
`;

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
      recordActivity({
        productId,
        state,
        source: 'RESULTS_PAGE',
        recipientIds: [recipientId],
      }).catch(() => {
        // Swallow — failed activity writes shouldn't block UX. Surface in
        // logs only. The Firestore listener is the source of truth, so a
        // dropped write means the heart simply won't fill.
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
      {status === 'PROCESSING' && sections.length === 0 && (
        <StatusBanner>
          <Spinner animation="border" size="sm" /> Setting up your carousels…
        </StatusBanner>
      )}
      {status === 'COMPLETED' && sections.length === 0 ? (
        <ProcessingHint>
          No recommendations were generated for this submission.
        </ProcessingHint>
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
