# Dreams: MirageKit + Tropical Context Safety

A clean, public-facing repository for demonstrating and sharing work on long-context reliability:

- **MirageKit demo concept**: interactive validity-mirage visualization and safety certificates
- **tropical-mcp MCP server**: L2 tropical-algebra context compaction with guarded retention
- **paper bundle**: key papers and selected TeX sources
- **reproducible evidence**: benchmark/test outputs included in `results/`

## Why this repo exists

Most context compression demos report only answer quality. This project shows a harder truth:

- raw answer validity can stay high,
- while **semantic intent silently drifts** (pivot substitution),
- unless context retention is constrained by a structural contract.

This repo is organized for sharing with researchers/engineers at AI labs, infra teams, and agent builders.

## Quick links

- Landing page (Vercel app source): [`site/`](./site/)
- Papers: [`papers/`](./papers/)
- Canonical MCP implementation: [`tropical-mcp`](https://github.com/jack-chaudier/tropical-mcp)
- Validation outputs: [`results/`](./results/)
- Collaboration/docs: [`docs/`](./docs/)

## Repo structure

```text
/dreams
├── site/                     # Vercel-ready showcase page
├── papers/                   # PDFs + selected source TeX
├── mcp/                      # pointers to canonical MCP repo
├── results/                  # reproducible benchmark and validation artifacts
├── docs/                     # collaboration and sharing notes
└── README.md
```

## Core evidence snapshot

From the included replay (`results/replay/replay_summary.json`):

- At retention fractions `0.65`, `0.5`, `0.4`:
  - `l2_guarded` pivot preservation = **1.0**
  - `recency` pivot preservation = **0.0**
- `pytest`: **30 passed** in the canonical `tropical-mcp` repository
- Packaging build: wheel + sdist built successfully

See full details in [`results/VALIDATION_SUMMARY.md`](./results/VALIDATION_SUMMARY.md).

## Run locally

### 1) MCP package checks

```bash
cd /absolute/path/to/tropical-mcp
uv run --extra dev pytest -q
uv build
uv run python scripts/run_full_validation.py
```

### 2) Serve the landing page

Any static server works. Example:

```bash
cd ./site
python3 -m http.server 8080
```

Open: `http://localhost:8080`

## Deploy to Vercel

The page is static and deploy-ready.

1. Import this repo into Vercel.
2. Keep the project root as this repository root (default).
3. Deploy.

`vercel.json` maps `/` to the static app in `site/`.

## Suggested outreach payload

Use this repo as a 3-link package:

1. landing page (fast wow)
2. paper links (mechanism and proofs)
3. reproducible artifacts + MCP implementation

Templates are in [`docs/CONTACT.md`](./docs/CONTACT.md).
