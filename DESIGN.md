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
---

# Design System: Resona

## Overview

**Creative North Star: "The Quiet Utility"**

Resona looks like a well-made piece of Windows itself: a Mica nav layer, a 36px custom title bar with native caption buttons, a labeled sidebar like Windows Settings, and one raised content pane that holds the work. Nothing competes for attention. Hierarchy comes from type weight, alpha hairlines and space, never from boxes, glows or badges. The one recurring object is the user's voice range; everything else stays out of its way.

Density is calm and desktop-native: 13 to 14px text, 32px controls, left-anchored content columns that cap at 1000px. Every colour is derived at runtime from two accent source colours (the level-unlocked theme), and OKLCH relative-colour syntax normalises lightness so every theme lands equally calm and legible, in light and dark.

Motion is quick, interruptible and physical without bounce: ease-out for entrances, ease-in-out for moves, exits shorter than entrances, a 0.97 press, and indicators that slide between positions on a shared layout id.

A session is a full-window focus mode. It keeps the same palette, hairlines and radii but adds a display tier read from a step back from the screen, and the accent inside it carries only signal: a primary action, a selection, progress (block progress, the recording scrubber) and "in range". Progress, Routines and Settings internals still carry the pre-redesign look (scheduled for phases 3 and 4); they are drift, not reference.

**Key Characteristics:**
- Two-layer shell: Mica-tinted nav layer, one raised content pane with a concentric 10px top-left corner.
- Neutrals are greys tinted a few points toward the accent hue; one accent for primary action, selection and "in range".
- Geist for all UI text; Geist Mono with tabular figures only for measurements (Hz, times, counts, indices).
- Alpha hairlines divide content; rows and sections, not cards.
- Small concentric radii: 6px controls, 10px surfaces.
- Text first: a custom 16px, 1.5-stroke icon set used only for transport and system controls.
- The range band is the one signature object, drawn with the same tint and edge recipe wherever pitch appears.
- Two type tiers: the page tier for arm's-length reading and a focus tier for reading at a distance during a session.

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

**The One Accent Rule.** The accent marks exactly three things: the primary action, the current selection, and "in range". If it appears for decoration, it is wrong.

**The Range Colour Rule.** Pitch status has three colours only: accent for "In range", ink for "Below range" and "Above range", muted for "Listening". Out of range is never red; danger is kept for strain and errors.

**The Dark Depth Rule.** In dark mode, lighter means closer: sidebar (L 0.165) sits lowest, then app ground (0.2), surface (0.245), panel (0.27).

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

**The Sentence Case Rule.** Headings, labels and buttons are sentence case at normal tracking. There are no uppercase tracked labels and no small text sitting above a heading.

## Layout

The window is a column: a 36px title bar, then a row of a 216px sidebar and the content pane. The title bar leaves 148px clear on the right for the native caption buttons and is a drag region. The content pane is one raised surface with a hairline on its top and left edges and a 10px top-left corner, the only rounded corner in the shell.

Pages sit left-anchored next to the nav, like Windows Settings, in a PageFrame: 40px side padding, 28px top, 64px bottom, max width 1000px (760px narrow for Settings, 1200px wide for Progress). The page header is 28px above content. Sections stack with 40px gap plus 32px padding above a hairline; the first section has neither. Lists are rows of 10px vertical padding divided by hairlines, laid out as a grid of index, label and right-aligned measurement. The Today page is a single hairline-bounded band (title and summary left, Change and Start right), then "Your voice" (the range band with recent session medians and a one-line muted summary), the routine list and the Focus note.

Focus mode covers the whole window below the title bar, sidebar included, on the app ground with a hairline at its top. Its gutters are 48px. A routine session stacks: the block-progress hairline (16px from the top), a header with the focus title left and the timer right, the prompt row, the live pitch chart filling the remaining height (220px minimum), and a 64px footer above a hairline, laid out as three columns: End session left, transport centred, position and "Next: title" right. The mic check (560px column), summary (760px) and "Session not saved" screens are left-anchored columns inside the same layer.

## Elevation & Depth

Flat at rest. Depth comes from tonal layering (nav layer, app ground, raised surface) and alpha hairlines, not shadows. One shadow exists, for things that float above the page.

### Shadow Vocabulary
- **Pop** (`box-shadow: 0 1px 2px oklch(0 0 0 / 0.06), 0 8px 24px -6px oklch(0 0 0 / 0.16)` light; `0 1px 2px oklch(0 0 0 / 0.3), 0 12px 32px -8px oklch(0 0 0 / 0.55)` dark): dialogs, popovers and menus only.
- **Segment lift** (`0 1px 2px oklch(0 0 0 / 0.12)`, light mode only): the selected thumb of a segmented control. In dark it becomes a 12% ink fill instead.

### Named Rules
**The Float-Only Shadow Rule.** A shadow means the element floats above the page (dialog, popover, menu). Nothing resting in the page flow gets one.

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
- **Style:** a labeled sidebar (Today, Progress, Routines; Settings pinned at the foot below a hairline). Items are 36px tall, 13.5px text, 6px radius; inactive muted with a 4.5% hover wash, active ink at 500 on a 7% wash.
- **Indicator:** a 3px by 16px accent bar on the left edge, one element shared by layout id, slides between items over 250ms ease-in-out and stretches 12% vertically while it moves. It does not animate on first paint. Press scales to 0.97.
- **Foot:** streak as a mono number plus "day streak", level as "Level N" with a 3px hairline meter filling in accent over 500ms. Small and plain, a button that opens level details.
- **Title bar:** the waveform mark in accent at 15px, "Resona" at 12px 500, and a muted status that crossfades with a 3px blur.

### Icons
A custom set on a 16px grid with 1.5px round-capped strokes, so icons match Geist's stroke weight. Used only for transport (play, pause, previous, next), prompt stepping (chevrons) and system controls (close). Transport glyphs fill their triangles with the stroke colour because filled shapes read better at small sizes; pause is two 2.25px strokes. The app mark is three waveform bars.

### Range band (signature)
The user's target pitch range as a tinted band on a log-frequency scale (70 to 420 Hz), drawn with one recipe everywhere pitch appears: Today's "Your voice", the session summary and, rotated to horizontal over time, the live chart.
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
A secondary icon button, "Recording" in 13.5px, a 3px ink 10% scrubber with an accent fill (click to seek), and mono "0:42 / 3:10" in 12.5px muted.

### Session flow
- **Focus layer:** enters with opacity and scale from 0.985 over 220ms ease-out, exits over 180ms; its steps (mic check, training, summary) crossfade 200 / 160ms.
- **Summary:** a 26px "Session complete", then one 15px muted sentence of results in the Mono Numbers, Sans Units form, the range band with this session's distribution and median, the recording, strain, optional note, and a large Done.
- **Saving:** sessions of 30 seconds or more of active (unpaused) time autosave. Shorter ones land on "Session not saved", which explains why and offers ghost Discard and primary "Save anyway"; a failed save shows the error in danger with "Try again".
- **Celebration:** confetti fires only for milestones (a new level, an unlocked achievement, a claimed goal), in the resolved accent, secondary and ink colours, 350ms after the summary has entered, and never under reduced motion.

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

### Don't:
- **Don't** use cards as structure: no grids of bordered or shadowed boxes holding page content.
- **Don't** use gradients or glows anywhere. (An alpha mask that fades the range band's scale ends is not a colour gradient.)
- **Don't** use large radii; nothing above 12px.
- **Don't** reach for a general icon library (no Lucide everywhere); use the custom 16px 1.5-stroke set, and only where text cannot do the job.
- **Don't** add decorative pills or badges.
- **Don't** add eyebrow or kicker labels: no small or uppercase tracked text above a heading.
- **Don't** bounce or overshoot everyday UI; the confirm pulse is the one exception.
- **Don't** put shadows on anything resting in the page flow.
- **Don't** use the accent decoratively inside focus mode; every accent there is a primary action, a selection, progress or "in range".
- **Don't** colour out-of-range pitch red.
- **Don't** fire confetti for ordinary session ends, or in colours outside the palette.
- **Don't** treat Progress, Routines or Settings internals as reference; they are legacy drift until phases 3 and 4.
