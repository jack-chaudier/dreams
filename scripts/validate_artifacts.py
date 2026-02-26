#!/usr/bin/env python3
"""Lightweight integrity checks for the public dreams showcase."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def _load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def _assert(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def check_replay_vs_site() -> None:
    replay = _load_json(ROOT / "results" / "replay" / "replay_summary.json")
    site = _load_json(ROOT / "site" / "data_miragekit.json")

    replay_map = {}
    for row in replay["summary"]:
        replay_map[(str(row["policy"]), str(float(row["fraction"])))] = row

    for policy, fractions in site["policies"].items():
        for fraction, vals in fractions.items():
            key = (policy, str(float(fraction)))
            _assert(key in replay_map, f"Missing replay row for {key}")
            row = replay_map[key]

            fields = [
                ("pivot_preservation_rate", "pivot_preservation_rate"),
                ("primary_full_rate", "primary_full_rate"),
                ("decoy_full_rate", "decoy_full_rate"),
                ("contract_satisfied_rate", "contract_satisfied_rate"),
            ]
            for site_field, replay_field in fields:
                lhs = float(vals[site_field])
                rhs = float(row[replay_field])
                _assert(
                    abs(lhs - rhs) <= 1e-12,
                    f"Mismatch for {policy} {fraction} {site_field}: {lhs} != {rhs}",
                )


def check_certificate_sync() -> None:
    source = _load_json(ROOT / "results" / "certificates" / "memory_safety_certificate.json")
    site = _load_json(ROOT / "site" / "data_certificate.json")
    _assert(source == site, "Site certificate JSON is out of sync with results certificate")


def check_private_path_leaks() -> None:
    scanned_files = [
        ROOT / "README.md",
        ROOT / "results" / "README.md",
        ROOT / "mcp" / "README.md",
        ROOT / "docs" / "CONTACT.md",
        ROOT / "docs" / "SHARE_CHECKLIST.md",
        ROOT / "docs" / "CREDIBILITY_NOTES.md",
    ]
    forbidden = ["../mirage/", "/Users/jackg/mirage", "tropical-compactor"]

    for path in scanned_files:
        text = path.read_text(encoding="utf-8")
        for token in forbidden:
            _assert(token not in text, f"Forbidden private/internal reference in {path}: {token}")


def check_structure() -> None:
    _assert((ROOT / "notebooks" / "README.md").exists(), "notebooks/README.md missing")
    _assert((ROOT / "tests" / "README.md").exists(), "tests/README.md missing")


def main() -> None:
    check_replay_vs_site()
    check_certificate_sync()
    check_private_path_leaks()
    check_structure()
    print("dreams integrity checks passed")


if __name__ == "__main__":
    main()
