# Papers

Curated paper bundle for the MirageKit research line.

## Status

All PDFs in this folder should be treated as **Working Paper / First Draft (2026)** unless explicitly superseded by an arXiv or venue version.

## Canonical public record

- DOI-backed archive: <https://doi.org/10.5281/zenodo.18794293>
- Current public `dreams` archive: `v0.1.1`
- Paper metadata manifest: [`manifest.json`](./manifest.json)

## License

Paper artifacts in this folder are intended for CC-BY 4.0 distribution.
See [`LICENSE_CC_BY_4_0.md`](./LICENSE_CC_BY_4_0.md).

## Included PDFs

- `paper_00_continuous_control_structural_regularization.pdf` — Working Paper / First Draft
- `paper_01_absorbing_states_in_greedy_search.pdf` — Working Paper / First Draft
- `paper_02_streaming_oscillation_traps.pdf` — Working Paper / First Draft
- `paper_03_validity_mirage_compression.pdf` — Working Paper / First Draft
- `paper_i_tropical_algebra.pdf` — Working Paper / First Draft

## Included source files

Selected TeX/Bib sources are included for transparency and citation traceability.

- `paper_00_main.tex`, `paper_00_refs.bib`
- `paper_01_main.tex`
- `paper_02_main.tex`
- `paper_03_main.tex`
- `paper_i_main.tex`, `paper_i_refs.bib`
- shared bibliography, style, and figure assets in `sources/`

## Where to update when the bundle expands

- add the new PDF and TeX source under `papers/` and `papers/sources/`
- register the paper in [`manifest.json`](./manifest.json)
- rerun `python3 scripts/validate_artifacts.py`
- rebuild the publication archive with `./scripts/package_zenodo_bundle.sh`

## Interpretation guidance

- Prefer claims that point to concrete artifacts in `../results/`.
- Treat single-backend or small-sample validations as suggestive, not universal.
- Use source TeX for caveats and denominator definitions.
