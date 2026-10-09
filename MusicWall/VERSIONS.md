# Music Wall versions

## Version 1 — approved baseline

Andy approved the original version on 9 October 2026 and asked to be able to say **“reverse back to version 1.”** That phrase means restore this checkpoint, not attempt to approximate its appearance.

- Location: `checkpoints/version-1/project/`
- Integrity manifest: `checkpoints/version-1/manifest.json`
- Contains 60 checksum-verified files: source, original brief, public assets, dependency lock, documentation, fixtures and the complete built PWA in `dist/`.
- Excludes replaceable dependencies (`node_modules`), temporary test results and generated TypeScript cache.
- Do not edit or overwrite this checkpoint. The checkpoint script refuses to overwrite it.

### When a rollback is requested

First save the current working version separately. Restore the project files named in the Version 1 manifest, preserving the entire `checkpoints` folder and any user exports. Compare added application files against the manifest rather than recursively deleting the project. Restore the matching package lock and install dependencies with `npm ci` if needed. The saved `dist/` is also the exact original production build.

Validate every restored file against the manifest before making further changes. Run the original checks with `npm exec vitest run src` and build. Refresh the same local preview and explicitly apply the service-worker update so the browser is actually showing Version 1. Browser-local saved looks/settings should remain in place: the scene IDs, palette indexes and settings schema are compatible with Version 2.

## Version 2 — dance and flow

- Bass-onset detection catches kicks even when compressed music has little change in overall loudness. Beat accents decay quickly; sustained bass does not manufacture repeated beats. Melody and treble remain independent inputs.
- Velvet Ribbon, Paper Waves and Night Current use directional, travelling wave patterns. Paper Waves retains layered paper shading, with flowing edge highlights and grains.
- Disco Mosaic uses larger group tilts, tile flips, bass expansion, moving colour waves and small star glints.
- Liquid Light has beat ripples and drifting droplets; Orbit Garden breathes more strongly; Prism Bloom has crisper opening facets; Afterglow Tunnel responds more clearly to bass.
- Flowing stars, grains and droplets use stable procedural positions, scaled density and audio-driven highlights. They do not require downloads or external assets.
- All 24 existing palettes have bolder, more saturated colours. Names and saved-look indexes are preserved.
- The silent demo uses a 128 BPM pattern to make the changes easy to explore. Real audio still supplies its own timing; the demo rhythm is never added to microphone or file input.
- The existing interface and audio-source controls remain familiar. Calm, reduced motion, low-power quality and visual pause remain available.
- Settings adds Beat impact, Melody detail, Flow speed, Particle amount and Colour intensity sliders (0–200%), with a reset for those five effects. They persist in named looks and exports. Older settings/looks receive 100% defaults; Version 1 safely ignores the additional fields if restored. Particle amount at zero hides the new decorative particles; colour at zero is monochrome.

No deployment or external audio processing is introduced.

## Version 3 — let the music lead

- Automatic coordinates a slow musical atmosphere with fast beat accents. It tours all eight scenes and palettes, waits during silence, pauses and editing, and respects the user's particle ceiling. Manual scene/palette selection holds the scene while keeping automatic effects available.
- One control area: Music source, Automatic, Scenes, Customise and Fullscreen; Hide interface is secondary. Start listening remains explicit. Customise leads with Intensity and explains Relaxed/Balanced/Energetic manual styles. Advanced controls are collapsible.
- Desktop panels leave a sharp preview alongside them; shorter phone sheets leave artwork visible. No background blur or panel transparency obscures adjustments.
- Sparse particles sit in scene-specific lanes and fade with audio energy. Glossy surface normals, soft highlights, bevels and layered shadows improve depth. Paper Waves stays matte. Reduced motion and high-intensity responses have explicit bounds.
- Existing particle preferences and looks migrate without being discarded. New looks remember Automatic/manual mode; old looks remain manual when opened. Device/accessibility preferences are not part of looks.
- Version 2 source and built app are separately preserved in `checkpoints/version-2/` (67 files). Version 1 remains untouched. Both can be checked with `node scripts/verify-checkpoint.mjs version-N`.
- The GitHub/Pages release overlay and hub preview are staged under `release/`, excluded from project version control until the selected release files are copied into an isolated publishing checkout. No live changes have been made.

## Version 4 — continuous sound, clearer controls

- Stable microphone and Automatic labels prevent the control row changing width with the audio. A light indicates incoming sound; the detailed source panel keeps its meter.
- Tour duration is visible beside the artwork and editable in Automatic and Scenes: 30 seconds, 1, 3 or 5 minutes, with at most two seconds of beat alignment. Opening a panel pauses the tour clock without stopping audio reaction; closing resumes the remaining duration.
- Drawing surfaces resize only when dimensions actually change; Auto quality increases only after sustained headroom. Beat analysis and atmosphere estimation never wait on each other.
- Spectrum Hall adds 32 independent logarithmic frequency bars with glossy shading/reflections. Live Wire draws the actual signed audio waveform. Both have three palettes, yielding ten scenes / 30 palettes.
- Focus trapping includes disclosure controls and excludes disabled/hidden controls. Scene navigation now uses the collection size.
- Version 3 was preserved before changes: checkpoints/version-3, 71 checksum-verified files. Versions 1 and 2 remain intact.

Rollback note: Version 4 adds two scene IDs that older builds cannot read. Before reverting, export the complete Version 4 collection. Keep that export intact and create a compatible copy excluding new-scene looks/favourites/palette entries and selecting an original scene; do not overwrite or discard the full export.
