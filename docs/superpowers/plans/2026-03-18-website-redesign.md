# Website Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Revamp the Validity Mirage website from a single-page research layout to a 6-page, modern, premium site with warm editorial aesthetic, dark mode, and interactive demo.

**Architecture:** Vanilla HTML5 + CSS3 + ES6 JavaScript, no framework. Shared `styles.css` for design system (tokens, nav, footer, typography, responsive). Each page is a standalone HTML file with shared nav/footer markup. Interactive slider logic in `app.js` (demo page only), report generation in `report.js`. Theme toggle on `<html>` element, persisted in localStorage.

**Tech Stack:** HTML5, CSS3 (custom properties, clamp(), grid, flexbox), ES6 JavaScript, Google Fonts (Playfair Display + Inter), Vercel deployment.

**Spec:** `docs/superpowers/specs/2026-03-18-website-redesign-design.md`

**Approved mockup reference:** `.superpowers/brainstorm/92042-1773888098/homepage-design.html` — contains the exact CSS for nav, hero, stats, problem section, demo preview, papers grid, and footer. Use this as the visual ground truth with these overrides:
- **Font loading:** Use `<link rel="preconnect">` + `<link>` tags (NOT the mockup's `@import` — it hurts Lighthouse)
- **Theme target:** Use `document.documentElement` (NOT `document.body` as in mockup's onclick)
- **Mobile nav:** Use hamburger + slide-down panel (NOT the mockup's hide-non-active-links approach)
- **Label spacing:** Use `letter-spacing: 2.5px` for all labels including `.stat-label` (mockup uses 1.5px — use spec value)

---

## File Structure

```
site/
├── styles.css          # REWRITE — complete design system, all shared styles
├── app.js              # REFACTOR — slider logic preserved, adapted for demo.html
├── report.js           # CREATE — mirage report table, export (JSON/CSV/MD)
├── index.html          # REWRITE — new homepage
├── research.html       # CREATE — research findings page
├── demo.html           # CREATE — interactive demo page
├── evidence.html       # REWRITE — redesigned evidence page
├── grok.html           # CREATE — grok experiment page
├── get-started.html    # CREATE — installation/usage page
├── 404.html            # CREATE — branded 404 page
├── data_miragekit.json # PRESERVE — unchanged
├── data_certificate.json # PRESERVE — unchanged
├── favicon.svg         # PRESERVE
├── social-card.png     # PRESERVE
├── robots.txt          # PRESERVE
├── sitemap.xml         # UPDATE — add new page URLs
├── topology-demo.html  # PRESERVE (check main branch: git show main:site/topology-demo.html)
└── topology-demo.js    # PRESERVE (check main branch: git show main:site/topology-demo.js)
vercel.json             # UPDATE — new rewrites and redirects
```

**Shared HTML patterns** (copy into each page):
- Nav: sticky 56px bar with logo, page links, theme toggle, mobile hamburger
- Footer: copyright + DOI left, GitHub/Twitter/Email right
- Head: SEO meta, OG tags, early theme init script, Google Fonts preconnect

---

## Task 1: Design System — `styles.css`

**Files:**
- Create: `site/styles.css` (complete rewrite)

This is the foundation. Every other task depends on it.

- [ ] **Step 1: Write CSS reset and custom properties**

Write the `:root` light mode tokens and `[data-theme="dark"]` dark mode tokens exactly matching the spec. Include font-family variables, layout variables, and all color tokens.

```css
/* Reset */
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

:root {
  /* Colors — Light (default) */
  --bg: #f5f2ec;
  --bg-secondary: #edeae3;
  --surface: #ffffff;
  --ink: #1a1a1a;
  --ink-secondary: #6b6b6b;
  --ink-tertiary: #a0a0a0;
  --accent: #c8553a;
  --accent-hover: #b04a33;
  --rule: #ddd8cf;
  --nav-bg: rgba(245, 242, 236, 0.85);
  --safe: #2d8a56;
  --warn: #b8860b;
  --danger: #c8553a;

  /* Typography */
  --serif: 'Playfair Display', Georgia, 'Times New Roman', serif;
  --sans: 'Inter', -apple-system, system-ui, 'Helvetica Neue', sans-serif;
  --mono: 'SF Mono', 'Fira Code', 'Consolas', monospace;

  /* Layout */
  --max-width: 1100px;
  --content-width: 720px;
}

[data-theme="dark"] {
  --bg: #111110;
  --bg-secondary: #1a1918;
  --surface: #1f1e1d;
  --ink: #e8e4de;
  --ink-secondary: #9a9590;
  --ink-tertiary: #5a5652;
  --accent: #d4775f;
  --accent-hover: #e08a73;
  --rule: #2a2825;
  --nav-bg: rgba(17, 17, 16, 0.85);
  --safe: #3da06a;
  --warn: #d4a952;
  --danger: #d4775f;
}
```

- [ ] **Step 2: Write base styles, typography, and transition**

```css
body {
  background: var(--bg);
  color: var(--ink);
  font-family: var(--sans);
  font-size: 16px;
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
  transition: background 0.3s, color 0.3s;
  padding-top: 56px; /* Clear fixed nav */
}

h1, h2, h3 { font-family: var(--serif); }

/* Fluid type sizing per spec */
h1 { font-size: clamp(40px, 6vw, 64px); font-weight: 400; line-height: 1.1; letter-spacing: -1px; }
h2 { font-size: clamp(28px, 4vw, 40px); font-weight: 400; line-height: 1.2; letter-spacing: -0.5px; }
```

- [ ] **Step 3: Write nav styles**

Sticky nav, 56px height, blur backdrop, mobile hamburger at <768px. Reference the mockup CSS exactly for `.nav-inner`, `.nav-logo`, `.nav-links`, `.theme-btn`. Add hamburger styles:

```css
.nav-hamburger {
  display: none; /* shown at <768px */
  background: none;
  border: none;
  color: var(--ink);
  font-size: 20px;
  cursor: pointer;
}
.nav-mobile-panel {
  position: absolute;
  top: 56px;
  left: 0;
  right: 0;
  background: var(--nav-bg);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--rule);
  padding: 16px 32px;
}
.nav-mobile-panel {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.2s ease;
}
.nav-mobile-panel.open { max-height: 400px; }
.nav-mobile-panel a {
  display: block;
  padding: 12px 0;
  color: var(--ink-secondary);
  text-decoration: none;
  font-size: 15px;
  border-bottom: 1px solid var(--rule);
}
@media (max-width: 768px) {
  .nav-links { display: none; }
  .nav-hamburger { display: block; }
}
```

- [ ] **Step 4: Write section, layout, and card styles**

Section pattern (max-width, padding, dividers), card pattern (surface bg, border, radius), button styles (primary + ghost), stats row.

- [ ] **Step 5: Write footer styles**

```css
footer {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 48px 32px;
  border-top: 1px solid var(--rule);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
```

- [ ] **Step 6: Write responsive breakpoints**

Three tiers: >1100px (full), 768-1100px (grids 3→2), <768px (single column, hamburger, stacked stats/footer).

- [ ] **Step 7: Write scroll reveal and animation styles**

```css
.reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;
}
.reveal.revealed {
  opacity: 1;
  transform: translateY(0);
}
@media (prefers-reduced-motion: reduce) {
  .reveal { opacity: 1; transform: none; transition: none; }
}
```

- [ ] **Step 8: Write slider and demo-specific styles**

Port slider track, progress bar, ticks, cards (naive vs guarded), metric bars, mirage warning, contract badges, status dots. These are used on the demo page.

- [ ] **Step 9: Write evidence, research, and get-started page-specific styles**

Evidence chunk lists, certificate comparison, code blocks, install cards, expandable sections.

- [ ] **Step 10: Verify styles load correctly**

Create a minimal test HTML that imports `styles.css` with both themes. Open in browser to check tokens resolve.

- [ ] **Step 11: Commit**

```bash
git add site/styles.css
git commit -m "feat: complete design system rewrite with light/dark tokens, nav, footer, responsive"
```

---

## Task 2: Homepage — `index.html`

**Files:**
- Create: `site/index.html` (replaces current)

**Reference:** The approved mockup at `.superpowers/brainstorm/92042-1773888098/homepage-design.html` is the visual ground truth. Port its HTML structure, adapting inline styles to use `styles.css` classes.

- [ ] **Step 1: Write HTML head with SEO, OG tags, and early theme init**

Include: charset, viewport, title ("The Validity Mirage"), description, OG tags, Twitter card tags, canonical URL, favicon, Google Fonts preconnect + import, theme-color meta, early theme detection script (same pattern as current `index.html` lines 31-49 but targeting `document.documentElement`).

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="./styles.css">
```

Early theme script (before body renders):
```html
<script>
(function(){
  try {
    var q = new URLSearchParams(location.search).get('theme');
    var s = localStorage.getItem('miragekit-theme');
    var d = matchMedia('(prefers-color-scheme:dark)').matches;
    var t = q==='dark'||q==='light' ? q : s==='dark'||s==='light' ? s : d?'dark':'light';
    document.documentElement.dataset.theme = t;
  } catch(e) { document.documentElement.dataset.theme = 'light'; }
})();
</script>
```

- [ ] **Step 2: Write nav HTML**

```html
<nav>
  <div class="nav-inner">
    <a href="/" class="nav-logo">validity mirage</a>
    <div class="nav-links">
      <a href="/" class="active">Home</a>
      <a href="/research">Research</a>
      <a href="/demo">Demo</a>
      <a href="/evidence">Evidence</a>
      <a href="/grok">Grok</a>
      <a href="/get-started">Get Started</a>
      <button class="theme-btn" id="themeToggle" aria-label="Toggle theme">◐</button>
    </div>
    <button class="nav-hamburger" id="hamburgerBtn" aria-label="Menu">☰</button>
  </div>
  <div class="nav-mobile-panel" id="mobilePanel">
    <a href="/">Home</a>
    <a href="/research">Research</a>
    <a href="/demo">Demo</a>
    <a href="/evidence">Evidence</a>
    <a href="/grok">Grok</a>
    <a href="/get-started">Get Started</a>
  </div>
</nav>
```

- [ ] **Step 3: Write hero section**

Eyebrow ("AI Safety Research"), h1 ("Your AI forgets what matters most."), subtitle, two CTAs, stats row with 4 stats. Match the mockup structure exactly.

- [ ] **Step 4: Write problem section**

Section label, h2, explanation paragraph, two contrast cards ("The surface looks fine" / "The foundation is gone"). Content from mockup.

- [ ] **Step 5: Write demo preview section**

Static HTML/CSS illustration of slider at 65% retention. Two-column metric comparison (Naive vs Guarded) with hardcoded values. CTA link to `/demo`. No event listeners — purely visual.

- [ ] **Step 6: Write papers section**

3-column card grid. Three paper cards with serif titles, date metadata, descriptions, linking to `/papers/paper_03_...pdf`, `/papers/paper_i_...pdf`, and `/grok`.

Paper links:
- The Validity Mirage → `/papers/paper_03_validity_mirage_compression.pdf`
- Tropical Geometry → `/papers/paper_i_tropical_algebra.pdf`
- Grok Experiment → `/grok`

- [ ] **Step 7: Write footer**

```html
<footer>
  <div class="footer-left">© 2025 Jack Chaudier · DOI: 10.5281/zenodo.18794293</div>
  <div class="footer-links">
    <a href="https://github.com/jack-chaudier/dreams">GitHub</a>
    <a href="https://x.com/J_C_Gaffney">Twitter</a>
    <a href="mailto:jack@miragekit.dev">Email</a>
  </div>
</footer>
```

- [ ] **Step 8: Write inline theme toggle + hamburger JS**

Small script at bottom of page for theme toggle and mobile hamburger. Theme toggle uses the same logic as current `app.js` `initThemeToggle()`. Hamburger toggles `.open` on mobile panel, closes on link click.

```html
<script>
(function(){
  var KEY = 'miragekit-theme';
  var toggle = document.getElementById('themeToggle');
  var hamburger = document.getElementById('hamburgerBtn');
  var panel = document.getElementById('mobilePanel');

  if (toggle) {
    toggle.addEventListener('click', function(){
      var cur = document.documentElement.dataset.theme;
      var next = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem(KEY, next); } catch(e){}
    });
  }

  if (hamburger && panel) {
    hamburger.addEventListener('click', function(){
      panel.classList.toggle('open');
      hamburger.textContent = panel.classList.contains('open') ? '✕' : '☰';
    });
    panel.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){ panel.classList.remove('open'); hamburger.textContent = '☰'; });
    });
  }
})();
</script>
```

- [ ] **Step 9: Add `.reveal` classes to sections**

Add `class="reveal"` to problem section, demo preview, and papers section for scroll-reveal animation.

- [ ] **Step 10: Write scroll reveal init**

```html
<script>
(function(){
  var els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    els.forEach(function(el){ el.classList.add('revealed'); });
    return;
  }
  var obs = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if (e.isIntersecting) { e.target.classList.add('revealed'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  els.forEach(function(el){ obs.observe(el); });
})();
</script>
```

- [ ] **Step 11: Test homepage in browser**

Open in browser. Verify: light mode renders correctly, dark mode toggles, mobile hamburger works, all sections visible, stats display, paper cards link correctly.

- [ ] **Step 12: Commit**

```bash
git add site/index.html
git commit -m "feat: new homepage with hero, problem, demo preview, and papers sections"
```

---

## Task 3: Demo Page — `demo.html` + `app.js`

**Files:**
- Create: `site/demo.html`
- Modify: `site/app.js` (refactor for demo page context)

The demo page is the most complex — it has the interactive slider, metric bars, mirage warning, certificate display, and report generation.

- [ ] **Step 1: Write demo.html with head, nav, footer**

Same head pattern as index.html (SEO tags, theme init, fonts). Title: "Interactive Demo | The Validity Mirage". Nav with "Demo" as active link.

- [ ] **Step 2: Write brief intro section**

Two sentences max: "Drag the slider to compress a conversation. Watch how naive compression maintains surface validity while silently destroying task relevance."

- [ ] **Step 3: Write interactive slider HTML**

Port the slider markup from current `index.html` lines 159-245. This includes:
- Slider input range
- Retention display, context text, regime badge
- Slider track with progress bar and ticks
- Two comparison cards (Naive Recency vs Tropical L2 Guarded)
- Each card: status dot, title, subtitle, metric bars container, contract badge
- Mirage warning box
- Legend section

Add one-line subtitles under each policy column title:
- Naive: "Keeps newest messages"
- Guarded: "Keeps messages the current task depends on"

- [ ] **Step 4: Write mirage report container**

```html
<section class="section" id="mirageReport">
  <div class="section-label">Mirage Report</div>
  <h2>Analysis Results</h2>
  <div id="reportContainer"></div>
  <div class="report-actions" id="reportActions" style="display:none;">
    <button class="btn-secondary" id="exportJson">Export JSON</button>
    <button class="btn-secondary" id="exportCsv">Export CSV</button>
    <button class="btn-secondary" id="exportMd">Export Markdown</button>
  </div>
</section>
```

- [ ] **Step 5: Write expandable detail sections**

Three collapsible sections below the slider:
1. "What am I seeing?" — explanation of the mirage phenomenon
2. "Policy descriptions" — what each policy does
3. "Mathematical details" — core contract, frontier feasibility formulas

```html
<details class="expandable">
  <summary>What am I seeing?</summary>
  <div class="expandable-content">...</div>
</details>
```

- [ ] **Step 6: Write deep analysis section (witness + certificate)**

Port the expandable deep section from current index.html (witness claim, W[k] value, semantic regret, certificate comparison with kept/dropped chunk lists). This section is collapsed by default.

- [ ] **Step 7: Refactor app.js for demo page**

The current `app.js` (688 lines) runs on every page. Refactor it:
- Keep all slider logic, metric rendering, certificate rendering, theme toggle, scroll reveal
- Guard slider initialization behind `if (document.getElementById('retentionSlider'))` so it only runs on demo.html
- Theme toggle and scroll reveal should run on every page
- Extract the theme toggle and scroll reveal into the shared inline scripts (already in each page's HTML)
- `app.js` becomes demo-page-only: slider init, data fetch, metric rendering, certificate rendering

The refactored `app.js` structure:
```javascript
(function() {
  'use strict';
  // METRICS array, helper functions (pct, levelKey, metricColor, etc.)
  // getCardState, getStatusLabel, addRawValidity, getExactPoint
  // buildMetricBars, updateMetrics, updateCardState, updateContractBadge
  // getExplainer, getSliderContext, getSliderRegime
  // renderCertificateComparison + chunk helpers
  // Deep toggle handler
  // async init() — fetch data, build slider, render
  // init().catch(...)
})();
```

- [ ] **Step 8: Link topology-demo if it exists**

Check if `site/topology-demo.html` exists (either in worktree or main branch). If it exists, add a link from demo.html: `<a href="/topology-demo">Topology Demo →</a>` in the expandable sections area.

- [ ] **Step 9: Test slider functionality**

Open demo.html in browser. Verify:
- Slider moves and updates metrics in real-time
- Both naive and guarded cards update correctly
- Status badges change (SAFE → DEGRADED → CRITICAL)
- Mirage warning appears at low retention with high raw validity
- Regime badge transitions work
- Deep toggle expands/collapses
- Certificate comparison renders correctly
- Theme toggle works

- [ ] **Step 10: Commit**

```bash
git add site/demo.html site/app.js
git commit -m "feat: interactive demo page with slider, metrics, and certificate display"
```

---

## Task 4: Report Generation — `report.js`

**Files:**
- Create: `site/report.js`

The spec says to preserve and adapt report.js. Since it doesn't currently exist, we create it. It generates a summary report table from the demo data and provides export buttons.

- [ ] **Step 1: Write report.js with table generation**

```javascript
(function() {
  'use strict';

  function generateReport(mirage) {
    var levels = mirage.retention_levels.slice().sort(function(a,b){ return b-a; });
    var rows = [];
    for (var i = 0; i < levels.length; i++) {
      var r = levels[i];
      var key = String(r); if (key.indexOf('.') === -1) key += '.0';
      var naive = mirage.policies.recency[key];
      var guarded = mirage.policies.l2_guarded[key];
      if (!naive || !guarded) continue;
      rows.push({
        retention: r,
        naive_validity: Math.max(naive.decoy_full_rate||0, naive.primary_full_rate||0),
        naive_pivot: naive.pivot_preservation_rate,
        naive_contract: naive.contract_satisfied_rate,
        guarded_validity: Math.max(guarded.decoy_full_rate||0, guarded.primary_full_rate||0),
        guarded_pivot: guarded.pivot_preservation_rate,
        guarded_contract: guarded.contract_satisfied_rate,
        mirage: naive.pivot_preservation_rate < 0.05 && Math.max(naive.decoy_full_rate||0, naive.primary_full_rate||0) > 0.9
      });
    }
    return rows;
  }

  function pct(v) { return Math.round(v * 100) + '%'; }

  function renderReportTable(container, rows) {
    var html = '<table class="report-table"><thead><tr>' +
      '<th>Retention</th><th>Naive Validity</th><th>Naive Pivot</th>' +
      '<th>Guarded Validity</th><th>Guarded Pivot</th><th>Guarded Contract</th><th>Mirage?</th>' +
      '</tr></thead><tbody>';
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      var cls = r.mirage ? ' class="mirage-row"' : '';
      html += '<tr' + cls + '>' +
        '<td>' + pct(r.retention) + '</td>' +
        '<td>' + pct(r.naive_validity) + '</td>' +
        '<td style="color:' + (r.naive_pivot < 0.05 ? 'var(--danger)' : 'var(--safe)') + '">' + pct(r.naive_pivot) + '</td>' +
        '<td>' + pct(r.guarded_validity) + '</td>' +
        '<td style="color:var(--safe)">' + pct(r.guarded_pivot) + '</td>' +
        '<td>' + pct(r.guarded_contract) + '</td>' +
        '<td>' + (r.mirage ? 'YES' : '—') + '</td>' +
        '</tr>';
    }
    html += '</tbody></table>';
    container.innerHTML = html;
  }

  function downloadFile(content, filename, mime) {
    var blob = new Blob([content], { type: mime });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function exportJSON(rows) {
    downloadFile(JSON.stringify(rows, null, 2), 'mirage-report.json', 'application/json');
  }

  function exportCSV(rows) {
    var lines = ['retention,naive_validity,naive_pivot,guarded_validity,guarded_pivot,guarded_contract,mirage'];
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      lines.push([r.retention, r.naive_validity, r.naive_pivot, r.guarded_validity, r.guarded_pivot, r.guarded_contract, r.mirage].join(','));
    }
    downloadFile(lines.join('\n'), 'mirage-report.csv', 'text/csv');
  }

  function exportMarkdown(rows) {
    var lines = ['| Retention | Naive Validity | Naive Pivot | Guarded Validity | Guarded Pivot | Contract | Mirage |',
      '|-----------|---------------|-------------|-----------------|--------------|----------|--------|'];
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      lines.push('| ' + [pct(r.retention), pct(r.naive_validity), pct(r.naive_pivot), pct(r.guarded_validity), pct(r.guarded_pivot), pct(r.guarded_contract), r.mirage ? 'YES' : '—'].join(' | ') + ' |');
    }
    downloadFile(lines.join('\n'), 'mirage-report.md', 'text/markdown');
  }

  // Init: called after data is loaded in app.js
  window.MirageReport = {
    generate: generateReport,
    render: renderReportTable,
    exportJSON: exportJSON,
    exportCSV: exportCSV,
    exportMarkdown: exportMarkdown
  };
})();
```

- [ ] **Step 2: Wire report.js into demo.html**

Add `<script src="./report.js"></script>` before `app.js` in demo.html. In app.js init(), after data loads, call:
```javascript
var reportRows = MirageReport.generate(mirage);
MirageReport.render(document.getElementById('reportContainer'), reportRows);
document.getElementById('reportActions').style.display = 'flex';
document.getElementById('exportJson').addEventListener('click', function(){ MirageReport.exportJSON(reportRows); });
document.getElementById('exportCsv').addEventListener('click', function(){ MirageReport.exportCSV(reportRows); });
document.getElementById('exportMd').addEventListener('click', function(){ MirageReport.exportMarkdown(reportRows); });
```

- [ ] **Step 3: Test report rendering and exports**

Verify table renders below slider with correct data. Test each export button downloads a file.

- [ ] **Step 4: Commit**

```bash
git add site/report.js site/demo.html site/app.js
git commit -m "feat: mirage report table with JSON/CSV/Markdown export"
```

---

## Task 5: Research Page — `research.html`

**Files:**
- Create: `site/research.html`

- [ ] **Step 1: Write research.html with full structure**

Head (SEO, theme init, fonts), nav (Research active), then sections:

1. **Hero** — "The Research" heading, brief abstract (2-3 sentences about the validity mirage finding)

2. **Key Findings** — 4 stat cards (same stats as homepage but with more context): 21.95% mirage rate, 0 false positives, 54.9% trap rate, Ω(k) state bound. Each with a 1-2 sentence explanation.

3. **Methodology** — How experiments were designed: deterministic replay witness (n=3 per policy/fraction), 5 retention levels, two policies compared. Explain the experimental setup clearly.

4. **Mathematical Foundations** — Port from current index.html lines 247-271. Four formula cards:
   - Core Contract: d_pre(π₀, Sₖ) ≥ k
   - Frontier Feasibility: W[k] < ∞
   - Raw Validity: max(decoy_full_rate, primary_full_rate)
   - Mirage Gap: raw_validity − pivot_preservation_rate

5. **Papers** — Card grid with all 5 papers. Each card includes: title (serif), date, 2-3 sentence abstract, download link. Extract abstracts from the paper PDFs or current index.html content.
   - Paper 03: The Validity Mirage (`/papers/paper_03_validity_mirage_compression.pdf`) — The core paper defining the mirage phenomenon
   - Paper 00: Continuous Control (`/papers/paper_00_continuous_control_structural_regularization.pdf`) — Structural regularization foundations
   - Paper 01: Absorbing States (`/papers/paper_01_absorbing_states_in_greedy_search.pdf`) — Absorbing states in greedy search
   - Paper 02: Streaming Traps (`/papers/paper_02_streaming_oscillation_traps.pdf`) — Streaming oscillation traps
   - Paper I: Tropical Algebra (`/papers/paper_i_tropical_algebra.pdf`) — The mathematical framework

Footer. Inline theme toggle + hamburger + scroll reveal scripts.

- [ ] **Step 2: Add reveal classes and test**

Test in browser: both themes, responsive, all paper links work.

- [ ] **Step 3: Commit**

```bash
git add site/research.html
git commit -m "feat: research page with findings, methodology, math, and paper links"
```

---

## Task 6: Evidence Page — `evidence.html`

**Files:**
- Modify: `site/evidence.html` (complete rewrite using new design system)

- [ ] **Step 1: Rewrite evidence.html**

Port content from current evidence.html (324 lines) into new design system. Sections:

1. **Overview** — What evidence is available (version map: dreams v0.1.1, tropical-mcp v0.2.1)

2. **Implementation Checks** — Evidence record 01: ruff, mypy, pytest, build validation. Link to `/results/` files.

3. **Replay Witnesses** — Evidence record 02: n=3 variants per policy with certificate data. Link to `/results/replay/` files.

4. **Portable Certificate** — Evidence record 03: Full audit record. Link to `/results/certificates/memory_safety_certificate.json`.

5. **Reproduction Paths** — Smoke test and research workflow commands from current evidence.html lines 221-274.

Use the new nav, footer, card styles. Add `.reveal` classes.

- [ ] **Step 2: Test evidence page**

Verify all `/results/` and `/papers/` links resolve. Both themes. Responsive.

- [ ] **Step 3: Commit**

```bash
git add site/evidence.html
git commit -m "feat: redesigned evidence page with new design system"
```

---

## Task 7: Grok Experiment Page — `grok.html`

**Files:**
- Create: `site/grok.html`

The spec says to keep the current structure since it works well. Check if `site/mirage-shelf-grok-2026-03.html` exists in the main branch (`git show main:site/mirage-shelf-grok-2026-03.html`). If it exists, port its content into the new design system. If not, create from the spec flow below.

- [ ] **Step 1: Port grok content into grok.html**

First, check the main branch for the existing grok page:
```bash
git show main:site/mirage-shelf-grok-2026-03.html > /tmp/grok-source.html 2>/dev/null
```

If the file exists, port its content (headline finding, key scores table, chart/figure, interpretation, methods, artifacts) into the new design system with new nav, footer, and theme support.

If the file does not exist, create sections from the spec:
1. **Headline finding** — Key result from Grok cross-validation
2. **Key scores table** — Comparison table showing Grok results
3. **Chart/main figure** — Reference figure from papers if available, otherwise styled data table
4. **Interpretation** — What the Grok results mean
5. **Methods** — How the experiment was set up
6. **Artifacts** — Links to paper and raw data

**Important:** Do NOT fabricate experiment data. Use only content from the existing page or papers. Nav with "Grok" active. New design system throughout.

- [ ] **Step 2: Test grok page**

Both themes, responsive, links work.

- [ ] **Step 3: Commit**

```bash
git add site/grok.html
git commit -m "feat: grok experiment page with cross-model validation results"
```

---

## Task 8: Get Started Page — `get-started.html`

**Files:**
- Create: `site/get-started.html`

- [ ] **Step 1: Write get-started.html**

Sections:
1. **Quick start** — Minimal install command:
```
uvx tropical-mcp
```
Or register with Codex/Claude Desktop.

2. **What it does** — 2-3 sentences about tropical-mcp: it's an MCP server that provides guarded context compression using tropical semiring algebra.

3. **Repository links** — 4-card grid:
   - `dreams` — Research monorepo (this site + papers)
   - `tropical-mcp` — The MCP server
   - `stark` — Supporting library
   - `immortal-baby` — Demo/test harness

Each card: repo name, 1-line description, GitHub link.

4. **Verification** — How to verify installation works. Port smoke test from current evidence.html (the `uvx tropical-mcp` test command).

Install code blocks styled with `--mono` font on `--surface` background.

- [ ] **Step 2: Test get-started page**

Both themes, responsive, all GitHub links work.

- [ ] **Step 3: Commit**

```bash
git add site/get-started.html
git commit -m "feat: get started page with install, repos, and verification"
```

---

## Task 9: 404 Page — `404.html`

**Files:**
- Create: `site/404.html`

- [ ] **Step 1: Write branded 404 page**

Simple page matching design system. Centered content:
- "404" in large serif
- "This page has been compressed away." in secondary text
- Link back to home

Include theme init script, styles.css, and minimal nav (logo only).

- [ ] **Step 2: Commit**

```bash
git add site/404.html
git commit -m "feat: branded 404 page"
```

---

## Task 10: Vercel Config + Sitemap

**Files:**
- Modify: `vercel.json`
- Modify: `site/sitemap.xml`

- [ ] **Step 1: Update vercel.json**

Replace rewrites with explicit routes for all pages plus the old grok URL redirect:

```json
{
  "cleanUrls": true,
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Content-Security-Policy", "value": "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; font-src 'self' https://fonts.gstatic.com; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Permissions-Policy", "value": "camera=(), geolocation=(), microphone=()" },
        { "key": "Cross-Origin-Resource-Policy", "value": "same-origin" }
      ]
    }
  ],
  "redirects": [
    { "source": "/mirage-shelf-grok-2026-03", "destination": "/grok", "statusCode": 301 }
  ],
  "rewrites": [
    { "source": "/", "destination": "/site/index" },
    { "source": "/papers/:path*", "destination": "/papers/:path*" },
    { "source": "/results/:path*", "destination": "/results/:path*" },
    { "source": "/research", "destination": "/site/research" },
    { "source": "/demo", "destination": "/site/demo" },
    { "source": "/evidence", "destination": "/site/evidence" },
    { "source": "/grok", "destination": "/site/grok" },
    { "source": "/get-started", "destination": "/site/get-started" },
    { "source": "/topology-demo", "destination": "/site/topology-demo" },
    { "source": "/(.*)", "destination": "/site/$1" }
  ]
}
```

**CSP tradeoff (accepted):** CSP updated to allow Google Fonts (`font-src https://fonts.gstatic.com`) and inline scripts (`'unsafe-inline'` for script-src — needed for early theme init to prevent FOUC). This is a deliberate choice: the site serves no user input and the inline scripts are all first-party. Tightening to nonce-based CSP can be a follow-up task after launch.

- [ ] **Step 2: Update sitemap.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://dreams-dun.vercel.app/</loc></url>
  <url><loc>https://dreams-dun.vercel.app/research</loc></url>
  <url><loc>https://dreams-dun.vercel.app/demo</loc></url>
  <url><loc>https://dreams-dun.vercel.app/evidence</loc></url>
  <url><loc>https://dreams-dun.vercel.app/grok</loc></url>
  <url><loc>https://dreams-dun.vercel.app/get-started</loc></url>
  <url><loc>https://dreams-dun.vercel.app/topology-demo</loc></url>
  <url><loc>https://dreams-dun.vercel.app/papers/paper_03_validity_mirage_compression.pdf</loc></url>
</urlset>
```

- [ ] **Step 3: Commit**

```bash
git add vercel.json site/sitemap.xml
git commit -m "feat: update vercel config and sitemap for multi-page site"
```

---

## Task 11: Cross-Page Verification

**Files:** All pages

- [ ] **Step 1: Verify nav consistency**

Open each page. Check that nav renders identically with correct active state. Check logo links to `/`. Check all nav links work.

- [ ] **Step 2: Verify footer consistency**

Check footer renders identically on all pages. DOI link, GitHub, Twitter, Email links all work.

- [ ] **Step 3: Verify dark mode on all pages**

Toggle theme on each page. Verify it persists when navigating between pages (localStorage).

- [ ] **Step 4: Verify mobile responsive on all pages**

Resize browser to <768px. Check hamburger menu, single column layouts, stacked stats, stacked footer.

- [ ] **Step 5: Verify all external links**

Check paper PDFs load, GitHub repo link works, DOI resolves, Twitter/X profile loads.

- [ ] **Step 6: Fix any issues found**

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "fix: cross-page consistency and link verification"
```
