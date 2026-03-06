# Results

Reproducible evidence artifacts used by the showcase.

## Files

- `pytest.txt` — canonical MCP unit/property test output
- `build.txt` — canonical MCP packaging build output
- `full_validation.json` — canonical MCP functional validation report
- `replay/replay_rows.csv` — row-level replay output
- `replay/replay_summary.csv` — aggregate replay metrics
- `replay/replay_summary.json` — aggregate replay metrics (JSON)
- `certificates/memory_safety_certificate.json` — example memory safety certificate

## Regenerate From Canonical MCP Repo

```bash
cd ~/tropical-mcp
uv run --extra dev pytest -q | tee ~/dreams/results/pytest.txt
uv build > ~/dreams/results/build.txt 2>&1
uv run tropical-mcp-full-validate > ~/dreams/results/full_validation.json
uv run tropical-mcp-replay \
  --fractions 1.0,0.8,0.65,0.5,0.4 \
  --policies recency,l2_guarded \
  --k 3 \
  --line-count 200 \
  --output-dir ~/dreams/results/replay
```
