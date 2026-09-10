# PR Spec — "Trending gift guides" rail on the logged-out homepage

**Repo:** `ManuelMar/thea-web` (React / CRA / styled-components).
**Scope:** Frontend only. No schema, no Firestore rules/indexes, no backend, no new Cloud Functions.
**Design (approved):** Claude Design canvas — https://claude.ai/code/artifact/ad8b54a6-c438-4830-801a-9506dcf2ed82
*(Kate to grant access; this spec is self-contained without it — see §4.)*

This spec is written to be built, not merged as-is — implement it the way that fits the codebase; the
**acceptance criteria (§8)** are the contract.

---

## 1. Problem

On the logged-out / first-time homepage (`LandingPage`, the `!showSignedInLayout` branch):

- The bottom section titled **"Browse gift guides"** is actually `OccasionBrowse` fed `OCCASION_TILES` —
  **8 occasion tiles** (Mother's Day … Teacher Appreciation) linking to `/occasion/<slug>`. It is **not**
  the curated guides.
- The **curated guides** that live on `/gift-guides` (65 visible today, `GUIDE_BROWSE_LISTINGS` in
  `src/theaWeb/guide/guideListings.ts`) are **absent** from the homepage.
- There is **no link to `/gift-guides`** anywhere on the logged-out homepage. The nav "Gift Guides" link
  (`useDesktopNav`) is gated to users with ≥1 board and hidden below 1024px — so a logged-out **mobile**
  visitor has no path to the browse page at all.

## 2. What ships

Replace the occasion browse with a **"Trending gift guides"** horizontal rail of curated guide cards,
placed **above** the testimonials section, whose header carries a **"See all →"** link to `/gift-guides`
(the homepage's first door to the browse page). Mobile = native swipe; desktop = paging arrows.

The rail shows the **same top guides, in the same order, as the top of `/gift-guides`** — it derives from
the same registry (`visibleGuideListings`) and reads strip photos from the same preview source — so the
first guides a visitor sees are identical on the homepage and the browse page.

New logged-out homepage order:
```
Hero → FeatureStack → EmotionalBanner → [Trending gift guides rail] → TestimonialsCarousel → Footer
```
(`OccasionBrowse` is removed. The `/occasion/*` routes/pages are NOT touched — still reachable directly.)

## 3. Current state — exact anchors in this repo

- `src/components/landing/marketing/LandingPage.tsx` — the `!showSignedInLayout` JSX block renders
  `FeatureStack → EmotionalBanner → TestimonialsCarousel → OccasionBrowse` (grep `OccasionBrowse` /
  `occasionsHeading` / `occasionTiles` — line numbers omitted, master moves). Those two props feed
  `OccasionBrowse`; **grep-confirmed no external caller passes them**, and `OccasionBrowse` is imported
  only here + its own test/story.
- `src/theaWeb/guide/GuideBrowse.tsx` — the `/gift-guides` card: an emotive **title + emoji** over a
  **3-tile (aspect 2:3) product "peek strip"**, 16px radius, 2px gaps. Its `Section/Title/Strip/Tile`
  styled-components are **module-private** (only `GuideBrowse`, its props, and `GUIDE_BROWSE_TILE_COUNT`
  are exported).
- `src/theaWeb/guide/guideListings.ts` — `GUIDE_BROWSE_LISTINGS` (hand-ordered registry: `key`, `href`,
  `title`, `emoji`, optional `season`), `visibleGuideListings(now)` (season-filtered), `isInSeason`.
- `src/theaWeb/guide/useGuidePreviewDoc.ts` — reads the materialized doc `theaWebGuidePreviews/current`
  → `{ [guideKey]: string[] }` preview image urls (one doc, self-heals daily; **anon-readability is a
  pre-build gate to verify, not an assumption — §10 #2**). This is how
  `GiftGuidesPage` sources its strip photos.
- `src/theaWeb/pages/GiftGuidesPage.tsx` — reference for wiring listings + `useGuidePreviewDoc` →
  `GuideBrowse`, and for the card-click analytics call.
- `src/theaWeb/board/ProductDetailSheet.tsx` — **reference implementation for a desktop horizontal rail
  with paging arrows** (the "More like this" rail): measure → `canScrollLeft/Right` → conditionally
  rendered ‹ › → page by ~`clientWidth`. Reuse this pattern.
- `src/components/landing/marketing/TestimonialsCarousel.tsx` — the homepage's existing horizontal
  **swipe rail** (flush-left at the section padding, bleeds right). The new rail must match its register.
- `src/theaWeb/lib/gaPixel.ts` — `gaGuideCardClick` → `guide_card_click`; `guide_quiz_cta` shows the
  house pattern of splitting a shared event by an `action` dimension (relevant to §6).

## 4. Target design (self-contained)

**Both viewports** match the **testimonials rail register** so the section reads as part of the page:

- Section `max-width: 1280px`, centered, horizontal padding `16px → 32px (≥640/768) → 64px (≥1024)`.
- Header row: `<h2>` **"Trending gift guides"** at **28px mobile / 40px desktop, weight 700** (identical to
  `TestimonialsCarousel`'s heading). **The entire heading text is itself a link to `/gift-guides`** (the
  whole "Trending gift guides" is clickable — `<h2><a href="/gift-guides">…</a></h2>`), and a right-aligned
  **"See all →"** link (clay `#AF5B50`) also goes to `/gift-guides`. Both are entries to the browse page.
- **Cards per view — RESPONSIVE. The px below are DERIVED reference values, not implementation constants;
  hard-coding them ships broken (a fixed 500px clips the 2nd card on 1024–1279px laptops; a fixed 285px
  loses the peek on ≤~360px phones).** The tiny 5–6-up is rejected — photos must be large/compelling.
  - **`R` = the rail's inner content width** = `min(viewport, 1280px) − 2 × sectionPadding`
    (sectionPadding = 16px `<640`, 32px `640–1023`, 64px `≥1024`). The rail is the testimonials-track
    pattern: cards flush-left at the padding, the next card peeking and **bleeding through the right
    padding to the physical viewport edge** — exactly what `TestimonialsCarousel` already does, and the
    affordance that reads as "there is more this way". Card widths are still derived from `R`, so every
    formula below is unchanged: measured against the content box the peek is exactly 20%, it just reads
    wider (~33% at 1280px) against the full viewport. Mirror `TestimonialsCarousel`'s Track exactly for
    this.
  - **Card-to-card gap (pin it, matching the testimonials rail): `16px` below 768px, `24px` at ≥768px.**
    (The peek amount and whether the cards fit both depend on the gap.) Tile gap stays 2px;
    `tileW = (cardW − 4px) / 3`.
  - **Target peek = 20% of the next card.** Card width per breakpoint (no clamps — the formula holds the
    1-/2-up + 20% invariant at every width in range):
    - **Mobile (<768px): 1 full + 20% peek** → `cardW = (R − 16px) / 1.2`  (CSS `calc(83.333% − 13.333px)`).
      @390px `R`=358 → **~285px** (peek 57px); @320px SE `R`=288 → ~227px (peek 45px). ✓
    - **Tablet (768–1023px): 1 full + a ~50% peek (~1.5 cards)** → `cardW = (R − 24px) / 1.5`.
      @768 `R`=704 → ~453px; @1023 `R`=959 → ~623px. (Avoids one giant single card before desktop's 2-up.)
    - **Desktop (≥1024px): 2 full + 20% peek** (two gaps — 1→2 and 2→3) → `cardW = (R − 2 × 24px) / 2.2`
      (CSS `calc(45.4545% − 21.818px)`). @≥1280 `R`=1152 → **~502px** (peek ~100px, tiles ~166px);
      @1024 `R`=896 → ~386px, still 2 full + peek. ✓
  - Card = the shared `GuidePeekCard` (title + 3-photo strip).
- **Card** = the existing `/gift-guides` peek strip: **title with the emoji trailing, pinned to the last
  word** (see below), over a 3-tile 2:3 product-photo strip (16px radius, 2px gaps, cream placeholder
  tiles when an image is missing).
- **Title height must be reserved so the strips align.** In a single-row rail, a 1-line title vs. a
  2-line title (e.g. "Back to school" vs. "Coffee, tea & matcha gifts") otherwise pushes its strip down
  and the rail looks broken/uneven. Reserve a fixed two-line title height (`min-height ≈ 2 × line-height`)
  so **every peek strip starts on the same baseline** regardless of title length. (This is a real bug the
  first mock had — see the acceptance criteria.)
- **Emoji handling (explicit request):** the emoji sits **after** the title, pinned to the **last word**
  with a non-breaking space so it wraps together with that word and is **never orphaned on its own line**
  (e.g. "Spooky Season / Style 🦇"). Emoji at `0.82em`; title `text-wrap: balance`.

**Ergonomics:**
- **Mobile:** native touch swipe (`overflow-x: auto`), no JS. Matches the testimonials rail.
- **Desktop (≥1024px):** paging **arrows (‹ ›)** that appear **only when there is more to scroll** and
  hide at each end; clicking pages by ~one viewport width. Reuse `ProductDetailSheet`'s rail pattern:
  - gate rendering on a desktop viewport check (matchMedia `(min-width: 1024px)`), not CSS alone;
  - page with `scrollBy({ left: ±Math.max(clientWidth * 0.9, 200) })`, `behavior: 'smooth'` **downgraded
    to `'auto'` when `matchMedia('(prefers-reduced-motion: reduce)').matches || navigator.webdriver`**
    (keeps Storybook/Happo deterministic);
  - arrow = ~46px circle, white, `#E8E5E0` border, soft shadow, an **inline-SVG chevron** (no emoji/glyph).
  - **Accessibility (required, not optional):** each arrow is a native `<button>` with an `aria-label`
    ("Previous gift guides" / "Next gift guides"), a visible focus style, and it is removed/disabled in
    sync with the scroll bounds — so keyboard and screen-reader users get real, labeled controls, not a
    clickable SVG. (The mock draws a bare `<div>` for brevity; the build must use a button.)
- **No auto-advance** (that behavior belongs to testimonials' 4 items, not a browse rail).

Palette/type already in the theme: font `Albert Sans`; accent/clay `#AF5B50`; foreground `hsl(22 10% 20%)`;
cream `#F5F0EB`; hairline `#E8E5E0`; strip radius 16px.

## 5. Changes — recommended structure (two PRs)

Splitting keeps each PR small and lets the refactor land independently. Combine if preferred, but keep
the card **shared, not forked** (§8).

### PR 1 — extract a shared `GuidePeekCard`
- New `src/theaWeb/guide/GuidePeekCard.tsx` (+ test + story): an exported presentational card
  `{ href, title, emoji, imageUrls, onClick? }` holding the title (with the pinned-emoji rule above) and
  the 3-tile strip (padding to `GUIDE_BROWSE_TILE_COUNT`, `data-testid` `guide-peek-tile` /
  `guide-peek-placeholder`, clay hover).
- Refactor `GuideBrowse.tsx` to render `<GuidePeekCard>` in its existing grid — behavior unchanged.
- The pinned-emoji tweak is the one intended visual change vs. today's `GuideBrowse`.

### PR 2 — the homepage rail
- The rail shows the **top N of `/gift-guides`**: derive its listings from
  `visibleGuideListings(now).slice(0, HOME_RAIL_COUNT)` — the exact same season-filtered, hand-ordered
  registry `GiftGuidesPage` renders — so the homepage and the browse page always lead with the same
  guides in the same order, by construction. Define `HOME_RAIL_COUNT` (default **8**) next to the
  component. No separate featured list to maintain: the single control point is the registry order in
  `guideListings.ts` (which already governs `/gift-guides`); a guide falling out of season drops from
  both surfaces together. **Note this order needs no Firestore read** — `visibleGuideListings` is a pure
  function over the static registry, so the "matches /gift-guides" guarantee costs nothing.
- New `src/components/landing/marketing/HomeGuideRail.tsx` (+ test + story): the section in §4. Listings
  from `visibleGuideListings(now).slice(0, HOME_RAIL_COUNT)`; strip photos from `useGuidePreviewDoc()`
  (the same doc `/gift-guides` uses — see §10 #2, the one item for Manny's agents to confirm). Accept
  story/test overrides (e.g. `previewImagesOverride`, `nowOverride`) so stories never touch Firebase.
  Renders `GuidePeekCard`s + the desktop arrows.
- `LandingPage.tsx`: in the `!showSignedInLayout` block, render `<HomeGuideRail/>` **above**
  `<TestimonialsCarousel>` and **remove** `<OccasionBrowse/>` + its two props + the now-unused
  `OCCASION_TILES` / `OccasionGridTile` imports. Applies to `/` and `/welcome2` automatically
  (`MomsLandingPage` wraps `LandingPage`).
- Delete the orphaned `OccasionBrowse.tsx` + its test + story. Grep-confirm `OccasionGrid.tsx` /
  `OCCASION_TILES` has no other importer; if none, delete it too.

## 6. Analytics

The `surface` GA param is a fixed vocabulary (`board | liked | shared_board | gift_guide`) — **do not mint
a new surface**. Distinguish the homepage rail with an added dimension, mirroring how `guide_quiz_cta`
splits by `action`:

- Card tap in the rail → fire the **same event `GiftGuidesPage` fires for that listing's `kind`**
  (`gaGuideCardClick` for `kind:'guide'`, `gaOccasionCardClick` for `kind:'occasion'` — every listing is a
  guide today), tagged with `entry_point: 'homepage_rail'`, e.g.
  `gaGuideCardClick({ occasion: <key>, surface: 'gift_guide', entry_point: 'homepage_rail' })`. Extend
  **both** `GaGuideCardClickParams` **and** `GaOccasionCardClickParams` with an optional
  `entry_point?: string` and pass it in whichever branch fires (today it's always the guide branch, but the
  registry keeps `kind: 'occasion'` for future listings — don't leave the occasion path un-taggable);
  `/gift-guides` keeps firing both events **unchanged** (no `entry_point`).
- Tap on **either** the "See all →" link **or the "Trending gift guides" heading** (both go to
  `/gift-guides`) → a new `gaGuideSeeAllClick({ entry_point: 'homepage_rail' })` → `emit('guide_see_all_click', …)`.

Rationale: lets us measure rail CTR, see-all CTR, and (joined to `quiz_start`) whether the rail is additive
to quiz starts vs. an early exit. `entry_point` and `guide_see_all_click` also need registering as GA4
custom dimension/event (Kate's side).

## 7. Testing requirements

Match the repo's existing layers (Jest + RTL unit, Storybook + Happo visual). Every new component needs a
test **and** a story.

- `GuidePeekCard`: title renders; **emoji is pinned to the last word and never orphans**; N image tiles vs.
  placeholders; link href; `onClick` fires. Story uses `data:` URI images (Happo determinism).
- `HomeGuideRail`: renders the featured listings in order; card tap fires `gaGuideCardClick` with
  `entry_point: 'homepage_rail'` (spy); **both** the "See all" link **and the "Trending gift guides"
  heading** link to `/gift-guides` and fire `gaGuideSeeAllClick`;
  **desktop arrows** — mock the rail node's `scrollWidth`/`clientWidth`/`scrollLeft`, drive with
  `fireEvent.scroll`, assert each arrow appears/hides at start / middle / end, and that a click calls
  `scrollBy` with `±~0.9 × clientWidth`; assert the reduced-motion/`navigator.webdriver` path uses instant
  scroll. **Accessibility:** query the arrows via `getByRole('button', { name: /previous gift guides|next gift guides/i })`
  (proves they're real, labeled buttons, not clickable SVGs). Inject `previewImagesOverride` so no Firebase.
  Story: deterministic `data:` tiles, Happo targets for both a mobile (swipe) and desktop (arrows) frame; JS
  scroll gated so nothing is photographed mid-flight.
- The rail's source list equals the leading `HOME_RAIL_COUNT` of `visibleGuideListings(now)` — assert it
  matches the first N listings `/gift-guides` shows, in the same order; add a season-boundary case (an
  in-season guide is present, then absent past its window, and the same guide leaves `/gift-guides`).
- `LandingPage`: a render-order assertion — `FeatureStack → EmotionalBanner → HomeGuideRail →
  TestimonialsCarousel`, and `OccasionBrowse` absent (mock `HomeGuideRail`, matching how the page tests
  mock heavy children).

## 8. Acceptance criteria (the contract)

1. Logged-out / no-boards homepage renders, in order, `FeatureStack → EmotionalBanner → Trending-guides
   rail → TestimonialsCarousel`; **no** occasion browse anywhere on the page.
2. The rail's cards are the **same card component** the `/gift-guides` page renders — no duplicated/forked
   card markup (one source of truth).
3. Card title shows the emoji **trailing, pinned to the last word**; a two-line title never leaves the emoji
   alone on a line.
4. Section register matches the testimonials rail: 1280 max-width, 16/32/64 padding, 28→40px/700 heading,
   flush-left/bleed-right.
5. **Mobile:** the rail swipes. **Desktop:** ‹ › arrows appear only when scrollable, hide at the ends, and
   page the rail; motion is instant under reduced-motion / webdriver.
6. **Cards per view (responsive per §4):** mobile shows **1 card + the next peeking**; desktop shows **2
   cards + the 3rd peeking**, with a ~20% peek held by the formula (NOT fixed px). **Verify at the edges
   where fixed px breaks:** 320px (mobile keeps a peek, card ~227px), 390px (~285px), 1024px (desktop
   shows 2 full + peek, card ~386px), ≥1280px (~502px). Card width is derived from `R`; the gap is 16/24px.
7. **Both** the "See all →" link **and the "Trending gift guides" heading** navigate to `/gift-guides`.
7. Analytics per §6 fire with the right params; `/gift-guides`'s existing `guide_card_click` is unchanged.
8. `/` and `/welcome2` remain identical.
9. Tests + stories per §7 pass; `CI=true npm run build` is clean; Happo has no unexplained diffs.
10. The rail's guides and their order **equal the top `HOME_RAIL_COUNT` of `/gift-guides`** (both derive
    from `visibleGuideListings`); reordering the registry updates both surfaces identically.
11. **All peek strips align on a common baseline** — a card with a 2-line title does not push its strip
    below the 1-line cards. Verify at desktop AND mobile widths with a mix of 1- and 2-line titles in the
    rail (e.g. "Back to school" next to "Coffee, tea & matcha gifts").

## 9. Out of scope

- The `/occasion/*` routes and pages (kept, untouched).
- `GiftGuidesPage`'s container, listings, and behavior (unchanged). **NOT out of scope:** `GuideBrowse` is
  intentionally refactored to render the shared `GuidePeekCard`, and the pinned-emoji change applies to its
  cards too — that visual change on `/gift-guides` is expected, not scope creep.
- Any schema / Firestore rules / backend / Cloud Function change.
- The signed-in / has-boards homepage ("Your people").
- A/B experimentation infrastructure (see §10).

## 10. Decisions

**Settled (Kate):**
1. **Placement** — rail **above** testimonials.
3. **Featured set** — the rail **mirrors the top of `/gift-guides`** (the first `HOME_RAIL_COUNT` of
   `visibleGuideListings`), so both surfaces always lead with the same guides. `HOME_RAIL_COUNT` default
   **8** (adjustable). No separate curated list — variety/ordering is controlled by the registry order in
   `guideListings.ts`, which already governs `/gift-guides`, so the two never drift.

   **The rail follows the page's order, by design.** What ranks at the top of `/gift-guides` is a
   **manual editorial decision Kate makes in `guideListings.ts`** (today the Halloween guides lead). The
   rail's whole job is to inherit exactly that order — so "is the lead set right for the season" is
   answered on the `/gift-guides` side, never here. How that top order gets chosen (a future,
   currently-manual process Kate owns) is **out of scope for this rail** — build it to match whatever the
   page currently shows.

**One item for Manny's agents to confirm (this is a GATE, not a default):**
2. **Preview images.** The recommended path — read strip photos from **`useGuidePreviewDoc`** (the same
   `theaWebGuidePreviews/current` doc `/gift-guides` reads) — depends on two things this spec cannot settle
   from thea-web, so treat them as **pre-build gates**, not assumptions:
   - **(a) Verify the anonymous read.** Confirm an unauthenticated, production-equivalent read of
     `theaWebGuidePreviews/current` actually succeeds (the Firestore rules live in thea-serverless). The
     spec does **not** assert this is true — verify it. `/gift-guides` reading it while anon-reachable is
     suggestive, not proof.
     If the read is denied, the live path is off the table.
   - **(b) Approve the listener.** This adds **one Firestore doc listener** to the logged-out marketing
     homepage, currently listener-light by design — confirm that's acceptable there.

   **If either gate fails**, the listener-free fallback is a **checked-in, keyed manifest**
   (`guide-key → [3 CDN urls]`, built by resolving each featured guide's lead-product `images_cdn`/
   `images_cdn_mobile`), and the contract then narrows to **order-mirroring only** — the guides + their
   order still mirror `/gift-guides` (that comes from the static registry, not the listener), but the
   *photos* become a manual snapshot that can drift and must be refreshed on catalog/registry changes.
   Note the coupling to the mirror: the manifest must be keyed by guide **key** (not position) and must
   cover every guide the top-`HOME_RAIL_COUNT` slice can surface, or a reorder shows placeholder tiles.
   Everything else in this spec is independent of this choice.

**Post-ship (Kate, not a build task):** the analytics in §6 exist so Kate can watch quiz-start and
first-board-creation rates after launch and revert if the rail measurably pulls visitors out of the quiz
funnel.
