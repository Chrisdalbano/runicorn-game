# NES menu reference and implementation

Research checked September 8, 2026.

## References

- [Nintendo-hosted Mega Man 2 instruction manual](https://www.nintendo.co.jp/clv/manuals/en/pdf/CLV-P-NABBE.pdf), printed pages 4-7: Start opens the weapon screen; Up/Down selects; Start returns to play. Weapon information uses concise labels and energy meters.
- [Mega Man 2 equipment screen in RetroGame Man's review](https://retrogameman.com/2018/07/13/nes-review-mega-man-2/): black inset panels, thick pale pixel borders, a repeating blue tile field, a sprite beside text, and plain text menu commands.

The adaptation uses the reference's structure and interaction. It does not reproduce Capcom artwork or fonts. Downloaded reference material stays in ignored local test files.

## Runicorn's menu rules

- A single original SVG pixel frame supplies the stepped cyan window corners and dark tiled surround. The structure comes from the NES reference; the charcoal/cyan palette belongs to Runicorn. It is embedded inside the offline game.
- Weapons occupy contiguous rows with framed primary and secondary icons. Both effects remain readable before selection. There are no floating cards or hover lifts.
- One yellow pixel cursor identifies the active command. Arrow keys wrap through choices; Enter or Space confirms. Pointer movement selects the row under it; clicking or tapping equips it. The existing 1/2/3 shortcuts still work.
- Opening a menu focuses its first command. Pause and game-over screens expose Continue and Title. Returning to the title clears the pause overlay.
- Commands use text and a cursor, without filled call-to-action rectangles. Focus makes a short synth blip after audio has been enabled. Reduced-motion mode keeps the cursor steady.
- The centered title screen uses a bold rainbow-edged Runicorn wordmark, the full Zombie Apocalypse subtitle, an animated unicorn mural and a framed Press Start panel.
- Dialogs retain the pixel-story scenes and letter sounds, with black inset panels and framed portraits. The touch controls use square hardware-style borders.

The original font is now 732 bytes after removing unused glyphs and scanline components. The Last Wish is the story arc, not the game title. Version 1.4 increases movement speeds and adds a shared musical clock; see ALGORITHMS.md.

## Checks

`npm run test:menus` checks the packed keyboard controls in Chromium and Firefox, one active cursor, wraparound, correct equipment selection, pause/title and game-over/title transitions, and three simultaneous combined upgrades at 320x568, 390x844 and 844x390. Tests use actual seeded offers, including both icons and full descriptions. `npm run test:browser` covers the existing game flow and offline build; `npm run test:story` covers narration and the Wavedash adapter.
