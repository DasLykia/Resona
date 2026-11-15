---
name: Resona
description: A quiet Windows utility for daily voice training, where hierarchy comes from type, hairlines and space.
colors:
  primary: "oklch(0.53 0.16 292.7)"
  primary-hover: "oklch(0.47 0.16 292.7)"
  on-primary: "oklch(0.99 0 0)"
  secondary: "oklch(0.56 0.14 162.5)"
  danger: "oklch(0.55 0.19 25)"
  bg-app: "oklch(0.985 0.003 292.7)"
  bg-sidebar: "oklch(0.952 0.014 292.7)"
  bg-surface: "oklch(0.997 0.002 292.7)"
  bg-panel: "oklch(0.945 0.007 292.7)"
  text-main: "oklch(0.22 0.015 292.7)"
  text-muted: "oklch(0.48 0.014 292.7)"
  border-hairline: "oklch(0.25 0.03 292.7 / 0.12)"
  border-strong: "oklch(0.25 0.03 292.7 / 0.2)"
typography:
  page-title:
    fontFamily: "Geist, Segoe UI Variable Text, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Geist, Segoe UI Variable Text, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    letterSpacing: "-0.01em"
  section:
    fontFamily: "Geist, Segoe UI Variable Text, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
  body:
    fontFamily: "Geist, Segoe UI Variable Text, system-ui, sans-serif"
    fontSize: "13.5px"
    fontWeight: 400
    lineHeight: 1.45
    fontFeature: "'ss01', 'cv11'"
  control:
    fontFamily: "Geist, Segoe UI Variable Text, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
  caption:
    fontFamily: "Geist, Segoe UI Variable Text, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
  measure:
    fontFamily: "Geist Mono, Consolas, monospace"
    fontSize: "12.5px"
    fontWeight: 400
    fontFeature: "'tnum'"
  focus-title:
    fontFamily: "Geist, Segoe UI Variable Text, system-ui, sans-serif"
    fontSize: "34px"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  focus-timer:
    fontFamily: "Geist Mono, Consolas, monospace"
    fontSize: "64px"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.03em"
    fontFeature: "'tnum'"
  focus-readout:
    fontFamily: "Geist Mono, Consolas, monospace"
    fontSize: "34px"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontFeature: "'tnum'"
  focus-phrase:
    fontFamily: "Geist, Segoe UI Variable Text, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 500
rounded:
  segment: "5px"
  control: "6px"
  surface: "10px"
  full: "9999px"
spacing:
  row: "10px"
  section-head: "16px"
  page-top: "28px"
  page-x: "40px"
  section: "72px"
  focus-x: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "32px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-primary-lg:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "40px"
  button-ghost:
    textColor: "{colors.text-muted}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "32px"
  nav-item:
    textColor: "{colors.text-muted}"
    rounded: "{rounded.control}"
    padding: "0 12px 0 16px"
    height: "36px"
  segmented-segment:
    textColor: "{colors.text-muted}"
    typography: "{typography.control}"
    rounded: "{rounded.segment}"
    padding: "0 12px"
    height: "28px"
  dialog:
    backgroundColor: "{colors.bg-surface}"
    rounded: "{rounded.surface}"
    padding: "20px"
  popover:
    backgroundColor: "{colors.bg-surface}"
    rounded: "{rounded.surface}"
    padding: "16px"
  button-transport:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.control}"
    height: "40px"
    width: "48px"
  strain-option:
    textColor: "{colors.text-muted}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    height: "40px"
  calendar-day:
    textColor: "{colors.text-main}"
    typography: "{typography.measure}"
    rounded: "{rounded.control}"
    height: "36px"
  calendar-day-trained:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
  switch:
    rounded: "{rounded.full}"
    height: "20px"
    width: "40px"
  switch-on:
    backgroundColor: "{colors.primary}"
  settings-row:
    typography: "{typography.body}"
    padding: "14px 0"
  day-toggle:
    textColor: "{colors.text-muted}"
    rounded: "{rounded.control}"
    height: "32px"
    width: "36px"
  day-toggle-on:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
  accent-swatch:
    rounded: "{rounded.full}"
    size: "24px"
  command-menu:
    backgroundColor: "{colors.bg-surface}"
    rounded: "{rounded.surface}"
    width: "560px"
  command-item:
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
  nav-sub-item:
    textColor: "{colors.text-muted}"
    rounded: "{rounded.control}"
    padding: "0 12px 0 28px"
    height: "32px"
  week-day:
    textColor: "{colors.text-muted}"
    rounded: "{rounded.control}"
    height: "56px"
---

# Design System: Resona

## Overview

**Creative North Star: "The Quiet Utility"**

Resona looks like a well-made piece of Windows itself: a Mica nav layer, a 36px custom title bar with native caption buttons, a labeled sidebar like Windows Settings, and one raised content pane that holds the work. Nothing competes for attention. Hierarchy comes from type weight, alpha hairlines and space, never from boxes, glows or badges. The one recurring object is the user's voice range; everything else stays out of its way.

Density is calm and desktop-native: 13 to 14px text, 32px controls, left-anchored content columns that cap at 1000px; from 1536px wide pages run up to 2200px and split into columns, so a large monitor fills with content rather than margin. Every colour is derived at runtime from two accent source colours (the level-unlocked theme), and OKLCH relative-colour syntax normalises lightness so every theme lands equally calm and legible, in light and dark.

Motion is quick, interruptible and physical without bounce: ease-out for entrances, ease-in-out for moves, exits shorter than entrances, a 0.97 press, and indicators that slide between positions on a shared layout id.

A session is a full-window focus mode. It keeps the same palette, hairlines and radii but adds a display tier read from a step back from the screen, and the accent inside it carries only signal: a primary action, a selection, progress (block progress, the recording scrubber) and "in range".

Progress is reading, not a dashboard: five sub-pages that each answer one question, charts that all share the range band, sessions in a ruled table with a detail pane, and destructive actions that confirm in a popover grown from their own trigger.

Routines and Settings are working pages edited in place: each routine is its own page, listed in the sidebar, with its name as the editable page title and ruled, draggable exercise rows; settings are one page per group of Windows Settings rows that apply the moment they change, with no Save button. The sidebar expands only the active section into its sub-pages. A Ctrl+K command menu reaches every page and action, entered from one Search row at the top of the sidebar. A first-launch Setup of three steps sets a direction, training days and the microphone, and a one-sentence page hint under each title explains the page until dismissed. Every surface now follows this system; no pre-redesign component remains.

**Key Characteristics:**
- Two-layer shell: Mica-tinted nav layer, one raised content pane with a concentric 10px top-left corner.
- A sidebar of sections and sub-pages; only the active section is open.
- Wide windows (2xl, 1536px) get columns, not wider margins.
- Neutrals are greys tinted a few points toward the accent hue; one accent for primary action, selection and "in range".
- Geist for all UI text; Geist Mono with tabular figures only for measurements (Hz, times, counts, indices).
- Alpha hairlines divide content; rows and sections, not cards.
- Small concentric radii: 6px controls, 10px surfaces.
- Text first: a custom 16px, 1.5-stroke icon set used only for transport, reordering, search and system controls.
- The range band is the one signature object, drawn with the same tint and edge recipe wherever pitch appears.
- Two type tiers: the page tier for arm's-length reading and a focus tier for reading at a distance during a session.
- No native dialogs: every destructive action confirms in a popover from the button that asked.
- Edits apply in place: settings and routines save as they change.
- One visible keyboard shortcut in the whole app: "Search · Ctrl K".

## Colors

A near-monochrome palette of accent-tinted greys with a single, chroma-capped accent doing all the signalling.

All values below are resolved for the default Violet theme (accent source #8b5cf6, hue 292.7; secondary source #10b981, hue 162.5). The canonical source is `index.css`: each token is `oklch(from var(--accent-src) L C h)` with fixed lightness and chroma, so only the hue follows the theme. Accent chroma is capped at 0.16 (`--chroma-cap`), secondary at 0.14 (0.13 in dark). Dark mode redefines every token under `[data-mode='dark']`; the dark values live in the sidecar.

### Primary
- **Theme Accent** (primary): the Start button, the sliding nav bar, the level meter fill, focus rings, caret, selection wash (32% mix), the "× XP today" line. Hover deepens it by 0.06 lightness in light mode and lifts it by 0.06 in dark.
- **On Accent** (on-primary): text on filled accent buttons; near-white in light, a deep accent-hued ink (L 0.2) in dark.

### Secondary
- **Second Source** (secondary): derived from the theme's second source colour. Reserved for a second data series; today it appears only as one of the three milestone confetti colours (with accent and ink).

### Tertiary
- **Danger Red** (danger): fixed hue 25, independent of theme. Used as a 10% wash with red text for destructive buttons, never as a filled block.

### Neutral
- **App Ground** (bg-app): the content pane, the main reading surface.
- **Nav Layer** (bg-sidebar): title bar and sidebar. In Electron it becomes a translucent wash (light L 0.96 C 0.02 at 50%, dark L 0.16 C 0.02 at 45%) so Windows Mica shows through.
- **Raised Surface** (bg-surface): dialogs and inputs, the closest layer.
- **Panel** (bg-panel): tonal fill for quiet grouped controls.
- **Ink** (text-main) and **Muted Ink** (text-muted): body text and secondary text (dates, counts, descriptions, inactive nav).
- **Hairline** (border-hairline) and **Strong Hairline** (border-strong): alpha borders that pick up whatever sits beneath, used for every divider, row rule and input outline.

### Named Rules
**The Two Sources Rule.** No colour is hand-picked per surface. Every token derives from `--accent-src` / `--accent2-src` through fixed OKLCH lightness and capped chroma, so a new theme can never break contrast.

**The One Accent Rule.** The accent marks exactly four things: the primary action, the current selection, "in range", and progress (block progress, seek fill, goal bars, trained-day tint). If it appears for decoration, it is wrong.

**The Range Colour Rule.** Pitch status has three colours only: accent for "In range", ink for "Below range" and "Above range", muted for "Listening". Out of range is never red; danger is kept for strain and errors.

**The Dark Depth Rule.** In dark mode, lighter means closer: sidebar (L 0.165) sits lowest, then app ground (0.2), surface (0.245), panel (0.27).

**The Ring Means Locked Rule.** A reward colour that is not yet earned is an empty 2px ring in its own colour; an earned one is filled. Locked colours are never shown as faded or pastel fills. Swatches are drawn at `oklch(from <source> 0.6 min(c, 0.16) h)`, the same lightness and chroma cap as the accent.

## Typography

**Display Font:** Geist (with Segoe UI Variable Text, system-ui)
**Body Font:** Geist, variable 100 to 900, bundled locally, `ss01` and `cv11` on
**Label/Mono Font:** Geist Mono (with Consolas), measurements only

**Character:** One neutral grotesque carries every role through size and weight alone; the mono appears only where a number is a reading, so measurements line up and read as data.

### Hierarchy
- **Page title** (600, 26px, line-height 1, -0.02em): one per page, in the PageFrame header, left-aligned, with an optional muted aside (Today's date) on the right.
- **Title** (600, 17px, -0.01em): the primary object on a page, e.g. the chosen routine name.
- **Section** (600, 15px): section headings and dialog titles; a 13px 600 variant heads small inline blocks (Focus).
- **Body** (400, 13.5px, 1.45): list rows, paragraphs, nav items; long text uses relaxed leading and `max-w-prose`.
- **Control** (500, 13px): button and segmented labels; large buttons step to 14px.
- **Caption** (400, 12 to 12.5px, muted): sidebar foot, title bar, secondary actions.
- **Measure** (Geist Mono, 12 to 12.5px, tabular): Hz, durations, counts, list indices, streak and level numbers.

Focus tier, used only inside a session's focus mode:
- **Focus title** (600, 34px, line-height 1.1, -0.025em): the current exercise name, with its description beneath in 15px muted at 62ch.
- **Focus timer** (Geist Mono, 64px, line-height 1, -0.03em, tabular): the block countdown or count-up. The colon is pulled in by -0.18em on each side so it gives back most of its mono cell.
- **Focus readout** (Geist Mono, 34px, line-height 1, -0.02em, tabular): the live pitch in Hz, with "Hz" in 13px muted Geist beside it.
- **Focus phrase** (500, 20px): the pitch status word (-0.01em) and the prompt phrase, which sits in ink between chevron buttons with a mono "n/m" counter.

### Named Rules
**The Mono Means Measured Rule.** Geist Mono with tabular figures is used for numbers that are readings (times, Hz, counts, indices) and for nothing else.

**The Two Tiers Rule.** The page tier (26 / 17 / 15 / 13.5 / 12) and the focus tier (64 / 34 / 20) never mix: focus sizes appear only in focus mode, and focus mode's own pages (mic check, summary, not saved) use the page tier.

**The Mono Numbers, Sans Units Rule.** In running text the number is Geist Mono in ink and the unit stays in Geist ("**12** min **4** s", "**68**% ... inside **239–285** Hz").

**The Unbroken Measurement Rule.** A measurement and its unit never split across lines: the number and unit are one no-wrap unit (the `Num` helper: mono number in ink, a space, the unit in Geist).

**The Sentence Case Rule.** Headings, labels and buttons are sentence case at normal tracking. There are no uppercase tracked labels and no small text sitting above a heading. A step count ("Step 2 of 3") lives in the footer beside the step's actions, never above the heading.

## Layout

The window is a column: a 36px title bar, then a row of a 216px sidebar and the content pane. The title bar leaves 148px clear on the right for the native caption buttons and is a drag region. The content pane is one raised surface with a hairline on its top and left edges and a 10px top-left corner, the only rounded corner in the shell; it clips its overflow (`overflow: clip`) so page transitions never spill past that corner.

Pages sit left-anchored next to the nav, like Windows Settings, in a PageFrame: 40px side padding (56px from 2xl), 28px top, 64px bottom, max width 1000px by default, 760px narrow (Settings) and 2200px wide (Today, Progress, Routines). The title is a node, so a page can make it editable (the routine name). The page header is 28px above content; an optional page hint sits between them. Sections stack with 40px gap plus 32px padding above a hairline; the first section has neither. Lists are rows of 10px vertical padding divided by hairlines, laid out as a grid of index, label and right-aligned measurement. The Today page opens with a hairline-bounded band (the routine picker and its length left, ghost Free session and large Start session right), then the routine list, This week, "Your voice" (the range band with recent session medians and a one-line muted summary) and the Focus note.

**Wide layout.** The 2xl breakpoint (1536px) turns pages into columns, top-aligned, 64px apart unless noted:
- **Today:** two columns, 1fr and 0.9fr. Start and the routine list on the left; This week, Your voice and Focus on the right.
- **Then and now:** pickers and playback in a 24rem column, the chart beside them (56px gap); the chart is `clamp(window height − 380px, 320px, 640px)` tall.
- **Sessions:** the list, then a 34rem sticky detail pane (48px gap). The newest session opens in it by default; below 2xl rows expand inline instead (`useWide` flips layout and behaviour together).
- **Calendar:** three months instead of two.
- **Overview:** the pitch trend's median panel is `clamp(width × 0.2, 190px, 420px)` tall.
- **Goals and achievements:** two columns from lg, capped at 1400px.
- **Routine:** the editor, then a 22rem sticky "How it runs" aside.

Progress is five sub-pages in the sidebar, each with its own wide PageFrame and a title that is a plain question or name: Overview ("Is your voice changing?", the pitch trend), Then and now (compare recordings), Calendar (streak sentence and the activity calendar), Sessions (the session table, then recordings without a session) and Goals and achievements (ruled lists). Charts fill their column; nothing sits in a card.

Each routine is a page: the sidebar lists the routines under Routines, and the routine's name is the page title. The editor header puts the count and length left and its actions right from xl, and stacks them below xl. Settings is one narrow page per group (Appearance, Training, Microphone, Progress and data, Updates); the page title names the group, so only an extra group on the same page (Reset, under Progress and data) gets its own 15px heading and hairline, 40px below the rows above.

The welcome modal is gone; a first-launch Setup replaces it (see Components).

Focus mode covers the whole window below the title bar, sidebar included, on the app ground with a hairline at its top. Its gutters are 48px. A routine session stacks: the block-progress hairline (16px from the top), a header with the focus title left and the timer right, the prompt row, the live pitch chart filling the remaining height (220px minimum), and a 64px footer above a hairline, laid out as three columns: End session left, transport centred, position and "Next: title" right. The mic check (560px column), summary (760px) and "Session not saved" (560px) screens are columns centred with auto margins inside the same layer, starting 10vh from the top (8vh for the summary).

## Elevation & Depth

Flat at rest. Depth comes from tonal layering (nav layer, app ground, raised surface) and alpha hairlines, not shadows. One shadow exists, for things that float above the page.

### Shadow Vocabulary
- **Pop** (`box-shadow: 0 1px 2px oklch(0 0 0 / 0.06), 0 8px 24px -6px oklch(0 0 0 / 0.16)` light; `0 1px 2px oklch(0 0 0 / 0.3), 0 12px 32px -8px oklch(0 0 0 / 0.55)` dark): dialogs, popovers, menus and chart tooltips only.
- **Segment lift** (`0 1px 2px oklch(0 0 0 / 0.12)`, light mode only): the selected thumb of a segmented control. In dark it becomes a 12% ink fill instead.

### Named Rules
**The Float-Only Shadow Rule.** A shadow means the element floats above the page (dialog, popover, menu, tooltip). Nothing resting in the page flow gets one.

## Shapes

Small, concentric radii. Controls are 6px; a control's inner thumb is 5px inside a 2px inset track; surfaces (dialogs, the content pane corner) are 10px; 12px is the ceiling. Full rounding is kept for thin bars: the 3px nav indicator, the 3px level meter, the 3px block-progress segments and recording scrubber, the 6px mic level meter, range-band median markers, scrollbar thumbs, spinners. Borders are 1px alpha hairlines. Focus is a 2px accent outline at 2px offset that follows each element's own radius.

**The Concentric Rule.** An inner radius equals the outer radius minus its inset. No surface exceeds 12px.

## Components

### Buttons
Quiet, compact and tactile.
- **Shape:** gently rounded (6px), 28/32/40px tall (sm/md/lg), 32px square for icon buttons. An invisible 4px hit slop extends past every button.
- **Primary:** accent fill with on-accent text, 13px 500; the large size (40px, 20px padding, 14px) is reserved for the page's one primary action such as Start session.
- **Secondary:** 7% ink wash, 11% on hover. **Ghost:** muted text, ink on hover with a 6% wash. **Outline:** strong hairline. **Danger:** 10% red wash, red text.
- **States:** background and colour transition 150ms ease-out; press scales to 0.97 in 75ms; disabled is 45% opacity. A 14px 1.5px-stroke spinner precedes the label when loading.

### Segmented control
- **Style:** a 6% ink track, 2px inset, with 28px segments of 13px text; the selected label is ink and 500, unselected muted.
- **Motion:** the selected thumb is one element moved between segments by a shared layout id, 220ms ease-in-out. It is a radio group.

### Dialogs
- **Shape:** 10px raised surface, hairline border, Pop shadow, up to 85vh, 448px default width.
- **Structure:** a 48px header with the 15px title and a hairline beneath, a ghost close icon button, then 20px content padding. Scrim is 30% black.
- **Motion:** enters with fade and scale from 0.95 over 200ms ease-out; exits to 0.97 over 160ms. Escape and scrim click close it.

### Inputs / Fields
- **Style:** raised surface fill, strong hairline, 6px radius, 13.5px text, accent caret.
- **Focus:** the border turns accent; keyboard focus adds the 2px accent ring.

### Navigation
- **Style:** a labeled sidebar (Today, Progress, Routines; Settings pinned at the foot below a hairline). Items are 36px tall, 13.5px text, 6px radius; inactive muted with a 4.5% hover wash, active ink at 500 on a 7% wash. A section whose sub-pages are open is ink at 500 without the wash.
- **Sections and sub-pages:** a route is a section and a sub-page. Only the active section expands; its sub-items (32px tall, 28px left padding, 13px text) open with a height animation, 220ms ease-in-out in and 180ms out, so the items below move rather than jump. Progress lists its five pages, Settings its five groups, and Routines every routine, the one used on Today marked by a 6px accent dot after its name, then a "New routine" item that opens the template Popover (Blank routine and each template, with a 12.5px muted summary).
- **Indicator:** a 3px by 16px accent bar on the left edge, one element shared by a single layout id across every item and sub-item, slides between them over 250ms ease-in-out and stretches 12% vertically while it moves. It does not animate on first paint. Press scales to 0.97.
- **Foot:** streak as a mono number plus "day streak", level as "Level N" with a 3px hairline meter filling in accent over 500ms. Small and plain, a button that opens level details.
- **Title bar:** the waveform mark in accent at 15px, "Resona" at 12px 500, and a muted status that crossfades with a 3px blur.

### Icons
A custom set on a 16px grid with 1.5px round-capped strokes, so icons match Geist's stroke weight. Used only for transport (play, pause, previous, next), prompt stepping (chevrons), the reorder grip, search (the sidebar Search row and the command menu field) and system controls (close). Transport glyphs fill their triangles with the stroke colour because filled shapes read better at small sizes; pause is two 2.25px strokes. The app mark is three waveform bars.

### Range band (signature)
The user's target pitch range as a tinted band on a log-frequency scale (70 to 420 Hz), drawn with one recipe everywhere pitch appears: Today's "Your voice", the session summary and, rotated to horizontal over time, the live chart and every Progress chart (pitch trend, pitch trace, then and now).
- **Recipe:** accent at 13% fill with 1px accent edge lines at 50%, over a strong-hairline baseline. Ticks at 80, 100, 150, 200, 250, 300 and 400 in 12px muted mono, "Hz" only after the last.
- **Edge fade:** the baseline, band and density fade out over the outer 3% of the scale through an alpha mask, so the scale has no hard ends.
- **Markers:** 2px fully rounded lines. The current median is accent at full height with its value above in 12px accent mono; earlier sessions are ink at 35%, half height.
- **Density:** on the summary, 72 bins of 3px bars (1px top radius, 6% minimum height): accent inside the band, ink at 30% outside. Bars grow from the baseline over 240ms ease-out, staggered left to right across 200ms.
- **Height:** 44px on Today, 56px on the summary.

**The One Band Rule.** The band is never restyled per surface. Inside it, accent means "in range" (plus the current median, the current selection); everything outside the band is ink at reduced alpha (30 to 55%).

### Live pitch
- **Readout row:** focus readout plus "Hz", then the status word in the focus phrase size coloured by the Range Colour Rule (150ms colour transition). The range trigger ("239–285 Hz · Edit") and "Hold for reference tone" sit right in 13px muted; the tone plays the range centre while pressed and the label turns accent ("Playing 262 Hz").
- **Chart:** a canvas of the last 20 seconds. Hairline grid at 100 to 400 Hz with 12px muted mono labels in a 44px left gutter, the band as a horizontal strip with top and bottom edge lines, and a 2.25px round-capped trace: accent inside the band, ink at 55% outside, broken on silence or jumps over 4 semitones. A 4px dot marks the newest sample. Colours are resolved from the CSS tokens, so the chart follows the theme.

### Focus transport
- **Pause / resume:** a large primary button 48px wide (40px tall); the only filled accent in the footer.
- **Previous / next exercise:** ghost icon buttons. On an open-ended block, next becomes a secondary "Next" (or "Finish") text button.
- **Block progress:** one 3px segment per block with 3px gaps, widths weighted by duration (open blocks count as 2 minutes), ink 10% track, accent fill advancing linearly each second.
- **Exercise change:** the title block enters from 14px below over 240ms and exits 10px up over 190ms (popLayout).
- **Pause:** the timer dims to 45% opacity with "Paused" beneath in 13px muted.

### Popover
A portalled floating surface anchored 6px under its trigger, aligned to the trigger's start or end edge, so it escapes any overflow.
- **Shape:** 10px raised surface, hairline border, Pop shadow, 16px padding.
- **Motion:** grows from the trigger corner (transform origin at the aligned edge), opacity and scale from 0.95 over 180ms ease-out; returns to 0.95 over 145ms.
- **Dismiss:** Escape or a pointer-down outside both panel and trigger. The range editor is its first use: a 13px 600 title, two mono number fields with an "Hz" suffix, a 12px helper line that turns danger on invalid input, and sm Cancel / Save.

### Strain radio row
- **Style:** a radio group of five equal 40px options with 6px gaps and 6px radius, 13px labels; unselected muted on a 5% ink wash (8% and ink on hover).
- **Selected:** a 14% tint with text in the same hue at 500: accent for the comfortable answers, danger for "Strained" and "Hurt".
- **Rest advisory:** choosing Strained or Hurt expands a 13px muted rest message beneath (height and opacity, 220ms in, 180ms out).

### Confirm pulse
A small text confirmation ("Saved") appears beside the heading it confirms in 12.5px: opacity in with scale 0.97 → 1.03 → 1 over 240ms ease-out, re-keyed on every save so it pulses again. It is the one sanctioned overshoot, for confirmation only.

### Icon crossfade
When an icon button swaps glyphs (play and pause, in the transport and recording player), the old glyph leaves and the new one enters with opacity, scale 0.6 and a 3px blur, 180ms in and 140ms out (popLayout). Prompt phrases crossfade with a 4px blur, 200ms in and 160ms out.

### Recording player
A secondary icon button (play and pause crossfade), "Recording" in 13.5px, the seek bar, and mono "0:42 / 3:10" in 12.5px muted. `StoredRecording` loads the audio from IndexedDB by id and renders the same player; recordings always render inside their session's detail.
- **Seek bar:** a native range input styled as a 3px fully rounded hairline: accent fill up to the playhead, ink 10% after it, 20px tall hit area. An 11px accent thumb fades in (150ms) only on hover and keyboard focus. It steps by 1 second, so arrow keys seek in seconds.

### Confirm button
Replaces every `window.confirm`. The trigger is an ordinary Button (ghost by default, danger or secondary allowed, sm); pressing it opens the anchored Popover from that trigger: a 256px column with the consequence in 13.5px relaxed text, then right-aligned sm ghost Cancel (focused first) and a danger button whose label names the act ("Delete 3 sessions").

### Grid labels
Every Progress chart draws hairline grid lines with 12px muted mono Hz labels in a left gutter, chosen from round values and thinned so no two labels sit closer than 32px.

**The 32px Label Rule.** Grid labels are thinned to at least 32px apart; a chart shows fewer labels before it lets them crowd.

### Pitch trend
A per-session column chart, one column per session, oldest left. Three stacked rows share the columns:
- **Median panel:** the range band (one recipe) with a 1.5px ink 35% line through session medians that draws in over 250ms ease-out; each median is a dot, accent when inside the band and ink outside.
- **Time-in-range row:** a bar per session of its share of time in range.
- **Strain row:** one mark per session; strain 4 to 5 in danger, 3 in ink at 45%, 1 to 2 in ink at 20%. Sessions that were deleted keep only this mark (`kept`), and their columns are not clickable.
- **Hover:** a floating tooltip (8px raised surface, hairline, Pop shadow, 12.5px) with date, mono median "Hz" and in-range percentage, entering over 150ms; clicking a column jumps to that session in the table.
- **Sentence:** beneath the chart, one then-vs-now sentence in the Mono Numbers, Sans Units form.

### Pitch trace and Then and now
- **Pitch trace:** the static pitch-over-time trace of one session, medians from `bucketPitch` at about one point per 2px, over the band with grid lines; 2px round accent trace (1.75px ink 45% for a second trace) and a 1px ink 60% playhead tied to the recording.
- **Then and now:** two ruled rows labelled "Then" (muted) and "Now" (accent), each with a recording picker and a muted stat line. Both traces share one chart: Then in ink at 45%, Now in accent. Playback switches A/B through a Segmented control and keeps its position, so the same moment plays in both.
- **Recording picker:** a text trigger (13.5px date, muted "· routine", 10px chevron) that opens a 320px Popover built for hundreds of recordings: a row of quick picks in 12.5px muted (First, 3 months ago, 1 month ago, Last week, Latest; each takes the nearest session), a 32px search field ("Search by date or routine"), then sessions newest first, grouped under 12px muted month names, each a row of mono date, routine and mono median Hz; the chosen one in accent.

### Activity calendar
Two months side by side (three from 2xl, the extra one older), weeks starting Monday. Day cells are 36px, 6px radius, mono 12.5px numbers.
- **Tint:** trained days fill in three steps by minutes: accent at 25% (under 10 min), 60% (10 to 20 min), full accent with on-accent text (20 min or more).
- **Rest days:** a 1px dashed ink outline inset 4px; clicking an empty past day toggles it. Clicking a trained day opens its session.
- **Today:** semibold with a 2px accent underline at 4px offset.
- **Paging:** months slide horizontally 24px in the paging direction, 220ms in and 180ms out, ease-out. A legend explains tint and rest days in 12.5px muted.

### Session table
A ruled table, not cards: rows divided by hairlines, mono date and duration, a chevron that rotates 90° over 200ms when the row is open.
- **Search** filters rows; **select mode** adds checkboxes and a bulk delete through the Confirm button.
- **Detail:** below 2xl a row expands in place (height and opacity, 240ms in, 190ms out) into the pitch trace, the recording, the note and a delete Confirm button; rows reflow with a 220ms ease-in-out layout tween. From 2xl the same detail shows in the sticky side pane under a 17px title and a muted date line, crossfading between sessions (200ms in from 6px below, 120ms out); the pane is never empty while sessions exist.
- **Jump highlight:** a row reached from the trend or calendar scrolls to centre and carries a 6% accent wash that fades out after 1.6s.
- **Other recordings:** only recordings whose session no longer exists get their own ruled list beneath, with mono minutes and MB and an inline player.

**The Recording Lives In Its Session Rule.** A recording is shown inside its session's detail. Only orphaned recordings get a list of their own.

### Ruled lists (goals and achievements)
Goals and achievements are hairline-ruled rows. A goal row carries its label, its actions inline in the row (sm "Complete goal" when done, a Remove Confirm button; no menus), and a right-aligned mono "n/m" with its unit; beneath it a 3px fully rounded progress bar on an ink 10% track fills in accent over 250ms ease-out. Completed goals hide behind a muted "Show completed goals (n)" toggle that expands in place (220ms in, 180ms out).

### Session flow
- **Focus layer:** enters with opacity and scale from 0.985 over 220ms ease-out, exits over 180ms; its steps (mic check, training, summary) crossfade 200 / 160ms.
- **Summary:** a 26px "Session complete", then one 15px muted sentence of results in the Mono Numbers, Sans Units form, the range band with this session's distribution and median, the recording, strain, optional note, and a large Done.
- **Saving:** sessions of 30 seconds or more of active (unpaused) time autosave. Shorter ones land on "Session not saved", which explains why and offers ghost Discard and primary "Save anyway"; a failed save shows the error in danger with "Try again".
- **Celebration:** confetti fires only for milestones (a new level, an unlocked achievement, a claimed goal), in the resolved accent, secondary and ink colours, 350ms after the summary has entered, and never under reduced motion.

### Hit slop
Every small control reaches past its drawn edge with an invisible pseudo-element: 4px on buttons and accent swatches, 6px on small text buttons (Add timer, phrases), 8px on switches. Nothing visible changes; only the target grows.

**The Hit Slop Rule.** Every control smaller than 32px gets hit slop. A small control is never a small target.

### Switch
A Windows-style toggle, 40 by 20px, fully rounded, for on/off settings.
- **Off:** transparent track with a 1px ink 45% outline and a 12px ink 70% knob; hover adds a 5% ink wash.
- **On:** accent fill and border (danger when the switch is destructive) with an on-accent knob.
- **Motion:** the knob travels 20px over 200ms ease-in-out and stretches `scaleX` 1 → 1.12 → 1 while it moves; the track colour transitions over 200ms; press scales to 0.97. 8px hit slop.
- **Asking first:** a switch whose change has consequences (Unlock all rewards) does not flip on press; it opens the anchored Popover from the switch with the consequence, a focused ghost Cancel and a primary button naming the act.

### Settings rows
Windows Settings rows: the label (13.5px ink) and an optional hint (12.5px muted, snug leading, 52ch) on the left, the control on the right, 14px vertical padding, a hairline beneath each row. Controls are the house primitives (Segmented, Switch, Button, Confirm button) plus a native range slider (176px) with its mono value beside it, a native `select` (32px, strong hairline, 6px radius, accent border on focus) for the input device and native colour inputs for custom colours.
- **Training days:** seven Monday-first toggles, 36 by 32px, 6px radius, two-letter labels and full day names as `aria-label`; on is accent fill with on-accent text, off a 5% ink wash with muted text.
- **Accent swatches:** a radio group of 24px circles with a 2px border, filled when unlocked and an empty ring when locked (the Ring Means Locked Rule); the selected one carries a 2px ink ring at 2px offset. Press scales to 0.97; 4px hit slop.
- **Update row:** "Version" with the mono version in its hint, then the state inline after a dot: "Checking…", "You're on the latest version.", an error sentence, "Updates only work in the installed app.", or "Version n is available." with a primary "Install and restart" replacing "Check for updates".
- **Reset:** "Delete all data" is a danger Confirm button.

**The Instant Settings Rule.** A setting applies the moment it changes. There is no Save button anywhere in Settings; a change with consequences asks first in a popover from its own control.

### Command menu
A Ctrl+K dialog that reaches every page and action: go to a page, start a routine or a free session, mark today as a rest day, switch colour mode, and find sessions by date.
- **Shape:** raised surface, hairline border, 10px radius, Pop shadow, 560px maximum width, centred horizontally at 14vh from the top over a 20% black scrim. A 48px field row (search icon, 14.5px input) above a hairline, then results up to 50vh tall.
- **Results:** grouped under 12px muted group names; 13.5px rows with an optional 12.5px muted detail right, 6px radius, the active row on a 7% ink wash that follows the pointer and the arrow keys. Enter runs, Escape closes. Combobox and listbox roles with `aria-activedescendant`.
- **Matching:** every typed word must appear in the label, detail or keywords. Sessions appear only once something is typed. Ctrl+K is ignored during a session.
- **Motion:** the panel enters from scale 0.97 and 6px above over 180ms ease-out and leaves to 0.98 over 140ms; the scrim fades 150 / 120ms.
- **Entry:** one "Search · Ctrl K" row at the top of the sidebar, 32px tall, hairline outline, 6px radius, 13px muted text with the shortcut in 12px muted at the right.

**The One Shortcut Rule.** "Search · Ctrl K" is the only keyboard shortcut shown anywhere in the app. Other shortcuts may exist, but no other hint, badge or key cap is drawn.

### Routine editor
- **Title:** the routine name is the page H1 itself, an inline input that inherits the 26px page-title type (`RoutineNameTitle`); an emptied name falls back to "Untitled routine" on blur. The editor has no name field of its own.
- **Header:** the count and total in the Mono Numbers, Sans Units form, and actions: a sm secondary "Use on Today" (or accent "Used on Today" text when it already is), ghost Duplicate and a Delete Confirm button. A strong hairline closes the header.
- **Inline fields:** every field is a borderless input that shows a 4% ink wash on hover and a raised surface with a 1px strong-hairline ring on focus.
- **Exercise rows:** ruled rows (hairline beneath, 12px vertical padding) as a grid of drag handle, mono index and content: the inline 14px 500 title, a right-aligned mono m:ss duration (or "Open-ended"), an "Add timer" / "Remove timer" text button, an instructions textarea that grows with its content (`field-sizing: content`), an optional phrases textarea (one phrase per line), and a Remove Confirm button.
- **Duration:** typed as m:ss and read on blur or Enter; an unreadable value reverts to the previous one rather than showing an error.
- **Reorder:** rows are a Motion Reorder group. The grip handle starts the drag; the held row follows the pointer exactly, lifts with scale 1.01 and the Pop shadow, and its neighbours tween out of the way over 200ms ease-in-out. Arrow Up and Down on the focused handle move the row.
- **Add:** secondary sm "Add exercise", ghost "Add open-ended" and "Add rest".

**The Held Drag Rule.** While held, a dragged element tracks the pointer 1:1 with no easing or lag; only the elements making room for it animate.

### How it runs
The routine page's 22rem sticky aside from 2xl: a 15px "How it runs" heading and a muted length line, a proportional block bar (one 6px fully rounded segment per block with 3px gaps, widths weighted by duration with open blocks as 2 minutes, the same weighting as the session's block progress; timed blocks accent at 60%, open blocks ink at 20%), the block list as 13px rows of mono index, title, mono m:ss (or "open") and mono share of time, then a full-width large "Start this routine".

### This week
Today's week, Monday to Sunday, as one ruled row: a hairline above and below and hairlines between seven cells, no boxes. The heading's right side reads "**N** of **M** planned days · **S** day streak" in 13px muted with mono numbers.
- **Cell:** a 56px button with 6px radius inset 4px, the 12px muted day name above a 12.5px state. Today's name is ink at 600 with the 2px accent underline, as on the calendar.
- **States:** a trained day shows mono minutes in accent at 500 on a 16% accent tint, the only tinted cell; a rest day carries the 1px dashed ink 40% outline; otherwise Today, Planned, Off or Missed in muted text, and only Missed is ink. Today is never Missed.
- **Rest:** an empty past or present day toggles rest on click (5% ink hover wash, 0.97 press); a muted line beneath explains that rest never breaks the streak.

### Page hint
One muted sentence (13.5px, relaxed, 72ch) between the page title and the content, explaining what the page is for, followed by a "Got it" text button in ink with a strong-hairline underline at 3px offset (6px hit slop). Got it folds the hint away (height and opacity, 220ms in, 180ms out, ease-out) and stores the page key in `settings.dismissedHints`; Settings › Appearance has a "Page hints" row with a sm secondary "Show them again". A hint is never a banner, a box or a tooltip.

### Setup
The first-launch tutorial (shown once to updaters too), replacing the welcome modal: three steps that each set something real. It runs in a centred 600px column with 48px side padding, starting 10vh from the top.
- **Steps:** "What are you training toward?" (direction), "Which days do you want to train?" (the Settings training-days toggles), then the microphone, which reuses MicCheck with `requireMic={false}` and "Finish setup", so a missing mic never blocks finishing. Each step has a 26px page-tier title and a 14px muted lead at 56ch.
- **Direction list:** a ruled radio list (hairline above and between, 14px rows): 14px label, 13px muted detail and the mono range ("165–255 Hz") at the right. The selected row gets a 6% accent wash and a 3px by 24px accent bar on the left edge that slides between rows on a shared layout id (220ms ease-in-out). "My own range" expands two mono Hz fields (height 220ms in, 180ms out) with a 12.5px helper that turns danger on invalid input. Choices come from `VOICE_DIRECTIONS` in `constants.ts`; a direction sets the starting range and adds the matching template.
- **Footer:** ghost "Skip setup" with the muted "Step n of 3" beside it on the left, ghost Back and a large Continue on the right. The step count is never above the heading.
- **Transition:** steps slide horizontally with popLayout, entering 24px from the direction of travel over 220ms and leaving 16px the other way over 180ms, ease-out.

### Routine picker
On Today the routine name (17px 600) is a button with a 10px chevron that opens a Popover of routines: each a row with the name and its muted length, the active one in accent at 500 and marked `aria-pressed`, then "Edit routines" beneath a hairline.

### Routine templates
New routines can start from a template (`ROUTINE_TEMPLATES`): Feminization basics, Masculinization basics and Androgynous basics. Template copy names no pitch as the user's target: a template that depends on range first sends the user to check their own target range on Today, and may mention a typical range only as a reference after that ("masculinizing voices often aim around 85–155 Hz").

**The Direction-Neutral Template Rule.** A template never sets or assumes a voice direction's pitch range. The user's own range comes first; templates point to it. Only Setup's direction choice proposes a starting range, shown in Hz and editable later.

### Level details
A Modal titled "Level N": a 3px fully rounded hairline meter filling in accent over 250ms ease-out, the mono XP to the next level, one muted sentence of how XP is earned in the Mono Numbers, Sans Units form, then "Rewards" as a ruled list: mono "Level n", a 12px colour dot (filled when earned, an empty ring when locked), the reward name, and "Unlocked" in accent or "Locked" in muted. No confetti, no badges.

## Do's and Don'ts

### Do:
- **Do** derive every new colour from `--accent-src` / `--accent2-src` through fixed OKLCH lightness and the chroma cap; never hard-code a theme colour.
- **Do** separate content with 1px alpha hairlines and space; lay out lists as rows.
- **Do** set measurements in Geist Mono with tabular figures, and everything else in Geist.
- **Do** keep radii at 6px for controls and 10px for surfaces, concentric inside.
- **Do** use ease-out (`cubic-bezier(0.23, 1, 0.32, 1)`) for entrances and ease-in-out (`cubic-bezier(0.65, 0, 0.35, 1)`) for elements moving on screen.
- **Do** make exits about 20% shorter than entrances (200ms in, 160ms out).
- **Do** keep dropdowns and popovers at 150 to 250ms, starting at scale 0.95 and entering from, and exiting to, their trigger.
- **Do** stagger list entrances by 30ms per item.
- **Do** scale pressable elements to 0.97 on press.
- **Do** move indicators and knobs as one element with a shared layout id, stretching about 12% along the direction of travel while moving.
- **Do** build motion with the Motion library so every animation is interruptible, and wrap the app in `MotionConfig reducedMotion="user"`.
- **Do** use the focus tier (34px title, 64px mono timer, 34px mono readout, 20px phrase) only inside focus mode.
- **Do** draw the range band with the one recipe (13% accent fill, 50% accent edge lines, masked edge fade) on every surface that shows pitch.
- **Do** colour pitch status by the Range Colour Rule: accent in range, ink below or above, muted while listening.
- **Do** float small editors in the anchored Popover, growing from and shrinking back into their trigger.
- **Do** autosave sessions of 30 seconds or more, and ask for "Save anyway" below that.
- **Do** confirm a save with the 240ms confirm pulse beside what was saved.
- **Do** keep a measurement and its unit on one line (the `Num` helper, no-wrap).
- **Do** draw the range band with the same recipe on every chart that shows pitch, including Progress charts.
- **Do** confirm destructive actions with the Confirm button: a popover from the trigger with Cancel and a danger action that names the act.
- **Do** show a recording inside its session; give only orphaned recordings their own list.
- **Do** thin chart grid labels so they sit at least 32px apart.
- **Do** apply settings the moment they change; ask first only for a change with consequences, in a popover from its own control.
- **Do** draw a locked reward colour as an empty ring in its own colour and an earned one filled.
- **Do** give every control smaller than 32px invisible hit slop (4px buttons and swatches, 6px text buttons, 8px switches).
- **Do** let a held drag follow the pointer exactly; animate only the neighbours (200ms ease-in-out).
- **Do** give every drag handle a keyboard alternative (Arrow Up and Down).
- **Do** write templates that send the user to set their own target range first.
- **Do** split wide pages into columns from 2xl (1536px), up to 2200px, rather than widening margins or stretching one column.
- **Do** expand only the active sidebar section, and keep one shared indicator for every item and sub-item.
- **Do** explain a page with one dismissible page hint under its title, never a banner or a tour overlay.
- **Do** put a step count in the footer beside the step's actions.
- **Do** centre the full-window session screens (mic check, summary, not saved) with auto margins.

### Don't:
- **Don't** use cards as structure: no grids of bordered or shadowed boxes holding page content.
- **Don't** use gradients or glows anywhere. (An alpha mask that fades the range band's scale ends is not a colour gradient.)
- **Don't** use large radii; nothing above 12px.
- **Don't** reach for a general icon library (no Lucide everywhere); use the custom 16px 1.5-stroke set, and only where text cannot do the job.
- **Don't** add decorative pills or badges.
- **Don't** add eyebrow or kicker labels: no small or uppercase tracked text above a heading, and no step count there either.
- **Don't** bounce or overshoot everyday UI; the confirm pulse is the one exception.
- **Don't** put shadows on anything resting in the page flow.
- **Don't** use the accent decoratively inside focus mode; every accent there is a primary action, a selection, progress or "in range".
- **Don't** colour out-of-range pitch red.
- **Don't** fire confetti for ordinary session ends, or in colours outside the palette.
- **Don't** use `window.confirm` or any native dialog for a destructive action.
- **Don't** add a Save button to Settings.
- **Don't** show a locked colour as a faded or pastel fill.
- **Don't** draw keyboard shortcut hints anywhere except the sidebar's "Search · Ctrl K" row.
- **Don't** ease or lag a dragged element behind the pointer.
- **Don't** write a template that assumes a pitch range for a voice direction.
