#!/usr/bin/env python3
"""Integrity checks for the public dreams showcase and paper release bundle."""

from __future__ import annotations

import json
import re
import subprocess  # nosec B404 - used only for controlled local tooling checks
from hashlib import sha256
from functools import cache
from pathlib import Path
from typing import Iterable

ROOT = Path(__file__).resolve().parents[1]

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
    ".svg",
}

PRIVATE_PATH_PATTERNS = (
    re.compile(r"/Users/[^\s\"'<>`]+"),
    re.compile(r"/home/[^\s\"'<>`]+"),
    re.compile(r"[A-Za-z]:\\\\Users\\\\[^\s\"'<>`]+"),
)
PARENT_RELATIVE_PATH_PATTERN = re.compile(r"\.\./[A-Za-z0-9._-]+/")
ALLOWED_PARENT_RELATIVE_PATHS = {
    "../docs/",
    "../dreams/",
    "../results/",
    "../tropical-mcp/",
}

REQUIRED_PUBLIC_DOCS = {
    "docs/ARTIFACT_INDEX.md",
    "docs/CREDIBILITY_NOTES.md",
    "docs/PUBLIC_SURFACE_MAP.md",
    "docs/SOURCE_OF_TRUTH.md",
    "docs/THEORY_STATUS.md",
}

REQUIRED_ROOT_DOCS = {
    "CONTRIBUTING.md",
    "SECURITY.md",
    "CODE_OF_CONDUCT.md",
    "SUPPORT.md",
}

MANIFEST_EXCLUDED_SUFFIXES = {".aux", ".bbl", ".blg", ".log", ".out"}


def _load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def _run(cmd: list[str], cwd: Path | None = None) -> str:
    proc = subprocess.run(  # nosec B603 - executes fixed local commands with no shell expansion
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


def _is_manifest_file(path: Path) -> bool:
    if not path.is_file() or path.name == "SHA256SUMS.txt":
        return False
    if path.suffix.lower() in MANIFEST_EXCLUDED_SUFFIXES:
        return False
    return True


@cache
def _public_release_map() -> dict[str, str]:
    site = _load_json(ROOT / "site" / "data_miragekit.json")
    release = site.get("public_release")
    _assert(
        isinstance(release, dict),
        "site/data_miragekit.json must define a public_release object",
    )

    dreams_version = str(release.get("dreams_version", "")).strip()
    tropical_version = str(release.get("tropical_mcp_version", "")).strip()
    _assert(dreams_version, "site/data_miragekit.json must define public_release.dreams_version")
    _assert(
        tropical_version,
        "site/data_miragekit.json must define public_release.tropical_mcp_version",
    )
    return {
        "dreams_version": dreams_version,
        "tropical_mcp_version": tropical_version,
    }


@cache
def _paper_specs() -> dict[str, dict[str, object]]:
    manifest = _load_json(ROOT / "papers" / "manifest.json")
    papers = manifest.get("papers")
    _assert(isinstance(papers, list) and papers, "papers/manifest.json must define at least one paper")

    specs: dict[str, dict[str, object]] = {}
    for entry in papers:
        _assert(isinstance(entry, dict), "Each paper manifest entry must be an object")
        key = str(entry.get("key", "")).strip()
        pdf = str(entry.get("pdf", "")).strip()
        tex = str(entry.get("tex", "")).strip()
        title = str(entry.get("title", "")).strip()
        author = str(entry.get("author", "")).strip()
        _assert(key and pdf and tex and title and author, f"Incomplete paper manifest entry: {entry}")
        specs[key] = {
            "pdf": ROOT / pdf,
            "tex": ROOT / tex,
            "title": title,
            "author": author,
        }
    return specs


def _public_site_base() -> str:
    zenodo = _load_json(ROOT / ".zenodo.json")
    for item in zenodo.get("related_identifiers", []):
        if item.get("relation") == "isDocumentedBy":
            return str(item.get("identifier", "")).rstrip("/")
    raise AssertionError(".zenodo.json must define an isDocumentedBy public site URL")


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
    rows = {(str(row["policy"]), float(row["fraction"])): row for row in replay["summary"]}

    for fraction in (0.65, 0.5, 0.4):
        l2 = rows[("l2_guarded", fraction)]
        recency = rows[("recency", fraction)]
        _assert(int(l2["n"]) == 3, f"l2_guarded must report n=3 at fraction={fraction}")
        _assert(int(recency["n"]) == 3, f"recency must report n=3 at fraction={fraction}")
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
    _assert("n=3" in summary_md, "VALIDATION_SUMMARY must explain the deterministic witness denominator")
    _assert(
        re.search(r"\d+ passed", summary_md) is not None,
        "VALIDATION_SUMMARY must report a pytest pass count (e.g. 'N passed')",
    )


def check_validation_logs() -> None:
    ruff_text = (ROOT / "results" / "ruff.txt").read_text(encoding="utf-8")
    mypy_text = (ROOT / "results" / "mypy.txt").read_text(encoding="utf-8")
    pytest_text = (ROOT / "results" / "pytest.txt").read_text(encoding="utf-8")
    build_text = (ROOT / "results" / "build.txt").read_text(encoding="utf-8")
    wheel_text = (ROOT / "results" / "installed_wheel.txt").read_text(encoding="utf-8")
    full_validation = _load_json(ROOT / "results" / "full_validation.json")
    tropical_version = _public_release_map()["tropical_mcp_version"]
    sdist_name = f"tropical_mcp-{tropical_version}.tar.gz"
    wheel_name = f"tropical_mcp-{tropical_version}-py3-none-any.whl"

    _assert("All checks passed!" in ruff_text, "results/ruff.txt must show a clean Ruff run")
    _assert(
        "Success: no issues found" in mypy_text,
        "results/mypy.txt must show a clean mypy run",
    )
    pytest_match = re.search(r"(\d+) passed", pytest_text)
    _assert(pytest_match is not None, "results/pytest.txt must include a pass count")
    _assert(
        f"Successfully built dist/{sdist_name}" in build_text,
        f"results/build.txt must include the built sdist ({sdist_name})",
    )
    _assert(
        f"Successfully built dist/{wheel_name}" in build_text,
        f"results/build.txt must include the built wheel ({wheel_name})",
    )
    _assert(
        f"Installed wheel validation passed for {wheel_name}" in wheel_text,
        f"results/installed_wheel.txt must confirm the built wheel validates after install ({wheel_name})",
    )
    _assert(
        str(full_validation["certificate_fixture"]["fixture"]).startswith("package:fixtures/"),
        "results/full_validation.json should expose packaged fixture refs",
    )
    _assert(
        str(full_validation["policy_invariance"]["fixture"]).startswith("package:fixtures/"),
        "results/full_validation.json should expose packaged fixture refs",
    )
    _assert(
        full_validation["stdio_smoke"]["alive_for_1s"] is True,
        "results/full_validation.json must show a live stdio smoke check",
    )


def check_certificate_sync() -> None:
    source = _load_json(ROOT / "results" / "certificates" / "memory_safety_certificate.json")
    site = _load_json(ROOT / "site" / "data_certificate.json")
    _assert(source == site, "Site certificate JSON is out of sync with results certificate")


def check_private_path_leaks() -> None:
    forbidden = [
        "/absolute/path/to/",
        "/absolute/path/to/private-research-repo/",
        "file:///absolute/path/to/private-research-repo/",
    ]
    for path in _iter_tracked_text_files():
        if path.resolve() == Path(__file__).resolve():
            continue
        text = path.read_text(encoding="utf-8")
        for token in forbidden:
            _assert(token not in text, f"Forbidden private path reference in {path}: {token}")
        for pattern in PRIVATE_PATH_PATTERNS:
            match = pattern.search(text)
            if match is not None:
                raise AssertionError(f"Forbidden absolute local path in {path}: {match.group(0)}")
        for match in PARENT_RELATIVE_PATH_PATTERN.finditer(text):
            if match.group(0) not in ALLOWED_PARENT_RELATIVE_PATHS:
                raise AssertionError(
                    f"Forbidden parent-relative sibling path in {path}: {match.group(0)}"
                )


def check_public_docs_surface() -> None:
    docs_dir = ROOT / "docs"
    tracked_docs = {
        path.relative_to(ROOT).as_posix()
        for path in docs_dir.glob("*.md")
        if path.is_file()
    }
    _assert(
        REQUIRED_PUBLIC_DOCS.issubset(tracked_docs),
        f"docs/ must include the curated public notes {sorted(REQUIRED_PUBLIC_DOCS)}; found {sorted(tracked_docs)}",
    )


def check_checksum_manifests() -> None:
    for manifest_path in (ROOT / "papers" / "SHA256SUMS.txt", ROOT / "results" / "SHA256SUMS.txt"):
        entries = manifest_path.read_text(encoding="utf-8").splitlines()
        _assert(entries, f"{manifest_path.relative_to(ROOT)} must not be empty")

        expected_files = sorted(
            path.relative_to(ROOT).as_posix()
            for path in manifest_path.parent.rglob("*")
            if _is_manifest_file(path)
        )
        seen_files: list[str] = []

        for line in entries:
            _assert("  " in line, f"Malformed checksum line in {manifest_path.relative_to(ROOT)}: {line}")
            digest, rel = line.split("  ", 1)
            _assert(
                re.fullmatch(r"[0-9a-f]{64}", digest) is not None,
                f"Invalid SHA-256 digest in {manifest_path.relative_to(ROOT)}: {digest}",
            )
            target = ROOT / rel
            _assert(target.is_file(), f"Checksum target missing: {rel}")
            actual = sha256(target.read_bytes()).hexdigest()
            _assert(actual == digest, f"Checksum mismatch for {rel}")
            seen_files.append(rel)

        _assert(
            seen_files == expected_files,
            f"{manifest_path.relative_to(ROOT)} must cover exactly the files in {manifest_path.parent.relative_to(ROOT)}",
        )


def check_site_index_surface() -> None:
    site_base = _public_site_base()
    index_text = (ROOT / "site" / "index.html").read_text(encoding="utf-8")
    evidence_text = (ROOT / "site" / "evidence.html").read_text(encoding="utf-8")
    sitemap_text = (ROOT / "site" / "sitemap.xml").read_text(encoding="utf-8")
    robots_text = (ROOT / "site" / "robots.txt").read_text(encoding="utf-8")
    vercel = _load_json(ROOT / "vercel.json")
    headers = vercel.get("headers", [])
    rewrites = vercel.get("rewrites", [])
    header_map: dict[str, str] = {}
    for rule in headers:
        if rule.get("source") != "/(.*)":
            continue
        for item in rule.get("headers", []):
            header_map[str(item.get("key"))] = str(item.get("value"))

    _assert((ROOT / "site" / "evidence.html").exists(), "site/evidence.html missing")
    _assert((ROOT / "site" / "social-card.png").exists(), "site/social-card.png missing")
    _assert(
        f"{site_base}/evidence" in sitemap_text,
        "sitemap.xml must include the rendered evidence page",
    )
    _assert(
        f"{site_base}/results/VALIDATION_SUMMARY.md" not in sitemap_text,
        "sitemap.xml should not index raw validation markdown",
    )
    _assert(
        f"{site_base}/results/certificates/memory_safety_certificate.json" not in sitemap_text,
        "sitemap.xml should not index raw certificate JSON",
    )
    _assert("Disallow: /results/" in robots_text, "robots.txt should de-index raw result artifacts")
    _assert(
        {"source": "/evidence", "destination": "/site/evidence"} in rewrites,
        "vercel.json must route /evidence to site/evidence",
    )
    _assert("social-card.png" in index_text, "site/index.html must use the PNG social card")
    _assert("twitter:image:alt" in index_text, "site/index.html must define twitter:image:alt")
    _assert("og:image:alt" in index_text, "site/index.html must define og:image:alt")
    _assert("fonts.googleapis.com" not in index_text, "site/index.html must not depend on Google Fonts")
    _assert("fonts.gstatic.com" not in index_text, "site/index.html must not depend on Google Fonts")
    _assert("social-card.png" in evidence_text, "site/evidence.html must use the PNG social card")
    _assert("twitter:image:alt" in evidence_text, "site/evidence.html must define twitter:image:alt")
    _assert("og:image:alt" in evidence_text, "site/evidence.html must define og:image:alt")
    _assert("fonts.googleapis.com" not in evidence_text, "site/evidence.html must not depend on Google Fonts")
    _assert("fonts.gstatic.com" not in evidence_text, "site/evidence.html must not depend on Google Fonts")
    _assert("n=3" in evidence_text, "site/evidence.html must explain the replay witness denominator")
    _assert(
        "Content-Security-Policy" in header_map,
        "vercel.json must define a site-wide Content-Security-Policy header",
    )
    _assert(
        "default-src 'self'" in header_map["Content-Security-Policy"],
        "Content-Security-Policy must default to self",
    )
    _assert(
        "frame-ancestors 'none'" in header_map["Content-Security-Policy"],
        "Content-Security-Policy must deny framing",
    )
    _assert(
        "font-src 'self'" in header_map["Content-Security-Policy"],
        "Content-Security-Policy must keep fonts same-origin",
    )
    for key in (
        "Referrer-Policy",
        "X-Content-Type-Options",
        "X-Frame-Options",
        "Permissions-Policy",
        "Cross-Origin-Resource-Policy",
    ):
        _assert(key in header_map, f"vercel.json must define {key}")


def check_structure() -> None:
    required_paths = [
        ROOT / "notebooks" / "README.md",
        ROOT / "tests" / "README.md",
        ROOT / "CITATION.cff",
        ROOT / ".zenodo.json",
        ROOT / "README_ZENODO.md",
        ROOT / "papers" / "LICENSE_CC_BY_4_0.md",
        ROOT / "papers" / "BUILD_NOTES.md",
        ROOT / "papers" / "SHA256SUMS.txt",
        ROOT / "papers" / "manifest.json",
        ROOT / "results" / "ruff.txt",
        ROOT / "results" / "mypy.txt",
        ROOT / "results" / "pytest.txt",
        ROOT / "results" / "build.txt",
        ROOT / "results" / "installed_wheel.txt",
        ROOT / "results" / "full_validation.json",
        ROOT / "results" / "SHA256SUMS.txt",
        ROOT / "results" / "replay" / "README.md",
    ]
    for path in required_paths:
        _assert(path.exists(), f"Required public artifact missing: {path.relative_to(ROOT)}")

    for rel in REQUIRED_ROOT_DOCS:
        _assert((ROOT / rel).exists(), f"Required repo policy file missing: {rel}")


def check_no_symlinks_in_public_bundle() -> None:
    for folder in [ROOT / "papers", ROOT / "site", ROOT / "results"]:
        for path in folder.rglob("*"):
            _assert(not path.is_symlink(), f"Symlink not allowed in public bundle: {path}")


def check_zenodo_and_citation_consistency() -> None:
    zenodo = _load_json(ROOT / ".zenodo.json")
    cff_text = (ROOT / "CITATION.cff").read_text(encoding="utf-8")
    release = _public_release_map()

    _assert(zenodo.get("upload_type") == "publication", "Zenodo upload_type must be publication")
    _assert(
        zenodo.get("publication_type") == "workingpaper",
        "Zenodo publication_type must be workingpaper",
    )
    _assert(zenodo.get("license") == "cc-by-4.0", "Zenodo license must be cc-by-4.0")
    _assert("license: CC-BY-4.0" in cff_text, "CITATION.cff license must be CC-BY-4.0")
    _assert("type: software" in cff_text, "CITATION.cff type should be software for this repository")
    _assert("preferred-citation:" in cff_text, "CITATION.cff must define a preferred citation")
    _assert(
        zenodo.get("title") in cff_text,
        "CITATION.cff should include the Zenodo working-paper title in its preferred citation",
    )
    _assert(
        "10.5281/zenodo.18794293" in cff_text,
        "CITATION.cff must include the DOI-backed preferred citation",
    )

    cff_title_match = re.search(r'^title:\s*"([^"]+)"', cff_text, flags=re.MULTILINE)
    _assert(cff_title_match is not None, "CITATION.cff missing top-level title")
    _assert(
        "repository-code: \"https://github.com/jack-chaudier/dreams\"" in cff_text,
        "CITATION.cff repository-code must reference dreams repo",
    )
    _assert(
        any(
            item.get("identifier") == "https://github.com/jack-chaudier/dreams"
            for item in zenodo.get("related_identifiers", [])
        ),
        "Zenodo related_identifiers must include dreams repo URL",
    )
    relation_map = {
        str(item.get("identifier")): str(item.get("relation"))
        for item in zenodo.get("related_identifiers", [])
    }
    _assert(
        relation_map.get("https://github.com/jack-chaudier/dreams") == "isSupplementedBy",
        "Dreams repo related identifier should use relation isSupplementedBy",
    )
    _assert(
        relation_map.get("https://github.com/jack-chaudier/tropical-mcp") == "isSupplementedBy",
        "tropical-mcp related identifier should use relation isSupplementedBy",
    )
    _assert(
        relation_map.get(_public_site_base()) == "isDocumentedBy",
        "Live demo related identifier should use relation isDocumentedBy",
    )

    required_keywords = {"long-context", "memory-compression", "semantic-drift"}
    present_keywords = {str(k).strip().lower() for k in zenodo.get("keywords", [])}
    _assert(
        required_keywords.issubset(present_keywords),
        f".zenodo.json keywords must include: {sorted(required_keywords)}",
    )

    creators = zenodo.get("creators", [])
    _assert(creators and isinstance(creators, list), ".zenodo.json must include at least one creator")
    zenodo_orcid = str(creators[0].get("orcid", "")).strip()
    _assert(zenodo_orcid, ".zenodo.json creator ORCID must not be empty")
    _assert(
        re.match(r"^\d{4}-\d{4}-\d{4}-\d{4}$", zenodo_orcid) is not None,
        f".zenodo.json ORCID must be plain 16-digit form, got: {zenodo_orcid}",
    )

    cff_orcid_match = re.search(
        r'orcid:\s*"?(https://orcid\.org/(\d{4}-\d{4}-\d{4}-\d{4}))"?',
        cff_text,
    )
    _assert(cff_orcid_match is not None, "CITATION.cff must include an ORCID URL for the author")
    cff_orcid_id = cff_orcid_match.group(2)
    _assert(
        cff_orcid_id == zenodo_orcid,
        f"CITATION.cff ORCID ({cff_orcid_id}) must match .zenodo.json ORCID ({zenodo_orcid})",
    )

    preprint_refs = len(re.findall(r"status:\s*preprint", cff_text))
    _assert(
        preprint_refs >= len(_paper_specs()),
        f"CITATION.cff should include a preprint reference for each paper ({len(_paper_specs())} expected, found {preprint_refs})",
    )

    cff_version_match = re.search(r"^version:\s*([0-9.]+)", cff_text, flags=re.MULTILINE)
    _assert(cff_version_match is not None, "CITATION.cff should include a version field")
    _assert(
        zenodo.get("version") == cff_version_match.group(1),
        "CITATION.cff and .zenodo.json versions must match",
    )
    _assert(
        release["dreams_version"] == zenodo.get("version"),
        "site/data_miragekit.json public_release.dreams_version must match .zenodo.json version",
    )

    tags = [
        tag
        for tag in _run(["git", "tag", "--list", "v*", "--sort=version:refname"], cwd=ROOT).splitlines()
        if tag
    ]
    if tags:
        latest_tag = tags[-1]
        tag_version = latest_tag[1:] if latest_tag.startswith("v") else latest_tag
        _assert(
            zenodo.get("version") == tag_version,
            f".zenodo.json version ({zenodo.get('version')}) should match latest v-tag ({tag_version})",
        )


def check_paper_sources() -> None:
    for key, spec in _paper_specs().items():
        tex_path = Path(spec["tex"])
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
    for key, spec in _paper_specs().items():
        tex_path = Path(spec["tex"])
        text = tex_path.read_text(encoding="utf-8")
        refs = include_pattern.findall(text)
        for ref in refs:
            _assert(".." not in ref, f"{key}: figure reference must not traverse upward: {ref}")
            asset = tex_path.parent / ref
            _assert(asset.exists(), f"{key}: missing figure asset referenced by TeX: {asset}")


def check_paper_pdfs() -> None:
    for key, spec in _paper_specs().items():
        pdf_path = Path(spec["pdf"])
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
    check_validation_logs()
    check_certificate_sync()
    check_private_path_leaks()
    check_public_docs_surface()
    check_checksum_manifests()
    check_site_index_surface()
    check_structure()
    check_no_symlinks_in_public_bundle()
    check_zenodo_and_citation_consistency()
    check_paper_sources()
    check_paper_figure_assets()
    check_paper_pdfs()
    print("dreams integrity checks passed")


if __name__ == "__main__":
    main()
