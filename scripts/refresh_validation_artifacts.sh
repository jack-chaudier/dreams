#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TROPICAL_DIR="${1:-${TROPICAL_MCP_DIR:-$HOME/tropical-mcp}}"
RESULTS_DIR="$ROOT_DIR/results"
REPLAY_DIR="$RESULTS_DIR/replay"

if [ ! -d "$TROPICAL_DIR" ]; then
  echo "tropical-mcp repo not found at: $TROPICAL_DIR" >&2
  echo "Pass the repo path explicitly or set TROPICAL_MCP_DIR." >&2
  exit 1
fi

mkdir -p "$RESULTS_DIR" "$REPLAY_DIR"

sanitize_to() {
  local input_path="$1"
  local output_path="$2"

  python3 - "$input_path" "$output_path" <<'PY'
import pathlib
import re
import sys

source = pathlib.Path(sys.argv[1])
target = pathlib.Path(sys.argv[2])
text = source.read_text(encoding="utf-8")

patterns = [
    (r"file:///Users/[^\s\"'<>`]+", "file:///local-path"),
    (r"/Users/[^\s\"'<>`]+", "/local/path"),
    (r"file:///home/[^\s\"'<>`]+", "file:///local-path"),
    (r"/home/[^\s\"'<>`]+", "/local/path"),
    (r"file:///private/var/[^\s\"'<>`]+", "file:///temp-path"),
    (r"/private/var/[^\s\"'<>`]+", "/temp/path"),
    (r"/var/folders/[^\s\"'<>`]+", "/temp/path"),
]

for pattern, replacement in patterns:
    text = re.sub(pattern, replacement, text)

target.write_text(text, encoding="utf-8")
PY
}

capture_text() {
  local command_text="$1"
  local output_path="$2"
  local temp_file

  temp_file="$(mktemp "${TMPDIR:-/tmp}/dreams-artifact-XXXXXX")"
  (
    cd "$TROPICAL_DIR"
    bash -lc "$command_text"
  ) >"$temp_file" 2>&1
  sanitize_to "$temp_file" "$output_path"
  rm -f "$temp_file"
}

capture_json() {
  local command_text="$1"
  local output_path="$2"
  local temp_file

  temp_file="$(mktemp "${TMPDIR:-/tmp}/dreams-artifact-XXXXXX")"
  (
    cd "$TROPICAL_DIR"
    bash -lc "$command_text"
  ) >"$temp_file"
  sanitize_to "$temp_file" "$output_path"
  rm -f "$temp_file"
}

capture_text "uv run --extra dev ruff check ." "$RESULTS_DIR/ruff.txt"
capture_text "uv run --extra dev mypy src/tropical_mcp" "$RESULTS_DIR/mypy.txt"
capture_text "uv run --extra dev pytest -vv" "$RESULTS_DIR/pytest.txt"
capture_text "uv build" "$RESULTS_DIR/build.txt"
capture_text "./scripts/validate_installed_wheel.sh" "$RESULTS_DIR/installed_wheel.txt"
capture_json "uv run tropical-mcp-full-validate" "$RESULTS_DIR/full_validation.json"

(
  cd "$TROPICAL_DIR"
  uv run tropical-mcp-replay \
    --fractions 1.0,0.8,0.65,0.5,0.4 \
    --policies recency,l2_guarded \
    --k 3 \
    --line-count 200 \
    --output-dir "$REPLAY_DIR"
)

python3 - "$REPLAY_DIR" <<'PY'
import pathlib
import sys

replay_dir = pathlib.Path(sys.argv[1])
for name in ("replay_rows.csv", "replay_summary.csv"):
    path = replay_dir / name
    text = path.read_text(encoding="utf-8")
    path.write_text(text.replace("\r\n", "\n"), encoding="utf-8")
PY

python3 - "$ROOT_DIR" "$RESULTS_DIR" <<'PY'
from datetime import date
import json
import pathlib
import re
import sys

root_dir = pathlib.Path(sys.argv[1])
results_dir = pathlib.Path(sys.argv[2])
pytest_text = (results_dir / "pytest.txt").read_text(encoding="utf-8")
replay = json.loads((results_dir / "replay" / "replay_summary.json").read_text(encoding="utf-8"))
site_data = json.loads((root_dir / "site" / "data_miragekit.json").read_text(encoding="utf-8"))

match = re.search(r"(\d+) passed", pytest_text)
if match is None:
    raise SystemExit("Could not find pytest pass count in results/pytest.txt")

public_release = site_data.get("public_release", {})
dreams_version = str(public_release.get("dreams_version", "")).strip()
tropical_version = str(public_release.get("tropical_mcp_version", "")).strip()
if not dreams_version or not tropical_version:
    raise SystemExit("site/data_miragekit.json must define public_release.dreams_version and tropical_mcp_version")

today = date.today()
snapshot_date = f"{today:%B} {today.day}, {today:%Y}"
rows = {(row["policy"], float(row["fraction"])): row for row in replay["summary"]}
summary = f"""# Validation Summary

Snapshot generated on {snapshot_date} from the hardened public repository copies. DOI-backed `dreams` archive: `v{dreams_version}`. Mirrored `tropical-mcp` validation release: `v{tropical_version}`.

## Mirrored implementation validation

- `ruff check .`: passed (`results/ruff.txt`)
- `mypy src/tropical_mcp`: passed (`results/mypy.txt`)
- `pytest -vv`: **{match.group(1)} passed** in the canonical implementation repo (`results/pytest.txt`)
- `uv build`: wheel + sdist built successfully (`results/build.txt`)
- `./scripts/validate_installed_wheel.sh`: built wheel validated after clean install (`results/installed_wheel.txt`)
- `uv run tropical-mcp-full-validate`: packaged fixture refs, stdio smoke, policy comparison, and certificate checks passed (`results/full_validation.json`)

## Deterministic replay witness

Source: `results/replay/replay_summary.json`

This witness is intentionally small and inspectable: `n=3` variants per policy and retention fraction.

At retention fractions `0.65`, `0.5`, and `0.4`, the committed witness produces the same rates shown below:

- `l2_guarded`
  - pivot preservation rate: **{rows[('l2_guarded', 0.65)]['pivot_preservation_rate']:.1f}**
  - primary arc full rate: **{rows[('l2_guarded', 0.65)]['primary_full_rate']:.1f}**
  - contract satisfied rate: **{rows[('l2_guarded', 0.65)]['contract_satisfied_rate']:.1f}**
- `recency`
  - pivot preservation rate: **{rows[('recency', 0.65)]['pivot_preservation_rate']:.1f}**
  - primary arc full rate: **{rows[('recency', 0.65)]['primary_full_rate']:.1f}**

At `0.8`, recency is topology-sensitive in this fixture (`{rows[('recency', 0.8)]['pivot_preservation_rate']:.4f}` pivot preservation) while `l2_guarded` stays at `{rows[('l2_guarded', 0.8)]['pivot_preservation_rate']:.1f}`.

## Certificate artifact

`results/certificates/memory_safety_certificate.json` demonstrates a checkable compaction audit including:

- full-context pivot and protected IDs
- policy-specific kept and dropped IDs
- feasibility and breach metadata
- contract and protection-satisfaction flags
"""

(results_dir / "VALIDATION_SUMMARY.md").write_text(summary, encoding="utf-8")
PY

"$ROOT_DIR/scripts/update_public_checksums.sh"

echo "Refreshed mirrored validation artifacts in $RESULTS_DIR from $TROPICAL_DIR"
