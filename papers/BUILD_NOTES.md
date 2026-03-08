# Build Notes

These notes describe the intended maintainer path for rebuilding the public paper bundle.

## Prerequisites

- A TeX distribution with `pdflatex` and BibTeX support
- `latexmk` is convenient when available, but it is not required
- `pdfinfo` and `pdftotext` for the repo integrity checks

## Working directory

Run paper builds from `papers/sources/`.

## Typical rebuild flow

```bash
cd papers/sources
pdflatex -interaction=nonstopmode -halt-on-error paper_00_main.tex
pdflatex -interaction=nonstopmode -halt-on-error paper_01_main.tex
pdflatex -interaction=nonstopmode -halt-on-error paper_02_main.tex
pdflatex -interaction=nonstopmode -halt-on-error paper_03_main.tex
pdflatex -interaction=nonstopmode -halt-on-error paper_i_main.tex
```

For bibliography-backed papers, run the usual follow-up passes:

```bash
bibtex paper_i_main
pdflatex -interaction=nonstopmode -halt-on-error paper_i_main.tex
pdflatex -interaction=nonstopmode -halt-on-error paper_i_main.tex
```

Move or copy the resulting PDFs into `papers/` using the published filenames, then refresh the integrity surface:

```bash
cd ../..
./scripts/update_public_checksums.sh
python3 scripts/validate_artifacts.py
```

## Release expectations

- PDF metadata must stay aligned with `papers/manifest.json`.
- The first page must still visibly show `Working Paper (First Draft)` and `CC-BY 4.0`.
- If theory wording changes in `paper_i_main.tex`, keep `docs/THEORY_STATUS.md` aligned with the revised draft.
