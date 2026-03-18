# dreams: The Validity Mirage

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.18794293.svg)](https://doi.org/10.5281/zenodo.18794293)

When AI agents compress long conversations to save memory, they can silently lose track of which task they're solving — while still answering confidently. We call this the **validity mirage**.

**[See it live](https://dreams-dun.vercel.app)** — interactive demo, research papers, and reproducible evidence.

## Try it yourself

```bash
pip install tropical-mcp
tropical-mcp-smoke
# certificate shows kept/dropped message IDs
```

Works with Claude Code, Codex, and any MCP-compatible client. See the [implementation repo](https://github.com/jack-chaudier/tropical-mcp) for full documentation.

## Verify the claims

```bash
git clone https://github.com/jack-chaudier/tropical-mcp.git ~/tropical-mcp
cd ~/tropical-mcp && git checkout v0.2.1
uv venv && source .venv/bin/activate
uv pip install -e '.[dev]'
uv run --extra dev pytest -vv
uv run tropical-mcp-full-validate
```

Reproduce the archival surface:

```bash
git clone https://github.com/jack-chaudier/dreams.git ~/dreams
cd ~/dreams && git checkout v0.1.1
python3 scripts/validate_artifacts.py
```

## Read the research

| # | Paper | Focus |
|---|-------|-------|
| 03 | [The Validity Mirage](https://dreams-dun.vercel.app/papers/paper_03_validity_mirage_compression.pdf) | Core problem definition and empirical measurement |
| 00 | [Continuous Control](https://dreams-dun.vercel.app/papers/paper_00_continuous_control.pdf) | Foundational retention model |
| 01 | [Absorbing States](https://dreams-dun.vercel.app/papers/paper_01_absorbing_states.pdf) | Irreversibility conditions for context loss |
| 02 | [Streaming Traps](https://dreams-dun.vercel.app/papers/paper_02_streaming_traps.pdf) | Streaming-specific failure modes |
| I  | [Tropical Algebra](https://dreams-dun.vercel.app/papers/paper_i_tropical_algebra.pdf) | Mathematical foundation for guarded compaction |

## Repository structure

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

## Citation

```bibtex
@misc{gaffney2026validity,
  author       = {Gaffney, Jack Chaudier},
  title        = {The Validity Mirage: Silent Task Drift Under AI Context Compression},
  year         = {2026},
  publisher    = {Zenodo},
  doi          = {10.5281/zenodo.18794293},
  url          = {https://doi.org/10.5281/zenodo.18794293}
}
```

## Links

- [Live site](https://dreams-dun.vercel.app) | [Evidence dossier](https://dreams-dun.vercel.app/evidence) | [Papers](https://dreams-dun.vercel.app/papers)
- [tropical-mcp implementation](https://github.com/jack-chaudier/tropical-mcp)
- [Correspondence](mailto:jackgaff@umich.edu) | [X / updates](https://x.com/J_C_Gaffney)
