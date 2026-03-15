# Artifact Index

Use this file as the fastest reviewer path through the public MirageKit release.

## Start Here

- `README.md`
- `docs/SOURCE_OF_TRUTH.md`
- `docs/THEORY_STATUS.md`
- `docs/CREDIBILITY_NOTES.md`
- `site/evidence.html`

## Core public claims

- The public website and README summarize the current release surface and should align with committed artifacts.
- The strongest software-facing public evidence is the deterministic replay witness plus mirrored `tropical-mcp` validation logs.
- The shipped implementation claim is witness-preserving and threshold-`k`; stronger categorical statements remain explicitly conjectural unless updated in the theory notes.

## Papers bundle

- `papers/README.md`
- `papers/BUILD_NOTES.md`
- `papers/SHA256SUMS.txt`
- `papers/manifest.json`
- `papers/paper_03_validity_mirage_compression.pdf`
- `papers/paper_i_tropical_algebra.pdf`

## Results bundle

- `results/README.md`
- `results/SHA256SUMS.txt`
- `results/VALIDATION_SUMMARY.md`
- `results/replay/README.md`
- `results/replay/replay_summary.json`
- `results/certificates/memory_safety_certificate.json`
- `results/full_validation.json`
- `results/mirage-shelf-grok-2026-03/README.md`
- `results/mirage-shelf-grok-2026-03/scores.json`
- `results/mirage-shelf-grok-2026-03/mirage_shelf.png`
- `results/mirage-shelf-grok-2026-03/scored_examples_sample.jsonl`

## Website and deployment surface

- `site/index.html`
- `site/evidence.html`
- `site/mirage-shelf-grok-2026-03.html`
- `site/data_miragekit.json`
- `site/data_certificate.json`
- `vercel.json`

## Maintainer integrity entry points

- `scripts/validate_artifacts.py`
- `scripts/refresh_validation_artifacts.sh`
- `scripts/update_public_checksums.sh`

## Companion implementation

- `../tropical-mcp/README.md`
- `../tropical-mcp/docs/configuration.md`
- `../tropical-mcp/docs/RELEASE.md`
