# Wavedash platform build

## Current release: Loop Encore / v1.5.0

Published September 10, 2026. Build `mn769k2n3yhnyy3m83cgg1ehcd8e44es`, release `rx77n9bce9s9qqvhm9reb9e2qn8e5f2h`. [Play Runicorn](https://wavedash.com/games/runicorn-zombie-apocalypse).

The wrapper is 15,904 bytes; the standalone competition ZIP is 13,290 bytes. All local host mock suites passed. See [the release record](../SUBMISSION.md) for verification and js13k review status. The September 8 setup/upload details below are historical; publication-pending statements are superseded by this release.

The standard competition ZIP is self-contained. A separate platform package uses the SDK provided by Wavedash's host page.

```sh
npm run build
npm run build:wavedash
npm run dev
# In a second terminal:
npm run test:story
```

Upload `release/wavedash-platform.zip` to Wavedash. Its root is `index.html`. This larger package is **not** the standard js13k ZIP; do not substitute it in the competition form without an explicit applicable rules exception. `dist/runicorn.zip` remains the offline entry.

## Integration

The adapter calls `window.Wavedash.init()` once, after the packed game has installed its UI. It resolves or creates the `runicorn-chroma` numeric leaderboard in descending order, then uploads completed-run scores with `keepBest: true`. The end panel reports the player's best rank. It sends no custom personal data. Scores are client-side and are not cheat-resistant.

The game continues when the SDK is absent, initialization fails, the leaderboard is unavailable, or a score upload fails. Asynchronous rank results cannot overwrite the next run's UI. The platform package contains only our adapter, not a bundled copy of Wavedash's SDK.

### Achievements and personal records

Eight achievement definitions, with original pixel icons, and five stats were created in the real project with CLI 0.1.95. `docs/wavedash-resources.json` records the creation receipts; `docs/wavedash-achievements.json` is the verified remote list. `src/wavedash-catalog.js` defines the identifiers and thresholds shared by provisioning and runtime.

| Achievement | Completed-run milestone |
| --- | --- |
| Color Outside the Grave | Close one rainbow loop |
| Loop Artist | Close ten loops in one run |
| Still Magical | Purify one zombie unicorn |
| Herd Control | Purify fifty in one run |
| Chroma Overdrive | Score at least 5,000 Chroma |
| The Last of Herd | Reach district three |
| Knock on the Dead | Reach district five |
| One Last Wish | Rescue Jacob and restore the world |

Milestones are evaluated on the final defeat/victory panel. Abandoning a run through Title does not submit it. Stats preserve the highest Chroma, most purifications, most loops, furthest district and whether the world was restored. `requestStats()` loads account progress before `getStat()`/`getAchievement()` checks; `setStat()` and `setAchievement()` batch changes, and `storeStats()` requests a flush. Only a successful `STATS_STORED` event produces the synced message. A scheduling boolean is not a persistence acknowledgment. Failed or timed-out writes leave the status unavailable; optimistic SDK cache values cannot later produce a false success in that session.

The Wavedash pause menu adds `toggleOverlay()` access with the existing pixel font, cursor and touch-button styling. Leaderboard failures and progress failures are independent. This is account progress, not a mid-run cloud-save/checkpoint system; multiplayer, WebXR and paid features are not implemented.

Reproduce setup with `npm run wavedash:icons` while the local server is running, then `npm run wavedash:provision -- --apply`. Provisioning explicitly targets this game's ID and records each creation before continuing. Review the receipt before using it against another account. Validate with `npm test`, `npm run test:wavedash` and `npm run test:story` after `npm run build:wavedash`.

Official API references, checked September 8, 2026:

- [SDK setup](https://docs.wavedash.com/sdk/setup): injected host SDK and required initialization.
- [Leaderboards](https://docs.wavedash.com/sdk/leaderboards): name-to-ID lookup, numeric descending order, best-score uploads and visibility.
- [Publishing](https://docs.wavedash.com/publishing/publish): account and game publishing workflow.

## Uploaded build

Uploaded on September 8, 2026 with the official Wavedash CLI 0.1.95. The downloaded CLI archive was checked against its published SHA-256 before use. Existing CLI authentication was used without copying credentials.

- Team: `chrisdalbano` (`jd7atyzp1q129eykdxqcpjjeh985kww0`).
- Game: `j970hj6zbxbbfjqw6b5bfyb9vs8e3sag`.
- Current build: `mn71mhkzg3vgzm11a1mpaxda298e3jev`, v1.4.0 gameplay plus achievements/stats/overlay adapter.
- Previous build: `mn7f9cxwezmfvf6sn6z8tqkcsx8e21ec`, based on game commit `1c3eda1`.
- [Developer portal](https://wavedash.com/dev-portal/chrisdalbano12/runicorn-zombie-apocalypse).
- [Uploaded playtest](https://wavedash.com/playtest/runicorn-zombie-apocalypse/ea255320-acab-4b32-8d93-59e4f28bfadb).
- Configuration: `wavedash.toml`; upload directory `release/wavedash`, entry point `index.html`.

The CLI confirmed successful upload. A clean-browser visit reached the Wavedash sign-in page, so it did not validate the game or leaderboard. No public publication was performed. There is no connected signed-in browser in this session, and the documented CLI does not expose store metadata/image editing.

The official `wavedash dev --no-open` host was also attempted. It redirected to the development sign-in page; selecting Continue as guest did not reach the game. No real-host achievement persistence is claimed from that attempt. All local mock checks passed, including event-confirmed saves, rejected/missing save confirmations, existing higher records, duplicate submissions, queued runs, stale UI responses and mobile overlay access. The eight remote achievement definitions and five stat creation receipts are real account-side setup, independently of gameplay mock tests.

## Still required for a challenge entry

Add `promo/listing-320.png` as square cover art and the prepared `docs/STORE-DESCRIPTION.md` copy in the portal. Use actual `promo/gameplay.png`, `promo/upgrades.png` and `promo/pause.png` as screenshots. `promo/header-800.png` is the separate 800 x 500 game-page header requested for submission. Play once as a signed-in team member to create the leaderboard with public visibility. Check score submission/rank in a fresh player session before publishing.

The live [2026 challenge page](https://js13kgames.com/2026/wavedash) was successfully read through browser rendering on September 8. It requires deploying and publishing the game on Wavedash. The three prizes total $1,500 in cash and platform credit; participants meeting all requirements and publishing receive $10 credit. SDK call count is not a listed requirement. The publishing extension runs through September 20 and explicitly excludes new features and bugfixing; the exact cutoff time is not stated.

The platform package is currently 15,936 bytes. The challenge page does not explicitly waive the 13 KB limit for adapter code. Before claiming eligibility, either reduce the applicable package below the limit or obtain an explicit applicable wrapper exception. Keep the standard 13,311-byte offline package as the competition artifact. Local SDK tests are not real-host verification, challenge enrollment or publication.
