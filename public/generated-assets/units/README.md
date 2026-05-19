# Generated unit models

Generated unit cutouts for Altarbound combat/model slots. These are original fantasy orc designs inspired by early-2000s RTS readability, not official Warcraft III assets.

## `orc-grunt-facing-right-3d-model.*`

Generated with Hermes image generation on 2026-05-19 using `gpt-image-2-high`.

Purpose: the active combat/map full-body model for Orc Grunt and Grunt Veteran.

Notes:
- Prompt requested a semi-3D/full-body orc infantry model facing **right**, so allied units on the left look toward enemies on the right.
- Original generated source: `orc-grunt-facing-right-3d-model-source.png`
- Background was removed with edge-connected checkerboard cleanup plus light neutral pixel cleanup.
- Runtime asset: `orc-grunt-facing-right-3d-model.webp`
- Full PNG cutout: `orc-grunt-facing-right-3d-model.png`

## `orc-grunt-generated-model.*`

Previous generated Grunt cutout kept for comparison/history. It was replaced because its pose did not read as clearly facing the enemy and looked too static/portrait-like in combat.

## `elf-archer-facing-right-3d-model.*`

Generated with Hermes image generation on 2026-05-19 using `gpt-image-2-high`.

Purpose: full-body model override for Archer-style units so common enemies do not appear as face icons in combat.

Notes:
- Prompt requested a semi-3D/full-body fantasy elf archer facing **right**; enemy-side CSS mirrors it to face left.
- Original generated source: `elf-archer-facing-right-3d-model-source.png`
- Runtime asset: `elf-archer-facing-right-3d-model.webp`
- Full PNG cutout: `elf-archer-facing-right-3d-model.png`

## `human-footman-facing-right-3d-model.*`

Generated with Hermes image generation on 2026-05-19 using `gpt-image-2-high`. Used as a race-level human unit fallback so combat does not fall back to face icons.

## `undead-ghoul-facing-right-3d-model.*`

Generated with Hermes image generation on 2026-05-19 using `gpt-image-2-high`. Used as a race-level undead unit fallback so combat does not fall back to face icons.

## `orc-grunt-pokemon-style-facing-right.*`

Generated with Hermes image generation on 2026-05-19 using `gpt-image-2-high` for the current Grunt iteration.

Purpose: smaller Pokémon-like/pixel-chibi Grunt prototype, replacing the more realistic semi-3D Grunt while we iterate only this unit before replicating the style.

Notes:
- Facing **right** for ally side; enemy side is mirrored in CSS.
- Runtime asset: `orc-grunt-pokemon-style-facing-right.webp`
- Full PNG cutout: `orc-grunt-pokemon-style-facing-right.png`
- Source: `orc-grunt-pokemon-style-facing-right-source.png`
