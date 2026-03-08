# Theory Status

This note keeps the public MirageKit theory language aligned with the shipped software and replay artifacts.

## Current software-facing contract

- The public implementation and certificate flow support a witness-preserving, threshold-`k` contract.
- In practical terms, the release is about whether protected pivot structure survives compaction under explicit budget pressure, not about a universal optimality guarantee across all possible summary algebras.
- The operational source of truth for that behavior is the `tropical-mcp` implementation plus its validation and certificate outputs.

## What the public bundle supports today

- The deterministic replay witness shows that naive recency can preserve answerability while losing pivot integrity.
- The guarded policy preserves the protected arc on the committed witness fixture.
- The implementation exposes feasibility, protected-chunk retention, and certificate artifacts directly enough for independent inspection.

## What remains conjectural or open

- The stronger statement that L2 is an initial object in a category of valid summaries remains conjectural in the public theory draft.
- That conjecture is not required for the release's software claim, replay claim, or certificate workflow.
- When public wording needs to be conservative, prefer the threshold-`k`, witness-preserving phrasing used in the implementation docs.

## How to read the theory paper

- `papers/paper_i_tropical_algebra.pdf` should be read as a working paper, not as a finalized proof of every stronger categorical interpretation mentioned in the draft.
- The lower-bound and optimality statements at the thresholded feasibility level are the parts that support the current public implementation story.
- If a reader finds tension between the theory draft and the implementation surface, the implementation contract and this note take precedence for release-facing interpretation.
