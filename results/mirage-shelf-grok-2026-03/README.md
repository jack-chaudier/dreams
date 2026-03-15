# Grok Mirage Shelf (March 2026)

This folder is the canonical public bundle for the March 2026 long-context mirage-shelf experiment on Grok.

## Question

Can answer accuracy remain relatively stable while witness fidelity degrades as context length grows?

## Setup

- Model: `grok-4-1-fast-non-reasoning`
- Items: `200` synthetic long-document decision items
- Full responses scored: `1600`
- Normal condition contexts: `4K`, `16K`, `64K`, `256K`, `512K`
- Witness-removed causal control contexts: `4K`, `64K`, `256K`
- Batch path: xAI batch API with replay recovery for failed rows
- Batch outcome: `1587` batch successes plus `13` direct replays for a complete local result set

## Headline Result

Answer accuracy remained relatively stable while witness fidelity degraded substantially with context. In the normal condition, the mirage gap widened from `+0.038` at `4K` to `+0.222` at `512K`.

In the witness-removed control, answer accuracy fell well below chance, from `0.315` at `4K` to `0.275` at `256K`, while corruption stayed high. The most conservative reading is that nearby near-miss evidence can actively pull the model toward the wrong answer when the true witness is absent.

## Key Scores

| Condition | Context | N | Answer | Witness | Gap | Corruption |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| normal | 4K | 200 | 0.825 | 0.7867 | +0.0383 | 0.2567 |
| normal | 16K | 200 | 0.8200 | 0.7767 | +0.0433 | 0.2467 |
| normal | 64K | 200 | 0.8100 | 0.7517 | +0.0583 | 0.2717 |
| normal | 256K | 200 | 0.8100 | 0.7150 | +0.0950 | 0.2583 |
| normal | 512K | 200 | 0.7750 | 0.5533 | +0.2217 | 0.2200 |
| witness_removed | 4K | 200 | 0.3150 | 0.1100 | +0.2050 | 0.6700 |
| witness_removed | 64K | 200 | 0.2850 | 0.1083 | +0.1767 | 0.6850 |
| witness_removed | 256K | 200 | 0.2750 | 0.1050 | +0.1700 | 0.6400 |

## Caveats

- This is a single-model result.
- Witness recovery should be read as a lower bound because exact-sentence scoring misses some paraphrases.
- In the full run, corruption in the normal condition is consistently present but not monotone with context. The strongest clean empirical story is the widening answer-vs-witness gap.

## Files

- `manifest.json` - experiment metadata and headline metrics
- `scores.json` - full aggregate metrics
- `mirage_shelf.png` - main public figure
- `mirage_shelf_experiment_v3.py` - exact script used for the run
- `scored_examples_sample.jsonl` - compact public sample of representative scored examples

## Notes On Scope

The full raw `output.jsonl` and full scored row bundle are intentionally not committed here. This repo keeps the public branch readable and centered on the figure, scores, script, and representative examples rather than a large noisy dump.
