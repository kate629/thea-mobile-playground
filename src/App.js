import React, { lazy, Suspense, useCallback, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { ThemeProvider } from "styled-components";

import ProtectedRoute from "./components/ProtectedRoute";
import { LandingPage } from "./components/landing/marketing/LandingPage";
import { QuizLoadingAnimated } from "./components/landing/quiz/QuizLoadingAnimated";
import { UserAuthContextProvider } from "./context/UserAuthContext.js";
import { AuthGateProvider, useAuthGate } from "./theaWeb/auth/AuthGateContext";
import { MergeStateProvider } from "./theaWeb/auth/MergeStateContext";
import { FirebaseProvider } from "./theaWeb/firebase/FirebaseContext";
import { useDeferredNavToResults } from "./theaWeb/hooks/useDeferredNavToResults";
import { useGaUserIdentity } from "./theaWeb/hooks/useGaUserIdentity";
import { usePageTracking } from "./theaWeb/hooks/usePageTracking";
import { useSubmitGiftFlow } from "./theaWeb/hooks/useSubmitGiftFlow";
import { gaFirstRender } from "./theaWeb/lib/gaPixel";
import { quizDisplayOccasionToEnum } from "./theaWeb/lib/loadingAmbientImages";
import { theme } from "./theme";

function LandingRoute() {
  const navigate = useNavigate();
  const { requestSignIn } = useAuthGate();
  const { submit } = useSubmitGiftFlow();
  // Bug #74 — defer navigation from the homepage SearchPill to the results
  // page until the carousel agent has finished its curation phase + first
  // 3 images are preloaded. Without this gate the user lands on results
  // mid-stream and sees the streaming product set get replaced by the
  // curated set ~1-2s later (visible flicker). Same root cause as bugs
  // #50/#57 (quiz path) and #43 (refresh path); shared hook keeps the gate
  // identical across all entry points.
  const [pendingNav, setPendingNav] = useState(null);
  const { liveImages } = useDeferredNavToResults(pendingNav);

  const handleSearchSubmit = useCallback(
    async (answers) => {
      try {
        // Mark T0 for time-to-first-result (spec §14). Cleared first so
        // prior submissions / regenerates can't bleed into the next
        // computation.
        try {
          if (typeof performance !== "undefined") {
            performance.clearMarks("thea-submit-click");
            performance.clearMarks("thea-submit-callable-resolve");
            performance.mark("thea-submit-click");
          }
        } catch {
          /* ignore */
        }
        const occasion = quizDisplayOccasionToEnum(answers.occasion);
        // SearchPill bypasses /quiz, so useSubmitGiftFlow fires `quiz_start`
        // (with entry_point='search_pill') for us when we pass that flag.
        const result = await submit(answers, { entry_point: "search_pill" });
        setPendingNav({
          recipientId: result.recipientId,
          recommendationId: result.recommendationId,
          carouselSessionId: result.carouselSessionId,
          occasion,
        });
      } catch {
        // Surface to the user via results-page error handling on next pass;
        // the SearchPill itself doesn't have a banner slot.
      }
    },
    [submit],
  );

  if (pendingNav) {
    return (
      <QuizLoadingAnimated
        interests={undefined}
        relationship={undefined}
        images={liveImages}
      />
    );
  }

  return (
    <LandingPage
      // entry_point is provided by LandingPage's hero/sticky sub-components
      // so the dashboard can split funnel completion rates per surface.
      onCtaClick={(entry_point) =>
        navigate("/quiz", { state: { from: "/", entry_point } })
      }
      onSignInClick={() => requestSignIn({ mode: "signin" })}
      onSearchSubmit={handleSearchSubmit}
    />
  );
}

// Dev surfaces are lazy-loaded so the customer-facing root bundle stays slim.
// Production users never download these chunks.
const Home = lazy(() => import("./components/Home"));
const Login = lazy(() => import("./components/auth/Login"));
const Signup = lazy(() => import("./components/auth/Signup"));
const CarouselFeedPage = lazy(() => import("./components/carousel/CarouselFeedPage"));
const FastCarouselFeedPage = lazy(() => import("./components/carousel/FastCarouselFeedPage"));
const QuizPage = lazy(() => import("./theaWeb/pages/QuizPage"));
const RecommendationResultsPage = lazy(() =>
  import("./theaWeb/pages/RecommendationResultsPage"),
);
const BoardRoute = lazy(() => import("./theaWeb/pages/BoardRoute"));
const TermsPage = lazy(() => import("./theaWeb/pages/TermsPage"));
const PrivacyPage = lazy(() => import("./theaWeb/pages/PrivacyPage"));

// Lazy so the ~600 hardcoded sample products don't bloat the root bundle.
const OccasionRoute = lazy(() =>
  import("./components/landing/marketing/OccasionRoute").then((m) => ({ default: m.OccasionRoute }))
);

// Mounted inside BrowserRouter (see src/index.js) so useLocation works.
// Fires Meta pixel PageView on every route change.
function PageTrackingMount() {
  usePageTracking();
  return null;
}

// Fires `page_first_render` exactly once per app load. Mounted as a sibling
// to PageTrackingMount so it runs after the first route's first commit.
// Pairs with bounce-attribution analysis: a Meta-reported LPV without a
// matching gaFirstRender means the React app failed to mount (bug or
// webview crash), distinct from "rendered but user bounced fast."
function FirstRenderMount() {
  React.useEffect(() => {
    gaFirstRender();
  }, []);
  return null;
}

// Wires GA4 `user_id` to the Firebase UID and fires the GA4 `sign_up` event
// on the (anon|null) → permanent transition. Mounted inside FirebaseProvider
// because the hook calls useAuth(). One mount per app load is enough.
function GaUserIdentityMount() {
  useGaUserIdentity();
  return null;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <FirebaseProvider>
        <UserAuthContextProvider>
          <MergeStateProvider>
            <AuthGateProvider>
        <PageTrackingMount />
        <FirstRenderMount />
        <GaUserIdentityMount />
        <Routes>
          <Route path="/" element={<LandingRoute />} />
          <Route
            path="/occasion/:id"
            element={
              <Suspense fallback={null}>
                <OccasionRoute />
              </Suspense>
            }
          />
          <Route
            path="/dev/login"
            element={
              <Suspense fallback={null}>
                <Login />
              </Suspense>
            }
          />
          <Route
            path="/dev/signup"
            element={
              <Suspense fallback={null}>
                <Signup />
              </Suspense>
            }
          />
          <Route
            path="/dev/home"
            element={
              <ProtectedRoute>
                <Suspense fallback={null}>
                  <Home />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dev/feed"
            element={
              <Suspense fallback={null}>
                <CarouselFeedPage />
              </Suspense>
            }
          />
          <Route
            path="/dev/feed-fast"
            element={
              <Suspense fallback={null}>
                <FastCarouselFeedPage />
              </Suspense>
            }
          />
          <Route
            path="/quiz"
            element={
              <Suspense fallback={null}>
                <QuizPage />
              </Suspense>
            }
          />
          <Route
            path="/quiz/results/:recipientId/:recommendationId"
            element={
              <Suspense fallback={null}>
                <RecommendationResultsPage />
              </Suspense>
            }
          />
          <Route
            path="/terms"
            element={
              <Suspense fallback={null}>
                <TermsPage />
              </Suspense>
            }
          />
          <Route
            path="/privacy"
            element={
              <Suspense fallback={null}>
                <PrivacyPage />
              </Suspense>
            }
          />
          <Route
            path="/board/:recipientId"
            element={
              <Suspense fallback={null}>
                <BoardRoute />
              </Suspense>
            }
          />
        </Routes>
            </AuthGateProvider>
          </MergeStateProvider>
        </UserAuthContextProvider>
      </FirebaseProvider>
    </ThemeProvider>
  );
}

export default App;
