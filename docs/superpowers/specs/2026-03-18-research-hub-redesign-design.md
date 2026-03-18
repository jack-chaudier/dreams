# MirageKit Research Hub Redesign

**Date:** 2026-03-18
**Author:** Jack Chaudier Gaffney
**Status:** Design approved, pending implementation

## Summary

Full redesign of the MirageKit public showcase site from a single dense research-paper page into a multi-page "Research Hub" with a story-first landing page, dedicated evidence explorer, papers catalog, and unified design across all existing pages. The goal: a general tech audience understands the validity mirage and wants to share it, while researchers can drill into evidence.

## Design Decisions

- **Audience:** General tech (HN, Twitter, ML practitioners). Papers accessible but secondary.
- **Primary goal:** Understand the problem + share it. Not tool adoption or paper reading.
- **Style:** Hybrid — academic soul (Charter serif, scholarly credibility) with modern skin (generous whitespace, subtle motion, contemporary component design).
- **Scope:** Full redesign. New pages, restructured content, CSS rewrite, README overhaul.
- **Constraint:** No emojis anywhere in the UI.

## Site Architecture

Five pages with a shared navigation bar and consistent design language:

```
/                              Landing page (story + demo + CTA)
/evidence                      Evidence dossier (replay, certificates, validation, math)
/papers                        Paper catalog with abstracts (NEW)
/topology-demo                 Topological replay visualization (existing, to be polished)
/mirage-shelf-grok-2026-03     Grok experiment results (existing, to be polished)
```

### Shared Navigation

Persistent top nav on all pages:
- Left: MIRAGEKIT wordmark (links to /)
- Right: Overview | Evidence | Papers | GitHub (external) | Theme toggle

Replaces the current sticky section-links bar on the landing page and the inconsistent headers on subpages.

## Design System

### Typography

| Role | Font | Usage |
|------|------|-------|
| Headlines, body prose | Charter / Georgia (serif) | The scholarly voice |
| Code, data labels, metrics | IBM Plex Mono / monospace | Technical precision |
| Nav, buttons, UI chrome | System sans-serif | Clean interface elements |

### Color Palette

**Dark mode (primary):**
- Background: `#0a0a0f`
- Surface: `#12121a`
- Card: `#1a1a2e`
- Accent (brand): `#e8927c` (warm salmon, carried from current site)
- Safe: `#065f46` / `#9ae6b4`
- Danger: `#991b1b` / `#fc8181`
- Link: `#63b3ed`

**Light mode:** Inverted palette, cream background (`#faf8f4` retained from current).

### Motion

- Scroll-triggered fade-up on sections: 200ms ease-out via Intersection Observer
- Smooth metric bar animations on slider interaction
- `prefers-reduced-motion` respected — all animations disable cleanly
- No gratuitous animation. Motion serves comprehension only.

## Page Designs

### 1. Landing Page (index.html)

The landing page is one focused scroll — under 5 screens tall. Content that doesn't serve the main narrative moves to /evidence or /papers.

**Section flow:**

1. **Nav bar** — shared component
2. **Hero** — provocative opening, not stat-first
   - Institutional line: "University of Michigan / Working Paper 2026"
   - Headline: "Your AI agent is solving the wrong problem. It just doesn't know it yet."
   - Subtext: Plain-language explanation with the "1 in 5" stat woven in naturally
   - Two CTAs: "See it happen" (scroll to demo) + "Read the paper" (external)
3. **Key stat callout** — the 21.95% number with confidence interval, as a left-bordered accent block
4. **Interactive demo** (centerpiece)
   - Headline: "Slide to compress. Watch the task disappear."
   - Brief guidance text
   - Enhanced slider with side-by-side Naive Recency vs Tropical L2 Guarded comparison
   - Each side shows: pivot status (kept/lost), task fidelity %, raw validity %
   - Bottom status line: clear verdict per policy
5. **How it works** — three-column summary
   - Tag: "Identify which messages carry the task"
   - Guard: "Protect them during compression"
   - Certify: "Prove what was kept and what was lost"
   - No emojis — use simple icons or numbered markers
6. **Try it** — minimal install section
   - 3-line code block: pip install, smoke test, expected output
   - Link to full documentation
7. **Footer**
   - Poetic closer: "The roots remember what the canopy forgets."
   - Author / institution / DOI
   - Essential links: Evidence, Papers, GitHub, tropical-mcp, Contact, X/Twitter

**Content removed from landing page (moved elsewhere):**
- Mathematical Foundations (4 formulas) -> /evidence
- Deep Analysis collapsible section -> /evidence
- Evidence Boundaries section -> /evidence
- Extended "Run It Yourself" code examples -> /evidence reproduction path
- Paper badges from footer -> /papers

### 2. Evidence Page (evidence.html)

The rigorous backing for every landing page claim. Feels like opening a well-organized paper appendix.

**Sections:**
1. **Replay Witness** — interactive table of retention fractions x policies with expandable raw data. Each cell links to committed JSON.
2. **Certificate Viewer** — visual diff of kept vs dropped message IDs under each policy.
3. **Mathematical Foundations** — the four formulas (core contract, frontier feasibility, raw validity, mirage gap) typeset with KaTeX, each with a plain-language explanation.
4. **Validation Pipeline** — status badges for ruff, mypy, pytest, wheel build, functional validation. All green with commit hashes.
5. **Evidence Boundaries** — honest scope limitations (moved from landing page).
6. **Reproduction Path** — step-by-step local reproduction guide.

**Design:** Data-table aesthetic. Monospace values, subtle grid lines. Every number links to its source file. Collapsible sections for raw JSON/CSV.

### 3. Papers Page (papers.html) — NEW

Clean catalog of all five research papers. Currently these are just badge links in the footer.

**Layout:** Each paper gets a card with:
- Number + title (e.g., "Paper 03: The Validity Mirage")
- One-paragraph abstract
- Key contribution in one sentence
- PDF link + file size
- Relationship to other papers in the series

Flagship paper (03) gets visual prominence. The page doubles as a reading guide — "start here, then read these."

### 4. Topology Demo (topology-demo.html) — POLISH

Currently has its own simple header ("Return to the main artifact"). Changes:
- Replace ad-hoc header with shared nav bar
- Apply the new design system (colors, typography, spacing)
- Keep the interactive canvas visualization and slider controls unchanged
- Update the explanatory text styling to match the landing page

### 5. Grok Mirage Shelf (mirage-shelf-grok-2026-03.html) — POLISH

Already uses the main site header/theme toggle. Changes:
- Replace current header with shared nav bar
- Apply updated typography scale and spacing
- Polish the data presentation cards (Findings, Methods, Artifacts sections)
- Ensure dark/light theme works consistently

## README Redesign

Current README: 169 lines, 20+ links, structured for reviewers/academics, duplicates site content.

**New structure (~60 lines):**

1. Title + one-sentence description + DOI badge
2. "What is the validity mirage?" — 2 sentences
3. "See it live" — link to the website
4. "Try it yourself" — 3-line install + smoke test
5. "Verify the claims" — reproduction steps
6. "Read the research" — paper list with one-line descriptions
7. "Repository structure" — the current tree diagram (keep)
8. "Citation" — BibTeX block

The README points to the site for details rather than duplicating it.

## Technical Approach

### Stack

- No framework. Vanilla HTML/CSS/JS. Keeps deployment simple.
- KaTeX (self-hosted, ~100KB) for math typesetting on the evidence page.
- CSS custom properties for theming (current approach, refined).
- Intersection Observer for scroll-triggered animations.
- Existing JSON data files reused (data_miragekit.json, data_certificate.json).

### What stays

- Vercel deployment + vercel.json routing (updated for new pages)
- Dark/light theme toggle with localStorage
- Interactive slider demo (enhanced, not replaced)
- Warm salmon accent color (#e8927c)
- Charter serif as the typographic anchor
- Social card / OG meta tags (updated design)
- favicon.svg

### What changes

- New file: `site/papers.html`
- Shared nav injected via JS template literal (no build step needed)
- Complete CSS rewrite: current 2600-line monolith -> modular, ~1200 lines
- `app.js` refactored into focused modules
- `vercel.json` updated with routes for /papers and /topology-demo
- New `social-card.svg` / `social-card.png` reflecting updated design
- CSP headers updated for KaTeX (if self-hosted fonts needed)

### Files touched

```
site/index.html              — Rewrite
site/styles.css               — Rewrite
site/app.js                   — Refactor into modules
site/evidence.html            — Restructure + polish
site/papers.html              — New
site/topology-demo.html       — Polish + shared nav
site/topology-demo.css        — Update to match design system
site/mirage-shelf-grok-2026-03.html — Polish + shared nav
site/social-card.svg          — Redesign
site/social-card.png          — Regenerate
site/sitemap.xml              — Update
vercel.json                   — Add routes
README.md                     — Rewrite
```

## Success Criteria

1. A first-time visitor understands the validity mirage within 30 seconds of landing
2. The interactive demo is the compelling centerpiece — it proves the claim visually
3. All five pages share a consistent nav, typography, and color system
4. Dark and light themes work cleanly across all pages
5. Math is properly typeset (KaTeX) on the evidence page
6. The README is concise and points to the site rather than duplicating it
7. Mobile responsive across all pages
8. No emojis anywhere in the UI
