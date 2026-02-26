#!/usr/bin/env python3
"""Integrity checks for the public dreams showcase and paper release bundle."""

from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path
from typing import Iterable

ROOT = Path(__file__).resolve().parents[1]

PAPER_SPECS = {
    "paper_01_absorbing_states_in_greedy_search": {
        "pdf": ROOT / "papers" / "paper_01_absorbing_states_in_greedy_search.pdf",
        "tex": ROOT / "papers" / "sources" / "paper_01_main.tex",
        "title": "Absorbing States in Greedy Search: When Endogenous Constraints Break Sequential Extraction",
        "author": "Jack Chaudier Gaffney",
    },
    "paper_02_streaming_oscillation_traps": {
        "pdf": ROOT / "papers" / "paper_02_streaming_oscillation_traps.pdf",
        "tex": ROOT / "papers" / "sources" / "paper_02_main.tex",
        "title": "Streaming Oscillation Traps in Endogenous-Pivot Sequential Extraction",
        "author": "Jack Chaudier Gaffney",
    },
    "paper_03_validity_mirage_compression": {
        "pdf": ROOT / "papers" / "paper_03_validity_mirage_compression.pdf",
        "tex": ROOT / "papers" / "sources" / "paper_03_main.tex",
        "title": "The Validity Mirage: Context Algebra for Endogenous Semantics under Memory Compression",
        "author": "Jack Chaudier Gaffney",
    },
    "paper_i_tropical_algebra": {
        "pdf": ROOT / "papers" / "paper_i_tropical_algebra.pdf",
        "tex": ROOT / "papers" / "sources" / "paper_i_main.tex",
        "title": "Tropical Algebra of Endogenous-Pivot Semantics: Absorbing States, Necessity, and the Record-Gap Spectrum",
        "author": "Jack Chaudier Gaffney",
    },
}

TEXT_SUFFIXES = {
    ".md",
    ".txt",
    ".json",
    ".toml",
    ".yaml",
    ".yml",
    ".py",
    ".js",
    ".css",
    ".html",
    ".tex",
    ".bib",
    ".cff",
}


def _load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def _run(cmd: list[str], cwd: Path | None = None) -> str:
    proc = subprocess.run(
        cmd,
        cwd=str(cwd) if cwd else None,
        capture_output=True,
        text=True,
        check=False,
    )
    if proc.returncode != 0:
        raise AssertionError(
            f"Command failed ({' '.join(cmd)}):\nstdout:\n{proc.stdout}\nstderr:\n{proc.stderr}"
        )
    return proc.stdout


def _assert(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def _parse_pdfinfo(text: str) -> dict[str, str]:
    out: dict[str, str] = {}
    for line in text.splitlines():
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        out[key.strip().lower()] = value.strip()
    return out


def _iter_tracked_text_files() -> Iterable[Path]:
    tracked = _run(["git", "ls-files"], cwd=ROOT).splitlines()
    for rel in tracked:
        path = ROOT / rel
        if path.exists() and path.suffix.lower() in TEXT_SUFFIXES:
            yield path


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


def check_headline_claim_regressions() -> None:
    replay = _load_json(ROOT / "results" / "replay" / "replay_summary.json")
    rows = {
        (str(row["policy"]), float(row["fraction"])): row
        for row in replay["summary"]
    }

    for fraction in (0.65, 0.5, 0.4):
        l2 = rows[("l2_guarded", fraction)]
        recency = rows[("recency", fraction)]
        _assert(
            float(l2["pivot_preservation_rate"]) == 1.0,
            f"l2_guarded pivot preservation must stay 1.0 at fraction={fraction}",
        )
        _assert(
            float(l2["primary_full_rate"]) == 1.0,
            f"l2_guarded primary_full_rate must stay 1.0 at fraction={fraction}",
        )
        _assert(
            float(l2["contract_satisfied_rate"]) == 1.0,
            f"l2_guarded contract_satisfied_rate must stay 1.0 at fraction={fraction}",
        )
        _assert(
            float(recency["pivot_preservation_rate"]) == 0.0,
            f"recency pivot preservation must stay 0.0 at fraction={fraction}",
        )
        _assert(
            float(recency["primary_full_rate"]) == 0.0,
            f"recency primary_full_rate must stay 0.0 at fraction={fraction}",
        )

    summary_md = (ROOT / "results" / "VALIDATION_SUMMARY.md").read_text(encoding="utf-8")
    _assert("30 passed" in summary_md, "VALIDATION_SUMMARY must report 30 passed tests")


def check_certificate_sync() -> None:
    source = _load_json(ROOT / "results" / "certificates" / "memory_safety_certificate.json")
    site = _load_json(ROOT / "site" / "data_certificate.json")
    _assert(source == site, "Site certificate JSON is out of sync with results certificate")


def check_private_path_leaks() -> None:
    forbidden = ["../mirage/", "/Users/jackg/mirage", "/Users/jackg/dreams/../mirage"]
    for path in _iter_tracked_text_files():
        if path.resolve() == Path(__file__).resolve():
            continue
        text = path.read_text(encoding="utf-8")
        for token in forbidden:
            _assert(token not in text, f"Forbidden private path reference in {path}: {token}")


def check_structure() -> None:
    _assert((ROOT / "notebooks" / "README.md").exists(), "notebooks/README.md missing")
    _assert((ROOT / "tests" / "README.md").exists(), "tests/README.md missing")
    _assert((ROOT / "CITATION.cff").exists(), "CITATION.cff missing")
    _assert((ROOT / ".zenodo.json").exists(), ".zenodo.json missing")
    _assert((ROOT / "papers" / "LICENSE_CC_BY_4_0.md").exists(), "papers LICENSE_CC_BY_4_0.md missing")


def check_no_symlinks_in_public_bundle() -> None:
    for folder in [ROOT / "papers", ROOT / "site", ROOT / "results"]:
        for path in folder.rglob("*"):
            _assert(not path.is_symlink(), f"Symlink not allowed in public bundle: {path}")


def check_zenodo_and_citation_consistency() -> None:
    zenodo = _load_json(ROOT / ".zenodo.json")
    cff_text = (ROOT / "CITATION.cff").read_text(encoding="utf-8")

    _assert(zenodo.get("upload_type") == "publication", "Zenodo upload_type must be publication")
    _assert(
        zenodo.get("publication_type") == "workingpaper",
        "Zenodo publication_type must be workingpaper",
    )
    _assert(zenodo.get("license") == "CC-BY-4.0", "Zenodo license must be CC-BY-4.0")
    _assert("license: CC-BY-4.0" in cff_text, "CITATION.cff license must be CC-BY-4.0")

    cff_title_match = re.search(r'^title:\s*"([^"]+)"', cff_text, flags=re.MULTILINE)
    _assert(cff_title_match is not None, "CITATION.cff missing top-level title")
    _assert(
        zenodo.get("title") == cff_title_match.group(1),
        "CITATION.cff and .zenodo.json titles must match",
    )

    _assert(
        "repository-code: \"https://github.com/jack-chaudier/dreams\"" in cff_text,
        "CITATION.cff repository-code must reference dreams repo",
    )
    _assert(
        any(item.get("identifier") == "https://github.com/jack-chaudier/dreams" for item in zenodo.get("related_identifiers", [])),
        "Zenodo related_identifiers must include dreams repo URL",
    )

    preprint_refs = len(re.findall(r"status:\s*preprint", cff_text))
    _assert(preprint_refs >= 4, "CITATION.cff should include references to papers 1/2/3/I as preprints")


def check_paper_sources() -> None:
    for key, spec in PAPER_SPECS.items():
        tex_path = spec["tex"]
        _assert(tex_path.exists(), f"{key}: missing TeX source {tex_path}")
        text = tex_path.read_text(encoding="utf-8")
        _assert(
            "Working Paper (First Draft)" in text,
            f"{key}: source must include Working Paper (First Draft) marker",
        )
        _assert(
            "creativecommons.org/licenses/by/4.0/" in text,
            f"{key}: source must include CC-BY 4.0 license link",
        )
        for token in ["pdftitle={", "pdfauthor={", "pdfsubject={"]:
            _assert(token in text, f"{key}: source missing PDF metadata token {token}")


def check_paper_figure_assets() -> None:
    include_pattern = re.compile(r"\\includegraphics(?:\[[^\]]*\])?\{([^}]+)\}")
    for key, spec in PAPER_SPECS.items():
        tex_path = spec["tex"]
        text = tex_path.read_text(encoding="utf-8")
        refs = include_pattern.findall(text)
        for ref in refs:
            _assert(".." not in ref, f"{key}: figure reference must not traverse upward: {ref}")
            asset = tex_path.parent / ref
            _assert(asset.exists(), f"{key}: missing figure asset referenced by TeX: {asset}")


def check_paper_pdfs() -> None:
    for key, spec in PAPER_SPECS.items():
        pdf_path = spec["pdf"]
        _assert(pdf_path.exists(), f"{key}: missing PDF {pdf_path}")

        info = _parse_pdfinfo(_run(["pdfinfo", str(pdf_path)]))
        _assert(spec["title"] == info.get("title", ""), f"{key}: PDF title mismatch")
        _assert(spec["author"] == info.get("author", ""), f"{key}: PDF author mismatch")
        _assert("pages" in info, f"{key}: missing page count in PDF metadata")
        _assert(int(info["pages"]) >= 8, f"{key}: PDF looks unexpectedly short ({info['pages']} pages)")

        page_text = _run(["pdftotext", "-f", "1", "-l", "1", str(pdf_path), "-"])
        _assert(
            "Working Paper (First Draft)" in page_text,
            f"{key}: first page must visibly show Working Paper (First Draft)",
        )
        _assert("CC-BY 4.0" in page_text, f"{key}: first page must visibly show CC-BY 4.0")

    for pdf in (ROOT / "papers").glob("paper_*.pdf"):
        _assert("draft" not in pdf.name.lower(), f"Published PDF filename should not contain 'draft': {pdf.name}")


def main() -> None:
    check_replay_vs_site()
    check_headline_claim_regressions()
    check_certificate_sync()
    check_private_path_leaks()
    check_structure()
    check_no_symlinks_in_public_bundle()
    check_zenodo_and_citation_consistency()
    check_paper_sources()
    check_paper_figure_assets()
    check_paper_pdfs()
    print("dreams integrity checks passed")


if __name__ == "__main__":
    main()
