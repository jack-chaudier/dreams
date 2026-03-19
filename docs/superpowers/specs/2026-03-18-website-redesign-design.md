# Website Redesign — Design Spec

**Date:** 2026-03-18
**Status:** Approved
**Author:** Jack Chaudier + Claude

## Overview

Total revamp of the Validity Mirage public website from a single-page research paper layout to a multi-page, polished modern site inspired by xAI, Anthropic, and Perplexity aesthetics.

**Goals:**
- Modern, premium feel that's shareable on X
- Bold hooks for attention, understated body for credibility
- Warm editorial aesthetic (Anthropic/Perplexity energy) with dark mode
- Clear information architecture across focused pages
- Persistent navigation and standardized footer

**Tech stack:** Vanilla HTML5 + CSS3 + ES6 JavaScript. No framework. Deployed on Vercel.

## Design System

### Typography

| Role | Font | Weight | Usage |
|------|------|--------|-------|
| Headlines | Playfair Display (Google Fonts) | 400-500 | Hero, section headings, stat values, paper titles |
| Body | Inter (Google Fonts) | 300-500 | Body text, nav, labels, buttons, metadata |
| Code | SF Mono / Fira Code / Consolas | 400 | Code snippets, metric values |

Sizing uses `clamp()` for fluid responsiveness:
- Hero h1: `clamp(40px, 6vw, 64px)`
- Section h2: `clamp(28px, 4vw, 40px)`
- Body: 16px, line-height 1.7-1.8
- Labels: 11px, letter-spacing 2.5px, uppercase

### Color Palette

**Light mode (default):**
| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#f5f2ec` | Page background (warm cream) |
| `--bg-secondary` | `#edeae3` | Card interiors, alt sections |
| `--surface` | `#ffffff` | Cards, demo panels |
| `--ink` | `#1a1a1a` | Primary text |
| `--ink-secondary` | `#6b6b6b` | Body text, descriptions |
| `--ink-tertiary` | `#a0a0a0` | Labels, metadata |
| `--accent` | `#c8553a` | Accent color (warm terracotta) |
| `--rule` | `#ddd8cf` | Dividers, borders |
| `--nav-bg` | `rgba(245,242,236,0.85)` | Nav backdrop |
| `--safe` | `#2d8a56` | Positive metrics |
| `--warn` | `#b8860b` | Intermediate/caution metrics |
| `--danger` | `#c8553a` | Negative metrics / warnings |

**Dark mode:**
| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#111110` | Page background |
| `--bg-secondary` | `#1a1918` | Alt sections |
| `--surface` | `#1f1e1d` | Cards |
| `--ink` | `#e8e4de` | Primary text (warm white) |
| `--ink-secondary` | `#9a9590` | Body text |
| `--ink-tertiary` | `#5a5652` | Labels |
| `--accent` | `#d4775f` | Accent (lighter terracotta) |
| `--rule` | `#2a2825` | Dividers |
| `--nav-bg` | `rgba(17,17,16,0.85)` | Nav backdrop |

| `--safe` | `#3da06a` | Positive metrics |
| `--danger` | `#d4775f` | Negative metrics / warnings |
| `--warn` | `#d4a952` | Intermediate/caution metrics |

Dark mode activates via `[data-theme="dark"]` on `<html>` (`document.documentElement`). Toggled by nav button, persisted in localStorage (`miragekit-theme`), respects `prefers-color-scheme` as default.

### Layout

- Max width: 1100px, centered
- Content width: 720px for prose
- Padding: 32px horizontal
- Section spacing: 80px vertical padding
- Sections separated by 1px `var(--rule)` horizontal rules
- Cards: `var(--surface)` background, 1px border, 12px border-radius
- Buttons: 8px border-radius, 12px/28px padding

### Navigation

Persistent sticky nav, 56px height:
- Left: "validity mirage" wordmark (sans-serif, 14px, weight 500)
- Right: page links (13px, secondary color, active state bold) + theme toggle (◐)
- Blur backdrop: `backdrop-filter: blur(12px)`
- Bottom border: 1px `var(--rule)`
- Mobile (< 768px): collapse to logo + hamburger button. Hamburger opens a full-width dropdown panel below the nav bar with vertical link list. Panel slides down with 0.2s ease transition. Clicking hamburger again or any link closes it. Focus trap not required (links are visible, not modal).

### Footer

Standardized across all pages:
- Left: copyright + DOI
- Right: GitHub, Twitter/X, Email links
- Top border: 1px rule
- 48px padding

## Page Architecture

### 1. Home (`index.html`)

**Purpose:** Hook visitors, communicate the core finding, direct them deeper.

**Flow:**
1. **Hero** — Eyebrow label ("AI Safety Research"), bold serif headline ("Your AI forgets what matters most."), understated subtitle, two CTAs (primary: "Read the Paper", ghost: "See it happen →"), key stats row (21.95% mirage rate, 0 false positives, 54.9% trap rate, Ω(k) state bound)
2. **The Problem** — Section label, serif heading, 2-3 sentence explanation, two contrast cards ("The surface looks fine" vs "The foundation is gone")
3. **Demo Preview** — Non-functional HTML/CSS illustration of the slider at 65% retention (not a screenshot, not a live component — a static render with hardcoded values, no event listeners). Two-column metric comparison (Naive vs Guarded). CTA links to full demo page.
4. **Papers** — 3-column card grid linking to the three papers with title, date, short description

### 2. Research (`research.html`)

**Purpose:** Present the full research findings, methodology, and mathematical framework.

**Flow:**
1. **Hero** — "The Research" heading, brief abstract
2. **Key Findings** — The core results in digestible format
3. **Methodology** — How the experiments were designed and run
4. **Mathematical Foundations** — The tropical semiring framework, core contract, frontier feasibility (currently in homepage "math snapshot" section)
5. **Papers** — Download links for all papers with abstracts

### 3. Demo (`demo.html`)

**Purpose:** Let visitors experience the mirage phenomenon interactively.

**Flow:**
1. **Brief intro** — 2 sentences max: what you're looking at, what to do
2. **Interactive slider** — Full-width compression slider with real-time metric updates. Two-column card comparison (Naive Recency vs Tropical Guarded). Status badges, metric bars, mirage warning alert. Ported from current `app.js` implementation.
3. **Mirage Report** — The existing report table, summary stats, and export buttons (JSON/CSV/Markdown) from `report.js`. Rendered below the slider when data is loaded. This is substantial interactive functionality that must be preserved.
4. **Expandable sections** — "What am I seeing?" explanation, policy descriptions, mathematical details — all collapsed by default

### 4. Evidence (`evidence.html`)

**Purpose:** Verification and reproducibility data for researchers.

**Flow:**
1. **Overview** — What evidence is available and why it matters
2. **Implementation Checks** — ruff, mypy, pytest, build validation results
3. **Replay Witnesses** — n=3 variants per policy with certificate data
4. **Portable Certificate** — Full audit record with kept/dropped chunk analysis
5. **Reproduction Paths** — How to reproduce results yourself

### 5. Grok Experiment (`grok.html`)

**Purpose:** Cross-model validation results (already the strongest standalone page).

**Flow:** Keep current structure — it works well:
1. Headline finding
2. Key scores table
3. Chart/main figure
4. Interpretation
5. Methods
6. Artifacts

### 6. Get Started (`get-started.html`)

**Purpose:** Installation and usage instructions for people who want to try the tool.

**Flow:**
1. **Quick start** — Minimal code to install and run
2. **What it does** — Brief explanation of tropical-mcp
3. **Repository links** — Card grid for the four repos (stark, dreams, tropical-mcp, immortal-baby)
4. **Verification** — How to verify your installation works

## Interactive Elements

### Compression Slider (Demo page)

Port the existing slider from `app.js` with these improvements:
- One-line plain-English subtitles under each policy column ("Keeps newest messages" vs "Keeps messages the current task depends on")
- Animated mirage warning with slide-in transition when surface validity is high but pivot is dropped
- Regime badge transitions (Aligned → Guard Active → Pressure Rising → Mirage Active)
- Expandable math/details sections below, collapsed by default

### Theme Toggle

- Nav button with ◐ icon
- Toggles `data-theme="dark"` on `<html>` (`document.documentElement`)
- Persists in localStorage (`miragekit-theme`)
- Respects `prefers-color-scheme` as initial default
- Smooth 0.3s transition on background and color

### Scroll Animations

Subtle fade-up reveal on scroll using IntersectionObserver:
- Elements with `.reveal` class
- threshold: 0.1
- translateY(20px) → translateY(0), opacity 0 → 1
- 0.6s duration, ease-out
- Reduced motion: skip animation, show immediately

## Responsive Breakpoints

| Breakpoint | Changes |
|-----------|---------|
| > 1100px | Full layout, max-width centered |
| 768-1100px | Grids collapse from 3→2 columns |
| < 768px | Single column, nav collapses to hamburger, stats wrap, demo stacks vertically |

## Migration Notes

### Files to create
- `site/index.html` — New homepage (replaces current)
- `site/research.html` — New page
- `site/demo.html` — New page
- `site/evidence.html` — Redesigned (replaces current)
- `site/grok.html` — Redesigned from current embedded content
- `site/get-started.html` — New page
- `site/styles.css` — Complete rewrite
- `site/app.js` — Refactored (slider logic preserved, new page-specific code)
- `site/report.js` — Preserved and adapted (Mirage Report generation, export buttons)
- `site/404.html` — Branded 404 page matching the design system

### Files preserved
- `site/data_miragekit.json` — Demo data (unchanged)
- `site/data_certificate.json` — Certificate data (unchanged)
- `site/favicon.svg` — Keep
- `site/social-card.png` — May update for new design
- `site/robots.txt` — Keep
- `site/sitemap.xml` — Update with new pages
- `site/topology-demo.html` — Preserved (linked from demo page)
- `site/topology-demo.js` — Preserved

### Vercel config
Update `vercel.json` rewrites to handle new pages:
- `/` → `/site/index`
- `/research` → `/site/research`
- `/demo` → `/site/demo`
- `/evidence` → `/site/evidence`
- `/grok` → `/site/grok`
- `/get-started` → `/site/get-started`
- `/topology-demo` → `/site/topology-demo`
- `/mirage-shelf-grok-2026-03` → redirect to `/grok` (301)

### Canonical URLs (for sitemap.xml)
- `https://dreams-dun.vercel.app/`
- `https://dreams-dun.vercel.app/research`
- `https://dreams-dun.vercel.app/demo`
- `https://dreams-dun.vercel.app/evidence`
- `https://dreams-dun.vercel.app/grok`
- `https://dreams-dun.vercel.app/get-started`
- `https://dreams-dun.vercel.app/topology-demo`

## Success Criteria

1. All 6 pages load and render correctly in light and dark mode
2. Interactive slider works on the demo page with all existing functionality
3. Persistent nav and footer consistent across all pages
4. Mobile responsive at all breakpoints
5. Existing data files (JSON) continue to work
6. All external links (papers, repos, DOI) remain functional
7. Theme preference persists across page loads
8. Lighthouse performance score > 90 (requires `<link rel="preconnect" href="https://fonts.googleapis.com">`, `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`, and `font-display: swap` on Google Fonts imports)
9. The site feels premium and shareable — the "vibe" test
