# Notebooks Workspace

This directory is reserved for exploratory and reproducibility notebooks.

## Intended usage

- Colab-first experiments for model/API checks
- Local exploratory analysis tied to `results/`
- Small validation notebooks that support claims in `papers/`

## Guardrails

- Keep notebooks lightweight and scoped.
- Avoid embedding secrets, private datasets, or credentials.
- Prefer committed outputs that are reproducible from scripts.

## Suggested naming

- `YYYY-MM-DD_<topic>_exploration.ipynb`
- `YYYY-MM-DD_<topic>_reproduction.ipynb`
