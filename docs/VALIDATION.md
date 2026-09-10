# Release validation

Validated locally on Windows with Node 22.19.0.

- Eight Node test groups pass, including 1,000 reproducible connected arenas, 1,000 mutation-generation sequences, audio clock/harmony, coalesced reward bursts, mute and background-stall recovery.
- The platform update adds five passing progress test groups (13 total): final-run parsing, eight achievement thresholds, higher account-record preservation, deduplication, failed reads, rejected/missing save acknowledgments and serialized rapid runs. Four packed platform scenarios cover success, read failure, save failure and stale responses; mobile end-panel bounds and the overlay button pass. The previous seven leaderboard scenarios still pass. Eight achievement definitions/icons and five stats were created through the CLI and remote achievement listing verified. Live signed-in gameplay persistence remains unverified.
- Chromium 153.0.8010.12 and Firefox 155.0 pass dialogue, movement, dash, pause, purification, upgrades, boss-victory transition, death and restart checks with zero uncaught page errors.
- A separate artifact runs the same release transforms with an instrumented probe. It applies all 11 mutations, then verifies shield charges, reduced dash cooldown, extended dash duration, and actual piercing/ricochet projectile properties.
- Story tests verify progressive text, oscillator blips, reveal-before-advance, the second wish, and Jacob's final wish. Wavedash tests cover success, missing SDK, false/throwing initialization, failed leaderboard lookup, failed score upload and a stale response after starting another run. These are local host mocks.
- NES menu checks pass on the packed artifact: keyboard confirmation, cyclic selection, a single visible cursor, and pause/title return. Three combined-upgrade rows with all six icons fit 320x568, 390x844 and 844x390 viewports.
- Icon checks confirm distinct mutation silhouettes, equipped Megacorn labeling, and live radio visibility. Mobile rows remain fully inside the portrait viewport.
- The packed production artifact executes offline in both browsers. Development hooks are absent from it. Its embedded pixel font loads without network requests.
- Packed title tests confirm centered naming, font loading, music after a real interaction in Chromium/Firefox, and title/button bounds at 320x568, 390x844 and 844x390.
- Touch emulation passes with portrait and landscape viewports. Portrait follows the player. Denied localStorage does not prevent play.
- Local stress sampling with eighteen enemies and an added trail load recorded approximately 16.6 ms median / 17.9 ms p95 animation-frame intervals in Chromium. Firefox sampling reported 6 ms median / 7 ms p95. These are headless desktop measurements, not phone-hardware performance guarantees.
- A scripted circular-steering playthrough exercises real loop closure without modifying health. It generates loops and kills, and can lose normally. Full campaign transition tests use development hooks; they do not prove balanced difficulty or a human-completed run.
- A 15.96-second gameplay audio capture measured -29.9 dB mean / -6.9 dB peak; a 9.96-second title capture measured -28.6 dB mean / -7.2 dB peak with FFmpeg volumedetect. Neither sample clipped; these samples do not exhaust every combat combination.
- Actual screenshots and a short input-driven gameplay recording are included in `promo/`. Promotional illustrations are separate from gameplay screenshots.
- Two consecutive production builds produced identical ZIP bytes and SHA-256 after fixing a packer API quirk: `optimize(0)` still runs an optimization search, so fixed-parameter builds skip that call entirely.

Real device playtests, player feedback, competition form submission and Wavedash challenge verification are not claimed by these checks. `dist/size.json` is the authoritative size and checksum record.
