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
import { useRecommendationDoc } from '../hooks/useRecommendationDoc';
import {
  carouselsToSections,
  recipientHeaderProps,
} from '../lib/resultsAdapters';

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

  const [activeTab, setActiveTab] = useState<ResultsTabKey>('recommended');
  const [likedIds, setLikedIds] = useState<Set<string>>(() => new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => new Set());
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(() => new Set());

  // Carousel sections come from the session — reuse the adapter so the
  // mapping (image preference order, product → card item) lives in one place
  // and is independently unit-tested.
  const sections = useMemo(
    () => (session ? carouselsToSections(session) : []),
    [session],
  );

  // Flat lookup of every card item by id so the Saved + Purchased grids can
  // hydrate from local sets without re-walking the carousels each render.
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
      // Fire-and-forget — UI feedback is local; persistence is best-effort
      // until a hydration hook lands.
      recordActivity({
        productId,
        state,
        source: 'RESULTS_PAGE',
        recipientIds: [recipientId],
      }).catch(() => {
        // Swallow — failed activity writes shouldn't block UX. Surface in
        // logs only.
      });
    },
    [recipientId],
  );

  const handleSaveClick = useCallback(
    (item: ResultsProductCardItem) => {
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (next.has(item.id)) {
          // Toggle off in UI; no UNLIKE state in the activity enum, so the
          // BE write is intentionally skipped on un-save until we add a
          // dedicated unsave endpoint.
          next.delete(item.id);
        } else {
          next.add(item.id);
          fireActivity(item.id, 'SAVED');
        }
        return next;
      });
    },
    [fireActivity],
  );

  const handleDismissFinalize = useCallback(
    (item: ResultsProductCardItem) => {
      setDismissedIds((prev) => {
        if (prev.has(item.id)) return prev;
        const next = new Set(prev);
        next.add(item.id);
        return next;
      });
      fireActivity(item.id, 'DISMISSED');
    },
    [fireActivity],
  );

  const handleMarkPurchased = useCallback(
    (item: ResultsProductCardItem) => {
      setPurchasedIds((prev) => {
        if (prev.has(item.id)) return prev;
        const next = new Set(prev);
        next.add(item.id);
        return next;
      });
      fireActivity(item.id, 'PURCHASED');
    },
    [fireActivity],
  );

  const isLiked = useCallback((id: string) => likedIds.has(id), [likedIds]);
  const isDismissed = useCallback((id: string) => dismissedIds.has(id), [dismissedIds]);
  const isPurchased = useCallback((id: string) => purchasedIds.has(id), [purchasedIds]);

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

  const savedItems = Array.from(likedIds)
    .map((id) => itemById.get(id))
    .filter((x): x is ResultsProductCardItem => Boolean(x));
  const purchasedItems = Array.from(purchasedIds)
    .map((id) => itemById.get(id))
    .filter((x): x is ResultsProductCardItem => Boolean(x));

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
          summary={{ saves: likedIds.size, dismissed: dismissedIds.size }}
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
      activeTab={activeTab}
      onTabChange={setActiveTab}
      likedCount={likedIds.size}
      purchasedCount={purchasedIds.size}
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
