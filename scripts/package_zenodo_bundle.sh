#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="$(ROOT="$ROOT" python3 - <<'PY'
import json
import os
from pathlib import Path
root = Path(os.environ["ROOT"])
print(json.loads((root / ".zenodo.json").read_text(encoding="utf-8"))["version"])
PY
)"

OUT_DIR="$ROOT/dist/zenodo"
STAGE_DIR="$OUT_DIR/dreams_zenodo_v${VERSION}"
TAR_PATH="$OUT_DIR/dreams_zenodo_v${VERSION}.tar.gz"
ZIP_PATH="$OUT_DIR/dreams_zenodo_v${VERSION}.zip"

rm -rf "$STAGE_DIR"
mkdir -p "$STAGE_DIR" "$OUT_DIR"

cp -R "$ROOT/papers" "$STAGE_DIR/"
cp -R "$ROOT/results" "$STAGE_DIR/"
cp "$ROOT/CITATION.cff" "$STAGE_DIR/"
cp "$ROOT/.zenodo.json" "$STAGE_DIR/"
cp "$ROOT/README_ZENODO.md" "$STAGE_DIR/"

rm -f "$TAR_PATH" "$ZIP_PATH"
tar -czf "$TAR_PATH" -C "$OUT_DIR" "$(basename "$STAGE_DIR")"
(
  cd "$OUT_DIR"
  zip -rq "$(basename "$ZIP_PATH")" "$(basename "$STAGE_DIR")"
)

echo "Created:"
echo "  $TAR_PATH"
echo "  $ZIP_PATH"
