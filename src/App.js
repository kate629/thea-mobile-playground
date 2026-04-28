import { lazy, Suspense, useCallback } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { ThemeProvider } from "styled-components";

import ProtectedRoute from "./components/ProtectedRoute";
import { LandingPage } from "./components/landing/marketing/LandingPage";
import { UserAuthContextProvider } from "./context/UserAuthContext.js";
import { AuthGateProvider, useAuthGate } from "./theaWeb/auth/AuthGateContext";
import { FirebaseProvider } from "./theaWeb/firebase/FirebaseContext";
import { usePageTracking } from "./theaWeb/hooks/usePageTracking";
import { useSubmitGiftFlow } from "./theaWeb/hooks/useSubmitGiftFlow";
import { theme } from "./theme";

function LandingRoute() {
  const navigate = useNavigate();
  const { requestSignIn } = useAuthGate();
  const { submit } = useSubmitGiftFlow();
  // SearchPill submit on the signed-in homepage. Same pattern as QuizPage:
  // submitGiftFlow returns { recipientId, recommendationId }; navigate routes
  // the user to the results page where the carousel doc streams in.
  const handleSearchSubmit = useCallback(
    async (answers) => {
      try {
        const { recipientId, recommendationId } = await submit(answers);
        navigate(`/quiz/results/${recipientId}/${recommendationId}`);
      } catch {
        // Surface to the user via results-page error handling on next pass;
        // the SearchPill itself doesn't have a banner slot.
      }
    },
    [submit, navigate],
  );
  return (
    <LandingPage
      onCtaClick={() => navigate("/quiz")}
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

function App() {
  return (
    <ThemeProvider theme={theme}>
      <FirebaseProvider>
        <UserAuthContextProvider>
          <AuthGateProvider>
        <PageTrackingMount />
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
            path="/board/:recipientId"
            element={
              <Suspense fallback={null}>
                <BoardRoute />
              </Suspense>
            }
          />
        </Routes>
          </AuthGateProvider>
        </UserAuthContextProvider>
      </FirebaseProvider>
    </ThemeProvider>
  );
}

export default App;
