import "bootstrap/dist/css/bootstrap.css";

import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { initWebVitals } from "./theaWeb/lib/webVitals";
import { BrowserRouter } from "react-router-dom";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);

// Real-User Monitoring of Core Web Vitals (LCP, FID, CLS, FCP, TTFB) →
// GA4 `web_vitals` events. Replaces the old `reportWebVitals(console.log)`
// scaffold that came with create-react-app — same library, but data flows
// to the dashboard now instead of just devtools. See `lib/webVitals.ts`
// for the threshold scoring and the rationale.
initWebVitals();
