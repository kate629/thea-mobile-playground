# Personal Boards — Architecture Proposal

*Draft for Manny's async review.*
*Author: Kate (with Claude). 2026-05-08.*
*Companion to the live prototype at `~/git/thea-mobile-playground/` and the Vercel build at `thea-mobile-playground-kate629s-projects.vercel.app`.*

> **Scope**: this proposal targets the **production app at givethea.com** — schemas in `ManuelMar/thea-shared-schemas`, callables/algo in `ManuelMar/thea-serverless`, FE in `ManuelMar/thea-web`. The playground in this repo is the FE prototype Manny can experience-test the proposal against; none of the playground stub code (`src/playground/*`) ports back. What ports back is the real component / hook / page code.

> **Updated 2026-05-08 post-Manny feedback (verbal):** scope narrowed substantially. **No materialized board document, no new triggers, no algo changes for incremental fetch, no implicit-signal feeding (dwell, scroll, etc.) — all vLater.** This proposal is now essentially a UI transpose with two small intentional BE additions: bump per-chip product count from ~12 → ~25, and add the missing un-like callable. Everything else is FE-only over the existing data shape.

---

## TL;DR

We want to evolve theaWeb from "one-time gift quiz → results → click-out" to **"build a persistent board for each person you shop for and like items into it over time."** The user-research signal: organic users (especially the older constant-shopper ICP) treat Thea as a curation tool already; they save 10–30+ items per session and return to browse. The current product wraps that behavior in a flow that pretends to be transactional. The proposal makes the implicit explicit.

**The realization that simplified the architecture**: this is mostly a UI transpose. Today on givethea.com, the *vertical* axis is "different carousels" (Decor, Cooking, Beauty…) and the *horizontal* axis is "more products in this carousel." The proposal swaps the axes — *horizontal* tabs for switching between chip categories, *vertical* scroll for more products in the active chip. Same data shape, same algo, same callable surface — just rendered against a different layout, with one BE constant bumped (~12 → ~25 products per chip) and one missing callable filled in (un-like).

The prototype lives at `~/git/thea-mobile-playground/` (fork of `thea-web@master`, stubbed Firebase). Architectural changes are **schema-additive only**, run **mutations through callables** with **Firestore listeners on the client**, and keep client state minimal — per Manny's stated guidance.

## Product narrative shift

| Before | After |
|---|---|
| Quiz → results → click-out → bounce | Quiz → board → like items in place → keep adding for that person, build new boards for others |
| "Find a gift for [Mom]" | "Build a board for [Mom]" |
| One recipient at a time, results-page-as-destination | Multiple recipients, board-as-destination; the results page is *one component of* a board, not the whole thing |
| Saved items gated behind sign-in | Liked items un-gated, persisted in localStorage for anon users |
| Anon users have ephemeral state | Anon users build complete N-recipient boards locally; sign-in materializes them |

The six buckets of change:

1. **Build-a-profile narrative** — quiz/homepage/loading-state copy that frames boards, not gifts; testimonials surfaced; inline rename of name + emoji; search-pill simplified on the board surface; "Other" occasion removed.
2. **Encourage liking** — un-gate likes; dedicated "Liked for X" tray on every board.
3. **Multi-recipient flow** — back-to-quiz from any board to start someone new; "My people" surface lists every board the user has built; sign-in nudge only fires at 3+ likes anywhere.
4. **Kid-specific flow** — adult/child branch for ambiguous relationships (Son / Daughter / Granddaughter / Grandson / Friend / Other); kid-specific age brackets, pill sets, freeform copy, emoji overrides; occasions slimmed for kids; WHAT segment hidden on kid boards.
5. **Responsive layout primitives** — bottom-sheet pattern on mobile, right-side popover on desktop; pill-button tabs with end-of-feed cross-promo; sticky-bottom CTAs; card-aspect peek so the next row hints at more.
6. **Frictionless scrolling** — remove the X (dismiss) button; remove the "Refresh my picks" / Regenerate CTA; **transpose the layout axes** so users switch between chip categories *horizontally* (tabs) and scroll for more products *vertically* within a chip (currently ~12 per carousel; bump to ~25 to make vertical scroll feel substantive). Same algo, same data, just laid out differently.

## Architecture summary

> **Operating principles, per Manny:**
> - **Mutations** go through Cloud Functions callables. Always.
> - **Reads** are direct Firestore listeners. No mutation-via-listener side effects.
> - **Client state is minimal** — Firestore listeners are the source of truth; React state is for ephemeral UI only.

The proposal layers on top of the existing architecture without replacing any of it. The data shape stays as today (`theaWebUser/{uid}/recipient/{rid}/recommendation/{recId}` + `giftActivity/{pid}` + `carouselSessions/{sid}`); the client keeps stitching those listeners as it does in `RecommendationResultsPage` today. The two intentional BE additions are **a per-chip product-count bump (~12 → ~25)** and **a missing un-like callable** that production was meant to ship as a "follow-up endpoint" but never did.

## Concept: the board (UX-level, not data-model-level)

A **board**, in the new product narrative, is the per-recipient surface the user thinks of as "Mom's board" / "Dad's board" / etc. Conceptually it includes:
- The recipient profile (name, emoji, relationship, age, gender). **Name + emoji are editable inline** from the Liked tray header via the existing `theaWebUpdateRecipient` callable. Relationship / age / gender remain edited via the existing ProfileDrawer (sparkles icon) — those reshape the algo's inputs and merit a heavier surface.
- The active recommendation (carousels of recommended products — the existing `recommendation/{rid}` + `carouselSessions/{sid}`). Occasion stays a primary algo input.
- The user's liked items for this recipient (the existing `giftActivity/{productId}` with `state: 'SAVED'`).
- The user's chip selections (today: transient client state; staying that way for v1 — making them persistent per-recipient is a vLater).
- (Future, post-v1) Notes, per-occasion sub-collections, sent-history, materialized board doc, scroll-driven incremental fetch, implicit-signal feeding.

**The boards model is a UX framing, not a new data structure.** The client continues to stitch the existing listeners (carousel session, recommendation, giftActivity) at render time. We don't materialize a `board/current` document, don't introduce new triggers, and don't reshape the carousel agent's one-shot model. Those are all things we considered and explicitly punted to vLater per Manny's "minimize BE" steer.

## Per-bucket: schemas, callables, documents

### Bucket 1 — Build-a-profile narrative

#### Schemas (additive)
- `recipient.json` gains optional fields:
  - `lastVisitedAt: Timestamp` (for sort/recency UI)
  - `boardName?: string` (overrides `name` for display only — null = use name)
  - `displayEmoji?: string` (overrides `emoji` for display only)
  - All optional, all additive.

#### Callables
- **`theaWebUpdateRecipient`** (existing) — already supports name/emoji/relationship/age/gender update. Extend to support `boardName` + `displayEmoji`. No breaking change.
- **`theaWebTouchRecipient`** (new, optional) — bumps `lastVisitedAt` when a user opens a board. Could be elided if we use a Firestore listener-write hybrid; punt for v1.

#### FE
- Search pill simplified on the board surface: WHO hidden, WHAT hidden for kid boards, "Other" occasion removed, "E.g.," sample prefixes on freeform.
- Inline rename via the Liked tray's "Edit name" link calls `theaWebUpdateRecipient`.

### Bucket 2 — Encourage liking

#### Storage shift: anon = localStorage

Today, anon Firebase users have IndexedDB-backed UIDs and write to Firestore subcollections under that UID. That works — but it's invisible to the user, can't be inspected, and the "merge to permanent UID" path only handles Firestore data.

The proposal: **for anon users, mirror `theaWebUser/{anonUid}/recipient/*` in localStorage**. Two storage tiers:

| State | Anon | Signed-in |
|---|---|---|
| Recipients | localStorage + Firestore (under anon UID) | Firestore only (under permanent UID) |
| Recommendations | Firestore (under anon UID) | Firestore only |
| Likes | localStorage + Firestore (under anon UID) | Firestore only |
| Materialized board | Built BE-side on Firestore writes | Same |

LocalStorage is the **read fallback** for anon users when Firestore is slow / offline / cold-cached, and the **survival mechanism** when the anon UID is somehow lost (rare but real: cleared cookies, switched private windows). Firestore stays the canonical write target.

#### Schemas (additive)
- `giftActivity.json` already has `state: 'SAVED' | 'DISMISSED' | 'PURCHASED'`. **No rename to 'LIKED'** — wire enum stays. The user-facing string is the only change ("Like" / "Liked"). This is the explicit additive-only path.
- Optional new field `likedAt: Timestamp` for sort consistency (separate from `createdAt` so the algo can distinguish first-save vs latest-touch).

#### Callables
- **`theaWebRecordActivity`** (existing) — no changes; already records SAVED/DISMISSED/PURCHASED.
- **`theaWebClearActivity`** (new — small intentional addition) — fills in the missing un-like path. The existing `RecommendationResultsPage.tsx:599` has a comment that explicitly flags this gap: *"No UNSAVED state on the BE — un-save is a follow-up endpoint. Until then, a second click on an already-liked product is a no-op."* Today's prod silently swallows un-like clicks. The boards model makes un-like much more important (users will accumulate dozens of likes per recipient and need to prune mistakes), so we should ship the follow-up callable now. Smallest possible shape: `{ productId, recipientIds }` → deletes the matching `giftActivity` doc(s). If you'd rather extend `recordActivity` with a `state: 'CLEARED'` value, equivalent — see open question.

#### FE
- Heart on every card un-gated (calls `theaWebRecordActivity` directly, no signup modal).
- "Liked for X" tray reads from the existing `giftActivity` listener (same pattern as today; the FE just renders it as a tray now).
- Inline X-to-remove on each item in the expanded Liked tray calls `theaWebClearActivity`.

### Bucket 3 — Multi-recipient flow

#### Schemas
No new fields. Existing `theaWebUser/{uid}/recipient/{recipientId}` already supports multiple recipients. We just use it.

#### Callables
- **`theaWebSubmitGiftFlow`** (existing) — already creates a recipient + recommendation atomically. Used by both the initial quiz and the back-button "start someone new" flow.
- **`theaWebMergeGiftFlow`** (existing) — fans out anon → permanent UID copy of recipients/recommendations/giftActivities. No changes needed; the data shape it copies is unchanged.
- **`theaWebMintMergeToken`** (existing) — unchanged.

#### FE
- "My people" page (`/people`): subscribes to `theaWebUser/{uid}/recipient` collection (existing), renders a tile per recipient. The 4-up collage on each tile is built client-side from the recipient's `giftActivity` listener (top 4 SAVED items by `createdAt` desc) — same stitching pattern the rest of the app uses.
- "Add someone" tile → `/quiz` to start a new recipient.
- Avatar dropdown: My people / Sign in (anon) / Log out, with the threshold-triggered alert.

#### Sign-in threshold
Aggregate user-liked count across all `giftActivity` entries with `state: 'SAVED'`. Once `>= 3`, persistent red dot on the avatar + alert menu item until sign-in.

### Bucket 4 — Kid-specific flow

#### Schemas
- **No schema change**. `recipient.json` already has `age` — kid-vs-adult is derived from age (< 18 = kid) on both FE and BE without a new explicit `lifeStage` field. The quiz captures it via the new lifeStage step in the FE, but the value lands as an age bucket in the existing `age` field. Aligned with Manny's minimize-BE steer.

#### Callables
- **`theaWebSubmitGiftFlow`** — no changes; `age` already on the request.

#### Algo
- No changes for v1. The carousel agent already varies behavior by age bucket; kid age values fall into existing kid-coded buckets the agent handles. (If post-launch we find the agent still surfaces irrelevant carousels for kids — Mother's Day picks for a 6-year-old, etc. — we revisit with an explicit `lifeStage` signal then.)

#### FE
- New `lifeStage` quiz step inserted between relationship and age (only for ambiguous relationships: Son / Daughter / Granddaughter / Grandson / Friend / Other).
- `KID_AGE_CHIPS` replace `ADULT_AGE_CHIPS` when the user picks Child.
- Kid path skips the occasion step → defaults `'Just Because'`.
- Kid-specific pill list per age bucket (already live in playground).
- Per-kid emoji overrides (Accessories → 🎒, Room decor → 🛏️).
- WHAT segment hidden on kid boards.

### Bucket 5 — Responsive layout primitives

These are FE-only — no schema or callable changes. Listed here for completeness so the proposal captures the full surface area.

- Bottom sheet on mobile (`useBottomSheet` hook with snap points) replaces the flat results-page bottom panel.
- Desktop right-side popover (`>= 1024px`) replaces the bottom sheet, with wheel-forwarding to the feed.
- Pill-button chip tabs with end-of-feed "More in X →" cross-promo.
- Sticky-bottom quiz CTA with dynamic disabled-state label ("Pick 1 more to continue").
- Card aspect peek (1:1 mobile, 6:5 desktop) for "scroll for more" affordance.

These are layered into the existing component tree without requiring router-level changes.

### Bucket 6 — Frictionless scrolling

Mostly FE, with one tiny BE constant change.

#### The realization
This bucket is, mechanically, a UI transpose of what givethea.com already does. **Today**: vertical scroll moves through different carousels (Decor, then Cooking, then Beauty…), horizontal scroll within each carousel reveals more products in that category. **Proposed**: horizontal tabs swap between chip categories, vertical scroll within the active chip reveals more products. Same data, same algo, same callables — just rendered against transposed axes.

#### What goes away (FE)
- **The "X" / dismiss button on every product card.** Removes the always-visible reject affordance. The `'DISMISSED'` wire enum stays in case we want to surface explicit dismiss elsewhere later; the FE just doesn't expose it on the card.
- **The "Refresh my picks" / Regenerate CTA.** Replaced by the user simply switching tabs / scrolling within a tab — the one-shot recommendation already returned a full set.
- **The horizontal "more like this" carousel scroll.** That horizontal motion now happens at the chip-strip level (switching tabs) rather than the per-carousel level.

#### What changes (FE)
- **Chip tabs** at the top become the primary horizontal axis for switching between categories. Pill-button styling per bucket 5.
- **Vertical scroll** within the active chip shows more products in that category — currently capped at ~12 per carousel; proposed bump to **~25** to make the vertical scroll feel substantive.
- **Like-or-keep-scrolling** is the only loop on the card. No third action surface.

#### What changes (BE — the only intentional algo-side change in the whole proposal)
- **Per-chip product count: ~12 → ~25.** A single constant bump in `carousel_agent.py` (or wherever the per-chip K is set). The agent already produces curated batches; we just ask for ~2× as many per category. No new code path, no pagination, no new callable. The exact number (25) is a starting guess — Manny can dial it.

#### Out of scope for this bucket (vLater)
Things we considered for this bucket and explicitly punted on Manny's "minimize BE" steer:
- Scroll-driven incremental fetch (continuously top up products as the user scrolls)
- Implicit-signal feeding (dwell time, scroll velocity, etc.) into the next batch
- Materialized board document
- Continuous-feed scrollspy layout (one feed, all chips, anchor-based navigation)

These are all attractive directions but each requires real algo / instrumentation work; deferring lets us ship the UX transpose now and revisit the algo work as a deliberate v2.

## Anon → permanent merge

The existing `theaWebMergeGiftFlow` callable already handles this: on sign-in, it copies the anon UID's `recipient/*` subtree (recipients + recommendations + giftActivities) to the permanent UID's subtree and cascade-deletes the source. Since this proposal doesn't change the data shape, **no merge changes are needed**.

If we adopt **localStorage shadow for anon users** (so the user can re-open the tab without losing their boards even if their Firebase anon UID gets cleared), the merge still operates on Firestore — localStorage is a write-through cache + offline survival fallback, never the canonical write target. Every mutation continues to fire the existing callable, which writes to Firestore under the anon UID; localStorage is mirrored on each successful write.

## Sequencing — proposed PR order

The narrowed scope collapses to ~6 PRs total. No schema PR needed (everything reuses existing schemas). Order is roughly "smallest BE thing first, then FE work in parallel-friendly chunks."

1. **BE PR — un-like callable.** Adds `theaWebClearActivity` (or extends `recordActivity` to handle a `'CLEARED'` state — Manny's call). Backwards-compatible. Small.
2. **BE PR — per-chip K bump.** Single constant change in `carousel_agent.py` from ~12 → ~25. One-line diff plus a regression test. Tiny.
3. **FE PR — Bucket 1 (board narrative).** Quiz copy, homepage copy, testimonials, inline rename, search-pill simplification, "Other" removal, loading state.
4. **FE PR — Bucket 2 (un-gate likes + Liked rename + un-like X-to-remove).** Copy + behavior changes. Calls (1) for the un-like path.
5. **FE PR — Bucket 4 (kid flow).** lifeStage quiz step, kid pill sets, kid emoji overrides, WHAT-hidden gate.
6. **FE PR — Bucket 3 (My people).** `/people` route, avatar dropdown with sign-in threshold, Add-someone tile.
7. **FE PR — Buckets 5 + 6 (responsive primitives + axis transpose).** Bottom sheet on mobile, desktop right-sidebar popover, pill-button chip tabs, sticky-bottom quiz CTA, drop X dismiss + Regenerate CTA, render the now-25-product per-chip vertical feed. Best to land after (2) so the FE has the bigger product set to render.

Each PR is independently shippable. Ordering is a recommendation, not a hard chain — the only constraint is (7) lands after (2) so users see the substantive vertical feed the new layout was designed for.

## Out of scope

- **iOS-CRM impact** — none. The shared `theaWebUser/*` subtree is theaWeb-only; the iOS-CRM side (`user/*`, `friend/*`, `event/*`) is untouched.
- **Auth provider changes** — sign-in modal flows stay as today (Apple, Google, email). No new auth surface.
- **Algo reweights** — no changes to the ranking model. The only algo-side change is per-chip K from ~12 → ~25.
- **Existing analytics events** — keep firing as today, no schema changes. New events specific to the boards UX (board_visited, board_renamed, like_threshold_crossed) can be a small follow-up analytics PR with the relevant GA4 custom-dimension registrations (per `gotchas.md`); not blocking for this proposal.
- **Sent / purchased history surface** — `'PURCHASED'` state already exists; the user-facing "I sent this on May 3" view is a future addition.
- **Per-vLater list** — the following were considered for this proposal and explicitly punted on Manny's "minimize BE" steer: materialized board document, `onGiftActivityWrite` trigger, scroll-driven incremental product fetch, implicit-signal feeding (dwell time / scroll velocity / etc.) into the algo, dedicated BE event-instrumentation schema, persistent per-recipient chip selections.

## Open questions for Manny

1. **`theaWebClearActivity` vs `recordActivity` with `state: 'CLEARED'`.** The un-like callable can be a new dedicated callable or an extension to the existing one with a new state value. Slight preference for the separate callable (cleaner intent, doesn't conflate un-like with active dismissal), but no strong opinion. Either is small.
2. **The K bump** — is **25** per chip the right starting number? Could be 20, could be 30. Driven mostly by mobile scroll-feel and the agent's per-chip latency. Easy to tune.
3. **localStorage write-through scope.** OK with anon users having localStorage as a write-through cache + offline survival, with Firestore (under anon UID) as the canonical write target? Or push for Firestore-anon-uid as the only persistence and skip localStorage entirely?
4. **`'DISMISSED'` retention.** With the always-visible X dismiss button removed from product cards, do we keep the wire enum + a less prominent dismiss path elsewhere (e.g. in the Liked tray's expanded view, "remove from feed forever"), or fully retire dismiss as a user-facing concept and let likes/un-likes be the only signal? My read: keep the enum, drop the FE surface for v1, easy to restore later.

## Companion artifacts

- **Live prototype**: `~/git/thea-mobile-playground/` — every bucket is implemented FE-only with stubbed Firebase. Best way to feel the proposed UX is to run `npm start` against it (or visit the deployed Vercel build).
- **Playground stub layer**: `src/playground/` — read-only mocks (`MockProviders`, `recipientRegistry`, `giftActivityStore`) that simulate the proposed BE shape. Useful as a reference for what the FE expects.
- **`PLAYGROUND_NOTES.md`** in the playground root — running log of any schema asks the prototype surfaced.

---

*Open to any of this being wrong or differently-shaped. The buckets reflect product intent; the architecture below them is one path, not the only one.*
