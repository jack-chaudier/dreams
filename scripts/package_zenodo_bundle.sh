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
PAPERS_ROOT="$ROOT/papers"
RESULTS_ROOT="$ROOT/results"

rm -rf "$STAGE_DIR"
mkdir -p "$STAGE_DIR" "$OUT_DIR"

cp "$ROOT/CITATION.cff" "$STAGE_DIR/"
cp "$ROOT/.zenodo.json" "$STAGE_DIR/"
cp "$ROOT/README_ZENODO.md" "$STAGE_DIR/"
cp "$ROOT/papers/LICENSE_CC_BY_4_0.md" "$STAGE_DIR/"

# Copy curated paper assets while excluding local build artifacts and metadata cruft.
mkdir -p "$STAGE_DIR/papers" "$STAGE_DIR/papers/sources"
cp "$PAPERS_ROOT"/paper_*.pdf "$STAGE_DIR/papers/"
cp "$PAPERS_ROOT/README.md" "$STAGE_DIR/papers/"
cp "$PAPERS_ROOT/LICENSE_CC_BY_4_0.md" "$STAGE_DIR/papers/"
cp -R "$PAPERS_ROOT/sources/figures" "$STAGE_DIR/papers/sources/"
cp "$PAPERS_ROOT/sources"/paper_00_main.tex "$STAGE_DIR/papers/sources/"
cp "$PAPERS_ROOT/sources"/paper_00_refs.bib "$STAGE_DIR/papers/sources/"
cp "$PAPERS_ROOT/sources"/paper_01_main.tex "$STAGE_DIR/papers/sources/"
cp "$PAPERS_ROOT/sources"/paper_02_main.tex "$STAGE_DIR/papers/sources/"
cp "$PAPERS_ROOT/sources"/paper_03_main.tex "$STAGE_DIR/papers/sources/"
cp "$PAPERS_ROOT/sources"/paper_i_main.tex "$STAGE_DIR/papers/sources/"
cp "$PAPERS_ROOT/sources"/paper_i_refs.bib "$STAGE_DIR/papers/sources/"
cp "$PAPERS_ROOT/sources"/references.bib "$STAGE_DIR/papers/sources/"
cp "$PAPERS_ROOT/sources"/refs.bib "$STAGE_DIR/papers/sources/"

# Results are intentionally included for reproducibility.
cp -R "$RESULTS_ROOT" "$STAGE_DIR/"

# Defense-in-depth: strip hidden/macOS files and common TeX byproducts if present.
find "$STAGE_DIR" -type f \( -name '.DS_Store' -o -name '._*' -o -name '*.aux' -o -name '*.log' -o -name '*.bbl' -o -name '*.blg' -o -name '*.out' \) -delete
find "$STAGE_DIR" -type d -name '__MACOSX' -prune -exec rm -rf {} +

rm -f "$TAR_PATH" "$ZIP_PATH"
tar -czf "$TAR_PATH" -C "$OUT_DIR" "$(basename "$STAGE_DIR")"
(
  cd "$OUT_DIR"
  zip -rq "$(basename "$ZIP_PATH")" "$(basename "$STAGE_DIR")"
)

echo "Created:"
echo "  $TAR_PATH"
echo "  $ZIP_PATH"
