# Contributing

Thanks for taking the public MirageKit release seriously enough to improve it.

## What belongs where

- `dreams` is the public showcase: site copy, papers, replay witness, and mirrored validation artifacts.
- `tropical-mcp` is the canonical evaluation implementation.
- If a change affects tool behavior, validation fixtures, or installability, make it in `tropical-mcp` first and then mirror the public artifacts here.

## Good first contributions

- tightening public wording without broadening claims
- improving artifact reproducibility or link hygiene
- fixing site clarity issues on `site/index.html` or `site/evidence.html`
- updating maintainer maps and public documentation when new papers or artifacts land

## Before opening a PR

1. Run `python3 scripts/validate_artifacts.py`.
2. If you changed the paper bundle archive layout, run `./scripts/package_zenodo_bundle.sh`.
3. If you changed mirrored validation artifacts in `results/`, regenerate them from `tropical-mcp` rather than editing them by hand.
4. Keep scope language conservative and explicit about denominators.

## Communication

- Use issues or PRs for concrete changes.
- For questions about licensing or broader collaboration, contact <mailto:jackgaff@umich.edu>.
- Repository rights remain governed by the root `LICENSE`; contributing does not broaden redistribution rights for non-paper assets.
