# Zenodo Upload Notes

This repository uses a split-license release policy:

- Public research artifacts in `papers/` and `results/` are intended for CC-BY 4.0 distribution in the Zenodo bundle.
- Other repository assets stay under the root evaluation license and are not part of the CC-BY paper bundle unless explicitly included.

For a clean, unambiguous Zenodo record, upload a papers-focused bundle rather than auto-archiving the full repository.

## Current DOI

- Published record: <https://doi.org/10.5281/zenodo.18794293>
- Published archival version: `v0.1.1`

## Recommended Zenodo Bundle Contents (CC-BY 4.0)

- `papers/`
- `results/`
- `CITATION.cff`
- `.zenodo.json`
- `README_ZENODO.md`
- `papers/LICENSE_CC_BY_4_0.md`

## Included Paper Mapping

- `paper_00_continuous_control_structural_regularization.pdf`
- `paper_01_absorbing_states_in_greedy_search.pdf`
- `paper_02_streaming_oscillation_traps.pdf`
- `paper_03_validity_mirage_compression.pdf`
- `paper_i_tropical_algebra.pdf`

## Manual Upload Workflow

1. Build the bundle archive:

   ```bash
   ./scripts/package_zenodo_bundle.sh
   ```

2. In Zenodo, create a new upload as:
   - `upload_type`: `publication`
   - `publication_type`: `working paper`
   - `license`: `cc-by-4.0`

3. Upload the generated archive from `dist/zenodo/`.
4. Optional but recommended: also upload the five paper PDFs as individual files so Zenodo can preview them directly.
5. Confirm metadata fields from `.zenodo.json` and publish.

## For The Next Archive Refresh

When a new public archive is cut, update all of the following together:

- `CITATION.cff`
- `.zenodo.json`
- `README.md`
- `site/index.html` and `site/evidence.html`
- any paper PDF metadata or DOI references that should point at the new record
