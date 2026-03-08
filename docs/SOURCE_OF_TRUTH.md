# Source of Truth

This file defines what wins when public MirageKit artifacts disagree.

## Resolution order

1. Machine-readable artifacts and metadata.
2. Scripts that regenerate or validate those artifacts.
3. Narrative docs and website copy.

## Canonical sources by question

- Replay metrics and witness rates:
  `results/replay/replay_summary.json` and `results/replay/replay_summary.csv`
- Overview-page witness cards:
  `site/data_miragekit.json`, which must match the replay summary
- Certificate contents:
  `results/certificates/memory_safety_certificate.json`, mirrored into `site/data_certificate.json`
- Mirrored implementation validation:
  `results/ruff.txt`, `results/mypy.txt`, `results/pytest.txt`, `results/build.txt`, `results/installed_wheel.txt`, and `results/full_validation.json`
- Paper inventory and metadata:
  `papers/manifest.json`, the PDF bundle in `papers/`, and citation metadata in `CITATION.cff` plus `.zenodo.json`
- Release integrity:
  `papers/SHA256SUMS.txt`, `results/SHA256SUMS.txt`, and the validator/update scripts that check them

## Implementation boundary

- `tropical-mcp` is the canonical implementation repository.
- When `dreams` prose and `tropical-mcp` implementation docs disagree about tool behavior, prefer the implementation repo and then update `dreams`.
- The minimum public smoke flow is `runtime_info()`, `compact_auto(...)`, and `certificate(...)`.
- The fuller reviewer workflow adds `diagnose(...)`, `context_anchor(...)`, and `telemetry_summary(...)`.

## Theory boundary

- Public theory claims should be read through the clarification in `docs/THEORY_STATUS.md`.
- The released software does not depend on proving stronger categorical statements beyond the current witness-preserving contract.

## Review order

- Start with `README.md`.
- Use `docs/ARTIFACT_INDEX.md` to locate the relevant public bundle.
- Check the machine-readable artifacts before trusting narrative summaries.
- Use `scripts/validate_artifacts.py` if you need the repo's own release gate.
