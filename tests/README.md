# Tests Surface

`dreams` is primarily a curated artifact and site repo.

Canonical implementation tests live in `tropical-mcp`:

- `uv run --extra dev pytest -q`
- `uv run tropical-mcp-full-validate`

Public-surface integrity checks for this repo are enforced by:

- `python scripts/validate_artifacts.py`

Current high-value checks include:

- replay/site data consistency (`results/replay/*.json` vs `site/data_miragekit.json`)
- headline claim regressions for reported retention fractions
- certificate sync (`results/certificates/*` vs `site/data_certificate.json`)
- private path leak scans in tracked text files
- Zenodo + CITATION metadata alignment and license consistency
- ORCID presence/consistency between Zenodo and citation metadata
- paper source checks (draft marker + CC-BY + PDF metadata declarations)
- paper figure asset presence checks (no missing `\includegraphics` targets)
- compiled PDF checks (title/author metadata, first-page draft/license visibility)
- no symlink packaging hazards in public release surfaces (`papers/`, `site/`, `results/`)
