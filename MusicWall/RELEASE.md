# Finger Games release

Publication approved on 9 October 2026. Deployment is handled by the existing repository's [GitHub Pages workflow](https://github.com/andyclifton-stack/FingerOfShame/actions/workflows/deploy.yml); that page records the outcome of each release.

The existing hub repository is `https://github.com/andyclifton-stack/FingerOfShame`, default branch `master`, with workflow-based GitHub Pages. Its public hub is `https://fingergame.co.uk/FingerOfShame/`; the domain root redirects there. These details were checked against GitHub and the public site on 9 October 2026.

Music Wall's release URL is `https://fingergame.co.uk/FingerOfShame/MusicWall/`. The manifest, asset paths and service-worker scope are relative, so the app is isolated to its subdirectory.

## Development workspace preparation

The following staging paths and helper scripts belong to the original development workspace; they are not included in the public MusicWall source folder.

- `release/repository/MusicWall/`: source, lockfile, tests and public assets, ready to add to the existing repository. Personal brief, version checkpoints, audio selections, settings and screenshots are excluded.
- `release/repository/hub.js`: one additive Music Wall app entry using the existing hub design.
- `release/repository/index.html`: only the hub-script cache version changes.
- `release/repository/.github/workflows/deploy.yml`: adds a Node 24 Music Wall test/build after existing apps build, excludes its source directory from public assembly, then copies only its built output to the site. Existing apps retain their own setup/build steps.
- `release/manifest.json`: source reference commit and SHA-256 hashes of the proposed overlay.
- `release/hub-preview/`: local preview of the proposed hub navigation and nested-path production app. Other app bundles are deliberately not copied; their local preview links are not release tests of those apps.

Rebuild with `npm run build`, then `node scripts/prepare-release.mjs`. The staging script uses read-only reference copies under `release/reference/`; refresh them from GitHub and review changes if the hub has moved on. Start the nested-path preview with `node scripts/serve-release.mjs` at `http://127.0.0.1:4174/FingerOfShame/`.

## Publication process

The existing `C:\Projects\Fingergames\FingerOfShame` checkout has unrelated uncommitted work. Do not copy over it, stage it wholesale, reset it or publish its current working tree. Use a fresh isolated checkout of the latest remote `master`, compare it with the recorded reference commit, and apply only the Music Wall overlay after reviewing the diffs. Refresh/reconcile the hub entry and workflow if either changed upstream.

Run Music Wall tests/build and the existing hub's applicable checks. Commit only the reviewed Music Wall source, hub entry, index cache version and workflow change. Publishing a push to `master` triggers the live Pages workflow. Verify workflow completion, hub search/Apps entry, nested app URL, cache scope, reload/offline operation, and preservation of existing hub links after publication.

Local storage belongs to the origin. Looks saved on localhost do not automatically appear on fingergame.co.uk: export them from Customise before moving and import them on the live app.

Physical Samsung installation/microphone and connected-TV checks remain separate from browser viewport and synthetic audio tests. HTTPS publication enables phone installation but does not itself certify those device behaviours.
