# Release record

## Loop Encore / v1.5.0 / September 10, 2026

The original game is shipped on both platforms, confirmed by Christian. This section supersedes the September 8 notes below.

- Competition ZIP: `dist/runicorn.zip`, one root `index.html`, **13,290 / 13,312 bytes**, 22 bytes spare.
- SHA-256: `aa21031e95971416778d3dac644788192f1fe3c29fdd68b296ea836764f99c5f`.
- Separate Wavedash SDK wrapper: `release/wavedash-platform.zip`, **15,904 bytes**. No size exception is claimed for the wrapper.
- Published Wavedash build: `mn769k2n3yhnyy3m83cgg1ehcd8e44es`.
- Release: `rx77n9bce9s9qqvhm9reb9e2qn8e5f2h`.
- [Public game](https://wavedash.com/games/runicorn-zombie-apocalypse).
- [Build playtest](https://wavedash.com/playtest/runicorn-zombie-apocalypse/19a33445-6569-44f8-93fa-2033c4cc50b9).
- [js13k review branch](https://github.com/Chrisdalbano/runicorn-game/tree/loop-encore).

The replacement `.website/game.zip` and description are committed and pushed. GitHub rejected PR creation with `Resource not accessible by personal access token (createPullRequest)`. No signed-in browser is connected. The competition version remains unchanged until a PR is created and merged. Prepared PR text is in `docs/JS13K-UPDATE.md`.

Loop rewards now have immediate impact, three changing beat-synced phrases, echoes and more notes for larger catches. Narration has soft chords and melody. Gameplay adds directional Megacorn fire, Requiem dash shots, rare Nyan flight, Green Herb healing, a stronger Warden second phase and a 1.8-second death scene marking its cause. Touch layouts fill the viewport. Background detail, rain, shadows and decorative frames were simplified to fund the audio and gameplay within the byte cap.

Verification passed: 14 unit tests; Chromium 153 and Firefox 155 source/packed/offline flows; keyboard menus, audio unlock and fonts; touch emulation at 320x568, 390x844 and 844x390; directional fire, independent Requiem cooldown, healing limits, Nyan speed, Warden HP and delayed death. All Wavedash local host/failure/achievement/save suites passed.

The captured `promo/loop-encore.webm` sample includes menu, lore and six loop rewards, peaking at -3.34 dBFS with no nonfinite samples. Load sample: Chromium median 16.5 ms, p95 17.9 ms; Firefox median 6 ms, p95 7 ms. These samples are not exhaustive performance/audio guarantees. Touch emulation is not physical-phone testing. Real signed-in host persistence was not reverified; the CLI confirmed publication and local host mocks passed.

## Historical checklist / September 8

The source push also passed the GitHub Actions build. Its optional Pages deployment returned 404 because Pages is not enabled. Deployment is now explicitly opt-in through `ENABLE_PAGES`; this does not affect Wavedash or the competition package.

## Deliverables

- `dist/runicorn.zip`: competition package, one root `index.html`.
- `dist/size.json`: byte count and SHA-256. Version 1.4.0 is 13,311 bytes, one byte below the 13,312-byte cap.
- `release/wavedash-platform.zip`: larger platform package, excluded from the standard entry.
- Public readable source repository with lockfile and build instructions.
- `promo/listing-320.png`: listing artwork, exactly 320 x 320 PNG, 62,645 bytes (below 64,000).
- `promo/header-800.png`: matching header, exactly 800 x 500 PNG, 226,001 bytes (below 256,000).
- `promo/logo.svg`: original pixel wordmark.
- `promo/gameplay.png`, `promo/dialog.png`, `promo/title.png`: actual game captures.
- `promo/gameplay.webm`: short gameplay recording.
- `promo/electro-preview.webm`, `promo/menu-electro.webm`: captured gameplay soundtrack/effects and title music.

## Competition

Public repository creation was attempted and rejected by GitHub with `Resource not accessible by personal access token (createRepository)`. The readable source is committed locally; the release includes a source archive. Public publishing is pending repository-creation access.

The provided saved rules specify 13,312 bytes maximum, no external runtime resources, readable GitHub source, and playable Chrome and Firefox builds. The stated deadline is September 13, 2026 at 13:00 CEST (07:00 Eastern).

Intended categories: Desktop and Mobile. No WebXR or Online category claim.

The source and package must be entered into the js13kGames submission form. Creating this release does not itself submit it to the competition. Account-side declarations and the final entry are pending.

## Wavedash

Uploaded September 8, 2026 to the chrisdalbano team. Current build ID: `mn71mhkzg3vgzm11a1mpaxda298e3jev`. [Playtest](https://wavedash.com/playtest/runicorn-zombie-apocalypse/ea255320-acab-4b32-8d93-59e4f28bfadb). Eight achievements with icons and five stats are configured remotely; the updated adapter also provides pause-overlay access. This is an uploaded build, not a public release. Store artwork/description, signed-in host validation and publication remain pending. The available CLI supports upload but does not expose store-image editing; the connected browser inventory was empty. Prepared copy is in `docs/STORE-DESCRIPTION.md`.

The live [Wavedash challenge page](https://js13kgames.com/2026/wavedash), read September 8, requires deployment and publication. Its extension through September 20 is only for those steps, not new features or bugfixing. This release includes separate host-SDK integration, tested locally with mocks, but no verified host publication or challenge submission. The 15,936-byte platform package requires a confirmed applicable wrapper exception or further reduction; the page does not explicitly grant extra adapter bytes. See [the platform build instructions](docs/WAVEDASH.md).

Before entering, verify that challenge's current rules, publishing requirements, deadline, and any SDK exception. Use this offline build as the baseline. Keep platform-specific integrations separate from the general-ranking package unless expressly permitted by competition rules.

## Verification record

Run `npm test`, `npm run build`, `npm run test:browser`, `npm run test:menus`, and `npm run test:story`. Browser results are written to `test-results/report.json`. Automated checks include generated arenas, upgrade compatibility, loop geometry, controls, transitions, pixel fonts and item icons, radio messages, packed mutation behavior, offline execution, touch emulation, and denied storage. Real phone hardware and a user playtest remain useful checks; emulation is not hardware testing.
