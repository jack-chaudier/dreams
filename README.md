# dreams: MirageKit Public Showcase

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.18794293.svg)](https://doi.org/10.5281/zenodo.18794293)

A curated, public-facing showcase for the MirageKit research program.

## 15-Second Map

- `MirageKit` is the research program.
- `dreams` is the public showcase repo: website, papers, replay artifacts, and certificate snapshots.
- `tropical-mcp` is the installable implementation repo for Codex and Claude-style clients.
- If you want to verify the implementation, start in `tropical-mcp` with `runtime_info()`, `compact_auto(...)`, and `certificate(...)`.

## Scope and Boundaries

- `dreams` is the public front door: live site, paper bundle, and reproducible artifacts.
- The full `mirage` research monorepo stays private.
- The canonical installable MCP implementation is maintained in `tropical-mcp`.

## Current Status

- Public status: working-paper stage, with committed replay artifacts and validation outputs.
- Live-facing surfaces: `site/` for the website, `papers/` for draft PDFs, `results/` for reproducible evidence.
- Install path: use the `tropical-mcp` repo directly; this repo is not the package you install into Codex or Claude-style clients.

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

## Licensing Split

- Papers in `papers/` are released under **CC-BY 4.0** (for scholarly sharing and reuse with attribution).
- Reproducibility artifacts in `results/` are also released under **CC-BY 4.0**.
- Repository code and other non-paper assets follow the root [`LICENSE`](./LICENSE).

## Evidence Snapshot

Source: `results/replay/replay_summary.json`

- At retention fractions `0.65`, `0.5`, and `0.4`:
  - `l2_guarded` pivot preservation = **1.0**
  - `recency` pivot preservation = **0.0**
- Canonical MCP validation snapshot:
  - `pytest`: **34 passed**
  - packaging build: wheel + sdist successful

Detailed summary: [`results/VALIDATION_SUMMARY.md`](./results/VALIDATION_SUMMARY.md)

## Credibility Notes

To keep interpretation rigorous:

- Synthetic and fixture-based evaluations dominate the current artifact set.
- Real-incident validation is smaller scale than synthetic sweeps.
- Results are reported with explicit denominators and caveats in source papers.

## Local Reproduction

### 1) Install and validate `tropical-mcp`

```bash
git clone https://github.com/jack-chaudier/tropical-mcp.git ~/tropical-mcp
cd ~/tropical-mcp
uv venv
source .venv/bin/activate
uv pip install -e '.[dev]'
uv run --extra dev pytest -q
uv build
uv run tropical-mcp-full-validate
uv run tropical-mcp-replay \
  --fractions 1.0,0.8,0.65,0.5,0.4 \
  --policies recency,l2_guarded \
  --k 3 \
  --line-count 200 \
  --output-dir "$PWD/../dreams/results/replay"
```

After client registration, the minimum MCP smoke flow is:

- `runtime_info()`
- `compact_auto(...)`
- `certificate(...)`

See the implementation README for the Codex quick-start and full example bundle: <https://github.com/jack-chaudier/tropical-mcp>

### 2) Serve the showcase site

```bash
cd ~/dreams
python3 -m http.server 8080
```

Open: `http://localhost:8080/site/`

## Deployment

- Live site: <https://dreams-dun.vercel.app>
- `vercel.json` routes `/` to static content in `site/`

## Quick Links

- Live site: <https://dreams-dun.vercel.app>
- Implementation repo: <https://github.com/jack-chaudier/tropical-mcp>
- Site source: [`site/`](./site/)
- Paper bundle: [`papers/`](./papers/)
- Repro artifacts: [`results/`](./results/)
- Notebook workspace: [`notebooks/`](./notebooks/)
- Credibility notes: [`docs/CREDIBILITY_NOTES.md`](./docs/CREDIBILITY_NOTES.md)
- Zenodo upload notes: [`README_ZENODO.md`](./README_ZENODO.md)
- Canonical MCP repo: <https://github.com/jack-chaudier/tropical-mcp>
