Megacorn automatically targeted the nearest enemy, making runs too easy. This update makes it fire forward with a slower base cadence and shorter range, so steering controls the aim.

Loop closures now produce an immediate impact followed by one of three beat-synced arpeggio phrases with echoes. Larger catches extend the phrase. The update also adds Requiem dash shots, rare Nyan-Unicorn flight and music, Green Herb healing, a tougher Warden second phase, a 1.8-second death scene showing the cause, narration music, and full-viewport touch layouts.

The replacement `.website/game.zip` contains one offline `index.html`: **13,290 / 13,312 bytes**. SHA-256: `aa21031e95971416778d3dac644788192f1fe3c29fdd68b296ea836764f99c5f`.

Validation: 14 unit tests; Chromium and Firefox packed/offline play, keyboard menus and audio unlock; touch layouts at 320x568, 390x844 and 844x390; directional fire, independent Requiem cooldown, healing limits and delayed death tests. A captured loop-reward audio sample peaked at -3.34 dBFS. Background details were simplified to preserve the new audio within the size cap.

Readable source and build instructions: https://github.com/Chrisdalbano/runicorn-game

Wavedash's separate SDK build is excluded from this competition ZIP. This PR is submitted for maintainer review as advised in the community discussion.
