import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { Alert, Spinner } from 'react-bootstrap';

import { ResultsPage } from '../../components/landing/results/ResultsPage';
import { AlertDialog } from '../../components/ui/AlertDialog';
import { ResultsDiscoverTab } from '../../components/landing/results/ResultsDiscoverTab';
import { ResultsCarouselAnimated } from '../../components/landing/results/ResultsCarouselAnimated';
import { SkeletonResultsCarousel } from '../../components/landing/results/ResultsCarousel';
import { ResultsSavedGrid } from '../../components/landing/results/ResultsSavedGrid';
import { ResultsPurchasedGrid } from '../../components/landing/results/ResultsPurchasedGrid';
import { ProfileDrawer } from '../../components/landing/results/ProfileDrawer';
import { useProfileDrawer } from '../../components/landing/results/useProfileDrawer';
import type {
  ResultsProductCardItem,
  ResultsTabKey,
} from '../../components/landing/results/types';
import { getInterestPills } from '../../components/landing/quiz/ageBasedContent';
import { getQuizPlaceholder } from '../../components/landing/quiz/useQuizFlow';

import { recordActivity, updateRecipient } from '../callables';
import { useCarouselSession } from '../hooks/useCarouselSession';
import { useExitAnimationQueue } from '../hooks/useExitAnimationQueue';
import { useGiftActivities } from '../hooks/useGiftActivities';
import { useLeaveWarning } from '../hooks/useLeaveWarning';
import { useBackButtonGuard } from '../hooks/useBackButtonGuard';
import { useRecommendationDoc } from '../hooks/useRecommendationDoc';
import { useRedirectOnSignOut } from '../hooks/useRedirectOnSignOut';
import { useRegenerate } from '../hooks/useRegenerate';
import {
  carouselsToSections,
  mergeHeaderWithDraft,
  recipientHeaderProps,
} from '../lib/resultsAdapters';
import {
  recommendationToProfileDraft,
  profileDraftToUpdateRecipient,
  profileDraftToRegenerateRequest,
} from '../lib/profileDraftAdapter';
import { useAuthGate } from '../auth/AuthGateContext';
import { HeaderAccountMenu } from '../auth/HeaderAccountMenu';
import { useAuth } from '../firebase/FirebaseContext';
import { gaQuizResultsViewed, gaSelectItem } from '../lib/gaPixel';
import { ageBucket, metaQuizResultsViewed, metaViewContent } from '../lib/metaPixel';

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

// Sentinel draft used while the recommendation doc is still loading. Hooks
// must be called unconditionally, so `useProfileDrawer` gets this and resets
// to the real draft when the doc resolves (its useEffect on `initial` keeps
// the draft in sync with whatever we pass).
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
  // If the user signs out (or signOut is called and they fall back to a fresh
  // anon), the rec doc under the prior uid is no longer readable — redirect
  // home rather than render the "couldn't find this recommendation" alert.
  useRedirectOnSignOut('/');
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
  const navigate = useNavigate();
  const { state: regenerateState, regenerate, reset: resetRegenerate } = useRegenerate();

  const [activeTab, setActiveTab] = useState<ResultsTabKey>('recommended');
  // Logo-click confirmation: navigating away loses the in-flight quiz
  // results for anon users (the rec doc is preserved server-side, but
  // reaching it again requires re-quizzing). Mirror the OLD givethea.com
  // pattern: AlertDialog with "Stay" / "Leave" before navigating home.
  //
  // For signed-in users, results are persisted to their account, so the
  // "you'll lose your results" copy is wrong/confusing — `skipWhenSignedIn`
  // routes them straight to `/` without the dialog (bug #46).
  const leaveWarning = useLeaveWarning('/', { skipWhenSignedIn: true });
  // Browser back / mobile swipe-back: anon users get the same leave dialog
  // they get from the wordmark click. Signed-in users have their results
  // persisted server-side, so we leave the natural back behavior alone for
  // them (bug #62). `isSignedIn` is reactive — if an anon user signs in
  // while on this page, the guard disarms on the next render.
  useBackButtonGuard(!leaveWarning.isSignedIn, leaveWarning.requestLeave);
  const exitingIds = useExitAnimationQueue(liked, hydrated, EXIT_ANIMATION_MS);

  const isRefreshing = regenerateState.status === 'regenerating';

  // When the regenerate round-trip resolves, swap the URL so the page
  // remounts on the freshly minted recommendationId. Until that resolves we
  // KEEP the current page mounted (carousels visible, dimmed via the
  // `refreshing` prop) so the user never sees a skeleton flash (bug #43).
  const handleRefresh = useCallback(() => {
    if (!recipientId || !doc) return;
    if (regenerateState.status === 'regenerating') return;
    regenerate({ recipientId, recommendation: doc })
      .then((res) => {
        navigate(`/quiz/results/${res.recipientId}/${res.recommendationId}`);
      })
      .catch(() => {
        // state.status === 'error' surfaces inline below.
      });
  }, [recipientId, doc, regenerateState.status, regenerate, navigate]);

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
    () => (session && doc ? carouselsToSections(session, doc.input, doc.recipientSnapshot) : []),
    [session, doc],
  );

  // Fire Meta pixel `QuizResultsViewed` exactly once per recommendation when
  // the session lands in COMPLETED with at least one carousel. Guarded by a
  // ref-via-state so re-renders / heart clicks don't refire.
  const [pixelResultsFired, setPixelResultsFired] = useState(false);
  useEffect(() => {
    if (pixelResultsFired) return;
    const sessStatus = session?.status ?? doc?.status;
    if (sessStatus !== 'COMPLETED') return;
    if (sections.length === 0) return;
    const productCount = sections.reduce((acc, s) => acc + s.products.length, 0);
    const resultsParams = {
      occasion: doc?.input?.occasion,
      relationship: doc?.recipientSnapshot?.relationship,
      age_bucket: ageBucket(doc?.recipientSnapshot?.age ?? undefined),
      interest_count: doc?.input?.interests?.length ?? 0,
      carousel_count: sections.length,
      product_count: productCount,
    };
    metaQuizResultsViewed(resultsParams);
    gaQuizResultsViewed(resultsParams);
    setPixelResultsFired(true);
  }, [pixelResultsFired, session?.status, doc, sections]);

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

  // Bug #23 — wire the search-pill pencil to the existing slide-over drawer.
  // Builds the initial draft from the recipient snapshot + recommendation
  // input frozen on the doc.
  //
  // Bug #51 — the "Update picks" CTA dispatches based on what the user
  // changed. Algo-triggering fields (gender/age/interests/freeform/
  // relationship/occasion/vibes) drive a regenerate via `useRegenerate` with
  // a draft-built payload override; the new recipient state is upserted
  // server-side as part of the same submitGiftFlow call. Recipient-only
  // edits (name/emoji) don't enable the button — they auto-save through
  // `theaWebUpdateRecipient` when the drawer closes.
  const initialDraft = useMemo(
    () => (doc ? recommendationToProfileDraft(doc) : EMPTY_DRAFT),
    [doc],
  );

  // "Update picks" path — fires only when an algo-triggering field changed
  // (drawer's `isDirty` gates the button). Builds an override payload and
  // hands it to `useRegenerate`; on success we navigate to the new rec URL
  // so the page remounts on fresh results, mirroring `handleRefresh`.
  const handleUpdatePicks = useCallback(
    (next: typeof initialDraft) => {
      if (!recipientId || !doc) return;
      if (regenerateState.status === 'regenerating') return;
      const requestOverride = profileDraftToRegenerateRequest(next, recipientId, doc);
      regenerate({ recipientId, recommendation: doc, requestOverride })
        .then((res) => {
          navigate(`/quiz/results/${res.recipientId}/${res.recommendationId}`);
        })
        .catch(() => {
          // state.status === 'error' surfaces inline below.
        });
    },
    [recipientId, doc, regenerateState.status, regenerate, navigate],
  );

  // Auto-save path — only fires on drawer close when the user changed
  // recipient-only fields (name/emoji). The "Update picks" CTA stays
  // disabled for these per bug #51, so without this hook the edits would
  // be silently dropped.
  const handleAutoSaveOnClose = useCallback(
    (next: typeof initialDraft) => {
      if (!recipientId) return;
      const req = profileDraftToUpdateRecipient(next, recipientId);
      if (Object.keys(req).length <= 1) return;
      updateRecipient(req).catch((err) => {
        // BE listener will heal back to truth on next read; surface to
        // console for now since the drawer has no toast surface yet.
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

  // Reactive to the live draft so the chip set + freeform placeholder
  // update as the user edits gender/age/relationship inside the drawer
  // (bug #51). Falling back to sane defaults when those fields are
  // temporarily cleared keeps the helper functions from blowing up.
  const liveAge = drawer.draft.age ?? 30;
  const liveGender = drawer.draft.gender ?? 'other';
  const liveRelationship = drawer.draft.relationship ?? '';
  const interestPills = useMemo(
    () => getInterestPills(liveAge, liveGender),
    [liveAge, liveGender],
  );
  // Relationship-specific copy ("She's been getting into mahjong" for Mom)
  // — same function the quiz uses, so the textarea hint matches the quiz
  // step the user just completed.
  const freeformPlaceholder = useMemo(
    () => getQuizPlaceholder(liveGender, liveRelationship),
    [liveGender, liveRelationship],
  );

  // Live price filter (bug #51) — price is a client-side filter, not an
  // algo input, so we apply it to the rendered carousels as the user drags
  // the slider rather than waiting for an Update picks click. Sections that
  // become empty after filtering are dropped so the user doesn't see
  // skeleton-shaped empty carousels.
  const priceMin = drawer.draft.priceMin ?? 0;
  const priceMax = drawer.draft.priceMax ?? Number.POSITIVE_INFINITY;
  const filteredSections = useMemo(() => {
    return sections
      .map((s) => ({
        ...s,
        products: s.products.filter((p) => {
          if (p.price === undefined || p.price === null) return true;
          return p.price >= priceMin && p.price <= priceMax;
        }),
      }))
      .filter((s) => s.products.length > 0);
  }, [sections, priceMin, priceMax]);

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
      // Mirror the heart's auth-gate pattern. If the user is anonymous, open
      // the sign-in modal and stage the PURCHASED write to fire after auth
      // completes — never write under the throwaway anon uid (otherwise the
      // purchased state is stranded once they sign in for real). The carousel
      // filter reads BE-truth `purchased` to hide the card, so since we
      // don't fire the activity until auth lands, the card naturally stays
      // in place during the modal — same intent-preservation behavior as
      // the heart, no extra optimistic state needed.
      if (auth.currentUser?.isAnonymous !== false) {
        requestSignIn({
          mode: 'signup',
          onAuthed: () => fireActivity(item.id, 'PURCHASED'),
        });
        return;
      }
      fireActivity(item.id, 'PURCHASED');
    },
    [fireActivity, requestSignIn],
  );

  // Map product id → carousel title so ViewContent can carry content_category
  // (helpful for Meta's audience modeling) without re-walking sections on each
  // click.
  const carouselTitleById = useMemo(() => {
    const map = new Map<string, string>();
    for (const section of sections) {
      for (const item of section.products) map.set(item.id, section.title);
    }
    return map;
  }, [sections]);

  const handleProductClick = useCallback(
    (item: ResultsProductCardItem) => {
      // Fire pixels BEFORE opening the new tab so a popup-blocker / mobile
      // Safari race never strands the event.
      const category = carouselTitleById.get(item.id) || 'quiz_results';
      metaViewContent({
        content_name: item.title,
        content_ids: [item.id],
        content_category: category,
        value: item.price,
        currency: 'USD',
      });
      gaSelectItem({
        item_id: item.id,
        item_name: item.title,
        item_category: category,
        price: item.price,
        currency: 'USD',
      });
      if (item.productUrl) {
        window.open(item.productUrl, '_blank', 'noopener,noreferrer');
      }
    },
    [carouselTitleById],
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

  // Header reads from the rec's frozen `recipientSnapshot` (so old recs
  // preserve their historical view). For the LIVE rec on screen, layer in
  // any in-drawer name/emoji edits so the search pill reflects them —
  // both while the drawer is open (live preview) and after close
  // (recipient-only edits auto-save via `updateRecipient` but the snapshot
  // stays stale until the next regenerate). Bug #51 followup.
  const headerProps = mergeHeaderWithDraft(recipientHeaderProps(doc), {
    name: drawer.draft.name,
    emoji: drawer.draft.emoji,
  });
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
      {regenerateState.status === 'error' && (
        <Alert
          variant="danger"
          dismissible
          onClose={resetRegenerate}
        >
          We couldn't refresh your picks: {regenerateState.error.message}
        </Alert>
      )}
      {status === 'COMPLETED' && sections.length === 0 ? (
        <ProcessingHint>
          No recommendations were generated for this submission.
        </ProcessingHint>
      ) : status === 'PROCESSING' && sections.length === 0 ? (
        <ResultsDiscoverTab
          summary={{ saves: liked.size, dismissed: dismissed.size }}
          // While loading, hide the "more you react" summary banner — there
          // are no products under it yet, so it reads as broken (bug #35).
          showSummary={false}
          onRefresh={handleRefresh}
          refreshing={isRefreshing}
        >
          {Array.from({ length: 3 }, (_, i) => (
            <SkeletonResultsCarousel key={`skel-row-${i}`} />
          ))}
        </ResultsDiscoverTab>
      ) : (
        <ResultsDiscoverTab
          summary={{ saves: liked.size, dismissed: dismissed.size }}
          // Only render the summary banner once we actually have products
          // for the user to react to (bug #35).
          showSummary={status === 'COMPLETED' && sections.length > 0}
          onRefresh={handleRefresh}
          refreshing={isRefreshing}
        >
          {filteredSections.map((section, i) => (
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
              onProductClick={handleProductClick}
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
    <>
      <ResultsPage
        {...headerProps}
        onLogoClick={leaveWarning.requestLeave}
        onProfilePillClick={drawer.openDrawer}
        rightActions={<HeaderAccountMenu />}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        likedCount={liked.size}
        purchasedCount={purchased.size}
        drawers={
          <AlertDialog
            open={leaveWarning.open}
            onClose={leaveWarning.cancelLeave}
            title="Leave your gift results?"
            description="You'll need to retake the quiz to see these recommendations again."
            primaryAction={{ label: 'Leave', onClick: leaveWarning.confirmLeave, variant: 'primary' }}
            secondaryAction={{ label: 'Stay', onClick: leaveWarning.cancelLeave, variant: 'ghost' }}
          />
        }
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
