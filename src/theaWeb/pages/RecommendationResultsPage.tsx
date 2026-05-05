import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

import type { Recommendation } from '../schemas';
import { recordActivity, updateRecipient } from '../callables';
import { openExternal } from '../lib/openExternal';
import { useCarouselSession } from '../hooks/useCarouselSession';
import { useExitAnimationQueue } from '../hooks/useExitAnimationQueue';
import { useGiftActivities, type GiftActivityDetail } from '../hooks/useGiftActivities';
import { useLeaveWarning } from '../hooks/useLeaveWarning';
import { useBackButtonGuard } from '../hooks/useBackButtonGuard';
import { useRecommendationDoc } from '../hooks/useRecommendationDoc';
import { useRedirectOnSignOut } from '../hooks/useRedirectOnSignOut';
import { useRegenerate } from '../hooks/useRegenerate';
import { buildPreferenceSignals } from '../lib/preferenceSignals';
import {
  carouselsToSections,
  isSessionReadyToDisplay,
  mergeHeaderWithDraft,
  recipientHeaderProps,
  type ResultsCarouselSection,
} from '../lib/resultsAdapters';
import {
  recommendationToProfileDraft,
  profileDraftToUpdateRecipient,
  profileDraftToRegenerateRequest,
} from '../lib/profileDraftAdapter';
import { useAuthGate } from '../auth/AuthGateContext';
import { HeaderAccountMenu } from '../auth/HeaderAccountMenu';
import { useAuth } from '../firebase/FirebaseContext';
import {
  gaProductDismissed,
  gaProductSaved,
  gaQuizResultsProductClick,
  gaQuizResultsViewed,
  gaRegenerateRecommendations,
  gaSelectItem,
  type GaProductReactionParams,
} from '../lib/gaPixel';
import { ageBucket, metaQuizResultsViewed, metaViewContent } from '../lib/metaPixel';
import { useTimeToFirstResult } from '../hooks/useTimeToFirstResult';
import { logEvent } from '../lib/eventSink';

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
  const {
    liked,
    dismissed,
    purchased,
    likedDetails,
    dismissedDetails,
    purchasedDetails,
    hydrated,
  } = useGiftActivities(recipientId);
  const navigate = useNavigate();
  const { state: regenerateState, regenerate, reset: resetRegenerate } = useRegenerate();

  // Generic preference primitives the carousel callable consumes — built
  // from the recipient's prior `giftActivity` so the agent can adapt to
  // user signal across regenerates. The combination + cap logic lives in
  // `lib/preferenceSignals.ts` so it's covered by unit tests.
  const preferenceSignals = useMemo(
    () => buildPreferenceSignals(likedDetails, dismissedDetails, purchasedDetails),
    [likedDetails, dismissedDetails, purchasedDetails],
  );

  // Per-session counter — increments each time the user enters a regenerate
  // state. Threaded onto every product_saved / product_dismissed event so the
  // dashboard can answer "do users save more on a regenerated set than on
  // their original picks?" 0 means acting on the original results; 1+ means
  // acting on a refreshed/updated set.
  const regenerateCountRef = useRef(0);
  const prevRegenerateStatusRef = useRef<string | undefined>(regenerateState.status);
  useEffect(() => {
    if (
      prevRegenerateStatusRef.current !== 'regenerating' &&
      regenerateState.status === 'regenerating'
    ) {
      regenerateCountRef.current += 1;
    }
    prevRegenerateStatusRef.current = regenerateState.status;
  }, [regenerateState.status]);

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

  // Carousel sections come from the session — declared early so the
  // refresh-snapshot pattern below can capture the current sections at
  // refresh-start time. The pixel-fire useEffect further down also reads
  // these (live).
  const sections = useMemo(
    () => (session && doc ? carouselsToSections(session, doc.input, doc.recipientSnapshot) : []),
    [session, doc],
  );

  // Refresh-snapshot pattern (bug #43). The flicker on "Refresh my picks"
  // came from the URL transition between the OLD recommendationId and the
  // NEW one: regenerate() returns IDs the moment the BE call completes, but
  // the carousel pipeline is still streaming products into the new session
  // for ~5-15s after that. During that window the page would render the new
  // (empty) session as skeletons before the new content arrived.
  //
  // Fix: snapshot {doc, sections} at the moment the user clicks Refresh,
  // and keep using the snapshot for rendering through the URL change AND
  // through the new session's PROCESSING window. Clear the snapshot once
  // the new session is ready (has carousels or completed). The user sees
  // continuous content with the "Refreshing…" overlay throughout.
  // The clear-effect must wait until we're looking at the NEW session, not
  // the OLD one. Without `expectedRecommendationId`, the effect fires the
  // moment the snapshot is set — because the LIVE session at that instant
  // is still the OLD COMPLETED one, satisfying isSessionReadyToDisplay.
  // We populate this field after regenerate resolves; the clear-effect
  // checks `doc.recommendationId === expectedRecommendationId` before
  // looking at session status.
  const [refreshSnapshot, setRefreshSnapshot] = useState<{
    doc: Recommendation;
    sections: ResultsCarouselSection[];
    expectedRecommendationId: string | null;
  } | null>(null);

  const isRefreshing = regenerateState.status === 'regenerating' || !!refreshSnapshot;

  const handleRefresh = useCallback(() => {
    if (!recipientId || !doc) return;
    if (regenerateState.status === 'regenerating') return;
    // Fire `regenerate_recommendations` BEFORE invoking regenerate so the
    // dashboard can denominator the cohort even when the regenerate call
    // fails or the user navigates away mid-pipeline. The counter ref
    // increments via the useEffect that watches regenerateState.status.
    gaRegenerateRecommendations({
      path: 'refresh_my_picks_button',
      prior_carousel_count: sections.length,
      ...(doc.recipientSnapshot?.relationship !== undefined
        ? { relationship: doc.recipientSnapshot.relationship }
        : {}),
      ...(doc.input?.occasion !== undefined ? { occasion: doc.input.occasion } : {}),
      ...(doc.carouselSessionId !== undefined
        ? { carousel_session_id: doc.carouselSessionId }
        : {}),
    });
    // Capture pre-regenerate state. expectedRecommendationId is null until
    // regenerate resolves with the new id — see the clear-effect below.
    setRefreshSnapshot({ doc, sections, expectedRecommendationId: null });
    regenerate({ recipientId, recommendation: doc, preferenceSignals })
      .then((res) => {
        // Stamp the expected new id so the clear-effect knows when the
        // page has actually loaded the new doc, not the old one.
        setRefreshSnapshot((prev) =>
          prev ? { ...prev, expectedRecommendationId: res.recommendationId } : null,
        );
        navigate(`/quiz/results/${res.recipientId}/${res.recommendationId}`);
      })
      .catch(() => {
        // Drop the snapshot on error so the user sees the inline error UI
        // (regenerateState.status === 'error') against the current page
        // rather than against frozen old content.
        setRefreshSnapshot(null);
      });
  }, [recipientId, doc, sections, regenerateState.status, regenerate, navigate, preferenceSignals]);

  // Clear the snapshot once we're actually viewing the NEW session AND the
  // pipeline has reached a terminal state. Both gates are required —
  // without the recommendationId check the effect fires immediately because
  // the OLD session is still COMPLETED at the moment of click.
  useEffect(() => {
    if (!refreshSnapshot) return;
    if (!refreshSnapshot.expectedRecommendationId) return;
    if (doc?.recommendationId !== refreshSnapshot.expectedRecommendationId) return;
    if (isSessionReadyToDisplay(session)) {
      setRefreshSnapshot(null);
    }
  }, [refreshSnapshot, doc?.recommendationId, session]);

  // Safety net: if the agent hangs and the new session never reaches a
  // terminal state, clear the snapshot after 30s so the user isn't locked
  // into a dimmed-old-content view forever. Whatever the new session has
  // at that point gets shown — usually skeletons + the regenerate-error
  // alert if the BE actually failed (bug #43).
  useEffect(() => {
    if (!refreshSnapshot) return;
    const timer = setTimeout(() => setRefreshSnapshot(null), 30_000);
    return () => clearTimeout(timer);
  }, [refreshSnapshot]);

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
      age_range: ageBucket(doc?.recipientSnapshot?.age ?? undefined),
      interest_count: doc?.input?.interests?.length ?? 0,
      carousel_count: sections.length,
      product_count: productCount,
    };
    metaQuizResultsViewed(resultsParams);
    // GA4 carries carousel_session_id additionally so the dashboard can join this
    // event to the same `carousel_session_id` carried by quiz_search_submitted +
    // every product_saved/dismissed event for cross-event funnel analysis.
    gaQuizResultsViewed({
      ...resultsParams,
      ...(doc?.carouselSessionId !== undefined
        ? { carousel_session_id: doc.carouselSessionId }
        : {}),
    });
    setPixelResultsFired(true);
  }, [pixelResultsFired, session?.status, doc, sections]);

  // LCP-anchored time-to-first-result analytics (spec §14). The hook installs
  // a PerformanceObserver for the LCP entry and fires `time_to_first_result_ms`
  // exactly once per recommendation, with sub-timings for submit-callable,
  // agent-phase, and nav-to-LCP. Only fires when the submit pipeline laid
  // down its `thea-submit-click` + `thea-submit-callable-resolve` marks (i.e.,
  // the user came in via a real submission, not a deep link).
  useTimeToFirstResult({
    isReady: session?.status === 'COMPLETED' && sections.length > 0,
    occasion: doc?.input?.occasion,
    relationship: doc?.recipientSnapshot?.relationship,
    sessionId: doc?.carouselSessionId,
  });

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
  // (drawer's `isDirty` gates the button). Same flicker-prevention snapshot
  // as `handleRefresh` (bug #43): without it, the URL transition + new
  // session loading would render blank cards then half-streamed carousels.
  const handleUpdatePicks = useCallback(
    (next: typeof initialDraft) => {
      if (!recipientId || !doc) return;
      if (regenerateState.status === 'regenerating') return;
      // Fire `regenerate_recommendations` (path=update_picks_from_drawer) on
      // intent — same pattern as handleRefresh. The dashboard splits these
      // two paths to compare drawer-edit vs in-place-refresh engagement.
      gaRegenerateRecommendations({
        path: 'update_picks_from_drawer',
        prior_carousel_count: sections.length,
        ...(doc.recipientSnapshot?.relationship !== undefined
          ? { relationship: doc.recipientSnapshot.relationship }
          : {}),
        ...(doc.input?.occasion !== undefined ? { occasion: doc.input.occasion } : {}),
        ...(doc.carouselSessionId !== undefined
          ? { carousel_session_id: doc.carouselSessionId }
          : {}),
      });
      setRefreshSnapshot({ doc, sections, expectedRecommendationId: null });
      const requestOverride = profileDraftToRegenerateRequest(next, recipientId, doc);
      regenerate({ recipientId, recommendation: doc, requestOverride, preferenceSignals })
        .then((res) => {
          setRefreshSnapshot((prev) =>
            prev ? { ...prev, expectedRecommendationId: res.recommendationId } : null,
          );
          navigate(`/quiz/results/${res.recipientId}/${res.recommendationId}`);
        })
        .catch(() => {
          setRefreshSnapshot(null);
        });
    },
    [recipientId, doc, sections, regenerateState.status, regenerate, navigate, preferenceSignals],
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
    // Use the refresh snapshot's sections during a refresh so the price
    // filter operates on what the user is actually looking at (bug #43).
    const source = refreshSnapshot ? refreshSnapshot.sections : sections;
    return source
      .map((s) => ({
        ...s,
        products: s.products.filter((p) => {
          if (p.price === undefined || p.price === null) return true;
          return p.price >= priceMin && p.price <= priceMax;
        }),
      }))
      .filter((s) => s.products.length > 0);
  }, [refreshSnapshot, sections, priceMin, priceMax]);

  // Map product id → carousel title + zero-based card position. Used by the
  // pixel fire sites (save / dismiss / click) so each event carries the
  // dashboard-segment fields without re-walking sections on every fire.
  // Declared here (above handleSaveClick) so the cohort builder is in scope
  // before the save/dismiss handlers reference it in their deps array.
  const carouselTitleById = useMemo(() => {
    const map = new Map<string, string>();
    for (const section of sections) {
      for (const item of section.products) map.set(item.id, section.title);
    }
    return map;
  }, [sections]);
  const cardPositionById = useMemo(() => {
    const map = new Map<string, number>();
    for (const section of sections) {
      section.products.forEach((item, i) => map.set(item.id, i));
    }
    return map;
  }, [sections]);

  // Build the cohort-rich param shape every product_saved / product_dismissed
  // / quiz_results_product_click event needs. Hoisted so each fire site
  // doesn't repeat the same field plumbing — the dashboard wants the recipient
  // + occasion + regenerate_count fields on every reaction so it can pivot.
  const buildProductReactionParams = useCallback(
    (item: ResultsProductCardItem): GaProductReactionParams => ({
      product_id: item.id,
      product_name: item.title,
      ...(item.brand !== undefined ? { brand: item.brand } : {}),
      ...(item.price !== undefined ? { price: item.price } : {}),
      carousel_name: carouselTitleById.get(item.id) || 'quiz_results',
      card_position: cardPositionById.get(item.id) ?? 0,
      ...(doc?.recipientSnapshot?.relationship !== undefined
        ? { relationship: doc.recipientSnapshot.relationship }
        : {}),
      ...(doc?.input?.occasion !== undefined ? { occasion: doc.input.occasion } : {}),
      ...(doc?.recipientSnapshot?.gender !== undefined
        ? { gender: doc.recipientSnapshot.gender }
        : {}),
      ...(doc?.recipientSnapshot?.age != null
        ? (() => {
            const ab = ageBucket(doc.recipientSnapshot.age);
            return ab !== undefined ? { age_range: ab } : {};
          })()
        : {}),
      regenerate_count: regenerateCountRef.current,
      ...(doc?.carouselSessionId !== undefined
        ? { carousel_session_id: doc.carouselSessionId }
        : {}),
    }),
    [carouselTitleById, cardPositionById, doc],
  );

  // Same shape but for the first-party event sink (ranker-telemetry path).
  // Adds recommendation_id + recipient_id, which we deliberately keep OUT of
  // GA4 events to honor the gaPixel.ts "no PII" comment — the first-party
  // sink already has user_id, so the join is intentional and accountable.
  const buildSinkProductProps = useCallback(
    (item: ResultsProductCardItem): Record<string, unknown> => {
      const ga = buildProductReactionParams(item);
      return {
        product_id: ga.product_id,
        product_name: ga.product_name,
        ...(ga.brand !== undefined ? { brand: ga.brand } : {}),
        ...(ga.price !== undefined ? { price: ga.price } : {}),
        carousel_name: ga.carousel_name,
        card_position: ga.card_position,
        regenerate_count: ga.regenerate_count,
        ...(ga.relationship !== undefined ? { relationship: ga.relationship } : {}),
        ...(ga.occasion !== undefined ? { occasion: ga.occasion } : {}),
        ...(ga.gender !== undefined ? { gender: ga.gender } : {}),
        ...(ga.age_range !== undefined ? { age_range: ga.age_range } : {}),
        ...(ga.carousel_session_id !== undefined
          ? { session_id: ga.carousel_session_id }
          : {}),
        ...(doc?.recommendationId !== undefined
          ? { recommendation_id: doc.recommendationId }
          : {}),
        ...(recipientId !== undefined ? { recipient_id: recipientId } : {}),
      };
    },
    [buildProductReactionParams, doc, recipientId],
  );

  // Stable impression-context for ResultsCarouselAnimated. Passed once per
  // render rather than per-card; the carousel does the per-card fan-out.
  // Keyed by carouselSessionId so changing recommendations causes the
  // children to remount their impression hooks.
  const impressionContext = useMemo(
    () => ({
      sessionId: doc?.carouselSessionId,
      recommendationId: doc?.recommendationId,
      recipientId,
      relationship: doc?.recipientSnapshot?.relationship,
      occasion: doc?.input?.occasion,
      gender: doc?.recipientSnapshot?.gender,
      ageRange:
        doc?.recipientSnapshot?.age != null
          ? ageBucket(doc.recipientSnapshot.age)
          : undefined,
      regenerateCount: regenerateCountRef.current,
    }),
    [doc, recipientId],
  );

  const handleSaveClick = useCallback(
    (item: ResultsProductCardItem) => {
      // No UNSAVED state on the BE — un-save is a follow-up endpoint. Until
      // then, a second click on an already-liked product is a no-op.
      if (liked.has(item.id)) return;

      // Fire `product_saved` on INTENT (i.e. at click time), not after the
      // optional sign-in modal resolves. Anon users who bail out of the auth
      // gate should still be counted in the save-intent dashboard cell — the
      // BE just won't have the activity row. Matches the old v6 behavior.
      gaProductSaved(buildProductReactionParams(item));
      // Mirror to first-party event sink for ranker training.
      logEvent('product_saved', buildSinkProductProps(item));

      // Persist under the current uid (anon or permanent). For anon users,
      // `mergeGiftFlow` migrates the giftActivity into the permanent uid on
      // sign-in (every sign-in path in `accountAuth.ts` already invokes it),
      // so we don't need a post-auth replay closure. This is what makes the
      // mobile redirect path work: `signInWithRedirect` reloads the entire
      // tab, which would have erased any in-memory `onAuthed` ref the modal
      // used to depend on. Bug 1 in the mobile-auth TDD plan.
      fireActivity(item.id, 'SAVED');

      // Conversion nudge for anon users — opens the modal so the heart can
      // promote to a permanent account. The save itself is already in flight,
      // so dismissing the modal is harmless (the heart sticks under the anon
      // uid and migrates on the next sign-in).
      if (auth.currentUser?.isAnonymous !== false) {
        requestSignIn({ mode: 'signup' });
      }
    },
    // `auth.currentUser?.isAnonymous` is intentionally omitted — touching this
    // closure on auth changes would invalidate the optimistic-heart UI in flight.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [liked, fireActivity, requestSignIn, buildProductReactionParams, buildSinkProductProps],
  );

  const handleDismissFinalize = useCallback(
    (item: ResultsProductCardItem) => {
      // Anon users CAN dismiss (BE only requires auth.uid which the anon
      // session provides). Fire unconditionally — matches BE behavior.
      gaProductDismissed(buildProductReactionParams(item));
      logEvent('product_dismissed', buildSinkProductProps(item));
      fireActivity(item.id, 'DISMISSED');
    },
    [fireActivity, buildProductReactionParams, buildSinkProductProps],
  );

  const handleMarkPurchased = useCallback(
    (item: ResultsProductCardItem) => {
      // Same shape as `handleSaveClick`: write under the current uid (anon
      // or permanent), let `mergeGiftFlow` migrate on sign-in. Avoids the
      // mobile redirect bug where an in-memory onAuthed ref was destroyed
      // by the post-OAuth tab reload. Bug 1 in the mobile-auth TDD plan.
      logEvent('product_purchased', buildSinkProductProps(item));
      fireActivity(item.id, 'PURCHASED');

      // Conversion nudge for anon users — same shape as the heart-save
      // modal. Dismissing it is harmless because the activity is already
      // persisted under the anon uid.
      if (auth.currentUser?.isAnonymous !== false) {
        requestSignIn({ mode: 'signup' });
      }
    },
    // Same exhaustive-deps tradeoff as `handleSaveClick` above — see note there.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fireActivity, requestSignIn, buildSinkProductProps],
  );

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
      // V6-shape companion to gaSelectItem — keeps the v6 dashboard's SQL
      // queries against `quiz_results_product_click` working without dropping
      // GA4's standard select_item (used by Enhanced Ecommerce reports).
      // See spec §11.11 (decision 12.1: fire BOTH).
      gaQuizResultsProductClick({
        product_id: item.id,
        product_name: item.title,
        ...(item.brand !== undefined ? { brand: item.brand } : {}),
        ...(item.price !== undefined ? { price: item.price } : {}),
        destination_url: item.productUrl ?? '',
        carousel_name: category,
        card_position: cardPositionById.get(item.id) ?? 0,
        ...(doc?.recipientSnapshot?.relationship !== undefined
          ? { relationship: doc.recipientSnapshot.relationship }
          : {}),
        ...(doc?.input?.occasion !== undefined ? { occasion: doc.input.occasion } : {}),
        ...(doc?.carouselSessionId !== undefined
          ? { carousel_session_id: doc.carouselSessionId }
          : {}),
      });
      // First-party mirror — the ranker treats clicks as a mid-strength
      // positive signal; carries destination_url for downstream attribution
      // joins.
      logEvent('product_clicked', {
        ...buildSinkProductProps(item),
        destination_url: item.productUrl ?? '',
      });
      if (item.productUrl) {
        openExternal(item.productUrl);
      }
    },
    [carouselTitleById, cardPositionById, doc, buildSinkProductProps],
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

  // Snapshot fallback: when an activity's product is no longer in the
  // currently rendered carousel sections (most often after a regenerate),
  // synthesize a card item from the frozen `productSnapshot` instead of
  // dropping it. The grids would otherwise show empty-state copy while the
  // tab badge — which counts straight off the BE-truth Set — still says >0.
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
  const purchasedItems = useMemo(
    () =>
      Array.from(purchased)
        .map((id) => itemById.get(id) ?? fromSnapshot(id))
        .filter((x): x is ResultsProductCardItem => Boolean(x)),
    [purchased, itemById, fromSnapshot],
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

  // While a refresh is in flight (or the new session is still warming up
  // post-URL-change), keep rendering the snapshot of the old doc + sections
  // so the user sees continuous content instead of a flash of skeletons.
  // Bug #43.
  const displayDoc = refreshSnapshot?.doc ?? doc;
  const displaySections = refreshSnapshot ? refreshSnapshot.sections : sections;

  if (!displayDoc) {
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
  const headerProps = mergeHeaderWithDraft(recipientHeaderProps(displayDoc), {
    name: drawer.draft.name,
    emoji: drawer.draft.emoji,
  });
  // While a refresh snapshot is active, treat status as COMPLETED so the
  // page renders the carousels-with-content branch (using snapshot sections)
  // instead of the PROCESSING-skeletons branch (which would key off the new,
  // empty session). Bug #43.
  const status = refreshSnapshot ? 'COMPLETED' : (session?.status ?? doc?.status);
  const errorMessage = session?.errorMessage ?? doc?.errorMessage;

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
      {status === 'COMPLETED' && displaySections.length === 0 ? (
        <ProcessingHint>
          No recommendations were generated for this submission.
        </ProcessingHint>
      ) : status === 'PROCESSING' && displaySections.length === 0 ? (
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
          showSummary={status === 'COMPLETED' && displaySections.length > 0}
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
              impressionContext={impressionContext}
              carouselIndex={i}
              totalCarousels={filteredSections.length}
              carouselSessionId={doc?.carouselSessionId}
              // Gate impressions on COMPLETED session state so streaming-phase
              // products that get REPLACED by curation don't emit garbage
              // carousel_visible / carousel_scroll events. Bug #74 / two-phase
              // agent flicker. The outer JSX branch ALSO renders carousels
              // when status === 'PROCESSING' && displaySections.length > 0
              // (streaming intermediate); this prop is the analytics-side gate.
              trackingEnabled={status === 'COMPLETED'}
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
            onItemClick={handleProductClick}
          />
        )}
        {activeTab === 'purchased' && (
          <ResultsPurchasedGrid
            items={purchasedItems}
            personName={headerProps.personName}
            onItemClick={handleProductClick}
          />
        )}
      </ResultsPage>
      <ProfileDrawer
        open={drawer.open}
        onClose={drawer.closeDrawer}
        isMe={displayDoc.recipientSnapshot.isMe}
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
