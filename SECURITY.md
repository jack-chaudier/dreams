# Security Policy

`dreams` is a static public research showcase, but release-surface security still matters because the repository, website, and bundled artifacts are meant to be shared directly with researchers, labs, and press.

## Report privately

Please do not use public issues for sensitive reports. Send responsible-disclosure reports to <mailto:jackgaff@umich.edu> with:

- a short description of the issue
- affected files, pages, or bundle paths
- reproduction steps or screenshots when relevant
- any suggested mitigation

I will acknowledge receipt and work to confirm the issue quickly.

## In scope

- accidental disclosure of credentials, tokens, local paths, or unpublished material
- site-level issues in `site/` or deployment configuration that weaken the public surface
- bundle-generation mistakes that could publish unintended files
- checksum or integrity-manifest mismatches in released artifacts

## Out of scope

- disagreements with research conclusions that do not create a security or privacy issue
- copy edits or theory clarifications that do not affect confidentiality, integrity, or deployment behavior
- problems in third-party platforms that are outside this repository's control

## Release-day maintainer checklist

- run `python3 scripts/validate_artifacts.py`
- run `./scripts/update_public_checksums.sh`
- confirm there are no external font, script, or asset dependencies in `site/`
- confirm no secrets or local scratch files are tracked
- verify the website still renders correctly after any security-header changes
