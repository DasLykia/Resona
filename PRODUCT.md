# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

(Electron desktop app, Windows 11. Web technology, but it should feel like a native Windows utility.)

## Users
People doing gender-affirming voice training, in both directions: feminization and masculinization are equally first-class. They practise alone at their PC, usually daily and often in short sessions, and they want to see and hear their voice changing over weeks and months.

## Product Purpose
Resona makes daily voice training easy to start and easy to keep doing. It runs guided routines or free sessions with live pitch feedback and recording, then shows whether your voice is changing. Success means the user trains consistently without straining, and can see and hear their progress.

## Positioning
A private, offline desktop training companion. It combines guided routines, a live pitch range, and recording in one focused session, and treats vocal health (rest days, strain tracking) as part of the streak rather than a penalty.

## Operating Context
- Opening the app is mostly to start today's session with zero thought.
- During a session, the user is speaking or singing, not reading UI: a full-screen focus mode with the current exercise, timer and live pitch against a target range.
- After a session: a summary with time, time in range, and recording playback, plus a one-tap strain check (Easy · Fine · Some effort · Strained · Hurt). It saves automatically.
- Progress answers "is my voice changing?" first (pitch trend: median pitch and time in range), then consistency (calendar and streak), then the session list. Rest and sick days are marked on that calendar.
- Comparing an early recording with a recent one ("then vs now") is a core way to see progress.

## Capabilities and Constraints
- Places: Today, Session (focus mode), Progress (trends, calendar, sessions, recordings, achievements, goals), Routines, Settings.
- Multiple saved routines made of timed or open-ended blocks with prompts; templates for both feminization and masculinization. "Free session" is a stopwatch with pitch and recording.
- Pitch target is a range (low–high Hz), not a single note.
- Gamification is quiet but present: streak, XP and levels, level-unlocked accent colors, achievements, goals. Confetti only for real milestones.
- Fully local: data in localStorage and IndexedDB, no account, no server. Must work offline, with no CDNs or remote fonts at runtime.
- Updates via Velopack from GitHub releases.
- Existing users' sessions, recordings and stats must survive every change. Old effort (1–10) data maps onto the 5-step strain scale.
- Stack: Electron, React 19, Vite, Tailwind 3, TypeScript, Pitchy (pitch detection).

## Brand Commitments
- Name: Resona.
- Must support light and dark mode; follows the Windows setting by default, with a manual override.

## Evidence on Hand
- No testimonials, user counts or press exist. Do not invent any.
- The default routine and plan text in `constants.ts` is real training content written by the author.

## Product Principles
1. Starting is one action. Everything else is one step away, never in the way.
2. While training, the voice is the interface: show only what helps right now.
3. Rest is training. Health and recovery never feel like failure.
4. Progress is heard as well as seen.
5. Everything stays on the user's machine.
