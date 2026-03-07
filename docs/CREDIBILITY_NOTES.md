# Credibility Notes

This file exists to keep interpretation conservative, explicit, and easy to audit.

## What this repo claims

- Naive context compression can preserve answerability while losing pivot integrity.
- Guarded retention policies can preserve pivot-critical structure on the committed replay witness.
- The public bundle includes enough raw artifacts to check the witness, validation path, and certificate shape directly.

## What this repo does not claim

- Universal model-agnostic guarantees.
- Exhaustive real-world validation from the small committed public witness.
- That every paper-level result is reproduced by the small `results/replay/` bundle alone.

## Evidence profile

- Strongest public evidence: deterministic replay witness (`n=3` per policy and retention fraction) plus mirrored `tropical-mcp` validation logs in `results/`.
- Broader paper-level evidence: the working papers in `papers/` discuss larger synthetic sweeps, streaming studies, theory, and limited real-incident analyses with their own denominators and caveats.
- Binary rates on the site are exact proportions on the committed witness fixture, not smoothed benchmark averages.

## Release framing

- This is the first public release of the MirageKit research surface.
- `dreams` is the public showcase.
- `tropical-mcp` is the public evaluation implementation.
- The larger MirageKit research monorepo remains private and is not required to inspect the released artifacts.
