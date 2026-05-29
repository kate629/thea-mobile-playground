# Calendar — desktop / wider-viewport proposal

Status: **draft for Kate review**
Author: Claude (agent run, 2026-05-28)
Audience: Kate; pre-design discussion, not a build plan

## Goal

Scale the shipped mobile calendar (live at `kr-calendar-tab-mock` branch
@ `5efd066`, preview at
`thea-643b1-23686--materialized-people-preview-gku7u51e.web.app/calendar`)
to desktop. At ≥1024px viewports the existing phone-frame design centers
in a sea of cream and reads as "broken on big screens." We need a layout
that uses the wider canvas productively while keeping the iOS card
vocabulary and Thea's clay/cream palette intact. Mobile design is shipped
and stays as-is.

## Layout proposal

**Two-pane at desktop. Month grid on the left, event rail on the right.**

```
┌────────────────────────────────────────────────────────────┐
│  thea                                       People · Cal · 👤 │ ← SiteHeader
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────────────┐  ┌──────────────────────┐   │
│  │  May 2026     Today ‹ ›  │  │  MAY 2026  · 2 events │   │
│  │                          │  │                      │   │
│  │  S  M  T  W  T  F  S     │  │  ┌─────────────────┐ │   │
│  │  …                       │  │  │ May 24  Sarah   │ │   │
│  │   day cells (40-60px)    │  │  │ Birthday  …•••  │ │   │
│  │                          │  │  └─────────────────┘ │   │
│  │  …                       │  │  ┌─────────────────┐ │   │
│  │                          │  │  │ May 31  Mom     │ │   │
│  └──────────────────────────┘  │  │ Birthday  …•••  │ │   │
│        ~720px                  │  └─────────────────┘ │   │
│                                │      ~360px          │   │
│                                └──────────────────────┘   │
│                                                            │
│  outer max-width: 1400px · padding 64px @ ≥1024            │
└────────────────────────────────────────────────────────────┘
```

The right rail is **the same `EventList` + `EventCard` components from
mobile** — just laid out as a column to the right of the grid rather than
stacked below it. No new card primitive; the iOS vocabulary (peach-clay
date chip, overlapping thumbs, corner check) is preserved.

The left grid is **the same `MonthGrid`** but with bigger day cells
(40–60px square at ≥1024, with the today highlight rendering as the
existing clay rounded square just at larger scale). No inline event chips
on the grid cells — the dot stays, density goes into the right rail.
Rationale: inline grid chips create design pressure for "expand-on-click"
flyouts and clutter density choices; the rail already shows the same
information chronologically.

Day-tap behavior on the grid scrolls the rail to that date — same as the
existing `scrollToDate` mechanism on mobile.

## Component reuse vs. new

| Component | Mobile role | Desktop role | Change |
|---|---|---|---|
| `CalendarPage` | Page shell, Phone (480px) container | Two-pane layout shell | Replace `Phone` styled-div with breakpoint-aware container; mount `<DesktopShell>` ≥1024 |
| `MonthGrid` | 7-col, max-width 480 | 7-col, ~720px max | Reuse; pass a larger `cellSize` prop or scale via parent |
| `EventList` | Below grid | Right rail, sticky-scroll | Reuse; no API change |
| `EventCard` | Full-width | Slightly narrower (360px rail) | Reuse |
| `MobileTabBar` | Bottom of viewport, visible on mobile | Hidden on desktop | Add `@media (min-width: 1024px) { display: none; }` |
| `SiteHeader` | Already on /calendar (mobile + desktop) | Same, plus inline nav | Extend with optional horizontal nav links (see below) |
| `MobileTabBarMount` | Mounted on `LandingPage` for ≥1 recipient | Becomes mobile-only | Same gating logic; just adds a media query |
| **NEW: `DesktopShell`** | n/a | Two-pane layout primitive that hosts grid + rail | Tiny styled wrapper; ~30 lines |

## Top-nav strategy

Mobile uses a bottom tab bar; desktop doesn't get bottom-fixed nav (no
mobile-Safari URL-bar pain at desktop, but visual convention is top-nav).

**Add right-grouped nav links to `SiteHeader`, paired with the avatar.**
Pattern reference: Etsy + Pinterest's secondary nav — wordmark anchors
the left as the brand, nav items + avatar form a "your stuff" cluster
on the right. With only two nav items, this avoids the "lonely centered
nav" look that 2–3 items get when centered between wordmark and avatar.

```
┌────────────────────────────────────────────────────────────┐
│  thea                              People    Calendar   👤  │
└────────────────────────────────────────────────────────────┘
```

The avatar is **not** a third nav item — it's the existing
`HeaderAccountMenu` component (account/sign-in/sign-out, threshold-dot
nudges). So the nav is structurally two links + the existing avatar.

**Visual treatment:**
- Items: text-only, Albert Sans, 16px, weight 500 inactive / 700 active
- Active-route indicator: 2px clay underline, 4px below text baseline
- Hover: clay color shift on the text, no underline
- Gap between items: 24px
- Gap before avatar: 32px (visual breathing room separating nav from "you")
- Items hidden at `<1024px` — bottom tab bar handles mobile/tablet (shipped)

**Gating:** Calendar link appears only when `useFriendsList` reports ≥1
recipient (same gate as `MobileTabBarMount`). People link always shows
(its target `/#your-people` is the homepage section, which exists for
everyone). For first-time visitors with zero recipients, the nav is
empty — just wordmark + avatar.

**Rollout: ship to all pages in one PR.** Same `SiteHeader` instance
is used by `CalendarPage`, `LandingPage`, `OccasionRoute`, and any
future page. The nav surfacing follows the user wherever they are —
muscle-memory consistency for the ICP.

`SiteHeader` grows one new optional prop: `showNav?: boolean`
(defaulting to `true` once the rollout lands; explicit `false` for
surfaces that want the chrome-free version).

## Breakpoint behavior

| Width | Layout | Notes |
|---|---|---|
| `<640px` | Mobile (shipped) | Phone container at 480px max, bottom tab bar fixed |
| `640–1023px` | Same as mobile, slightly more breathing room | Phone container can grow to 600px max; tab bar stays |
| `1024–1279px` | Two-pane starts | Grid ~640px, rail ~320px, outer padding 32px |
| `≥1280px` | Comfortable two-pane | Grid ~720px, rail ~360px, outer padding 64px |
| Max content width | 1400px outer | Matches `BrowseMyFriendsSection` + `ComingUpStrip` patterns |

The 640–1023px range deliberately stays in mobile layout — narrow
tablet/window widths don't have room for a useful side rail without
crushing one or both panes. Cleaner to keep one design across that range.

## Interaction additions for desktop

- **Hover on a grid day with events:** small tooltip showing the
  event titles ("Sarah's Birthday · Mom's Birthday"). Uses the existing
  per-day `hasEvents` data + `event.recipient.name` from the same
  `events` array; pure render-time, no new state.
- **Hover on an event card:** subtle elevation lift (already wired via
  `transform: translateY(-1px)` in `EventCard`). Keep as-is.
- **Keyboard nav on the grid:** arrow keys move selection, Enter
  scrolls the rail to the selected date, Escape clears selection.
  Standard accessibility expectation for older ICP who's used to
  Google Calendar's keyboard model. ~20 lines of `useEffect` + `keydown`
  handler on `MonthGrid`.
- **Ellipsis menu on cards:** click only on desktop (matches mobile).
  Hover-open is jumpy and inaccessible — skip.
- **Past events:** same warm-gray date-chip treatment as mobile. No
  desktop-specific difference; the ICP cue is consistent.

## Empty state

A signed-in desktop user with no recipients (currently sees mock fallback
on preview) gets a wider canvas treatment:

**Left column** (grid area): the calendar grid still renders, scoped to
holidays-only. Mother's Day, Father's Day etc. appear as before.

**Right column** (rail area): instead of an event list, a soft prompt
card —

> *"Add your first person to start tracking their occasions"*
> [ + Add a recipient ]  (clay pill button)

The CTA links to `/quiz` (the existing recipient-creation entry point).
Once a recipient is added with a birthday, the rail switches to the live
event list automatically via `useMaterializedComingUp`.

Anon users (no `useFriendsList`) don't reach `/calendar` from the nav
(it's gated), so this state is signed-in-with-no-data only.

## Past events — default behavior

The current month's past events are visible by default for **both**
real users and the mock fallback. If today is May 28 and the rail is
showing May 2026, a birthday on May 24 renders with the dimmer
warm-gray date chip (plus the corner checkmark if marked done).

How the wiring works:
- **Future events** come from `useMaterializedComingUp()` — BE
  materialized, future-only by design.
- **Past-this-month events** are derived FE-side via a small new
  hook, `useRecipientDates()`. It subscribes to the same
  `theaWebUser/{uid}/recipient/*` collection that `materializedComingUp`
  feeds from, keeps only `birthdayMonth/Day` + `anniversaryMonth/Day`,
  and computes this-year's date for each. Anything in
  `[startOfMonth, today)` gets surfaced as a past event.
- IDs are namespaced (`${recipientId}_${eventType}_${year}_past`) so
  past entries can't collide with the future-year entries from
  `materializedComingUp`.

What's NOT shown by default: past events from **prior** months. To see
April events, the user navigates the grid back via `‹`. Punted: a
"show past months" affordance — current navigation pattern is sufficient.

## Decisions log (resolved during this draft)

These were open questions in earlier drafts; closed during Kate review:

1. **Inline event chips on grid cells.** Skipped. Small dot per event
   date stays. Density goes in the rail; the grid is for orientation.
2. **Multi-month agenda view.** Skipped. Month-by-month grid stays
   the only view.
3. **Day-click interaction.** Rail scrolls to the tapped day (uses
   the existing `scrollToDate` mechanism). No slide-in panel.
4. **Past-event affordances.** Past-this-month already shows by
   default; no "show past months" toggle.
5. **Nav rollout scope.** Same `SiteHeader` with right-grouped nav
   ships across all pages in one PR — calendar, homepage, occasion
   routes — for muscle-memory consistency.

## Constraints respected

- No new components beyond `DesktopShell` + an optional `SiteHeader.navItems` prop
- No backend changes (`useMaterializedComingUp` + `useRecipientDates`
  + `holidays.ts` data layer stays as-is)
- iOS card vocabulary (peach-clay chip, overlapping thumbs, corner
  check) preserved exactly
- Thea palette only — no new colors introduced
- Holidays remain FE-constant and don't connect to people
- No streak/badge/long-press affordances; older ICP

## Suggested implementation slice

Roughly a full day of FE work (grew from half-day because nav rolls
out everywhere, not just calendar):

1. Add `DesktopShell` to `CalendarPage` with `@media (min-width: 1024px)` switching layout (~30 min)
2. Extend `SiteHeader` with right-grouped nav (text links + active-route underline + gated Calendar item) (~1 hr)
3. Roll the new `SiteHeader` nav to `LandingPage` + `OccasionRoute` + any other `SiteHeader` consumer (~30 min, mostly grep + sanity-check)
4. Hide `MobileTabBar` at ≥1024 (~5 min)
5. Add keyboard nav (arrow/Enter/Esc) + hover tooltips to `MonthGrid` (~1.5 hr)
6. Wire empty-state card for signed-in-no-recipient case (~30 min)
7. Stories + tests + Happo runs on each surface (calendar desktop, homepage desktop) (~1.5 hr)
