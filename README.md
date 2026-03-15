# dreams: MirageKit Public Showcase

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.18794293.svg)](https://doi.org/10.5281/zenodo.18794293)

First public release of the MirageKit research surface: website, working-paper bundle, replay witness, certificate snapshots, and mirrored validation artifacts for the companion [`tropical-mcp`](https://github.com/jack-chaudier/tropical-mcp) evaluation repo.

## 15-Second Map

`MirageKit` is the research program. It spans four public repos, each owning one layer:

| Repo | Layer | What it owns |
|------|-------|--------------|
| [`stark`](https://github.com/jack-chaudier/stark) | Theory | Structural regularization and the algebraic foundations behind the mirage |
| [`dreams`](https://github.com/jack-chaudier/dreams) | Evidence | This site, paper bundle, replay witness, and reproducible artifacts |
| [`tropical-mcp`](https://github.com/jack-chaudier/tropical-mcp) | Implementation | Source-available MCP server for guarded compaction in Codex and Claude-style clients |
| [`immortal-baby`](https://github.com/jack-chaudier/immortal-baby) | Product / Runtime | Runtime artifact and experiments that close the loop from theory to deployed agent |

If you want to verify the implementation directly, use `runtime_info()`, `compact_auto(...)`, and `certificate(...)` as the minimum smoke flow; for a fuller review add `diagnose(...)`, `context_anchor(...)`, and `telemetry_summary(...)`.

## Public Release Status

- This repository is the public evidence surface, not the private MirageKit research monorepo.
- The DOI-backed `dreams` archive currently corresponds to `dreams v0.1.1`.
- The mirrored implementation validation in this repository currently tracks `tropical-mcp v0.2.1`.
- `main` can move ahead of the archived release; use the version map below when you want archival reproduction rather than latest development state.

## Scope and Boundaries

- `dreams` is the public front door: live site, paper bundle, replay witness, and committed evidence.
- The full MirageKit research monorepo remains private.
- The canonical evaluation MCP implementation is maintained in `tropical-mcp`.
- This repo is intentionally evidence-first: public-facing claims should trace back to committed files in `results/`, `papers/`, or `site/`.

## Repository Contents

```text
/dreams
├── site/                     # Vercel-ready interactive showcase
├── papers/                   # Working paper PDFs + selected TeX/Bib sources
├── results/                  # Reproducible witness + mirrored validation artifacts
├── notebooks/                # Colab/local notebook workspace scaffold
├── tests/                    # Public-surface validation notes
├── mcp/                      # Canonical MCP source-of-truth pointer
├── docs/                     # Public-facing interpretation + maintainer maps
└── README.md
```

## Evidence Snapshot

Source witness: `results/replay/replay_summary.json`

- Deterministic replay witness: `n=3` variants per policy and retention fraction.
- At retention fractions `0.65`, `0.5`, and `0.4`:
  - `l2_guarded` pivot preservation = **1.0**
  - `recency` pivot preservation = **0.0**
- At `0.8`, recency is topology-sensitive in this fixture (`0.3333`) while `l2_guarded` stays at `1.0`.

Mirrored implementation validation from `tropical-mcp v0.2.1`:

- `ruff check .`: clean
- `mypy src/tropical_mcp`: clean
- `pytest`: **61 passed**
- `uv build`: wheel + sdist successful
- `./scripts/validate_installed_wheel.sh`: installed wheel validation passed
- `uv run tropical-mcp-full-validate`: MCP-facing validation report passed

Research-facing summary: <https://dreams-dun.vercel.app/evidence>
Raw validation summary: [`results/VALIDATION_SUMMARY.md`](./results/VALIDATION_SUMMARY.md)
Public surface map: [`docs/PUBLIC_SURFACE_MAP.md`](./docs/PUBLIC_SURFACE_MAP.md)

## New Empirical Result

The public bundle now also includes a full long-context mirage-shelf experiment on Grok:

- Normal-condition answer accuracy declines from `0.825` at `4K` to `0.775` at `512K`
- Normal-condition witness fidelity declines from `0.7867` at `4K` to `0.5533` at `512K`
- The mirage gap widens from `+0.0383` at `4K` to `+0.2217` at `512K`
- In the witness-removed causal control, answer accuracy falls to `0.315` at `4K` and `0.275` at `256K`

Canonical bundle: [`results/mirage-shelf-grok-2026-03/README.md`](./results/mirage-shelf-grok-2026-03/README.md)
Public page: <https://dreams-dun.vercel.app/mirage-shelf-grok-2026-03>

## Interpretation Notes

- The strongest public evidence in this repo is the deterministic replay witness plus the mirrored validation logs in `results/`.
- Broader model counts, streaming studies, and real-incident analyses live in the working papers and should be read as paper-level evidence, not as part of the small committed replay witness.
- Caveats and conservative framing live in [`docs/CREDIBILITY_NOTES.md`](./docs/CREDIBILITY_NOTES.md).
- When prose and machine-readable artifacts diverge, use [`docs/SOURCE_OF_TRUTH.md`](./docs/SOURCE_OF_TRUTH.md).
- Public artifact integrity is tracked in [`papers/SHA256SUMS.txt`](./papers/SHA256SUMS.txt) and [`results/SHA256SUMS.txt`](./results/SHA256SUMS.txt).

## Reviewer Start Points

- Artifact index: [`docs/ARTIFACT_INDEX.md`](./docs/ARTIFACT_INDEX.md)
- Source-of-truth map: [`docs/SOURCE_OF_TRUTH.md`](./docs/SOURCE_OF_TRUTH.md)
- Theory-status boundary: [`docs/THEORY_STATUS.md`](./docs/THEORY_STATUS.md)
- Public surface map: [`docs/PUBLIC_SURFACE_MAP.md`](./docs/PUBLIC_SURFACE_MAP.md)
- Results bundle guide: [`results/README.md`](./results/README.md)
- Papers bundle guide: [`papers/README.md`](./papers/README.md)

## Published Version Map

- `dreams` archival release: [`v0.1.1`](https://github.com/jack-chaudier/dreams/releases/tag/v0.1.1)
- `tropical-mcp` mirrored validation release: [`v0.2.1`](https://github.com/jack-chaudier/tropical-mcp/releases/tag/v0.2.1)
- DOI-backed working-paper record: <https://doi.org/10.5281/zenodo.18794293>

## Local Reproduction

### 1) Reproduce the published `tropical-mcp` validation surface

```bash
git clone https://github.com/jack-chaudier/tropical-mcp.git ~/tropical-mcp
cd ~/tropical-mcp
git checkout v0.2.1
uv venv
source .venv/bin/activate
uv pip install -e '.[dev]'
uv run --extra dev ruff check .
uv run --extra dev mypy src/tropical_mcp
uv run --extra dev pytest -vv
uv build
./scripts/validate_installed_wheel.sh
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

For a fuller reviewer pass, extend the sequence to:

- `runtime_info()`
- `diagnose(...)`
- `context_anchor(...)`
- `compact_auto(...)`
- `certificate(...)`
- `telemetry_summary(...)`

See the implementation README for the Codex quick-start, license boundary, and full example bundle: <https://github.com/jack-chaudier/tropical-mcp>

### 2) Reproduce the archival `dreams` surface

```bash
git clone https://github.com/jack-chaudier/dreams.git ~/dreams
cd ~/dreams
git checkout v0.1.1
python3 scripts/validate_artifacts.py
python3 -m http.server 8080
```

Open: `http://localhost:8080/site/`

## Deployment

- Live site: <https://dreams-dun.vercel.app>
- `vercel.json` routes `/` to static content in `site/`

## Quick Links

- Live site: <https://dreams-dun.vercel.app>
- Flagship paper: <https://dreams-dun.vercel.app/papers/paper_03_validity_mirage_compression.pdf>
- Evidence dossier: <https://dreams-dun.vercel.app/evidence>
- Grok mirage-shelf experiment: <https://dreams-dun.vercel.app/mirage-shelf-grok-2026-03>
- Implementation repo: <https://github.com/jack-chaudier/tropical-mcp>
- Site source: [`site/`](./site/)
- Paper bundle: [`papers/`](./papers/)
- Repro artifacts: [`results/`](./results/)
- Grok experiment bundle: [`results/mirage-shelf-grok-2026-03/`](./results/mirage-shelf-grok-2026-03/)
- Notebook workspace: [`notebooks/`](./notebooks/)
- Interpretation notes: [`docs/CREDIBILITY_NOTES.md`](./docs/CREDIBILITY_NOTES.md)
- Artifact index: [`docs/ARTIFACT_INDEX.md`](./docs/ARTIFACT_INDEX.md)
- Source-of-truth map: [`docs/SOURCE_OF_TRUTH.md`](./docs/SOURCE_OF_TRUTH.md)
- Theory-status boundary: [`docs/THEORY_STATUS.md`](./docs/THEORY_STATUS.md)
- Public surface map: [`docs/PUBLIC_SURFACE_MAP.md`](./docs/PUBLIC_SURFACE_MAP.md)
- Papers checksum manifest: [`papers/SHA256SUMS.txt`](./papers/SHA256SUMS.txt)
- Results checksum manifest: [`results/SHA256SUMS.txt`](./results/SHA256SUMS.txt)
- Artifact refresh entry point: [`scripts/refresh_validation_artifacts.sh`](./scripts/refresh_validation_artifacts.sh)
- Checksum refresh entry point: [`scripts/update_public_checksums.sh`](./scripts/update_public_checksums.sh)
- Zenodo upload notes: [`README_ZENODO.md`](./README_ZENODO.md)
- Correspondence: <mailto:jackgaff@umich.edu>
- X / launch updates: <https://x.com/J_C_Gaffney>
