#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

python3 - "$ROOT_DIR" <<'PY'
from __future__ import annotations

from hashlib import sha256
from pathlib import Path
import sys

root = Path(sys.argv[1])
excluded_suffixes = {".aux", ".bbl", ".blg", ".log", ".out"}


def write_manifest(folder_rel: str) -> None:
    folder = root / folder_rel
    lines: list[str] = []
    for path in sorted(p for p in folder.rglob("*") if p.is_file()):
        rel = path.relative_to(root).as_posix()
        if path.name == "SHA256SUMS.txt":
            continue
        if path.suffix.lower() in excluded_suffixes:
            continue
        digest = sha256(path.read_bytes()).hexdigest()
        lines.append(f"{digest}  {rel}")
    (folder / "SHA256SUMS.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")


for folder_rel in ("papers", "results"):
    write_manifest(folder_rel)
PY

echo "Updated papers/SHA256SUMS.txt and results/SHA256SUMS.txt"
