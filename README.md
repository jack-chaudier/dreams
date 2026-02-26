# Dreams: Mirage Research Showcase

A curated, public-facing research showcase for long-context reliability under memory pressure.

## Scope and Boundaries

- `dreams` is the public front door: demo site, paper bundle, and reproducible artifacts.
- The full `mirage` research monorepo stays private.
- The canonical MCP implementation is maintained in `tropical-mcp`.

## Repository Contents

```text
/dreams
├── site/                     # Vercel-ready interactive showcase
├── papers/                   # Working paper PDFs + selected TeX/Bib sources
├── results/                  # Reproducible benchmark + validation artifacts
├── notebooks/                # Colab/local notebook workspace scaffold
├── tests/                    # Public-surface validation notes
├── mcp/                      # Canonical MCP source-of-truth pointer
├── docs/                     # Outreach + sharing docs
└── README.md
```

## Research Status

- Paper bundle status: **Working Paper / First Draft (2026)**.
- Claims are tied to committed artifacts in `results/` and source TeX in `papers/sources/`.
- This repo is intentionally minimal and evidence-first.

## Evidence Snapshot

Source: `results/replay/replay_summary.json`

- At retention fractions `0.65`, `0.5`, and `0.4`:
  - `l2_guarded` pivot preservation = **1.0**
  - `recency` pivot preservation = **0.0**
- Canonical MCP validation snapshot:
  - `pytest`: **30 passed**
  - packaging build: wheel + sdist successful

Detailed summary: [`results/VALIDATION_SUMMARY.md`](./results/VALIDATION_SUMMARY.md)

## Credibility Notes

To keep interpretation rigorous:

- Synthetic and fixture-based evaluations dominate the current artifact set.
- Real-incident validation is smaller scale than synthetic sweeps.
- Results are reported with explicit denominators and caveats in source papers.

## Local Reproduction

### 1) Validate canonical MCP implementation

```bash
cd /absolute/path/to/tropical-mcp
uv run --extra dev pytest -q
uv build
uv run tropical-mcp-full-validate
uv run tropical-mcp-replay \
  --fractions 1.0,0.8,0.65,0.5,0.4 \
  --policies recency,l2_guarded \
  --k 3 \
  --line-count 200 \
  --output-dir /absolute/path/to/dreams/results/replay
```

### 2) Serve the showcase site

```bash
cd /absolute/path/to/dreams/site
python3 -m http.server 8080
```

Open: `http://localhost:8080`

## Deployment

- Live site: <https://dreams-dun.vercel.app>
- `vercel.json` routes `/` to static content in `site/`

## Quick Links

- Site source: [`site/`](./site/)
- Paper bundle: [`papers/`](./papers/)
- Repro artifacts: [`results/`](./results/)
- Notebook workspace: [`notebooks/`](./notebooks/)
- Credibility notes: [`docs/CREDIBILITY_NOTES.md`](./docs/CREDIBILITY_NOTES.md)
- Canonical MCP repo: <https://github.com/jack-chaudier/tropical-mcp>
