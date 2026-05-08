# Personal Boards — Architecture Proposal

*Draft for Manny's async review.*
*Author: Kate (with Claude). 2026-05-08.*
*Companion to the live prototype at `~/git/thea-mobile-playground/` and the Vercel build at `thea-mobile-playground-kate629s-projects.vercel.app`.*

> **Scope**: this proposal targets the **production app at givethea.com** — schemas in `ManuelMar/thea-shared-schemas`, callables/triggers/algo in `ManuelMar/thea-serverless`, FE in `ManuelMar/thea-web`. The playground in this repo is the FE prototype Manny can experience-test the proposal against; none of the playground stub code (`src/playground/*`) ports back. What ports back is the real component / hook / page code, against the real BE shape proposed below.

---

## TL;DR

We want to evolve theaWeb from "one-time gift quiz → results → click-out" to **"build a persistent board for each person you shop for and like items into it over time."** The user-research signal: organic users (especially the older constant-shopper ICP) treat Thea as a curation tool already; they save 10–30+ items per session and return to browse. The current product wraps that behavior in a flow that pretends to be transactional. The proposal makes the implicit explicit.

The prototype lives at `~/git/thea-mobile-playground/` (fork of `thea-web@master`, stubbed Firebase). All architectural changes below are designed to be **schema-additive only**, run **mutations through callables** with **Firestore listeners on the client**, materialize state **server-side** to avoid client stitching, and keep client state minimal — per Manny's stated guidance.

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
6. **Frictionless scrolling** — remove the X (dismiss) button; remove the "Refresh my picks" / Regenerate CTA; switch from tab-swapped views to a primary vertical scroll organized by interest chip, with chip headers across the top acting as scrollspy / quick-jump anchors. Combined with bucket 2's ungated likes, the entire results experience becomes "scroll, like, repeat" rather than "tap, decide, tap to refresh."

## Architecture summary

> **Operating principles, per Manny:**
> - **Mutations** go through Cloud Functions callables. Always.
> - **Reads** are direct Firestore listeners. No mutation-via-listener side effects.
> - **Materialize** per-recipient board documents server-side via triggers. The client subscribes to the materialized doc.
> - **Avoid stitching in the client.** If a view needs data from N collections, build the merged doc on the BE.
> - **Client state is minimal** — Firestore listeners are the source of truth; React state is for ephemeral UI only.

The proposal layers cleanly on the existing architecture rather than replacing it. The dominant new concept is the **board** as a first-class materialized surface, and **localStorage** as the durable home for anon-user state.

## Concept: the board

A **board** is the per-recipient surface that includes:
- The recipient profile (name, emoji, relationship, age, gender). **Name + emoji are editable inline** from the Liked tray header. Relationship / age / gender remain edited via the existing ProfileDrawer (sparkles icon) — they're heavier identity fields and changing them re-shapes the algo's input.
- The active recommendation (carousels of recommended products, currently `recommendation/{rid}` + `carouselSessions/{sid}`). Occasions ARE used today and stay — `occasion` continues to be a primary algo input shaping which carousels surface (e.g. "Mother's Day" → relevant carousels for moms). What's *not* in v1 is **per-occasion sub-buckets within a board** (e.g. "saved for her birthday" vs "saved for Mother's Day" as separate liked-collections inside one board) — that's v2.
- The user's liked items for this recipient (currently `giftActivity/{productId}` with `state: 'SAVED'`)
- The user's chip selections (currently transient client state; proposed: persistent per-recipient)
- (Future, post-v1) Notes, per-occasion sub-collections, sent-history.

Today, the client stitches all of these together at render time inside `RecommendationResultsPage.tsx`. The proposal is to **materialize the board on the backend** as a single document that the client subscribes to.

### Materialized board document — proposed shape

Path: `theaWebUser/{uid}/recipient/{recipientId}/board/current`

```jsonc
{
  "_schemaVersion": 1,
  "recipientId": "...",
  "recipientSnapshot": { /* name, emoji, relationship, age, gender, isMe */ },

  "activeRecommendationId": "rec_01HXYZ...",
  "activeCarousels": [
    { "displayName": "The Kitchen", "products": [/* growing over time, see below */] },
    /* ... */
  ],
  "selectedChips": ["decor", "cooking", "beauty"],
  "availableChips": ["decor", "cooking", "beauty", "books", "fitness", /* ... */],

  "likedProductIds": ["d1", "k3", /* ... */],
  "likedProductDetails": [/* GiftActivityDetail[] for top N, newest first */],
  "likedCount": 7,
  "lastLikedAt": "Timestamp",

  "createdAt": "Timestamp",
  "updatedAt": "Timestamp",
  "completedAt": "Timestamp"
}
```

A trigger on `recommendation/{rid}` write + a trigger on `giftActivity/{pid}` write would rebuild this doc. The client just listens at `board/current`.

### Carousel growth: scroll-driven incremental fetch (no regenerate button)

**The "regenerate" concept goes away.** In the current product, the user explicitly hits a Regenerate CTA to re-run the agent with their accumulated likes/dismisses. In the new model the user **never sees a regenerate button** — they just keep scrolling, and as they near the bottom of a chip's products, the agent fetches the next batch of curated picks for that chip, with their accumulated likes/dismisses already baked into the prompt.

This has direct algo and document-shape implications:

- The carousel agent today treats a session as one-shot (search streams products in, curation pass replaces with the final set, `status: COMPLETED`). The new model needs **incremental fetches** — additional product batches added to a carousel over time, each curated against the user's current signal state.
- `activeCarousels[i].products` is **append-only-after-curation** rather than replaced-once. New batches are tagged with the signal state they were curated against (so the trigger / client can show a soft "based on your last 7 likes" if useful, though the prototype doesn't surface that).
- **Pagination**: a new callable (working name `theaWebExtendCarousel` or `theaWebFetchMoreForChip`) takes `{ recipientId, recommendationId, chipKey, cursor }` and triggers another agent pass for that chip. Returns when the next batch is curated and appended. Client triggers it on near-bottom-of-chip scroll.
- **Listener model**: the FE keeps subscribing to `board/current` (or to the carousel session). New products appearing in the chip's `products` array trigger a re-render. No client-side merge of "old + new" — the BE owns the array.
- **The COMPLETED gate stays meaningful** but per-batch instead of per-session — each fetch returns a discrete COMPLETED moment for that batch.

This is the biggest single algo change in the proposal. It replaces a button-driven full regenerate with a scroll-driven incremental fetch. The "useRegenerate" hook + the existing Regenerate CTA on `RecommendationResultsPage` go away entirely.

### Why this matters for the boards model

In the boards model, the user is intentionally *staying* on the recipient's board over many sessions, not bouncing through a one-shot quiz. Forcing a "regenerate" button assumes the user has a discrete moment of "I want fresh ideas now"; in practice they're scrolling, reacting, scrolling more. Treating the algo as a continuous incremental fetcher rather than a one-shot batch matches the actual user behavior we're seeing.

It also creates a natural **invisible feedback loop**: as the user likes more, the algo fetches better matches, and the board's *quality* compounds. No celebration moment, no progress UI — just the picks getting sharper as the user keeps engaging.

### Why not just have the client stitch?

Today's client stitches `useCarouselSession`, `useGiftActivities`, `useRecommendationDoc`, and a per-component `selectedChipKeys` set. That's:
1. **Four listeners**, four subscription lifecycles, four sources of inconsistency.
2. **Latency-prone** — products flicker as carousel data streams in mid-curation (already a documented anti-pattern; see `architecture.md` "Carousel agent — two-phase, gate the FE on COMPLETED").
3. **Stateful in the wrong place** — chip selections live in React state, lost on reload, can't be the source of truth for the algo's next regenerate.

Materializing on the BE solves all three. The client owns ephemeral UI state only (which tab is open, edit-mode flags, hover state).

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
- **`theaWebRecordActivity`** (existing) — no changes needed; it already records SAVED/DISMISSED/PURCHASED. Verify the playground's localStorage shadow stays in sync (best-effort write-through; Firestore is canonical).
- **`theaWebClearActivity`** (new) — currently the playground deletes locally only. We need a real BE callable for un-liking. Could also be folded into `recordActivity` with a new `state: 'CLEARED'` value, but that's less clean. Recommend a separate callable.

#### Triggers
- **`onGiftActivityWrite`** (new Firestore trigger) — rebuilds the board's materialized `likedProductIds`, `likedProductDetails`, `likedCount`, `lastLikedAt`. Fires on create/update/delete in `giftActivity`.

#### FE
- Heart on every card un-gated (calls `theaWebRecordActivity` directly, no signup modal).
- "Liked for X" tray reads from the materialized board's `likedProductDetails` (no client stitching).
- Inline X-to-remove calls `theaWebClearActivity`.

### Bucket 3 — Multi-recipient flow

#### Schemas
No new fields. Existing `theaWebUser/{uid}/recipient/{recipientId}` already supports multiple recipients. We just use it.

#### Callables
- **`theaWebSubmitGiftFlow`** (existing) — already creates a recipient + recommendation atomically. Used by both the initial quiz and the back-button "start someone new" flow.
- **`theaWebMergeGiftFlow`** (existing) — fans out anon → permanent UID copy of recipients/recommendations/giftActivities. **Verify this covers the new shape** — specifically, the materialized board document. Likely needs to call the same trigger that builds the board after merge so the new permanent user has materialized boards available immediately.
- **`theaWebMintMergeToken`** (existing) — unchanged.

#### Triggers
- The board-materialization trigger (above) handles new-recipient creation transparently.

#### FE
- "My people" page (`/people`): subscribes to `theaWebUser/{uid}/recipient` collection. Renders a tile per recipient with a 4-up collage from `board/current.likedProductDetails[0..3]`. No client stitching — the collage data is in the materialized board doc.
- "Add someone" tile → `/quiz` to start a new recipient.
- Avatar dropdown: My people / Sign in (anon) / Log out, with the threshold-triggered alert.

#### Sign-in threshold
Aggregate user-liked count across all recipients. Excludes seeded entries (playground-only concept; production has none). Once `>= 3`, persistent red dot + alert menu item until sign-in.

### Bucket 4 — Kid-specific flow

#### Schemas
- `recipient.json` already has `age`. Add an optional `lifeStage: 'adult' | 'child'` field — useful for the algo to know it's looking at a kid even before the age value resolves to a bucket. Additive.

#### Callables
- **`theaWebSubmitGiftFlow`** — accepts `lifeStage` in the request wrapper. The current request schema needs an additive field.

#### Algo
- The `carousel_agent` should accept lifeStage as a signal. Kids' algo today goes through the same path as adults; a lifeStage gate could short-circuit irrelevant carousels (no Mother's Day picks for a 6-year-old).

#### FE
- New `lifeStage` quiz step inserted between relationship and age (only for ambiguous relationships).
- KID_AGE_CHIPS replace ADULT_AGE_CHIPS when child.
- Kid path skips occasion → defaults `'Just Because'`.
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

Mostly FE — no new schemas, one minor callable consideration.

#### What goes away
- **The "X" / dismiss button on every product card.** Today the card surfaces three primary actions (Save, Dismiss, Open). Dismiss requires the user to *judge* every item, which adds friction to a behavior that's supposed to be passive browsing. The signal isn't worth the friction; users who don't want an item just scroll past it. We retain the `'DISMISSED'` wire enum and the long-press / explicit-mark path (e.g. inside the Liked tray) for users who actually want to remove an item from their feed, but the always-visible X disappears.
- **The "Refresh my picks" / Regenerate CTA.** Already covered above — replaced by scroll-driven incremental fetch.
- **The tab-swap interaction model on the chip strip.** Today, tapping a chip replaces the feed contents with that chip's products. That model treats categories as exclusive views; in practice users want to graze across categories.

#### What replaces it
- **One continuous vertical feed** organized by chip, with chip names as **section headers** that float into view as the user scrolls.
- **Chip strip across the top stays** but acts as a scrollspy / quick-jump anchor — tapping a chip smooth-scrolls to that section's header rather than swapping the feed contents. Active-chip state mirrors whichever section's header is closest to the top of the viewport.
- **Like-or-keep-scrolling is the only loop.** No third action surface, no decision overhead.

#### Implications
- The pill-button chip tabs from bucket 5 carry over visually but their semantics shift from "view switcher" to "section anchor."
- The end-of-feed "More in {NextChip} →" card from bucket 5 becomes redundant once all chips render in one feed — the user is already there. May be removed or repurposed as a section divider.
- BE: the carousel agent's incremental fetch (bucket 4 above on regenerate) needs to be aware that all chips are *visible at once*, so signal-driven top-up applies to whichever chip the user is dwelling in / liking from, not the whole feed.
- Implicit signal opportunity: dwell time per section, scroll velocity through a section, ratio of likes to scrolled-past items, all become meaningful per-chip signals (see open question below on instrumentation).

#### Trade-off
This is the largest single FE rearchitecture in the proposal. The current results page assumes one chip's products at a time. Stacking all chips into one virtualized feed needs careful work on:
- Image loading / virtualization so 100+ products don't paint at once on first load
- Scrollspy + smooth-scroll behavior across the chip jumps
- Like-flight animation needs to land on the (now further-away on long scrolls) Liked tray destination
- Mobile sheet expand-on-tap behavior must coexist cleanly with the new long-scroll context

## Anon → permanent merge: the one tricky bit

Today, the merge flow is well-understood: `theaWebMergeGiftFlow` copies the anon UID's `recipient/*` subtree to the permanent UID's subtree, then cascade-deletes the source. This already covers the new shape:

- New recipients → copied as-is.
- New recommendations → copied as-is.
- New giftActivity entries → copied as-is.
- New materialized `board/current` documents → **regenerated by the trigger when the merge writes the source data**, so the merge doesn't need to copy them. The trigger handles it as a side effect.

The only addition: if we adopt **localStorage shadow for anon users**, the merge needs to know that the source-of-truth on sign-in is localStorage (most-recent state) rather than the anon UID's Firestore subtree (potentially stale if the user did stuff offline). One of two paths:

1. **Always sync localStorage → Firestore (under anon UID) during normal use**, so the anon Firestore subtree is always at least as current as localStorage. Merge then operates on Firestore as today.
2. **Push localStorage → permanent UID's Firestore on sign-in**, then run the existing merge flow on the now-empty anon subtree. Slightly more complex but explicit.

Recommend **(1)** — write-through to Firestore on every mutation. localStorage is a read cache + offline survival, not the canonical write target.

## Sequencing — proposed PR order

1. **Schema PR** (additive only) — adds optional fields to `recipient.json`, `giftActivity.json`, `theaWebSubmitGiftFlow` request wrapper. Tag Manny per the schema rules. Land first.
2. **Trigger PR** — `onGiftActivityWrite` materializes `board/current.likedProductIds`. No FE changes; safe to deploy.
3. **Callable PR** — `theaWebClearActivity` (or extend `recordActivity` to handle CLEARED). Backwards-compatible.
4. **Algo PR — incremental carousel fetch** — replaces the one-shot regenerate with the scroll-driven incremental fetch path (open question 6 above). Touches `carousel_agent.py` and adds a new callable. Largest algo-side change — merits its own PR. Until this lands, the existing Regenerate CTA stays in place; FE still respects whatever the agent emits.
5. **FE PR — Liked rename + un-gate** — copy changes only, no new mutations. Very low risk.
6. **FE PR — Materialized board listener** — switch `RecommendationResultsPage` from stitching 4 listeners to subscribing to `board/current`. Most code-impactful FE change; merits its own PR with thorough integration tests.
7. **FE PR — Bucket 1 (board narrative)** — quiz copy, homepage copy, testimonials, inline rename, search-pill simplification, "Other" removal, loading state.
8. **FE PR — Bucket 4 (kid flow)** — lifeStage step, kid pill sets, kid emoji overrides, WHAT-hidden gate.
9. **FE PR — Bucket 3 (My people)** — `/people` route, recipient registry, Add-someone tile, avatar dropdown with sign-in threshold.
10. **FE PR — Bucket 5 (responsive primitives)** — bottom sheet, desktop sidebar, pill tabs, sticky CTAs.
11. **FE PR — Bucket 6 (frictionless scrolling)** — drops the X dismiss button + Regenerate CTA, switches to one continuous vertical feed organized by chip with scrollspy-style chip-strip nav. Depends on (4) being live so users actually see new picks as they scroll, and on (10) being live so the chip-strip pill geometry is in place.

Each PR can ship independently behind a feature flag if we want to phase the rollout, but the ordering above means each PR can land *without* a flag — earlier PRs don't break the existing surfaces, later PRs just light up new functionality. The one hard ordering constraint: **(4) must precede (11)**, because dropping the Regenerate CTA without the on-scroll fetch path live would strand users with no way to get fresh picks.

## Out of scope

- **iOS-CRM impact** — none. The shared `theaWebUser/*` subtree is theaWeb-only; the iOS-CRM side (`user/*`, `friend/*`, `event/*`) is untouched.
- **Auth provider changes** — sign-in modal flows stay as today (Apple, Google, email). No new auth surface.
- **Algo reweights** — the carousel agent's input signals expand (lifeStage, board completeness signals), but the ranking model itself doesn't change.
- **Existing analytics events** — they keep firing as today. New events specific to board behaviors (board_visited, board_renamed, like_threshold_crossed) will be a separate analytics PR with the relevant GA4 custom-dimension registrations (per `gotchas.md`).
- **Sent / purchased history surface** — out of scope for v1; the `'PURCHASED'` state already exists, but the user-facing "I sent this on May 3" view is a future addition.

## Open questions for Manny

1. **Materialized board document path.** Proposed `recipient/{rid}/board/current`. Reasonable, or do you want it elsewhere (e.g. a top-level `theaWebBoard/{boardId}` collection for explicit security rules scope)?
2. **`theaWebClearActivity` vs `recordActivity` with `state: 'CLEARED'`.** Separate callable or extend the existing one? Slight preference for separate (cleaner intent), but no strong opinion.
3. **localStorage write-through scope.** OK with anon users having localStorage as a read cache + offline survival, with Firestore as the canonical write target? Or push for IndexedDB / Firestore-anon-uid as the only persistence?
4. **`board/current` trigger fanout.** The trigger fires on every giftActivity write. For a user with 50 likes, that's 50 trigger invocations on initial bulk-load. Should we debounce / batch, or accept the fanout cost?
5. **lifeStage as a wire enum.** Worth canonicalizing as `'ADULT' | 'CHILD'` in the schema, or leaving it inferred from the age value? (My read: explicit field is cleaner — the algo can short-circuit kid-irrelevant carousels without re-deriving from age.)
6. **Scroll-driven incremental fetch.** Replacing the explicit Regenerate CTA with on-scroll batch fetches per chip is the largest algo-shape change in the proposal. Concretely: how do you want this to look? Options I see —
   - **(a) Per-chip pagination cursor** — a new callable (`theaWebExtendCarousel`?) takes `{ recipientId, recommendationId, chipKey, cursor }` and runs an agent pass that appends N more curated products to that chip. Cursor is a server-issued opaque token.
   - **(b) Implicit on-write** — the activity-write trigger that rebuilds `board/current` *also* opportunistically requests the agent to top up under-supplied chips. No client-side fetch trigger; the client just sees new products appear in its listener stream.
   - **(c) Hybrid** — explicit pagination callable for "user is actually scrolling now," opportunistic top-up trigger for "user has been liking, prep the next batch in the background."
   
   I lean toward **(c)** because it keeps client behavior responsive (scroll → fetch) while letting BE pre-warm in the background, but it's the most surface area to commit to. Open to whichever shape you prefer.

7. **Implicit-signal feeding into the agent.** Beyond explicit likes/dismisses, what user-behavior signals should we feed into the next batch of products? Concrete signals worth capturing —
   - **Dwell time on a card** before the user scrolls past (proxy for interest even without a like)
   - **Scroll velocity through a chip section** (fast = uninterested, slow = engaged)
   - **Tap-into-product** (opens external Sovrn link — strong intent signal even if not saved)
   - **Time-on-board across sessions** per recipient
   - **Chip-section abandonment** (user enters a section, scrolls 1-2 items, jumps to another)
   
   And the latency concern: if every scroll/dwell event roundtrips through Firestore + a callable, are we creating perceived lag? Options: client buffers signals and posts in batches every N seconds; signals fire-and-forget (no client wait); signals only feed the *next* fetch, not the current view.

8. **BE instrumentation for absorbing all signals.** Tied to (7) but worth its own scope: how do we want to schema the dwell/scroll/tab events on the BE so analytics + algo can both consume them without re-instrumentation? Recommend a separate dedicated PR for **data schema + logging architecture** after this proposal lands — covers GA4 event shape, Firestore-or-BigQuery for raw event capture, and the materialized aggregations the algo would actually consume. Keeps this proposal focused on product/UX architecture and lets the analytics shape get its own deliberate design pass.

## Companion artifacts

- **Live prototype**: `~/git/thea-mobile-playground/` — every bucket is implemented FE-only with stubbed Firebase. Best way to feel the proposed UX is to run `npm start` against it (or visit the deployed Vercel build).
- **Playground stub layer**: `src/playground/` — read-only mocks (`MockProviders`, `recipientRegistry`, `giftActivityStore`) that simulate the proposed BE shape. Useful as a reference for what the FE expects.
- **`PLAYGROUND_NOTES.md`** in the playground root — running log of any schema asks the prototype surfaced.

---

*Open to any of this being wrong or differently-shaped. The buckets reflect product intent; the architecture below them is one path, not the only one.*
