# Music Wall

A personal, installable music visualiser for Windows, Samsung phones and a computer connected to a TV. All ten scenes and all 30 palettes are included. There are no accounts, purchases, analytics, recordings or audio uploads.

The original brief and version checkpoints are preserved in the development workspace and excluded from the public repository.

## Versions

The current working app is **Version 4 — continuous sound, clearer controls**. Automatic adapts movement, beat impact, melodic detail, colour and sparse particles gradually, and tours all ten scenes and palettes. A single Intensity control sets the overall feel. Manual styles and fine-tuning remain available.

Your approved **Version 1** is preserved in the original development workspace at `checkpoints/version-1/`. Saying “reverse back to version 1” refers to that exact snapshot. See [VERSIONS.md](VERSIONS.md) for the change record and restoration instructions. In that workspace, verify the snapshot with `node scripts/verify-checkpoint.mjs`.

## Run locally

Use Node.js 22.12+ (this project was built with Node 24):

```sh
npm ci
npm run dev
```

Open the localhost address shown in the terminal. For the offline/installable production version:

```sh
npm run build
npm run preview -- --port 4173
```

Open `http://127.0.0.1:4173`. Localhost is a secure context on the same computer. Accessing a computer's plain HTTP LAN address from a phone does **not** provide the same secure-context microphone/PWA capabilities. Use the HTTPS Finger Games release for phone testing.

## Enjoying Music Wall

- **Music source:** start with the silent, labelled demo; tap Start listening for the microphone; choose local files; or share a desktop browser tab with its audio enabled. Opening the app never starts capture.
- **New scenes:** Spectrum Hall has 32 glossy frequency bars; Live Wire shows the live time-domain waveform, with a flat trace in silence. Each has three palettes and participates in touring, looks, offline use, reduced motion and visual pause.
- **Listening status:** microphone text stays steady; a subtle light responds to sound without shifting the controls. The source panel retains a level meter and explicit Stop listening.
- **Automatic:** on by default, with a single Intensity slider. Quick beat accents sit above slowly changing atmosphere. The app estimates energy and rhythmic texture locally; it does not recognise songs, instruments or genres.
- **Tour timing:** click the visible Tour button, or open Automatic / Scenes, and use **Change scene every**: 30 seconds, 1, 3 or 5 minutes. Automatic waits at most two extra seconds for a beat. Quiet music, visual pause, backgrounding and open panels pause the tour clock; adaptation and live drawing continue while editing. Selecting a scene/palette holds it; the cycle switch resumes touring.
- **Manual styles:** Relaxed, Balanced and Energetic select the former Calm, Flow and Party presets and turn Automatic off. Reduced motion always takes priority. Manual timed rotation can use favourites; Automatic tours all ten.
- **Local files:** transport controls provide play/pause, seeking, previous/next and repeat. Open Source to add, remove or reorder tracks and change volume. Files stay on your device; choose them again after reopening.
- **Customise:** Intensity first; manual styles next; optional Fine-tune the effects and Device & accessibility sections. Fine-tuning includes sensitivity, brightness, motion, beat impact, melody detail, flow speed, particle amount and colour intensity. Automatic uses these as preferences without moving or overwriting your sliders. Particle amount is a ceiling; 45% is the new sparse default, 0% hides particles. Existing saved values are preserved.
- **Looks:** save a named combination of scene, palette, intensity, Automatic/manual mode and fine-tuning. Opening a look holds its scene. Rename, favourite or delete looks. Quality and accessibility remain device preferences. Open the collection through Customise.
- **Fullscreen / Hide interface:** controls hide after four seconds of inactivity. A tap, pointer movement or key reveals them. Controls remain visible while a panel is open or a control has keyboard focus. Hide interface is available in Customise on phones.
- **Keyboard:** F toggles fullscreen, V pauses/resumes artwork, S stops capture, Escape closes panels/exits theatre. Shortcuts do not run while typing.

**Pause visuals** freezes the artwork and rotation; it does not pause music or stop the microphone. **Stop listening** releases the microphone tracks. Switching away from the app stops microphone/tab capture. It will not restart without an explicit action. Local playback may continue in the background where the browser permits it.

### Audio boundaries

Microphone and shared-tab input feed an analyser with no speaker-output connection. The local-file route is media element → analyser → volume gain → speakers. Turning playback volume down does not weaken visual analysis.

Tab sharing is offered on supported desktops and checks that the returned stream actually contains audio. Share cancellation, absent audio and stopped sharing never silently switch to microphone or demo. The browser requires a video capture request; Music Wall neither displays nor records that video and releases all capture tracks on stop.

The phone PWA cannot capture another Android app's internal audio. Use a room microphone or a file played by Music Wall. TV use means a connected laptop/mini PC; phone remote control, smart-TV browser support and wireless casting are not included.

### Installation, offline use and updates

Use Install when the browser offers it, or its Install app / Add to Home screen menu. After the app reports **Ready for offline use**, all ten scenes and interface resources are cached. Demo, saved looks and freshly selected local files work offline. Browser permissions still apply to microphone access. Clearing browser/site data removes cached resources and saved looks; export a backup first.

Updates appear in Customise and wait for you to choose **Update available · stop audio and reload**. Saved looks survive normal updates. Merging an import adds looks and scene favourites while retaining current device settings; replacing uses the imported settings and collection. Invalid files do not overwrite data. Audio files and permissions are never exported.

## Engineering checks

```sh
npm test
npm run build
```

The unit suite covers frequency isolation, silence/noise gating, smoothing, import validation, merge conflicts, capture cleanup and race conditions, single-route playback, queues and corrupt files.

In development, open `http://127.0.0.1:5173/?verify` for the visual/audio matrix and a configurable 1–60 minute foreground soak. It tests 180 combinations (10 scenes × 3 palettes × 3 moods × reduced motion on/off), exact visual pause, renderer resource stability and real browser decoding of synthetic audio fixtures. The suite mutes its output through the gain node. This page is excluded from the production build.

`?scene-test&time=4&bass=0.45&mids=0.35&treble=0.25&energy=0.4` freezes deterministic analysis/time for manual scene comparisons in the development app. The normal scene, palette and mood controls remain available.

Synthetic fixtures are original generated tones, not music. Recreate the WAV and corrupt file with `node scripts/fixtures.mjs`; optional codec fixtures were generated locally using FFmpeg. These fixtures are not copied into the production app.

See [VERIFICATION.md](VERIFICATION.md) for executed checks and remaining real-device checks.

## Finger Games release

Open [Music Wall](https://fingergame.co.uk/FingerOfShame/MusicWall/), also listed under Apps in the [Finger Games hub](https://fingergame.co.uk/FingerOfShame/). The repository's GitHub Pages workflow tests and builds Music Wall before publishing its output. See [RELEASE.md](RELEASE.md) for the release process and [deployment status](https://github.com/andyclifton-stack/FingerOfShame/actions/workflows/deploy.yml).

## Structure

- `src/audio`: managed input lifecycle and shared feature analysis.
- `src/scenes`: ten independent procedural scene shaders and curated palettes.
- `src/render`: one Three.js renderer, bounded render targets and smooth transitions.
- `src/App.tsx` / `src/style.css`: responsive controls, looks and viewing behaviour.
- `src/storage.ts`: versioned local persistence and validated transfer.
- `vite.config.ts` / `public`: PWA manifest, cached assets and installation icons.

Dependencies are locked in `package-lock.json`. Settings format version 1 is explicitly validated; unsupported future versions are rejected rather than guessed. New versions should add explicit migrations before changing this format.
