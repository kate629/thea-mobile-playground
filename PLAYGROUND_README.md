# Thea Mobile UI Playground

This is **not** the real `thea-web`. It's a stubbed clone for fast mobile-UI iteration.

- **Real repo:** `https://github.com/ManuelMar/thea-web` (configured here as the `upstream` remote, push blocked)
- **What's stubbed:** all backend hooks + Firebase callables (under `src/playground/` + overwrites of 5 hooks)
- **What's untouched:** all visual component code under `src/components/` and `src/theaWeb/pages/` etc.

## Run

```bash
npm install
npm start
# open http://localhost:3000 — or http://<laptop-LAN-IP>:3000 from your phone
```

No Firebase project needed. `.env.local` has dummy values.

## URL params for state-toggle

- `?session=processing` — render carousel session in mid-stream loading state
- `?session=completed` (default) — render fully curated carousels
- `?auth=signedin` — start signed in, hearts save instantly
- `?auth=anon` (default) — start anon, heart-tap opens fake "signup" modal

## Port-back protocol

When a design idea is keeper-worthy:

1. Branch off `upstream/master` in `~/git/thea-web/` (NOT this playground): `kr-<area>-<work>`
2. Hand-port only the visual component diffs (NEVER port `src/playground/` or the 5 stubbed hook files)
3. Add tests + stories in the same PR per [`testing.md`](../thea/.claude/rules/testing.md)
4. Schema-shaped changes from `PLAYGROUND_NOTES.md` ship as their own additive-only schema PR first, tagged to Manny

## Stay current with master

```bash
git fetch upstream
git rebase upstream/master
# resolve conflicts in your design changes; the stub layer rarely conflicts
```
