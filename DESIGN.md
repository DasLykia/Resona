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
---

# Design System: Resona

## Overview

**Creative North Star: "The Quiet Utility"**

Resona looks like a well-made piece of Windows itself: a Mica nav layer, a 36px custom title bar with native caption buttons, a labeled sidebar like Windows Settings, and one raised content pane that holds the work. Nothing competes for attention. Hierarchy comes from type weight, alpha hairlines and space, never from boxes, glows or badges. The one recurring object is the user's voice range; everything else stays out of its way.

Density is calm and desktop-native: 13 to 14px text, 32px controls, left-anchored content columns that cap at 1000px. Every colour is derived at runtime from two accent source colours (the level-unlocked theme), and OKLCH relative-colour syntax normalises lightness so every theme lands equally calm and legible, in light and dark.

Motion is quick, interruptible and physical without bounce: ease-out for entrances, ease-in-out for moves, exits shorter than entrances, a 0.97 press, and indicators that slide between positions on a shared layout id.

**Key Characteristics:**
- Two-layer shell: Mica-tinted nav layer, one raised content pane with a concentric 10px top-left corner.
- Neutrals are greys tinted a few points toward the accent hue; one accent for primary action, selection and "in range".
- Geist for all UI text; Geist Mono with tabular figures only for measurements (Hz, times, counts, indices).
- Alpha hairlines divide content; rows and sections, not cards.
- Small concentric radii: 6px controls, 10px surfaces.
- Text first: a custom 16px, 1.5-stroke icon set used only for transport and system controls.

## Colors

A near-monochrome palette of accent-tinted greys with a single, chroma-capped accent doing all the signalling.

All values below are resolved for the default Violet theme (accent source #8b5cf6, hue 292.7; secondary source #10b981, hue 162.5). The canonical source is `index.css`: each token is `oklch(from var(--accent-src) L C h)` with fixed lightness and chroma, so only the hue follows the theme. Accent chroma is capped at 0.16 (`--chroma-cap`), secondary at 0.14 (0.13 in dark). Dark mode redefines every token under `[data-mode='dark']`; the dark values live in the sidecar.

### Primary
- **Theme Accent** (primary): the Start button, the sliding nav bar, the level meter fill, focus rings, caret, selection wash (32% mix), the "× XP today" line. Hover deepens it by 0.06 lightness in light mode and lifts it by 0.06 in dark.
- **On Accent** (on-primary): text on filled accent buttons; near-white in light, a deep accent-hued ink (L 0.2) in dark.

### Secondary
- **Second Source** (secondary): derived from the theme's second source colour. Reserved for a second data series; no new-world surface uses it yet.

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

### Named Rules
**The Mono Means Measured Rule.** Geist Mono with tabular figures is used for numbers that are readings (times, Hz, counts, indices) and for nothing else.

**The Sentence Case Rule.** Headings, labels and buttons are sentence case at normal tracking. There are no uppercase tracked labels and no small text sitting above a heading.

## Layout

The window is a column: a 36px title bar, then a row of a 216px sidebar and the content pane. The title bar leaves 148px clear on the right for the native caption buttons and is a drag region. The content pane is one raised surface with a hairline on its top and left edges and a 10px top-left corner, the only rounded corner in the shell.

Pages sit left-anchored next to the nav, like Windows Settings, in a PageFrame: 40px side padding, 28px top, 64px bottom, max width 1000px (760px narrow for Settings, 1200px wide for Progress). The page header is 28px above content. Sections stack with 40px gap plus 32px padding above a hairline; the first section has neither. Lists are rows of 10px vertical padding divided by hairlines, laid out as a grid of index, label and right-aligned measurement. The Today page is a single hairline-bounded band (title and summary left, Change and Start right) followed by the routine list and the Focus note.

## Elevation & Depth

Flat at rest. Depth comes from tonal layering (nav layer, app ground, raised surface) and alpha hairlines, not shadows. One shadow exists, for things that float above the page.

### Shadow Vocabulary
- **Pop** (`box-shadow: 0 1px 2px oklch(0 0 0 / 0.06), 0 8px 24px -6px oklch(0 0 0 / 0.16)` light; `0 1px 2px oklch(0 0 0 / 0.3), 0 12px 32px -8px oklch(0 0 0 / 0.55)` dark): dialogs, popovers and menus only.
- **Segment lift** (`0 1px 2px oklch(0 0 0 / 0.12)`, light mode only): the selected thumb of a segmented control. In dark it becomes a 12% ink fill instead.

### Named Rules
**The Float-Only Shadow Rule.** A shadow means the element floats above the page (dialog, popover, menu). Nothing resting in the page flow gets one.

## Shapes

Small, concentric radii. Controls are 6px; a control's inner thumb is 5px inside a 2px inset track; surfaces (dialogs, the content pane corner) are 10px; 12px is the ceiling. Full rounding is kept for thin bars: the 3px nav indicator, the 3px level meter, scrollbar thumbs, spinners. Borders are 1px alpha hairlines. Focus is a 2px accent outline at 2px offset that follows each element's own radius.

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
A custom set on a 16px grid with 1.5px round-capped strokes, so icons match Geist's stroke weight. Used only for transport (play, record, stop) and system controls (close). The app mark is three waveform bars.

### Range band (signature, not yet built)
The direction names a tinted horizontal band for the target pitch range, drawn the same way wherever pitch appears. It ships in later phases; record its tokens here once it exists in code.

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

### Don't:
- **Don't** use cards as structure: no grids of bordered or shadowed boxes holding page content.
- **Don't** use gradients or glows anywhere.
- **Don't** use large radii; nothing above 12px.
- **Don't** reach for a general icon library (no Lucide everywhere); use the custom 16px 1.5-stroke set, and only where text cannot do the job.
- **Don't** add decorative pills or badges.
- **Don't** add eyebrow or kicker labels: no small or uppercase tracked text above a heading.
- **Don't** bounce or overshoot everyday UI.
- **Don't** put shadows on anything resting in the page flow.
