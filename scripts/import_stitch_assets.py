#!/usr/bin/env python3

from __future__ import annotations

import argparse
import sys
import zipfile
from pathlib import Path

ASSET_MAPPING = {
    'minimalist_shield_icon': 'logo-852.png',
    'minimalist_ai_assistant_avatar': 'agent-avatar.png',
    'dark_professional_banner': 'og-banner.png',
    'subtle_dark_geometric_grid_pattern': 'bg-pattern.png',
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description='Import selected Google Stitch assets into public/brand with stable short filenames.'
    )
    parser.add_argument('zip_path', help='Absolute or relative path to the Google Stitch ZIP file.')
    parser.add_argument(
        '--output-dir',
        default=None,
        help='Destination directory. Defaults to <repo>/public/brand.',
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    repo_root = Path(__file__).resolve().parent.parent
    zip_path = Path(args.zip_path).expanduser().resolve()
    output_dir = Path(args.output_dir).expanduser().resolve() if args.output_dir else repo_root / 'public' / 'brand'

    if not zip_path.exists():
        print(f'ZIP not found: {zip_path}', file=sys.stderr)
        return 1

    output_dir.mkdir(parents=True, exist_ok=True)
    copied: dict[str, Path] = {}

    with zipfile.ZipFile(zip_path) as archive:
        zip_names = archive.namelist()

        for key, target_name in ASSET_MAPPING.items():
            source_name = next((name for name in zip_names if key in name and name.endswith('/screen.png')), None)
            if not source_name:
                print(f'Missing expected Stitch asset: {key}', file=sys.stderr)
                return 1

            target_path = output_dir / target_name
            with archive.open(source_name) as source, target_path.open('wb') as target:
                target.write(source.read())
            copied[target_name] = target_path

    print('Imported Stitch assets:')
    for name, path in copied.items():
        print(f'- {name} -> {path}')

    return 0


if __name__ == '__main__':
    raise SystemExit(main())
