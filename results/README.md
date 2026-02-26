# Results

This folder contains reproducible evidence artifacts used in the showcase.

## Files

- `pytest.txt` — unit/property test run output
- `build.txt` — packaging build output
- `full_validation.json` — functional validation report
- `replay/replay_rows.csv` — row-level replay output
- `replay/replay_summary.csv` — aggregate replay metrics
- `replay/replay_summary.json` — aggregate replay metrics (JSON)
- `certificates/memory_safety_certificate.json` — example memory safety certificate artifact

## Re-generate

```bash
cd /Users/jackg/dreams/mcp/tropical-compactor
uv run --extra dev pytest -q | tee /Users/jackg/dreams/results/pytest.txt
uv build > /Users/jackg/dreams/results/build.txt 2>&1
uv run python scripts/run_full_validation.py > /Users/jackg/dreams/results/full_validation.json
uv run tropical-compactor-replay \
  --fractions 1.0,0.8,0.65,0.5,0.4 \
  --policies recency,l2_guarded \
  --k 3 \
  --line-count 200 \
  --output-dir /Users/jackg/dreams/results/replay
```
