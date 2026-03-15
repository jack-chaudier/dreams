# Public Surface Map

Use this file as the shortest path to the place that should change when the public MirageKit release expands.

## Narrative surfaces

- `README.md` is the repo landing page for researchers, press, and cold outreach.
- `site/index.html` is the overview page and should stay aligned with the README's scope language.
- `site/evidence.html` is the curated evidence dossier and should be the place where raw artifact links are introduced.
- `site/mirage-shelf-grok-2026-03.html` is the dedicated public page for the March 2026 Grok long-context experiment.
- `docs/ARTIFACT_INDEX.md` is the reviewer-facing entry point when someone wants the shortest path through the release.
- `docs/SOURCE_OF_TRUTH.md` defines what wins when narrative prose, scripts, and artifacts disagree.
- `docs/THEORY_STATUS.md` is where theory-boundary corrections should land before they are echoed elsewhere.

## Data-backed public artifacts

- `results/replay/` is the committed replay witness.
- `results/mirage-shelf-grok-2026-03/` is the committed empirical bundle for the March 2026 Grok mirage-shelf experiment.
- `results/certificates/memory_safety_certificate.json` is the public memory-safety certificate snapshot.
- `results/ruff.txt`, `results/mypy.txt`, `results/pytest.txt`, `results/build.txt`, `results/installed_wheel.txt`, and `results/full_validation.json` mirror the canonical validation outputs from `tropical-mcp`.
- `results/VALIDATION_SUMMARY.md` is the human-readable summary that sits on top of those raw files.
- `scripts/refresh_validation_artifacts.sh` is the canonical maintainer entry point for refreshing the mirrored validation logs, replay witness, and summary from `tropical-mcp`.

## Site data and social cards

- `site/data_miragekit.json` drives the interactive witness on the overview page.
- `site/data_certificate.json` must stay in sync with `results/certificates/memory_safety_certificate.json`.
- `site/social-card.svg` and `site/social-card.png` are the outreach and X card assets.
- `vercel.json` defines the public deployment headers and rewrites and must stay aligned with the static site's actual dependencies.

## Paper and citation surfaces

- `papers/` contains the released PDF bundle.
- `papers/BUILD_NOTES.md` records how the public paper set is rebuilt.
- `papers/SHA256SUMS.txt` is the integrity manifest for the paper bundle.
- `papers/sources/` contains the public TeX/Bib sources used by the integrity checks.
- `CITATION.cff`, `.zenodo.json`, and `README_ZENODO.md` must stay aligned with the DOI-backed archive.

## Integrity guardrails

- `scripts/validate_artifacts.py` is the public-surface gate and should be updated whenever new public files become required.
- `scripts/update_public_checksums.sh` is the canonical maintainer entry point for regenerating `papers/SHA256SUMS.txt` and `results/SHA256SUMS.txt`.
- Use `scripts/refresh_validation_artifacts.sh` before editing `results/` by hand; the script keeps the public logs in sync and strips machine-local absolute paths.
- `results/SHA256SUMS.txt` and `results/replay/README.md` should be refreshed whenever mirrored evidence files change.
- If the validation shape changes in `tropical-mcp`, refresh both `results/` and the checks in `scripts/validate_artifacts.py`.
- If the replay witness changes, refresh `results/replay/`, `results/SHA256SUMS.txt`, `site/data_miragekit.json`, and the scope language in `site/index.html`, `site/evidence.html`, `README.md`, and `docs/CREDIBILITY_NOTES.md` together.
- If the Grok experiment bundle changes, refresh `results/mirage-shelf-grok-2026-03/`, `results/SHA256SUMS.txt`, `site/mirage-shelf-grok-2026-03.html`, `site/evidence.html`, `site/index.html`, and the reviewer docs together.
- If the public verification workflow wording changes, keep the smoke-test versus reviewer-workflow distinction aligned across `README.md`, `site/index.html`, `site/evidence.html`, and `docs/SOURCE_OF_TRUTH.md`.

## Companion implementation

- `tropical-mcp` owns the installable evaluation implementation, its packaged fixtures, and its CI/release checks.
- When the public evidence bundle changes, sync the mirrored artifacts here after regenerating them from the companion repo rather than editing them by hand.
