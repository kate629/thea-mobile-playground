# Mobile UI design exploration — running document

Source material: paid ad campaign + user interviews 2026-05-06.
Last updated: 2026-05-07.

This document is the long-form design exploration for the mobile redesign.
It pairs with `PLAYGROUND_NOTES.md` (schema asks log) and the playground
itself. Kate has not yet reviewed; treat as draft for her redirection.

---

## ICP — design for the grandma in constant-shopping state

**The aspirational user is a grandma with little grandchildren who is
*always* in a state of looking for things for them.** Not the once-a-year
birthday-gift buyer. She's mentally noting things she sees, returning to
Thea over weeks and months, slowly building up a picture of what each
grandkid would love, sending when the moment is right.

Implications:
- The product is fundamentally about **return visits**, not single-session conversion.
- The product needs to feel **ambient and low-pressure** — closer to scrolling Instagram than executing an e-commerce search.
- **Persistent state per recipient** is the spine. 3 grandkids = 3 ongoing boards.

Existing observed archetypes (analytics + memory) are constraint checks, not targets:
- **List-Builder** (many saves, no clicks) — closest to ICP.
- **Click-Through Browser** (1 click, 0 saves) — currently a real revenue path; redesign for ICP costs some CTB revenue. Be explicit when a design has that tradeoff.

---

## Cross-theme synthesis

**Thesis**: per-recipient boards as the durable primitive — not result-sets.
The grandma's mental model is *"Maya has an ongoing list I'm always quietly
adding to"* — a CRM-shaped product, not a search-engine-shaped one.

**Item state model expands** from `SAVED / DISMISSED / PURCHASED` to:
- **Impressed** (Thea showed it to her — implicit signal: dwell, scroll-past speed, click-aways)
- **Saved** (one-tap, no signup gate)
- **Considering** (NEW — cart-like comparison lane)
- **Sent** (formerly Purchased)
- Dismissed becomes optional, mostly inferred.

**Click-aways become implicit interest signal** (per Kate's domain push) — they
fire from Impressed → implicit-interest, distinct from Saved (explicit). Channel
split changes; schema stays additive.

Alternatives considered and rejected:
- **Occasions as primitive**: punctual, not durable; doesn't fit always-shopping grandma. (See open question — punctual users may need an occasion-mode overlay.)
- **Pure temporal feed (Pinterest-home-style)**: lower friction, no recipient binding, loses the "Maya's board over time" thread.
- **No primitive change, just polish**: leaves theme 4 (magic isn't legible) unaddressed.

---

## Theme 1 — Curation feels too active

| Option | Design | Tradeoffs | Archetype risk |
|---|---|---|---|
| **1A** | Single-tap save into board (Pinterest). One primary action. Long-press for reactions. No X. Algorithm learns from saves + reactions + click-aways + dwell. | Long-press desktop-unfriendly. Needs separate /board surface. | Hurts CTB. Helps ICP + List-Builder. |
| **1B** | Tinder-style swipe (right=save, left=pass, up=detail, down=different vibe). | Low throughput — fatal mismatch with "90 seconds in line at the grocery store." | Probably wrong product shape. |
| **1C** | Kate's action item refined: chip filters as top tabs; sticky horizontal sub-headers; vertical scroll inside; ungated heart; X→long-press only. | Closest to current; cheapest to ship. Doesn't fix theme 2 alone. | Minimal. |
| **1D** | Two-pane "river": discover feed top, persistent board strip bottom. Tap card → flies into board. | Complex on mobile (small viewport); needs real DnD; new primitive. | Helps ICP a lot; overcomplicates CTB. |

**Recommendation: 1A.** Cleanest input into the boards primitive. 1C is the safe ship-incrementally fallback.

**Benchmark**: Pinterest's tap-to-save + long-press-for-board-picker. Mechanic: default action saves to default destination; gesture reveals power features.

**Validation**: Storybook A/B; 5-user moderated test "remember 5 things you'd like for someone." Measure saves/min, mistaken-save count, 24h return via paid-ad cohort split.

---

## Theme 2 — Where does saved go + login gate

| Option | Design | Tradeoffs | Archetype risk |
|---|---|---|---|
| **2A** | Board IS the post-quiz destination. `/board/:recipientId` with stacked sections (Discover/Saved/Considering/Sent). Save = visible flight animation. Anon = localStorage + bookmarkable URL. | Fragile localStorage (private browsing, clearing data, no cross-device). New primitive. Anon→permanent merge extension. | Reframes whole product. CTB may bounce. |
| **2B** | Board sidebar (visible-but-secondary). Persistent thumbnail strip on results page. | Less radical; mental model still leaks. | Minimal. |
| **2C** | Boards as home for return visitors. Returning users see "Your people: Mom · Maya · Alex." | Requires returning-user recognition. Doesn't fix in-session "where did my save go" alone. | Helps return-visit habit; first-session unchanged. |
| **2D** | Don't gate heart; flat localStorage favorites pile, no recipient binding. | Easiest. Doesn't enable per-recipient mental model. | Minimal. |

**Recommendation: 2A + 2C combined.** Synthesis only works if boards are durable spine *and* home. 2D is the bandage if we can't ship the full reframe.

**Benchmark**: are.na's "channels are the home." Pinterest's profile-as-board-list. Mechanic: persistent collection IS the entry point, not a sub-tab.

**Validation**: paid-ad cohort split — half see today's results page, half see board-as-home. Measure 24h and 7-day return rates.

---

## Theme 3 — Tweaking + retaking is hidden

| Option | Design | Tradeoffs | Archetype risk |
|---|---|---|---|
| **3A** | Inline "what we know about her" panel on board. Editable chip strip + freeform inline. Edits trigger refresh. | Per-field edit UI; refresh-strategy decision. | Strict improvement. |
| **3B** | Quiz becomes recipient settings drawer. | Discoverability fix only. Misses chance to redesign quiz. | Minimal. |
| **3C** | Conversational input replaces step quiz. Single freeform; LLM extraction; user confirms. | LLM cost + extraction failure modes. Recovery UX needed. | Helps ICP. Could intimidate discrete-option users. |
| **3D** | Quiz lite + ongoing nudges. Trim to 3 questions. Thea proactively asks one question per session on the board. | Matches accrual mental model. First-session less precise. New nudge component. | Helps ICP. |

**Recommendation: 3A + 3D as a package.** 3A for explicit edits; 3D for the ongoing input stream that mirrors how the ICP learns about her grandkids week-by-week. 3C is a more ambitious follow-up worth A/B testing later.

**Benchmark**: Spotify's onboarding (quick) + ongoing thumbs + "you've been listening to a lot of X" prompts.

**Validation**: 10-user diary study, 2 weeks. Measure edits/user/week, "for someone else" events, friction self-reports.

---

## Theme 4 — Magic isn't legible

| Option | Design | Tradeoffs | Archetype risk |
|---|---|---|---|
| **4A** | The board IS the message. Empty Saved/Considering/Sent visible from session 1. Header "for Maya · started today · 12 picks so far." | Depends on board UI being self-evident — design skill not copy skill. | Minimal. |
| **4B** | Thea-narrator copy in loading state. Slow-typing the value-prop sentence. | Lowest cost. Heavy-handed if not paired with UX shift. | Minimal. |
| **4C** | Onboarding tour after first quiz. | Most users skip tours. | Small first-session regression. |
| **4D** | "Build her board" framing replaces "find a gift" across surfaces. | Copy-only but consistent. First-impression confusion possible. | Possible first-tap-rate drop. |

**Recommendation: 4A + 4D.** Make the model visible without explaining (4A); language consistent (4D). Skip 4C. Skip 4B unless paired with 4A.

**Benchmark**: Notion's empty-state design — empty state itself teaches. Pinterest's first-board empty state.

**Validation**: 5-user moderated test. After 30s on first board ask "what is this for?" Today's answer: "find gifts." Target: "save ideas for Mom over time."

---

## Theme 5 — Click-out slog + cart-like comparison

| Option | Design | Tradeoffs | Archetype risk |
|---|---|---|---|
| **5A** | "Considering" lane on every board. Discover → Saved → Considering → Sent. Click-out from Considering, not Discover/Saved. | 4 states = more UI; new schema enum. | Helps ICP. Doesn't affect CTB (they skip to click-out as today). |
| **5B** | In-Thea detail view delays click-out. Thea-rendered detail page; click-out only on buy intent. | Needs richer per-product data; click-out later in funnel — quality up, velocity maybe down. | Helps ICP + List-Builder. |
| **5C** | Embedded merchant webview. | Technical complexity; iframe-block; affiliate cookie issues. | Marginal. |
| **5D** | Pinterest "ideas" vs "tried" split. | Less direct than 5A. | Helps ICP + List-Builder. |

**Recommendation: 5A.** Maps directly to cart-narrowing behavior users described. Click-aways from Considering are strong purchase-intent signal — different weight than click-aways from Discover.

**Benchmark**: Amazon "Save for later" vs "Cart." Goodreads' want-to-read / currently-reading / read. Mechanic: separate the long-tail "I'm interested" pool from the short-tail "I'm deciding now" pool.

**Validation**: 10-user diary study, 1 week. Did anyone use "move to Considering"? If not, collapse Saved+Considering.

---

## Holistic — Day in the life of Margaret (the ICP)

**Tuesday morning**, coffee, on her phone. Margaret sees a Thea ad. Lands on
the homepage with a single freeform input: *"Tell me about someone you'd
love to give to."* Types: *"My granddaughter Maya, 7, loves reading and
outdoors."* Thea confirms relationship + age band, lands her on
`/board/maya-{token}`. The board has Discover (filling in), and visible
empty Saved/Considering/Sent sections below. Header: "Maya's board · started
today." Loading sub-text: *"We'll keep adding to her board as we learn more."*
She scrolls Discover for 4 minutes, taps to save 6 things — each one flies
up into Saved. Closes the tab without signing in. Anon board persists in
localStorage with bookmarkable URL.

**Saturday morning**, kitchen. Types "thea" — autocomplete pulls up the
Maya bookmark. Lands on the board. Discover has 8 new picks (algorithm
learned from Tuesday's saves *and* her click-aways, both fed in). Saves
3 more. Saved has 9 items. Thinks: "Maya's birthday is in 3 weeks, let me
narrow." Drags 4 of the 9 into Considering. Considering shows them
side-by-side: $28, $35, $42, $19. Taps the $19 — Thea's detail view, no
click-out yet.

**Sunday afternoon**, ready to commit. Opens Maya's board. Considering has
4 items. Decides on the $35. Taps "Buy on [retailer]." For the first time,
Thea offers: *"Save Maya's board so you don't lose her over weekends like
this one."* She signs in (anon→permanent merge). Click-out fires. Affiliate
fires. Item moves to Sent. Returns 3 minutes later — the back button
worked — and the cycle restarts; she now has a board for grandson Jack too.

**Cohesion check**: boards primitive is the durable spine. Quiz becomes
freeform onboarding (3D + 3C). Saving is one-tap, anon-friendly (1A). Empty-
state teaches (4A + 4D). Considering lane provides cart-like comparison
(5A). Click-aways feed the algorithm at a different weight per state. Sign-
in is offered when she has *something to lose by not signing in* — not
gated up front.

---

## Sequencing — kr-* sized chunks

**Phase 1 — Cheapest test of synthesis (~2 weeks, 1–2 PRs)**
Ungated save (anon → localStorage) + "you saved 4 things for Mom"
affordance on existing results page. A/B on paid traffic. Measure 24h/7d
return rate. No backend, no schema, no new routes.

**Phase 2 — Recipient board surface (~3 weeks, 3 PRs)**
- `/board/:recipientId` route with BoardLayout (Discover + empty Saved/Considering/Sent).
- Post-quiz nav goes to `/board/...` instead of `/quiz/results/...`.
- Home shows board thumbnails for returning users.
- Schema asks: `Recipient.boardCreatedAt`, `Recipient.lastVisitedAt` (additive). Manny-tagged.

**Phase 3 — Considering lane (~2 weeks)**
- Additive `CONSIDERING` enum on `giftActivity.state`. Schema PR first.
- UI: drag/button between Saved↔Considering; side-by-side view.

**Phase 4 — Conversational onboarding + nudges (~2 weeks)**
- Replace step quiz with freeform LLM extraction (3C). Add "Thea asks a question" nudge component (3D).

**Phase 5 — Algorithm signal expansion (~1 week, gated on Manny)**
- Wire click-aways into recommendation pipeline at different weights per state.

**Phases 2+ are gated on Phase 1 validation.** If it fails: less-radical theme-by-theme fixes (1C, 2B, 3A, 4B, 5D) ~3 weeks total.

---

## Design language layer (added 2026-05-07)

> "How can we mix the scrollability of Instagram, with the gamification
> ('I saved it!' 'I added to their board') of mobile games, with the
> inspiration of Pinterest?" — Kate

This isn't a sixth theme — it's a design-language layer that runs *across*
the five themes. It changes the affective register of the product from
"competent" to "gentle, satisfying, ambient."

### What each lens contributes

**Instagram → effortless feed**
- Vertical infinite scroll on Discover. Section headers ("FOR THE COZY HOMEBODY") become subtle separators within one continuous scroll, not separate carousels.
- Full-bleed product photos — not cards-in-rows.
- Algorithmic ordering Thea owns (no more "here are 4 fixed carousels").
- Optional "stories" rail at top: recent saves on her other recipients' boards, mood inspiration.
- The feed *is* the experience — no tab-switching for browsing.

**Mobile games → satisfying micro-rewards**
- Double-tap to save (Instagram's heart) — instant, ungated, *feels* rewarding.
- On save: heart pulse + tiny particle burst + thumbnail flies up to a corner board-counter.
- Board counter at top of screen visibly increments: "Maya's board · 13 picks."
- Light haptic on iOS where supported.
- Streak/milestone moments (gentle, NOT Candy-Crushy):
  - "Maya's board hit 10 picks 🎉" — a one-time soft celebration.
  - "We noticed Maya's a cozy minimalist 🌿" — vibe label emerges after 3-5 saves.
  - "You've added to Maya 3 weeks in a row." (No countdown, no "DON'T BREAK YOUR STREAK" — just an observation that feels good to read.)
- Send moment as the final reward: "Maya's gift gallery is ready." Not just "you bought a thing."

**Pinterest → inspiration as collected feeling**
- Some Discover items are mood images, not products — a flatlay of a cozy desk, a girl reading by a window, a styled vignette. Saving them tells Thea "more like this energy."
- Board view has a "mood" section: the inspiration that drove the saves.
- Each board has its own visual identity — a color palette + typography flourish derived from the saves.
- "What Maya's board feels like" — autogenerated mood collage when she views it.
- Boards are visually beautiful as artifacts. Worth screenshotting. Worth showing your daughter on the phone.

### Specific design moves combining all three

1. **Replace horizontal carousels with vertical infinite feed.** (Instagram + Pinterest.) Pulls hard on theme 1 — eliminates the "horizontal scroll is taxing" problem. Section dividers stay; carousel-as-fixed-set goes.

2. **Double-tap save with rich micro-animation.** (Instagram + games.) Save mechanic for theme 1. Heart pulse, particle burst, thumbnail fly-to-corner, count increments. Ungated by login.

3. **Board counter as ambient progress indicator.** (Games.) Persistent at top of every Discover view: "Maya's board · 12 picks · last add 2m ago." Updates in real-time. Gentle progress, not gamified pressure.

4. **Vibe detection as celebratory milestone.** (Games + Pinterest.) After 3-5 saves, Thea surfaces an emergent vibe label: "Maya's a cozy minimalist 🌿." Editable. Becomes part of the board's visual identity. A small celebration, not a forced quiz step. Pulls on theme 4 — the ICP literally watches Thea learn her granddaughter, which makes the magic legible.

5. **Mood images alongside products in Discover.** (Pinterest.) ~20% of feed is mood content with no product attached — vignettes that match the recipient's vibe. Saving a mood = "more like this energy" signal to the algorithm. Pulls on theme 1 (richer save vocabulary) and theme 4 (the feed has affective content, not just utility).

6. **Send-the-board as completion reward.** (Games + Pinterest.) When Considering has 3+ items and the board is mature, surface: "Maya's gift gallery is ready — here's what to send for her birthday →" Pulls on theme 5; turns the click-out moment into a satisfying conclusion to the curation arc rather than the abrupt end of session.

7. **Cross-board streak (gentle).** (Games.) Optional, off by default. "You've added to Maya, Jack, and Mom this week — your most active week yet." No countdown, no penalty for missing. Pulls on theme 2 (board-as-home) and theme 4 (return visit habit).

8. **Boards are visually beautiful artifacts.** (Pinterest.) Masonry layout, no chrome, the items are the design. Screenshottable. Shareable. The board view itself is the "I made something for someone I love" object. Pulls on theme 4 (the magic) and surfaces the missing **sharing** dimension I flagged in self-critique #9.

### Why this layer matters

Without this layer, the five themes net out to a *competent* product:
boards primitive, board-as-home, considering lane, conversational quiz,
algorithm signal expansion. That's a clean redesign that solves the
research findings.

With this layer, the product becomes *emotional*. The grandma isn't using
a tool — she's enjoying a small daily ritual of curating for someone she
loves. That ritual is what creates the return-visit habit the ICP requires.

This layer also resolves self-critique #12 (warmth was missing).

### ICP-specific risk: gamification calibration

The grandma ICP is older, less likely to find aggressive gamification
charming. Streaks must be gentle and observational, not forced. The
language should never be "DON'T BREAK YOUR STREAK!" — it should be "you've
been thinking about Maya a lot this week, that's lovely." Visual register
should be elegant (Pinterest's quiet aesthetic), not gamified-bright
(Duolingo green).

Test specifically: a 5-user moderated session showing the streak/milestone
copy and asking "does this feel patronizing or warm?" If 2+ users feel
patronized, recalibrate — this is a high-stakes copy decision.

### Phase 1 — what changes with this layer

The Phase 1 affordance ("you saved 4 things for Mom") becomes more
specific:
- The save action is a double-tap with the Instagram-heart animation.
- The affordance is a small persistent counter, not a banner.
- One emergent vibe label appears after 5 saves.

Same Phase 1 cost (~2 weeks, FE-only), but the test now validates not just
"do users save more when ungated" but "do the gentle micro-rewards
materially raise return rate." Same A/B framework; richer signal.

---

## Open questions / where Kate would push back

These are flagged for Kate's review. I'd want input on these before drafting Phase 1.

1. **The boards thesis is presented too cleanly.** Multi-month bet, framed slam-dunk. Phase 1 tests the *save affordance*, not the *boards-as-home* claim. Real test of boards-as-home is a Phase-2 ship in front of paid cohort. Should distinguish "small bet (saves)" from "big bet (board reframe)."

2. **Occasions-as-primitive dismissed in one line.** Mother's Day, Christmas, weddings, graduations — punctual deadlines. Not all gift-giving is constant-shopping. May need an occasion-mode overlay on top of recipient boards. Underweighted.

3. **Anon-localStorage edge cases unworked.** Private browsing, browser data clearing, no cross-device — all destroy anon board. If we force signin to make it durable, we're back to the gate problem. Probable answer: localStorage + email-bookmark-link sent on first save + soft signup prompt at the right moment.

4. **Conversational quiz (3C) more fragile than admitted.** LLM extraction misreads + cost. 3D (lite quiz + nudges) is safer; 3C should be a follow-up.

5. **Considering lane (5A) might not earn complexity.** If diary study shows users don't use it, we collapse Saved+Considering. Design otherwise leans hard on it.

6. **Near-term affiliate revenue.** Moving the ICP from "click out fast" to "build a board over weeks" probably drops near-term revenue. Bet pays off only if return rate doubles enough to compensate for halved per-session click-out. Worth modeling break-even.

7. **No real plan for Click-Through Browser path.** Optimized for ICP at explicit expense of CTBs. Either propose parallel path that preserves CTB conversion OR explicitly acknowledge sunsetting that user.

8. **Manny dependency in Phases 3 and 5.** Phase 3 needs additive `CONSIDERING` enum. Phase 5 is BE-owned. Phases 3+ gated on his buy-in.

9. **Sharing is missing.** "Send when the time is right" — does Margaret share the board with anyone? With Maya? With co-givers? Sharing is huge unrealized upside; design-language layer surfaces it via "boards are beautiful artifacts" but doesn't yet propose a sharing mechanic.

10. **Benchmark thinness.** Missed: Pocket (read-it-later as primitive); Linktree (board as share surface); biggest miss — **wedding registry sites (Zola, Honeyfund)**. A registry IS a recipient-bound list that accrues over time and culminates in a send moment. Probably the most direct benchmark; worth studying Zola specifically before Phase 2.

11. **First-impression confusion in 4D copy.** "Start a board for someone" might feel like commitment when user just wants a gift idea. A/B-test homepage copy specifically.

12. **Gamification calibration risk for older ICP.** Streaks/milestones must be gentle/observational, not forced. High-stakes copy decision. Recalibrate if 2+ moderated-test users feel patronized.

### Where I'd want Kate's input most before drafting Phase 1
- Are we okay betting on the ICP this hard, or do you want to keep the redesign more reversible?
- What's the affiliate revenue floor we can't cross during the transition?
- How much weight do you want to give the punctual-occasion user vs. the constant-shopping ICP?
- Is sharing in scope or explicitly out for now?
- How "loud" should the gamification micro-rewards be — closer to Pinterest's quiet, or closer to Duolingo's celebratory?
