# Results

Reproducible public evidence artifacts mirrored from the canonical `tropical-mcp` evaluation repo.

This directory now also contains a committed empirical bundle for the March 2026 Grok mirage-shelf experiment.

## Files

- `SHA256SUMS.txt` — integrity manifest for the public results bundle
- `ruff.txt` — canonical lint output
- `mypy.txt` — canonical type-check output
- `pytest.txt` — canonical unit/property test output with a public pass count and machine-local paths removed
- `build.txt` — canonical packaging build output
- `installed_wheel.txt` — installed-wheel validation output
- `full_validation.json` — canonical MCP functional validation report
- `replay/README.md` — interpretation and regeneration notes for the replay witness
- `replay/replay_rows.csv` — row-level replay output
- `replay/replay_summary.csv` — aggregate replay metrics
- `replay/replay_summary.json` — aggregate replay metrics (JSON)
- `certificates/memory_safety_certificate.json` — example memory safety certificate
- `mirage-shelf-grok-2026-03/README.md` — experiment summary for the March 2026 Grok long-context run
- `mirage-shelf-grok-2026-03/scores.json` — aggregate experiment metrics
- `mirage-shelf-grok-2026-03/mirage_shelf.png` — main public figure for the experiment
- `mirage-shelf-grok-2026-03/mirage_shelf_experiment_v3.py` — exact run script used for the public bundle
- `mirage-shelf-grok-2026-03/scored_examples_sample.jsonl` — representative public sample of scored examples

## Published Version Map

- `dreams` archival release: `v0.1.1`
- `tropical-mcp` mirrored validation release: `v0.2.1`

## Regenerate From Canonical MCP Repo

```bash
git clone https://github.com/jack-chaudier/tropical-mcp.git ~/tropical-mcp
cd ~/dreams
./scripts/refresh_validation_artifacts.sh ~/tropical-mcp
```

The refresh script is the canonical maintainer path: it reruns the validation commands, refreshes the replay witness, rewrites `VALIDATION_SUMMARY.md`, and strips machine-local absolute paths from the mirrored logs before they become public artifacts.
It also refreshes the public checksum manifests so the release surface stays auditable.

## Sync Notes

- If the replay witness changes, also refresh `site/data_miragekit.json`, `site/index.html`, and `site/evidence.html`.
- If the validation shape changes, refresh `results/VALIDATION_SUMMARY.md` and `scripts/validate_artifacts.py`.
- Treat these files as mirrored outputs from `tropical-mcp`, not hand-authored substitutes for the implementation repo.
- The refresh entry point for maintainers is `scripts/refresh_validation_artifacts.sh`.
- The Grok experiment bundle is a public evidence add-on inside `results/`; it is not mirrored from `tropical-mcp`.
