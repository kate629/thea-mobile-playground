# Quiz Step Telemetry Plan

**Status:** DRAFT — pending Manny review
**Date:** 2026-05-05
**Authors:** Kate (with Claude)
**Reviewer:** Manny
**Implementation owner:** TBD

---

## Motivation

Today's quiz funnel instrumentation is start-and-end only. We fire `quiz_start` on `/quiz` mount and `quiz_search_submitted` on submit. There is no per-step instrumentation. We can compute the aggregate "% who finished the quiz" but we cannot tell **which step** users abandon on, or how long they linger on each step before bailing.

For an episodic-product like Thea, the quiz IS the conversion event. Without per-step data we cannot answer:

- Which step is the highest-friction (gender? occasion? freeform?)
- Does friction differ by cohort (e.g., do 60+ women drop on the gender step at higher rates)?
- Is freeform input a meaningful add or do users skip it?
- Are leave-warning interrupts effective?

This plan adds three events that close the gap, mirrors the existing PR #107 ranker-telemetry pattern (GA4 + first-party sink), and ships as a single FE-only slice that can be reviewed/merged independently.

---

## Design decisions (push back if you disagree, Manny)

All six initial open questions have a working resolution as of 2026-05-05. Each is shown with the recommendation; Manny has authority to override any of them, but absent objection these are the design as-shipping. Two that would materially affect the implementation if reverted: Q1 (ship `_view` + `_complete`, not just `_complete`) and Q6 (aggregate-only on interests, defer toggle stream).

1. ~~**`quiz_step_view` — ship or skip?**~~ **RESOLVED 2026-05-05 (Kate): ship both `_view` and `_complete`.** Without `_view`, we can't distinguish "user saw the step and bailed" from "user never reached this step" — that's the core diagnostic question we need answered. Cost is one extra event per step (~5/quiz, negligible). Push back only if you have a strong objection.

2. ~~**`time_in_step_ms` everywhere or only on abandon?**~~ **RESOLVED 2026-05-05 (Kate): always-on.** Cheap to capture on every transition (one `useRef<number>` for entry timestamp), useful for "did users zip through or dwell" on every step rather than only the abandoned one. Marginal cost is one param per step event. Push back if you'd rather only capture on abandon.

3. ~~**BQ column promotion (slice 2):**~~ **RESOLVED 2026-05-05 (Kate): defer to slice 2.** Today the JSON `properties` column on `analytics.user_events` accepts new fields without schema migration. Only justify the column promotion if query perf on `JSON_EXTRACT_SCALAR(properties, '$.step_name')` becomes a real bottleneck — probably never at our volume. Slice 1 lands in `properties`. Push back if you'd prefer top-level columns for slice 1.

4. ~~**Bundling with Tier 2 backlog?**~~ **RESOLVED 2026-05-05 (Kate): standalone slice.** Quiz dropoff is the highest-leverage Tier 2 event; ship it now without waiting for refresh events / sign_in / recipient_added / regenerate_recommendations to be ready. Those land as separate PRs later. Manny can still push back if he prefers a bundled approach.

5. ~~**Branch ownership.**~~ **RESOLVED 2026-05-05 (Kate): `kr-quiz-step-telemetry`** (Kate-side, Claude-implemented). You review. Push back if you'd rather own the implementation as `mgm-quiz-step-telemetry`.

6. ~~**Per-chip-toggle event stream for interests (v1 or v2)?**~~ **RESOLVED 2026-05-05 (Kate): aggregate payload in v1, defer per-toggle stream to v2.** v1 ships the summary fields on `quiz_step_complete` (final selection + total toggle count + freeform metadata), which answers today's friction questions. v2 toggle stream is meaningfully more events and only earns its keep if your ranker training specifically wants the interaction order. Push back if v2 should land in v1 because the ranker pipeline needs it now — you'd know better than I would.

---

## Architecture: GA4 + first-party sink (mirror pattern)

Mirror to BOTH destinations on every fire, exactly like PR #107 did with reactions (save / dismiss / click / purchase):

- **GA4** for dashboard funnel reporting. Existing pipe.
- **First-party sink → BQ** for unbiased cohort analysis. Captures the ~30% of users with ad-blockers that GA4 silently drops.

Single FE call site → two destinations. The marginal cost is one extra line per call site (`sinkEvent(...)` after the existing `gaXxx(...)` helper).

---

## Identifier scheme (per Manny's review feedback, 2026-05-05)

The existing `carousel_session_id` (`${uid}_${recommendation_id}`) doesn't exist during the quiz steps — there's no recommendation yet. Quiz events need a separate identifier that's stable across all events from the same quiz attempt, so the BQ funnel can be reconstructed.

**Scheme: `quiz_session_id = ${anon_uid}_quiz_${quiz_start_ts}`**

Generation rules:
- Generated client-side ONCE at the entry point (QuizPage mount, SearchPill submit, board-redirect, etc.) at the same moment `quiz_start` fires
- Stored in a small React context (or `useRef` on QuizPage) for the duration of the quiz
- Passed as a required param on every `quiz_step_view` / `quiz_step_complete` / `quiz_abandon` event
- Mirrored into the BQ `session_id` column so quiz events live alongside carousel events in the same column. The `event_name` distinguishes which session shape: `quiz_*` events use `quiz_session_id`; `carousel_*` and reaction events use `carousel_session_id`.

**Tie-back to the carousel:**
When the carousel session is created post-submit (in `useSubmitGiftFlow`), the same `quiz_session_id` is plumbed through and stored in `properties.quiz_session_id` on the resulting `carousel_visible` and reaction events. Lets analytics chain quiz → carousel → click-out without reconstructing through `anon_user_id` (which is noisy across multiple sessions).

**A user who starts the quiz, abandons, and starts again** = two distinct `quiz_session_id`s, same `anon_user_id`. Correctly reflects two separate funnel attempts.

**A user who hits the back button mid-quiz** stays on the same `quiz_session_id` (no re-mount of QuizPage; just `setStep` rewind).

---

## Events (3)

### Accumulated quiz context (added 2026-05-05 per Manny's review)

Every quiz step event carries any quiz context **collected up to that point**. The four context fields (`relationship`, `gender`, `age_range`, `occasion`) map to existing top-level BQ columns on `analytics.user_events` — so cohort segmentation queries don't need to JSON-extract from `properties`, and they don't need to join back to `quiz_search_submitted` for context.

| Step fires | Has `relationship` | Has `gender` | Has `age_range` | Has `occasion` |
|---|---|---|---|---|
| `quiz_step_view` (relationship) | – | – | – | – |
| `quiz_step_complete` (relationship) | ✓ | – | – | – |
| `quiz_step_view` / `_complete` (gender, conditional) | ✓ | view: – / complete: ✓ | – | – |
| `quiz_step_view` / `_complete` (age) | ✓ | ✓ if applicable | view: – / complete: ✓ | – |
| `quiz_step_view` / `_complete` (occasion) | ✓ | ✓ if applicable | ✓ | view: – / complete: ✓ |
| `quiz_step_view` / `_complete` (interests) | ✓ | ✓ if applicable | ✓ | ✓ |
| `quiz_abandon` | as known | as known | as known | as known |

Implementation: the running quiz answers are already in scope inside `useQuizFlow.ts` (state). Plumb them onto each event helper call.

### `quiz_step_view`
**Fires when:** A step renders to the user.

**Fire sites:**
- `QuizPage.tsx` — on mount, fire for `step_name='relationship', step_number=1` (no prior `setStep` to hook into). The `quiz_session_id` is generated here (or by the SearchPill caller) at the same moment.
- `useQuizFlow.ts` — fire for the step that's about to render after each `setStep()` transition

**Params:**
```ts
{
  quiz_session_id: string,    // ${anon_uid}_quiz_${quiz_start_ts} — generated once at entry point
  step_name: 'relationship' | 'gender' | 'age' | 'occasion' | 'interests',
  step_number: number,        // 1..5 by canonical position
  entry_point: string,        // pass-through from quiz_start
  // Accumulated context — present when known at fire time (see table above):
  relationship?: string,
  gender?: string,
  age_range?: string,
  occasion?: string,
}
```

### `quiz_step_complete`
**Fires when:** User clicks the chip / advances forward.

**Fire sites:** `useQuizFlow.ts` — fire for the *previous* step (the one that just completed) on each forward `setStep()`.

**Params:**
```ts
{
  quiz_session_id: string,
  step_name: ...,
  step_number: number,
  entry_point: string,
  time_in_step_ms: number,    // wall-clock from step view to completion
  // Accumulated context — present when known at fire time:
  relationship?: string,
  gender?: string,
  age_range?: string,
  occasion?: string,
  // For step_name === 'interests' only — additional `properties` (see "Interests step" section below):
  // chips_selected, chips_total_toggles, freeform_used, freeform_char_count, etc.
}
```

### `quiz_abandon`
**Fires when:** User leaves mid-quiz via back button, logo click, or leave-warning confirm.

**Fire sites:**
- `useBackButtonGuard.ts` — confirm-leave callback
- `useLeaveWarning.ts` — logo-click confirm-leave callback

**Params:**
```ts
{
  quiz_session_id: string,
  last_step_name: ...,
  last_step_number: number,
  entry_point: string,
  time_in_step_ms: number,    // time on the abandoned step
  abandon_reason: 'back_button' | 'logo_click' | 'leave_warning',
  // Accumulated context — whatever was known when they bailed:
  relationship?: string,
  gender?: string,
  age_range?: string,
  occasion?: string,
}
```

Note: `quiz_abandon` does NOT fire when the user closes the tab / loses connection / browser crash. Those are unrecoverable. We capture the explicit-action abandons only.

---

## Interests step: richer instrumentation (per Manny's review feedback, 2026-05-05)

The interests step is materially more interactive than relationship/age/gender/occasion (single-select chips, click-to-advance). It has:
- **Multi-select chip toggling** — users add and sometimes remove chips before submitting. Add-then-remove is a real friction signal.
- **Freeform textarea** — optional, ~1000 char cap (capped by recent fix). The freeform is where the differentiation moat lives, so usage rate matters.
- **Submit gate** — the "Show me my gifts" CTA only enables after ≥1 chip is selected.

The standard `quiz_step_complete` event for interests carries additional params alongside the standard ones. These land in BQ via the `properties` JSON column (no schema migration needed):

```ts
{
  // Standard quiz_step_complete params: quiz_session_id, step_name='interests',
  // step_number=5, entry_point, time_in_step_ms

  // Interests-specific (in `properties` JSON):
  chips_selected: string[],              // final selection at submit, e.g. ['Books','Cooking','Plants']
  chips_selected_count: number,          // |chips_selected| at submit
  chips_total_toggles: number,           // total clicks including deselects (high vs selected_count = friction)
  chips_unique_toggled: number,          // distinct chips touched at least once
  freeform_used: boolean,                // user typed at least 1 char before submit
  freeform_char_count: number,           // final length at submit
  freeform_word_count: number,           // approximate (split on whitespace)
  time_on_freeform_ms: number,           // cumulative focused time across all focus/blur cycles
}
```

These params answer:
- **"Are users adding then removing chips?"** — high `chips_total_toggles` relative to `chips_selected_count` indicates indecision
- **"Is the freeform getting used?"** — `freeform_used` rate across all interest-step completions; `freeform_word_count` distribution tells us if it's substantive or one-word
- **"Do users care about the freeform?"** — `time_on_freeform_ms` distribution; ratio against `time_in_step_ms` shows freeform-vs-other engagement split
- **"Do users dwell on the chip-selection task?"** — analytically: `time_in_step_ms - time_on_freeform_ms` (everything not focused in the textarea — captures active chip engagement plus idle/scrolling time, but distinguishing those isn't worth implementation complexity)

### Implementation notes (mobile reality)

Three real mobile quirks would otherwise produce misleading data. Worth pinning the implementation contract here so it doesn't get lost.

1. **`time_on_freeform_ms` must be cumulative across focus/blur cycles, not last-blur-minus-first-focus.** On iOS Safari especially, scrolling can trigger blur → refocus, and naive math would lose the time during scroll. Implementation: maintain an array of `{focus_ts, blur_ts}` pairs; sum durations at submit.

2. **Both `time_on_freeform_ms` and `time_in_step_ms` MUST pause on `visibilitychange`.** Page Visibility API: when `document.hidden === true`, pause the timer; when visible, resume. Without this, a user who tapped the textarea, got a phone notification, and came back 5 minutes later would log "5 min on freeform" — which is a phone-was-locked artifact, not engagement. **Apply the same Visibility API treatment to `time_in_step_ms` for the same reason.**

3. **No focus tracking on chips.** `<button>` elements don't get focus events the way a textarea does (only on keyboard-tab nav, which mobile users never trigger). That's why `time_on_chips_ms` is computed analytically rather than tracked directly. The `time_on_freeform_ms` field is the only direct dwell metric.

Tracked state lives in `useRef` inside the interests step (or `useQuizFlow.ts`):
- `chips_total_toggles`, `chips_unique_toggled` — incremented on each chip click
- `freeform_focus_intervals: Array<{focus: number, blur: number | null}>` — pushed on focus, blur_ts filled on blur. On submit, sum `(blur ?? performance.now()) - focus` across all intervals.

All metadata computed at submit time, sent on the single `quiz_step_complete` event for interests. No event explosion.

### Data caveats for mobile users

These metrics are directionally useful at cohort scale but should not be over-read at individual-user granularity:

- **`chips_total_toggles` over-counts "friction" on mobile.** Fat-finger taps are far more common on mobile than on desktop. A user might tap the wrong chip, untap it, tap the right one — that's 3 toggles for 1 final selection. Some of that is real friction (changed mind); some is accidental tap (fat finger). Hard to disambiguate per-user. Across a cohort of N=500+, the signal is real; per-user it's noisy.

- **`freeform_char_count` and `freeform_word_count` are autocorrect-affected.** iOS / Gboard autocomplete inflates character counts relative to user effort (user types 4 chars, autocomplete fills to 8). Useful for "is the freeform getting used and is the use substantive" — not useful for "user A typed 47 chars, user B typed 52 chars, A engaged less."

- **`freeform_word_count` is approximate.** Split on whitespace. "I'm" = 1 word; emoji are tokens; Unicode normalization not applied. Reliable enough as a distributional metric (1-word vs 5-word vs 20-word freeforms cluster meaningfully) but not for fine-grained comparisons.

**Per-chip-toggle stream — deferred to v2.** A `quiz_interest_chip_toggled` event firing on every click would give full behavior-replay capability (reconstruct the user's interaction order). v1 aggregate covers the friction questions without the volume bump. See open question 6.

---

## Fire site changes (concrete)

| File | Change |
|---|---|
| `src/theaWeb/lib/gaPixel.ts` | Add 3 helpers: `gaQuizStepView`, `gaQuizStepComplete`, `gaQuizAbandon`. Mirror existing helper shape (`fireWhenIdle(() => emit(eventName, params))`). Bot-skip via existing `botDetect.ts` (no contamination). |
| `src/theaWeb/lib/eventSink.ts` | No code change needed — `eventSink` already accepts arbitrary event names. Confirm in the PR description. |
| `src/components/landing/quiz/useQuizFlow.ts` | Wire fire calls into the 5 `setStep()` transitions. Use `useRef<number>` to capture `performance.now()` on each step entry; compute `time_in_step_ms` on transition. |
| `src/theaWeb/pages/QuizPage.tsx` | On mount, fire `quiz_step_view` for `step_name='relationship', step_number=1` (and capture entry timestamp for `time_in_step_ms` of the first step). |
| `src/theaWeb/hooks/useBackButtonGuard.ts` | Fire `quiz_abandon` from the confirm-leave callback. |
| `src/theaWeb/hooks/useLeaveWarning.ts` | Fire `quiz_abandon` from the logo-click confirm-leave callback. |

Each call site fires the GA4 helper AND mirrors to the sink:

```ts
const params = { step_name: 'gender', step_number: 2, ... };
gaQuizStepComplete(params);
sinkEvent('quiz_step_complete', params);
```

---

## Queries this schema supports (added 2026-05-05 per Manny's review)

Sanity-check that the events + params + context propagation actually cover the analyses we plan to run. Sketches below — not full SQL, just the join shape and which fields satisfy each question.

### Funnel-shape queries

**1. Per-step conditional CVR — "of users who saw step X, what % completed it?"**
```
numerator = COUNT(DISTINCT quiz_session_id) WHERE event_name='quiz_step_complete' AND properties.step_name=X
denominator = COUNT(DISTINCT quiz_session_id) WHERE event_name='quiz_step_view' AND properties.step_name=X
```
Both events carry `quiz_session_id` and `step_name`. ✓

**2. Where do users abandon most?**
```
SELECT properties.last_step_name, COUNT(*)
WHERE event_name='quiz_abandon'
GROUP BY 1
```
`quiz_abandon` carries `last_step_name`. ✓

**3. Time-on-step distribution per step**
```
SELECT properties.step_name,
       APPROX_QUANTILES(properties.time_in_step_ms, 100)[OFFSET(50)] as p50,
       APPROX_QUANTILES(properties.time_in_step_ms, 100)[OFFSET(75)] as p75
WHERE event_name='quiz_step_complete'
GROUP BY 1
```
`time_in_step_ms` on every `_complete` event. ✓

### Cohort-segmented funnel

**4. Per-step CVR by relationship** ("do gender-step dropoffs concentrate by relationship?")
```
Same as Q1 but grouped by `relationship` (top-level BQ column, populated via context propagation)
```
Now supported via the context-propagation table in the events section. ✓ (Was the gap Manny's question surfaced.)

**5. Per-step CVR by mobile vs desktop**
```
Same as Q1 but grouped by REGEXP_CONTAINS(user_agent, r'iPhone|Android|Mobile') AS is_mobile
```
`user_agent` already populated server-side on every event. ✓

**6. Per-step CVR by paid vs organic**
```
Join quiz_session_id → anon_user_id → existing paid_uids set (from update_overall_paid.py logic)
```
`anon_user_id` on every event. ✓ — minor query complexity for the paid-uid join but consistent with how the dashboard already works.

### Interests-step questions

**7. Most-selected chips by relationship × occasion**
```
SELECT relationship, occasion, chip, COUNT(*)
FROM (
  SELECT relationship, occasion,
         JSON_VALUE(c) AS chip
  FROM `analytics.user_events`,
       UNNEST(JSON_QUERY_ARRAY(properties, '$.chips_selected')) AS c
  WHERE event_name='quiz_step_complete' AND JSON_VALUE(properties, '$.step_name')='interests'
)
GROUP BY 1, 2, 3
```
`chips_selected` array in `properties`; `relationship` + `occasion` top-level columns. ✓

**8. Friction signal: % of users who toggle ≥N times before settling**
```
SELECT (CAST(JSON_VALUE(properties, '$.chips_total_toggles') AS INT64)
        - CAST(JSON_VALUE(properties, '$.chips_selected_count') AS INT64)) AS extra_toggles
WHERE event_name='quiz_step_complete' AND JSON_VALUE(properties, '$.step_name')='interests'
```
Both fields in `properties`. ✓

**9. Freeform usage rate + word-count distribution**
```
SELECT AVG(CAST(JSON_VALUE(properties, '$.freeform_used') AS BOOL)::INT64) AS usage_rate,
       APPROX_QUANTILES(CAST(JSON_VALUE(properties, '$.freeform_word_count') AS INT64), 100)[OFFSET(50)] AS p50_words
WHERE event_name='quiz_step_complete' AND JSON_VALUE(properties, '$.step_name')='interests'
```
Both fields in `properties`. ✓

**10. Engagement split: time on freeform vs total step**
```
SELECT JSON_VALUE(properties, '$.time_on_freeform_ms') / properties.time_in_step_ms AS freeform_share
WHERE event_name='quiz_step_complete' AND JSON_VALUE(properties, '$.step_name')='interests'
```
Both fields available. ✓

### Cross-funnel chains

**11. Quiz-session → carousel → click-out chain**
```
WITH quiz_completions AS (
  SELECT quiz_session_id, recommendation_id  -- recommendation_id available on quiz_search_submitted post-submit
  FROM `analytics.user_events`
  WHERE event_name='quiz_search_submitted'
)
SELECT q.quiz_session_id, ce.event_name, ...
FROM quiz_completions q
JOIN `analytics.user_events` ce
  ON ce.session_id = CONCAT(q.anon_user_id, '_', q.recommendation_id)  -- carousel_session_id format
  OR JSON_VALUE(ce.properties, '$.quiz_session_id') = q.quiz_session_id  -- explicit propagation
```
Joinable both via implicit `carousel_session_id` shape AND via explicit `quiz_session_id` in carousel-event `properties` (per the Identifier scheme section). ✓

**12. "Did high-freeform-engagement users click out at higher rates?"**
```
JOIN Q11 + Q10 + filter on quiz_results_product_click events
```
All three joinable. ✓

**13. Abandonment recovery: "did users who abandoned and started again get further?"**
```
SELECT anon_user_id, quiz_session_id, MAX(properties.last_step_number) AS reach
FROM `analytics.user_events`
WHERE event_name IN ('quiz_step_complete', 'quiz_abandon')
GROUP BY 1, 2
-- Then per anon_user_id, look at sequence of quiz_session_ids ordered by event_ts_client
```
`anon_user_id` and `quiz_session_id` both available; `event_ts_client` on every event. ✓

### Coverage summary

All 13 canonical analyses are queryable from the events as specified. The one gap Manny's question surfaced — context propagation onto each event — is now addressed in the event params.

---

## Schema impact

### GA4 custom dimensions (additive)

Register the following custom dimensions in GA4 admin (~5 min in the Admin UI). All NULLABLE — older quiz events without these params just leave the dimensions blank.

- `step_name` (event-scoped, string)
- `step_number` (event-scoped, integer)
- `last_step_name` (event-scoped, string)
- `last_step_number` (event-scoped, integer)
- `time_in_step_ms` (event-scoped, integer)
- `abandon_reason` (event-scoped, string)

Per the analytics handoff §1, GA4 already has 24 custom dimensions registered. These are 6 more. Within GA4's 50-custom-dimension limit per property.

### BigQuery (`analytics.user_events`)

**Slice 1: zero schema migration required.** The existing `properties` JSON column already accepts arbitrary new params; new event types land cleanly into the existing schema. The `event_name` column distinguishes our new event types from existing ones.

**Slice 2 (defer):** if `JSON_EXTRACT_SCALAR(properties, '$.step_name')` queries get expensive at scale, promote `step_name` and `step_number` to top-level columns via `ALTER TABLE ADD COLUMN` (additive, safe) + `schema_version` bump from 1 → 2 in `functions/loaders/user_events_schema.json`. Old rows stay null in the new columns.

---

## Performance discipline

Per the standards established in the analytics handoff §16:

- **All events fire through `fireWhenIdle()`** (existing `lib/idleCallback.ts`). No impact on user-perceived latency.
- **Bot-skip via existing `botDetect.ts`** — no contamination from Lighthouse / Happo / Selenium.
- **Sink events batch through existing eventSink** (10 events / 5s / visibilitychange / pagehide). No new infrastructure.
- **Bundle size:** ~100 LOC of new helper code. Negligible.
- **No new IntersectionObservers, no new PerformanceObservers** — quiz step events are pure user-action triggers.

Lighthouse impact: expected 0ms LCP, < 1ms TBT. No new render work on the quiz path. Confirm via Lighthouse compare on `/quiz` before merge.

---

## Test plan

- **Unit test (`gaPixel.test.ts`):** New helpers emit with correct event name + params. Bot-skip works. ~6 assertions.
- **Unit test (`useQuizFlow.test.tsx`):** Each `setStep()` forward transition fires `quiz_step_complete` for the previous step + `quiz_step_view` for the next step. `time_in_step_ms` computed correctly. Backward transitions (back button) do NOT fire `quiz_step_complete`. ~5 assertions.
- **Unit test (`useBackButtonGuard.test.tsx`, `useLeaveWarning.test.tsx`):** Confirm-leave callback fires `quiz_abandon` with current step state. ~2 assertions each.
- **Integration test:** Playwright e2e walking all 5 steps. Verify all 5 `quiz_step_view` + 5 `quiz_step_complete` events fired (caught via test-harness sink stub). ~1 e2e test.

Total: ~10-15 new tests, ~3-4 hours of test-writing time.

---

## Slice scope

### Slice 1 (this PR): FE-only quiz step events
- Three new events (view / complete / abandon)
- Mirrored to GA4 + sink
- No BE changes
- No BQ schema migration
- ~80-120 LOC + ~10-15 tests

### Slice 2 (future, only if needed): BQ column promotion
- ALTER TABLE on `analytics.user_events` to promote `step_name` + `step_number` to top-level columns
- `schema_version` bump
- Update `functions/loaders/user_events_schema.json`
- Backfill: nulls in old rows (not worth backfilling)
- Trigger: only if query perf on `JSON_EXTRACT_SCALAR(properties, '$.step_name')` becomes a bottleneck. Probably never at our volume.

---

## Out of scope

- **Sub-step granularity within `interests`** (e.g., "user paused on chip 3 for 8s before clicking chip 4"). Could add later as a separate event; deferring.
- **Regenerate-flow step instrumentation.** "Update picks" / "Refresh my picks" trigger their own funnel; they share the drawer UX with the quiz but are sequenced differently. Separate slice.
- **Recipient-edit-drawer step instrumentation.** Same as above.
- **Tab-close / browser-crash abandon detection.** `pagehide` event could fire a fire-and-forget abandon, but reliability is poor (sendBeacon limitations) and the data quality bar isn't worth the implementation cost. Deferred.
- **Per-question completion within a step.** E.g., "user selected relationship='Mom' but never advanced." Captured implicitly by `quiz_step_view` without a corresponding `quiz_step_complete`; doesn't need its own event.

---

## Branch + PR shape

- **Branch:** `kr-quiz-step-telemetry` (default; can move to `mgm-` if you prefer to own implementation)
- **PR title:** `Quiz step telemetry: per-step view / complete / abandon events`
- **PR body sections:** Summary / Out of scope / Tests (with quantified counts) / Schemas touched
- **Co-author tag:** `🤖 Generated with [Claude Code](https://claude.com/claude-code)`
- **Tag Manny on review** per the cross-cutting telemetry rule
- **Open as draft.** Mark Ready only after spec + PR review and CI green.

---

## References

- **Precedent for mirror-to-both pattern:** [thea-web PR #107](https://github.com/ManuelMar/thea-web/pull/107) — Ranker training telemetry: per-card impressions + dwell + reaction mirrors. Established `lib/eventSink.ts` and the GA4-plus-sink mirroring pattern.
- **Precedent for first-party telemetry pipeline:** [thea-serverless PR #18](https://github.com/ManuelMar/thea-serverless/pull/18) — Ranker training telemetry: logEvents callable + pipeline_phase + candidate_set. Established `theaWebLogEvents` callable.
- **Precedent for hourly BQ load:** [thea-serverless PR #20](https://github.com/ManuelMar/thea-serverless/pull/20) — Hourly GCS → BQ loader. Established `analytics.user_events` table.
- **Original Tier 2 plan:** `~/Desktop/thea/onboarding/ANALYTICS_HANDOFF.md` §3a — quiz_step_complete and quiz_abandon called out as Tier 2 events that haven't shipped.
- **Schema source of truth (BQ):** `~/git/thea-serverless/functions/loaders/user_events_schema.json`.
