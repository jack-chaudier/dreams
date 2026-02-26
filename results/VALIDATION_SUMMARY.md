# Validation Summary

Snapshot generated from this clean repository copy.

## Build and test

- Unit + property tests: **30 passed** (`pytest -q`)
- Packaging: wheel + sdist built successfully (`uv build`)
- Functional smoke checks: stdio server alive and tool diagnostics passed (`full_validation.json`)

## Replay benchmark headline

Source: `results/replay/replay_summary.json`

At retention fractions `0.65`, `0.5`, and `0.4`:

- `l2_guarded`
  - pivot preservation rate: **1.0**
  - primary arc full rate: **1.0**
  - contract satisfied rate: **1.0**
- `recency`
  - pivot preservation rate: **0.0**
  - primary arc full rate: **0.0**

At `0.8`, recency is topology-sensitive in this fixture (`0.3333` pivot preservation) while `l2_guarded` stays at `1.0`.

## Certificate artifact

`results/certificates/memory_safety_certificate.json` demonstrates a checkable compaction audit including:

- full-context pivot and protected IDs,
- policy-specific kept IDs,
- breach and feasibility metadata,
- contract/protection satisfaction flags.
