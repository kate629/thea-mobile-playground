import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "styled-components";

import ProtectedRoute from "./components/ProtectedRoute";
import { LandingPage } from "./components/landing/marketing/LandingPage";
import { UserAuthContextProvider } from "./context/UserAuthContext.js";
import { theme } from "./theme";

// Dev surfaces are lazy-loaded so the customer-facing root bundle stays slim.
// Production users never download these chunks.
const Home = lazy(() => import("./components/Home"));
const Login = lazy(() => import("./components/auth/Login"));
const Signup = lazy(() => import("./components/auth/Signup"));
const CarouselFeedPage = lazy(() => import("./components/carousel/CarouselFeedPage"));
const FastCarouselFeedPage = lazy(() => import("./components/carousel/FastCarouselFeedPage"));

function App() {
  return (
    <ThemeProvider theme={theme}>
      <UserAuthContextProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
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
        </Routes>
      </UserAuthContextProvider>
    </ThemeProvider>
  );
}

export default App;
