# Results

Reproducible public evidence artifacts mirrored from the canonical `tropical-mcp` evaluation repo.

## Files

- `ruff.txt` — canonical lint output
- `mypy.txt` — canonical type-check output
- `pytest.txt` — canonical unit/property test output with a public pass count and machine-local paths removed
- `build.txt` — canonical packaging build output
- `installed_wheel.txt` — installed-wheel validation output
- `full_validation.json` — canonical MCP functional validation report
- `replay/replay_rows.csv` — row-level replay output
- `replay/replay_summary.csv` — aggregate replay metrics
- `replay/replay_summary.json` — aggregate replay metrics (JSON)
- `certificates/memory_safety_certificate.json` — example memory safety certificate

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

## Sync Notes

- If the replay witness changes, also refresh `site/data_miragekit.json`, `site/index.html`, and `site/evidence.html`.
- If the validation shape changes, refresh `results/VALIDATION_SUMMARY.md` and `scripts/validate_artifacts.py`.
- Treat these files as mirrored outputs from `tropical-mcp`, not hand-authored substitutes for the implementation repo.
- The refresh entry point for maintainers is `scripts/refresh_validation_artifacts.sh`.
