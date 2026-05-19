# Generated battle backgrounds

Generated 2026-05-19 with Hermes image generation for Altarbound combat cards.

Purpose: Warcraft-inspired low-opacity battle-card backgrounds that sit behind the unit without stealing focus from sprite, HP bar, name, or level.

Assets:

- `barrens-card-bg.webp` / `.png`: arid savanna/red-mesa background, used for regular `battleType-battle`.
- `elwynn-card-bg.webp` / `.png`: lush green forest clearing, used for `battleType-training` and `battleType-tavern`.
- `undead-card-bg.webp` / `.png`: haunted purple/green ruins, used for `battleType-elite` and `battleType-boss`.

CSS applies the images with partial opacity via `.modelBattleCard::after`; the platform and unit are rendered above it.
