# Promotional artwork

These promotional illustrations are separate from gameplay screenshots and excluded from the competition ZIP.

| File | Format | Dimensions | Bytes | Maximum |
| --- | --- | --- | --- | --- |
| `listing-320.png` | Indexed PNG | 320 x 320 | 62,645 | 64,000 |
| `header-800.png` | Indexed PNG | 800 x 500 | 226,001 | 256,000 |

Both meet decimal KB limits. The full game title and rainbow enclosure remain visible at the intended display sizes.

## Export

FFmpeg 8.1.1 resized the artwork with Lanczos sampling and exported indexed PNGs. Palette limits: 64 colors for the listing and 96 for the header. Dithering is disabled and PNG compression is level 9. `manifest.json` records dimensions, byte counts and SHA-256 checksums.
