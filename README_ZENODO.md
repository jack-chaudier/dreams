# Zenodo Upload Notes

This repository uses a split license policy:

- Paper artifacts in `papers/` are CC-BY 4.0.
- Non-paper assets are review-only unless otherwise granted.

For a clean, unambiguous Zenodo record, upload a **papers-focused bundle** rather than
auto-archiving the full repository.

## Recommended Zenodo Bundle Contents

- `papers/`
- `results/`
- `CITATION.cff`
- `.zenodo.json`
- `README_ZENODO.md`

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
   - `upload_type`: publication
   - `publication_type`: working paper
   - `license`: `cc-by-4.0`

3. Upload the generated archive from `dist/zenodo/`.
4. Confirm metadata fields from `.zenodo.json` and publish.

## DOI Update Follow-Up

After publication, add the minted DOI to:

- site footer and/or hero links in `site/index.html`
- `README.md`
- future paper revisions
