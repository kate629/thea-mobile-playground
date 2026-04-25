# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Testing

This project has three testing layers, each with its own purpose, scope, and CI workflow.

### Unit tests — Jest + React Testing Library

**What they cover**: component behavior in isolation. Render a component, simulate user interaction, assert on the resulting DOM.

**Location**: co-located with the component as `<Component>.test.tsx`. See `src/components/common/Button.test.tsx` for the canonical pattern (render / interaction / conditional behavior).

**Run locally**:
```bash
npm test                    # interactive watch mode
npm test -- --watchAll=false  # one-shot (matches CI)
```

**CI**: `.github/workflows/test.yml` — blocks PR merges on failure.

**Best practices**:
- Query by accessible role (`getByRole('button', { name: 'Submit' })`) over test IDs
- Use `userEvent` (not `fireEvent`) for realistic interaction
- Group with `describe`, one assertion per `it` when reasonable
- Mock at the network or module boundary, not internal implementation

### Visual regression — Happo + Storybook

**What it covers**: pixel-level diffs of every Storybook story across `chrome-large`, `chrome-small`, and `accessibility` targets. Catches unintentional CSS/layout regressions that unit tests can't see.

**Location**: stories live next to components as `<Component>.stories.tsx`. See `src/components/common/Button.stories.tsx`.

**Run locally**:
```bash
npm run storybook   # browse stories at http://localhost:6006
npm run happo       # snapshot run; requires .env.local with Happo creds
```

`.env.local` (gitignored) must contain:
```
HAPPO_API_KEY=<from happo.io/settings>
HAPPO_API_SECRET=<from happo.io/settings>
```

**CI**: `.github/workflows/happo.yml` — runs on every PR. With the Happo GitHub App installed, posts a visual diff comment on the PR.

**Best practices**:
- Every reusable component in `src/components/common/` should have at least one story
- Cover meaningful states (default / hover / disabled / error) as separate stories — Happo screenshots each
- Keep stories deterministic: no `Date.now()`, `Math.random()`, network calls, or animations in flight when the snapshot is taken

### End-to-end — Playwright

**What it covers**: full-stack flows against a real running app. Catches integration issues (auth, routing, Firebase, deployment) that unit + visual tests can't.

**Location**: `tests/*.spec.ts`. See `tests/smoke.spec.ts`.

**Run locally** (against the dev server):
```bash
npm run e2e
```
Playwright auto-starts `npm start` via the `webServer` block in `playwright.config.ts`. To run against an existing dev server you've already started, the config sets `reuseExistingServer: true` outside CI.

**Run against a deployed URL**:
```bash
PLAYWRIGHT_BASE_URL=https://thea-643b1-23686.web.app npm run e2e
```

**CI**: `.github/workflows/e2e.yml` — runs against the deployed Firebase Hosting URL (`https://thea-643b1-23686.web.app`). **Marked `continue-on-error: true`** so failures surface visibly without blocking PR merges. The Playwright HTML report is uploaded as a workflow artifact.

**Best practices**:
- Test user-facing flows, not implementation details. Use page objects for anything reused across tests.
- Prefer `expect(locator).toBeVisible()` (auto-waits) over arbitrary `waitForTimeout`
- Don't write data into prod from tests — keep e2e read-only against prod, or stand up a preview channel for write flows
- For per-PR isolation, deploy each PR to a Firebase Hosting preview channel and pass that URL via `PLAYWRIGHT_BASE_URL` (future improvement)

### Which test type for what

| Question | Layer |
|----------|-------|
| Does this function/component behave correctly given inputs X? | Unit |
| Does this component still look right? | Visual (Happo) |
| Can a user actually complete this flow against the deployed app? | E2E |

When fixing a bug, add a regression test at the lowest layer that reproduces it.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
