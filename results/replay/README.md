# Replay Witness

This directory contains the committed deterministic witness used by the public MirageKit release.

## Files

- `replay_rows.csv` records row-level outcomes for each policy and retention fraction.
- `replay_summary.csv` provides the aggregate witness metrics in CSV form.
- `replay_summary.json` provides the same aggregate witness metrics in machine-readable JSON form.

## Interpretation

- The witness is intentionally small and inspectable: `n=3` variants per policy and retention fraction.
- On this fixture, `l2_guarded` preserves the protected pivot arc at retention fractions `0.65`, `0.5`, and `0.4`, while `recency` collapses it.
- The witness is a public inspection surface, not a claim that every broader paper result is reproduced by these three-example cells alone.

## Regeneration

The canonical maintainer path is to refresh from the `tropical-mcp` repository:

```bash
cd ~/dreams
./scripts/refresh_validation_artifacts.sh ~/tropical-mcp
```

That script regenerates the replay outputs from the implementation repo, refreshes the human-readable summary, and updates the release checksum manifests.
