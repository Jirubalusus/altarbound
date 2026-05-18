#!/usr/bin/env python3
"""
Convert local Warcraft III .blp assets to PNG names used by Altarbound.

Usage:
  python3 scripts/import-blp-assets.py --src ./raw-war3-blp --dest ./public/war3-assets/portraits

Notes:
- This script does not download any copyrighted assets.
- Put your legally-owned/exported .blp files in --src, or pass a folder extracted from your local Warcraft III install.
- Converted PNG files are ignored by git by default so they are not accidentally published.
"""
from __future__ import annotations

import argparse
import re
import shutil
import subprocess
import sys
from pathlib import Path

try:
    from PIL import Image
except Exception:
    print("Pillow is required for BLP support. Installing it for this Python user...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "--user", "Pillow"])
    from PIL import Image

ALIASES = {
    # Units
    "footman": "footman",
    "captainfootman": "captain_footman",
    "rifleman": "rifleman",
    "priest": "priest",
    "knight": "knight",
    "gryphonrider": "gryphon",
    "grunt": "grunt",
    "headhunter": "headhunter",
    "berserker": "berserker",
    "shaman": "shaman",
    "raider": "raider",
    "tauren": "tauren",
    "archer": "archer",
    "huntress": "huntress",
    "dryad": "dryad",
    "druidoftheclaw": "druid_claw",
    "chimaera": "chimaera",
    "ghoul": "ghoul",
    "cryptfiend": "crypt_fiend",
    "necromancer": "necromancer",
    "abomination": "abomination",
    "frostwyrm": "frost_wyrm",
    # Heroes
    "paladin": "paladin",
    "archmage": "archmage",
    "mountainking": "mountain_king",
    "bloodmage": "blood_mage",
    "blademaster": "blademaster",
    "farseer": "far_seer",
    "taurenchieftain": "tauren_chief",
    "shadowhunter": "shadow_hunter",
    "demonhunter": "demon_hunter",
    "keeperofthegrove": "keeper",
    "priestessofthemoon": "priestess",
    "warden": "warden",
    "deathknight": "death_knight",
    "dreadlord": "dreadlord",
    "lich": "lich",
    "cryptlord": "crypt_lord",
    "seawitch": "naga",
    "pandarenbrewmaster": "panda",
    "beastmaster": "beastmaster",
    "darkranger": "dark_ranger",
}


def normalize(stem: str) -> str:
    s = stem.lower()
    # Strip common Warcraft III icon prefixes/suffixes: BTNFootman, DISBTNFootman, PASBTN..., etc.
    s = re.sub(r"^(dis|pas|autocast|upgrade)?btn", "", s)
    s = re.sub(r"[^a-z0-9]+", "", s)
    return s


def target_name(path: Path) -> str | None:
    key = normalize(path.stem)
    if key in ALIASES:
        return ALIASES[key]
    # fallback: include unknown files with safe normalized names, useful for manual matching later
    return re.sub(r"[^a-z0-9_]+", "_", path.stem.lower()).strip("_") or None


def convert_one(src: Path, dest_dir: Path) -> bool:
    name = target_name(src)
    if not name:
        return False
    dest = dest_dir / f"{name}.png"
    try:
        with Image.open(src) as im:
            im = im.convert("RGBA")
            dest.parent.mkdir(parents=True, exist_ok=True)
            im.save(dest)
        print(f"OK  {src.name} -> {dest.relative_to(Path.cwd()) if dest.is_relative_to(Path.cwd()) else dest}")
        return True
    except Exception as exc:
        print(f"ERR {src}: {exc}")
        return False


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--src", required=True, help="Folder containing .blp files")
    parser.add_argument("--dest", default="public/war3-assets/portraits", help="Output folder for PNG files")
    parser.add_argument("--copy-readme", action="store_true", help="Copy README next to generated PNGs")
    args = parser.parse_args()

    src = Path(args.src).expanduser().resolve()
    dest = Path(args.dest).expanduser().resolve()
    if not src.exists():
        print(f"Source folder does not exist: {src}", file=sys.stderr)
        return 2

    blps = sorted(src.rglob("*.blp")) + sorted(src.rglob("*.BLP"))
    if not blps:
        print(f"No .blp files found in {src}")
        return 1

    ok = sum(convert_one(p, dest) for p in blps)
    print(f"Converted {ok}/{len(blps)} files into {dest}")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
