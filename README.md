# Resona

A Windows app for daily voice training. Resona runs your practice routine, shows your pitch and resonance live while you speak, records the session, and keeps track of how your voice changes over weeks and months.

It was made for gender-affirming voice training, in either direction, but works for any voice practice where pitch and consistency matter. Everything stays on your computer: no account, no server, works offline.

[![Latest release](https://img.shields.io/github/v/release/DasLykia/Resona?label=release&sort=semver)](https://github.com/DasLykia/Resona/releases/latest)
![Windows 10 and 11](https://img.shields.io/badge/platform-Windows%2010%20%7C%2011-0078D6)

## Install

Download `Resona-win-Setup.exe` from the [latest release](https://github.com/DasLykia/Resona/releases/latest) and run it. Resona installs for your Windows user only, so no administrator rights are needed.

Updates are checked when the app starts (you can turn this off in Settings). When one is available, a button in the sidebar installs it and restarts the app. Your sessions, recordings and settings are kept.

## What it does

### Today

The start page shows the routine planned for today, its exercises, and the current week. One click starts the session. On rest days you can still train if you want to.

### Sessions

A session fills the window so nothing else competes for attention:

- The current exercise, its instructions and a timer. Timed exercises move on by themselves; open-ended ones wait until you continue.
- A live pitch graph against your target range (for example 180–220 Hz), not a single note.
- A resonance meter that shows whether your voice is brighter or darker than usual.
- Optional phrases to read aloud, which you can cycle through.
- Pause, skip, and a short beep between exercises.

Sessions are recorded if recording is on. Afterwards you get a summary with your time, time in range and the recording, and you can rate how much strain you felt.

### Routines and the week plan

Routines are lists of timed exercises, open-ended exercises and rests. Templates for feminization and masculinization are included, and you can write your own, reorder exercises by dragging, and duplicate routines.

The week plan assigns a routine (or a rest day) to each weekday. You can run a different routine for just one day without changing the plan.

### Progress

- **Overview:** your median pitch and time in range over time, resonance, a training calendar and your goals.
- **Then and now:** play an early recording next to a recent one.
- **Sessions:** every saved session with its pitch data, notes and recording. Search, export or delete them.
- **Journey:** a recap for each month and milestones you marked yourself.

### Rest and vocal health

Rest days and planned days off never break your streak. If you are ill or away, you can mark a whole stretch of days at once. When your strain ratings stay high for a week, Resona suggests a rest day or a shorter session.

### Background and reminders

All optional and off by default:

- **Start with Windows**, hidden in the notification area.
- **Keep running in the tray** when the window is closed. The window is unloaded while hidden, so Resona uses very little memory.
- **Training reminder** at a time you choose, only on days your week plan has a routine. It is skipped on rest days and once you have trained.

### Your data

- Export one recording or all of them as WAV files.
- Back up everything (optionally including recordings) to a single file and restore it on another computer.
- Deletes ask for confirmation and can be undone for a few seconds afterwards.

Streaks, levels, achievements and unlockable accent colors are there for motivation. Levels can be turned off.

## Privacy

Resona has no account and sends nothing about you anywhere. Sessions, settings and recordings are stored in your Windows user profile (`%APPDATA%\Resona`). The only network request is the update check against this repository's releases, and that can be switched off.

## Versions

Since November 2026, versions are named after their release date: `2026.11.16` is the release from 16 November 2026. Earlier releases used `1.0.x`. Installs from 1.0.5 onwards update automatically.

## Development

You need [Node.js](https://nodejs.org/) 20 or newer.

```sh
git clone https://github.com/DasLykia/Resona.git
cd Resona
npm install
npm run dev
```

`npm run dev` starts Vite and opens the app in Electron with live reload.

Other scripts:

| Command | What it does |
| --- | --- |
| `npm run build` | Builds the interface into `dist/` |
| `npm run pack:win` | Builds and packages an unpacked app in `Releases/win-unpacked/` |
| `npm run make:release` | Turns the packaged app into a Velopack release (installer, full and delta packages) in `Releases/` |

Releases need the [Velopack CLI](https://docs.velopack.io/) (`dotnet tool install -g vpk`). Set the date version in `package.json`, run `npm run pack:win` and `npm run make:release`, and upload the files from `Releases/` to a GitHub release with the same tag.

The pure logic in `services/` has small self-tests that run without a test framework:

```sh
node --experimental-strip-types services/routines.selftest.ts
```

### Built with

[Electron](https://www.electronjs.org/), [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vite.dev/), [Tailwind CSS](https://tailwindcss.com/), [Motion](https://motion.dev/), [Pitchy](https://github.com/ianprime0509/pitchy) for pitch detection and [Velopack](https://velopack.io/) for installing and updating.

## Feedback

Found a bug or have an idea? [Open an issue](https://github.com/DasLykia/Resona/issues).
