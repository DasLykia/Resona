---
version: 1
slug: "app-tsx"
primary_target: "App.tsx"
related_targets: ["index.css","components/session/FocusSession.tsx"]
---

Scope: the app shell (window, title bar, sidebar, page frame) and the shared design system every screen inherits. Mode: Operate.

Audience/job: people doing gender-affirming voice training (fem and masc), opening the app daily to start a session with zero thought, then checking whether their voice is changing.
Constraints: offline (bundled Geist), Windows 11 Electron, light/dark follows Windows, existing data untouched, level-unlocked accents kept.

## Direction contract

THESIS: Resona is a quiet Windows utility where the one recurring object is your voice range. It refuses the dashboard of equal cards, glows and pills: hierarchy comes from type, hairlines and space.

OWN-WORLD: Neutral OKLCH greys tinted a few points toward the accent hue. A Mica sidebar washed with the accent at low chroma. One accent for primary action, selection and "in range". Geist for all UI text; Geist Mono only for measurements (Hz, times, counts), with tabular numbers. Alpha-hairline separators instead of boxes. 6px control radius, concentric radii inside it. Text first, with icons only for transport and system controls.

STORY: Open the app, see today's routine, press Start; train; see whether you stayed in range; over weeks, see and hear the change.

FIRST VIEWPORT: 36px custom title bar (name, drag area, native caption buttons). 216px labeled sidebar: Today, Progress, Routines, Settings. The active item is marked by a short accent bar that slides between items. Streak and level sit small at the sidebar foot: plain text with a hairline level meter (user: "Keep streak + levels, but small"). The content column on the app ground shows Today's heading and date, the chosen routine, and a primary Start.

FORM: pinned by the user. seed: none (pinned) "Quiet native app: Feels like a polished Windows/macOS utility: neutral, system-like, content-first, minimal chrome", "Custom title bar + Mica", "Labeled sidebar like Windows Settings", first screen: "Start today's session". Signature move: the range band, a tinted horizontal band for the target pitch range, drawn the same way wherever pitch appears.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Phase 2 (built): Today leads with Start, then "Your voice" (the range band with recent session medians), the routine list and the focus note. A session is a full-window focus mode: mic check, then the current exercise, timer and live pitch drawn against the range band, then an inline summary (time, % in range, median, the band with this session’s distribution, recording playback, one-tap strain, optional note; autosaved). Focus mode adds a display tier for reading at a distance: 34px exercise title, 64px mono timer, 34px mono pitch readout, 20px prompt phrase.

Unresolved: Progress (phase 3) and Routines, Settings, command menu (phase 4) still carry the legacy look.
