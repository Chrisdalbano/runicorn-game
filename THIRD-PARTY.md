# Authoring and build tools

The standard game has no third-party runtime library. The separate Wavedash platform package uses the SDK injected by its host; it does not redistribute that SDK. Roadroller's generated decoder is released into the public domain by its author.

| Tool | Role | License |
| --- | --- | --- |
| LibreSprite 1.1 | Editable animation and sprite-sheet export | GPL-2.0; external tool, not distributed |
| esbuild | Bundling and CSS minification | MIT |
| Terser | JavaScript minification | BSD-2-Clause |
| Roadroller | Build-time code packing | MIT; generated decoder public domain |
| fflate | Build-time ZIP envelope and verification | MIT |
| @gfx/zopfli | Build-time standard DEFLATE compression | MIT binding; Zopfli Apache-2.0 |
| pngjs | Build-time exported sprite decoding | MIT |
| FontTools 4.61.1 | Original pixel font compilation | MIT |
| Brotli 1.2.0 | WOFF2 authoring compression | MIT |
| Playwright | Development browser testing | Apache-2.0 |

JavaScript dependencies and exact versions are in `package-lock.json`; optional font authoring dependencies are pinned in `scripts/requirements-art.txt`. Each installed package carries its own upstream license. No external game assets, franchise art, music recordings, or web fonts are embedded in the submitted file.

