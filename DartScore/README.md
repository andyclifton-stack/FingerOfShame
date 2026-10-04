# DartScore

A phone and tablet darts companion with an interactive board, accessible button entry, and a visit-total keypad.

## Current build

The match-night release includes:

- `301` and `501` with bust handling, double-out/straight-out and best-of 1, 3, 5, 7 or 9 legs
- `Free Scoring` with an editable target score
- Maths-based dartboard hit detection from tap/click coordinates
- Turn tracking for up to 3 darts
- `Undo Last Dart`
- `End Turn`
- Local `localStorage` resume for unfinished games
- Round the Clock and Killer, with guidance for the active player
- Editable three-dart review, instant undo and legal checkout suggestions based on darts remaining
- Alternating leg starters, results, same-player rematches and the last 50 completed matches
- Three-dart averages, highest visits, darts used, best checkouts and personal bests
- Install manifest, versioned offline shell and an optional screen wake lock
- Remembered player names and match settings, reduced-motion support and keyboard scoring
- Phone-first playing screen with a full-width, viewport-fitted board, compact scores, three dart indicators and Undo/Next player. Match statistics, history, alternate scoring and settings are available from the match menu.
- Direct dart placement: tap to record, or press and drag before releasing to aim. Drag a numbered marker to correct it; a tap on the same position adds another dart. After three darts, review the group and select Next player. Cancelled gestures, extra fingers and releases outside the board do not score. Select a dart in the footer to reposition overlapping markers.
- Automatic precision lens: hold for 220 ms or drag to see a 2.5x close-up with a crosshair and live score. The lens stays inside the board and disappears on release or cancellation; quick taps require no extra steps.

Scores and history stay in this browser on this device. Visit-total entry uses the explicitly entered darts-used count and never invents individual hits. Bust visits score zero for averages. Checkout percentages are not inferred. Screen wake lock and installation depend on browser/device support.

Existing version-one saved games retain their scores; historical statistics are available for visits recorded by this release.

## Stack

- React
- TypeScript
- Vite
- Vitest

## Project structure

```text
src/
  components/
  logic/
  types/
  App.tsx
  main.tsx
  styles.css
```

## Run locally

```bash
npm install
npm run dev
```

Open the local Vite URL shown in the terminal.

## Quality checks

```bash
npm test
npm run lint
npm run build
```

## Deployment

The existing GitHub Pages workflow builds, lints and tests DartScore before deployment at `/FingerOfShame/DartScore/`. The build generates `dist/sw.js` with a fingerprint of all shell assets. Offline caches are scoped to DartScore; updates wait for existing app tabs to close.
