# Small systems behind Runicorn

## Reproducibility

A 32-bit seed drives a Mulberry32 PRNG. Map layouts use a separate stream derived from seed and district, so art generation cannot change the gameplay layout. Enemy spawns, pickups, and mutation rolls share the gameplay stream. Cosmetic particles and audio noise are intentionally non-deterministic. This is reproducible generation, not a cross-device replay format.

## Navigable ruined arenas

Each district samples six to eight separated city lots. Lot positions have seeded jitter; obstacles vary in width, height, and type. Even at maximum dimensions and jitter, neighboring lots retain at least 56 horizontal or 36 vertical units of street clearance. A central rectangle stays empty for the relay.

This leaves connected streets by construction, without a runtime flood fill or retry loop. Tests independently flood-fill 1,000 generated layouts with actor clearance. Moving enemies and temporary corrupted trails can still close routes during play. Pickups spawn with collision clearance and expire.

## Rainbow loops

The trail records points at three-unit intervals and expires after 5.5 seconds, extended by trail mutations. The new player segment is tested against older segments, excluding the twelve most recent samples to prevent accidental closure immediately behind the player. Segment intersection and a small proximity allowance make touch steering forgiving.

A closed polyline becomes a polygon. Polygons below 110 square units do not purify. An even/odd ray test finds enclosed enemy centers. The same test clears corrupted trail samples inside the loop. A loop deals three damage to the Warden and lethal damage to ordinary enemies. The consumed trail cannot reward the player repeatedly. An empty loop still displays feedback but awards no score or charge.

Self-intersecting loops use even/odd fill semantics. Trails are temporary local geometry; this is not a persistent territory simulator.

## Enemy steering

Every 160-280 ms, an enemy evaluates seven candidate directions around its current heading. Scores favor its target heading, penalize predicted wall collisions, avoid nearby rainbow samples, and discourage crowding. A 24-unit spatial hash indexes rainbow points; a 32-unit hash indexes enemies.

Pursuers target the current player position. Flankers target a point 45 units ahead of the player. Chargers stop, display their intended charge line, then commit at higher speed with reduced steering. Enemy steering uses visible current state and fixed anticipation, not future input or machine learning. It can be baited.

## Generated mutations

The generator first filters capped upgrades and unmet prerequisites. Weighted sampling without replacement produces three distinct primary offers. Megacorn is guaranteed while unequipped. Later districts have a 45% chance per offer to attach a secondary mutation chosen from compatible, uncapped effects. A blaster mutation can pair with Megacorn because the primary effect supplies its prerequisite.

Every generated offer displays both effects. Selecting an offer applies both, including recovery or shield side effects. Names and effect combinations are finite and authored; no network or generative model is used during play. Random combinations do not introduce uncapped stats.

## Timing, memory and safety

The simulation uses 60 Hz steps with a capped accumulator contribution after stalls. Player movement is swept in at most three-unit increments, including during dashes. Projectiles step twice per tick. Particles are capped at 320; blood marks at 40; enemies at 18; trails and pickups expire. Pausing and leaving the tab freeze gameplay.

Roadroller's decoder is a startup cost, not a per-frame game dependency. Its memory budget is capped by the build configuration. The submitted file remains playable offline after extraction.

## Pixel interface and audio

The UI uses an original 5x7 alphabet. Shared row components, unused-glyph removal and an empty fallback glyph keep the embedded WOFF2 font to 732 bytes. Component grid rounding is disabled to keep adjoining rows continuous at fractional display sizes. The logo, HUD, radio dialogue, and weapon rows use the same font. Item silhouettes are 8x8 masks, cached on 12x12 canvases with highlights and shadows; the same masks appear in pickups and the equipment strip.

The synth schedules a 148 BPM, four-bar electro-rock loop ahead of the audio clock. Filtered saw bass, sine sub, drums, power chords and arpeggios share the master bus. Each loop closure advances a phrase index and adds sixteen sixteenth-note steps of melody, capped at thirty-two. Kills add two steps; pickups add four. Loop chords, pickup arpeggios, dash sweeps and blaster notes use the next unscheduled sixteenth note and current bar root. A bit mask coalesces simultaneous rewards. Impact noise stays immediate. The title plays a repeating lead; gameplay adds syncopated power chords and earns its lead through actions.

Dialogue reveals thirty-two characters per second, sounding a short square-wave blip for each new non-space character. Continue completes a line before advancing; Skip ends the sequence. Shared pixel drawing code and sprites illustrate the first, second and final wishes.

Live radio messages appear at 12 and 29 seconds of each district. Stage portraits pause play; short live messages do not.

Menu focus is also the selection state. The keyboard handler cycles through visible menu commands and confirms the focused command; pointer movement updates that same focus. This prevents simultaneous hover and keyboard cursors. Menu input does not populate held movement keys. A small original SVG supplies the window border and blue tile pattern.

## Release transforms

UI and environment colors use compact hexadecimal palettes; unused sprite palette entries are stripped at export.

The packer shortens DOM names with a checked unique mapping and maps the eleven mutation identifiers consistently in definitions, references, and string keys. Terser reserves those identifiers. Prose is normalized to capitals, matching the original font's lowercase mapping; canvas font declarations stay unchanged. `--verify` builds a separate instrumented artifact through these same transforms. Browser checks apply every mutation and verify shielding, recharge, dash duration, piercing, and ricochet on the actual game functions. Instrumentation is absent from the submitted ZIP.

The HTML envelope omits optional head tags and trims surrounding whitespace. Browser parsing creates the head element; offline release tests cover the resulting document.

Version 1.4 raises player speed from 92 to 100 units/s, dash from 275 to 300, steering from 6.8 to 7.4 radians/s, and shots from 230 to 250 units/s. Enemy movement increases by roughly 9%; their warning time remains unchanged. The fixed simulation step and swept wall checks are retained.
