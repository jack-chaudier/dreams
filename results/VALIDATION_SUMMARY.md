# Validation Summary

Snapshot generated on March 7, 2026 from the hardened public repository copies. DOI-backed `dreams` archive: `v0.1.1`. Mirrored `tropical-mcp` validation release: `v0.2.1`.

## Mirrored implementation validation

- `ruff check .`: passed (`results/ruff.txt`)
- `mypy src/tropical_mcp`: passed (`results/mypy.txt`)
- `pytest -vv`: **61 passed** in the canonical implementation repo (`results/pytest.txt`)
- `uv build`: wheel + sdist built successfully (`results/build.txt`)
- `./scripts/validate_installed_wheel.sh`: built wheel validated after clean install (`results/installed_wheel.txt`)
- `uv run tropical-mcp-full-validate`: packaged fixture refs, stdio smoke, policy comparison, and certificate checks passed (`results/full_validation.json`)

## Deterministic replay witness

Source: `results/replay/replay_summary.json`

This witness is intentionally small and inspectable: `n=3` variants per policy and retention fraction.

At retention fractions `0.65`, `0.5`, and `0.4`, the committed witness produces the same rates shown below:

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

- full-context pivot and protected IDs
- policy-specific kept and dropped IDs
- feasibility and breach metadata
- contract and protection-satisfaction flags
