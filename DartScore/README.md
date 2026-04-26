# DartScore

A tablet-first React + TypeScript web app for scoring real-world darts games by tapping directly on an SVG dartboard.

## Current build

This first implementation covers:

- `501` with bust handling and selectable finish rule
- `Free Scoring` with an editable target score
- Maths-based dartboard hit detection from tap/click coordinates
- Turn tracking for up to 3 darts
- `Undo Last Dart`
- `End Turn`
- Local `localStorage` resume for unfinished games

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

## Next recommended stage

- Add richer checkout guidance and suggested finishes for X01
- Expand X01 presets to `301` and `701`
- Add persistent match history and lightweight stats
- Add more practice and party modes after the scoring core has settled
