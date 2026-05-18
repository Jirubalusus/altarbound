# Warcraft III asset drop folder

This folder is the local/private seam for Warcraft III assets supplied from a legitimate source.

## Telegram upload workaround

Telegram/Hermes does not accept raw `.blp` as a document type here. Zip the `.blp` files first, or copy them directly into the project from Windows.

Suggested local source folder:

```txt
raw-war3-blp/
```

Then run:

```bash
python3 scripts/import-blp-assets.py --src raw-war3-blp --dest public/war3-assets/portraits
```

The app will automatically try PNG portraits from:

```txt
public/war3-assets/portraits/<unit_or_hero_id>.png
```

Examples:

```txt
public/war3-assets/portraits/footman.png
public/war3-assets/portraits/grunt.png
public/war3-assets/portraits/archer.png
public/war3-assets/portraits/ghoul.png
public/war3-assets/portraits/paladin.png
public/war3-assets/portraits/archmage.png
```

## Important

Do not commit or publish protected Blizzard assets unless you have permission/license to redistribute them. Generated `.png` files in this folder are ignored by git by default.
