# Research Hub Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the MirageKit public showcase from a dense single-page research paper into a 5-page Research Hub optimized for a general tech audience to understand and share the validity mirage research.

**Architecture:** Vanilla HTML/CSS/JS static site deployed on Vercel. Shared nav component injected via JS across all pages. Complete CSS rewrite from 2600-line monolith to modular ~1200 lines. KaTeX for math typesetting on the evidence page. All five pages share a consistent design system.

**Tech Stack:** HTML5, CSS3 (custom properties for theming), vanilla ES5+ JS, KaTeX (self-hosted), Vercel static hosting.

**Spec:** `docs/superpowers/specs/2026-03-18-research-hub-redesign-design.md`

---

## File Structure

```
site/
  index.html              -- Rewrite: story-first landing page
  styles.css              -- Rewrite: modular CSS with new design system
  app.js                  -- Refactor: slider demo + shared nav + scroll animations
  evidence.html           -- Restructure: add math section, reorganize
  papers.html             -- New: paper catalog with abstracts
  topology-demo.html      -- Polish: shared nav, updated styling
  topology-demo.css       -- Update: align with new design system
  topology-demo.js        -- Unchanged (interactive canvas logic)
  mirage-shelf-grok-2026-03.html -- Polish: shared nav, updated styling
  data_miragekit.json     -- Unchanged
  data_certificate.json   -- Unchanged
  favicon.svg             -- Unchanged
  social-card.svg         -- Update after all pages done
  social-card.png         -- Regenerate after SVG update
  sitemap.xml             -- Update with new pages
  robots.txt              -- Unchanged
vercel.json               -- Update routes
README.md                 -- Rewrite: concise, points to site
```

---

## Chunk 1: Design System Foundation

This chunk creates the CSS foundation and shared nav that all pages depend on.

### Task 1: CSS Design System Rewrite

**Files:**
- Rewrite: `site/styles.css`

The current `styles.css` is 2600 lines. Rewrite it as a modular stylesheet with the new design system tokens. All pages will use this single stylesheet.

- [ ] **Step 1: Read the current styles.css fully to understand all components in use**

Read through `site/styles.css` in its entirety. Note every component class, every CSS custom property, and every media query. You need to know what exists before you can rewrite.

Also read `site/topology-demo.css` to understand what styles are page-specific vs shared.

- [ ] **Step 2: Write the new styles.css — reset, tokens, and base typography**

Start the file with:
- CSS reset (box-sizing, margin, padding)
- Design system tokens as CSS custom properties on `:root` (light mode) and `[data-theme="dark"]`
- Base typography rules (body, headings h1-h4, p, a, code, pre, blockquote)
- The content width constraint (`--content-w: min(760px, 100% - 3rem)`)

Color tokens from spec:
- Dark: bg `#0a0a0f`, surface `#12121a`, card `#1a1a2e`, accent `#e8927c`, safe `#065f46`/`#9ae6b4`, danger `#991b1b`/`#fc8181`, link `#63b3ed`
- Light: bg `#faf8f4`, and inverted equivalents

Typography tokens:
- `--serif: Charter, 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif`
- `--sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- `--mono: 'IBM Plex Mono', ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace`

- [ ] **Step 3: Write nav bar styles**

The shared nav bar:
- Fixed/sticky at top, full width
- Left: MIRAGEKIT wordmark (accent color, letter-spacing, sans-serif, links to /)
- Right: nav links (Overview, Evidence, Papers, GitHub external, theme toggle)
- Subtle bottom border and backdrop blur
- Active page indicator
- Mobile: hamburger menu or simplified layout

- [ ] **Step 4: Write component styles**

Reusable components used across pages:
- `.hero` — centered hero section with headline, subtitle, CTAs
- `.stat-callout` — left-bordered accent block for key statistics
- `.card` / `.card-grid` — used on evidence, papers, and landing pages
- `.code-block` — styled pre/code with dark background
- `.section` — standard content section with consistent spacing
- `.section-label` — small uppercase label (e.g., "THE PROBLEM", "INTERACTIVE DEMO")
- `.footer` — site footer with links and attribution
- `.badge` — small status indicators (safe/warn/danger)
- `.metric-bar` — horizontal progress bar for demo metrics
- `.btn` / `.btn-outline` — primary and outline button styles
- `.three-col` — three-column layout for "How it works"
- `.collapsible` — expandable sections for deep analysis

- [ ] **Step 5: Write slider/demo-specific styles**

The interactive demo is the centerpiece. Style:
- `.demo-container` — the demo wrapper with card background
- `.demo-slider` — custom range input styling
- `.demo-columns` — side-by-side comparison layout
- `.demo-policy-card` — individual policy card (naive vs guarded)
- `.demo-verdict` — bottom status line per policy
- Animated metric bars with smooth transitions

- [ ] **Step 6: Write scroll animation styles**

```css
.fade-up {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.5s ease-out, transform 0.5s ease-out;
}
.fade-up.visible {
  opacity: 1;
  transform: translateY(0);
}
@media (prefers-reduced-motion: reduce) {
  .fade-up { opacity: 1; transform: none; transition: none; }
}
```

- [ ] **Step 7: Write responsive / mobile styles**

Media queries for:
- Tablet (max-width: 768px): stack columns, adjust spacing
- Mobile (max-width: 480px): full-width cards, simplified nav

- [ ] **Step 8: Write evidence page-specific styles**

Styles for evidence.html components:
- `.evidence-table` — data tables with monospace values
- `.evidence-record` — individual evidence cards
- `.katex-section` — math formula display area
- `.reproduction-steps` — numbered step list
- `.validation-badge` — green status indicators

- [ ] **Step 9: Write papers page-specific styles**

- `.paper-card` — individual paper listing
- `.paper-card--flagship` — visual prominence for Paper 03
- `.paper-number` — large number display
- `.reading-guide` — suggested reading order

- [ ] **Step 10: Write topology-demo and mirage-shelf overrides**

Page-specific adjustments that supplement the main stylesheet. Keep `topology-demo.css` for canvas-specific styles but update its tokens to reference the new CSS custom properties.

- [ ] **Step 11: Verify the stylesheet loads correctly**

Start the dev server (`preview_start` with name "dev") and confirm:
- The page loads without CSS errors in console
- Light and dark themes apply correctly
- No visual regressions on the current index.html (it will look different — that's expected — but shouldn't be broken)

- [ ] **Step 12: Commit**

```bash
git add site/styles.css site/topology-demo.css
git commit -m "feat: rewrite CSS with new design system tokens and modular components"
```

### Task 2: Shared Nav + Theme Toggle + Scroll Animations (app.js)

**Files:**
- Refactor: `site/app.js`

The current `app.js` is 688 lines handling slider demo, theme toggle, deep analysis toggle, witness/certificate rendering, and DOM manipulation. Refactor it to also include the shared nav component and scroll-triggered animations.

- [ ] **Step 1: Read the current app.js fully**

Read all 688 lines. Identify:
- Which functions power the slider demo (these stay, enhanced)
- Which functions handle the theme toggle (refactor into shared nav)
- Which functions handle deep analysis / witness / certificate (move to evidence page or keep as conditional)
- DOM element IDs referenced (must be preserved or updated)

- [ ] **Step 2: Write the shared nav injection function**

Add a function at the top of app.js that injects the nav bar into every page:

```javascript
function injectNav() {
  var currentPath = window.location.pathname;
  var navHTML = '<nav class="site-nav" role="navigation">'
    + '<a href="/" class="nav-wordmark">MIRAGEKIT</a>'
    + '<div class="nav-links">'
    + '<a href="/"' + (currentPath === '/' || currentPath === '/index.html' ? ' class="active"' : '') + '>Overview</a>'
    + '<a href="/evidence"' + (currentPath.includes('evidence') ? ' class="active"' : '') + '>Evidence</a>'
    + '<a href="/papers"' + (currentPath.includes('papers') ? ' class="active"' : '') + '>Papers</a>'
    + '<a href="https://github.com/jack-chaudier/tropical-mcp" target="_blank" rel="noopener">GitHub <span class="external-arrow">&nearr;</span></a>'
    + '<button id="themeToggle" class="theme-toggle" aria-label="Toggle theme"><span id="themeToggleValue"></span></button>'
    + '</div>'
    + '</nav>';
  document.body.insertAdjacentHTML('afterbegin', navHTML);
}
```

Call `injectNav()` on DOMContentLoaded.

- [ ] **Step 3: Write the scroll animation observer**

```javascript
function initScrollAnimations() {
  if (!('IntersectionObserver' in window)) return;
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.fade-up').forEach(function(el) {
    observer.observe(el);
  });
}
```

- [ ] **Step 4: Refactor theme toggle to work with injected nav**

Update the theme toggle initialization to find the button after nav injection. Keep localStorage persistence with key `miragekit-theme`. Keep the inline `<script>` in `<head>` for flash-free theme detection (this stays in each HTML file).

- [ ] **Step 5: Keep slider demo logic, update DOM references**

The slider demo functions stay largely intact. Update any DOM references if element IDs change in the new index.html. Guard the slider code so it only runs when slider elements exist on the page (i.e., only on index.html).

- [ ] **Step 6: Guard page-specific code**

Wrap page-specific code in existence checks:
```javascript
// Only run slider on landing page
if (document.getElementById('retentionSlider')) {
  initSlider();
}
// Only run deep analysis on pages with it
if (document.getElementById('deepToggle')) {
  initDeepAnalysis();
}
```

- [ ] **Step 7: Verify nav appears on the current page**

Load the site in the preview, confirm:
- Nav bar renders at the top
- Theme toggle works
- Active page is highlighted
- Links navigate correctly

- [ ] **Step 8: Commit**

```bash
git add site/app.js
git commit -m "feat: add shared nav injection, scroll animations, refactor app.js"
```

---

## Chunk 2: Landing Page + Footer

### Task 3: Landing Page Rewrite (index.html)

**Files:**
- Rewrite: `site/index.html`

This is the biggest single file change. The current page is ~525 lines with dense research content. Rewrite to the story-first structure from the spec.

- [ ] **Step 1: Read the current index.html fully**

Read all ~525 lines. Note:
- The inline `<head>` script for theme detection (keep this)
- The structured data JSON-LD (update)
- The OG/Twitter meta tags (update descriptions)
- All section IDs referenced by app.js
- The slider HTML structure (preserve or update element IDs)

- [ ] **Step 2: Write the new `<head>` section**

Keep:
- Charset, viewport, title, favicon
- Theme detection inline script
- OG/Twitter meta tags (update title/description to match new hero copy)
- JSON-LD structured data (update description)
- Link to styles.css
- Script tag for app.js (defer)

Update title to: "The Validity Mirage — AI agents silently lose their task under memory compression"

- [ ] **Step 3: Write the hero section**

```html
<header class="hero fade-up">
  <p class="section-label">University of Michigan &middot; Working Paper 2026</p>
  <h1>Your AI agent is solving the wrong problem.<br>
    <span class="hero-subtitle">It just doesn't know it yet.</span></h1>
  <p class="hero-body">When long conversations get compressed to save memory,
    AI agents can silently lose track of <em>which task they're solving</em> —
    while still answering confidently. We found this happens in
    <strong class="accent">1 in 5</strong> cases.</p>
  <div class="hero-cta">
    <a href="#demo" class="btn">See it happen</a>
    <a href="/papers/paper_03_validity_mirage_compression.pdf" target="_blank" rel="noopener" class="btn-outline">Read the paper <span class="external-arrow">&nearr;</span></a>
  </div>
</header>
```

- [ ] **Step 4: Write the key stat callout**

```html
<div class="stat-callout fade-up">
  <span class="stat-number">21.95%</span>
  <span class="stat-text">of responses silently drifted from their governing task
    (Wilson 95% CI [16.3%, 28.9%])</span>
</div>
```

- [ ] **Step 5: Write the interactive demo section**

Preserve the slider functionality from current app.js. Structure:

```html
<section id="demo" class="section fade-up">
  <p class="section-label">Interactive Demo</p>
  <h2>Slide to compress. Watch the task disappear.</h2>
  <p class="section-intro">Move the slider to simulate memory pressure. The left panel uses naive compression. The right uses our guarded approach.</p>
  <div class="demo-container">
    <!-- Slider control -->
    <div class="demo-slider-wrap">
      <label class="demo-slider-label">Memory Pressure</label>
      <input type="range" id="retentionSlider" ...>
      <div id="sliderTicks" class="demo-ticks"></div>
    </div>
    <!-- Side-by-side comparison -->
    <div class="demo-columns">
      <div id="cardNaive" class="demo-policy-card demo-policy-card--danger">
        <h3 class="demo-policy-title">Naive Recency</h3>
        <div id="naiveMetrics" class="demo-metrics"></div>
        <div id="naiveStatus" class="demo-verdict"></div>
      </div>
      <div id="cardGuarded" class="demo-policy-card demo-policy-card--safe">
        <h3 class="demo-policy-title">Tropical L2 Guarded</h3>
        <div id="guardedMetrics" class="demo-metrics"></div>
        <div id="guardedStatus" class="demo-verdict"></div>
      </div>
    </div>
    <p id="explainerText" class="demo-explainer"></p>
  </div>
</section>
```

Keep the same element IDs as current so app.js slider logic works. Verify against app.js DOM references.

- [ ] **Step 6: Write the "How it works" section**

Three-column layout, no emojis. Use numbered markers or simple CSS icons:

```html
<section class="section fade-up">
  <p class="section-label">How it works</p>
  <h2>Three ideas in one sentence</h2>
  <div class="three-col">
    <div class="three-col-item">
      <span class="three-col-marker">1</span>
      <h3>Tag</h3>
      <p>Identify which messages carry the task</p>
    </div>
    <div class="three-col-item">
      <span class="three-col-marker">2</span>
      <h3>Guard</h3>
      <p>Protect them during compression</p>
    </div>
    <div class="three-col-item">
      <span class="three-col-marker">3</span>
      <h3>Certify</h3>
      <p>Prove what was kept and what was lost</p>
    </div>
  </div>
</section>
```

- [ ] **Step 7: Write the "Try it" install section**

```html
<section class="section fade-up">
  <p class="section-label">Try it</p>
  <h2>Three lines to verify</h2>
  <div class="code-block">
    <code><span class="code-prompt">$</span> pip install tropical-mcp</code>
    <code><span class="code-prompt">$</span> tropical-mcp-smoke</code>
    <code class="code-comment"># certificate shows kept/dropped message IDs</code>
  </div>
  <p class="section-note">Works with Claude Code, Codex, and any MCP-compatible client.
    <a href="https://github.com/jack-chaudier/tropical-mcp" target="_blank" rel="noopener">Full documentation &nearr;</a></p>
</section>
```

- [ ] **Step 8: Write the footer**

```html
<footer class="site-footer fade-up">
  <p class="footer-quote">The roots remember what the canopy forgets.</p>
  <p class="footer-attribution">Jack Chaudier Gaffney &middot; University of Michigan &middot; DOI: <a href="https://doi.org/10.5281/zenodo.18794293">10.5281/zenodo.18794293</a></p>
  <nav class="footer-links">
    <a href="/evidence">Evidence</a>
    <a href="/papers">Papers</a>
    <a href="https://github.com/jack-chaudier/dreams" target="_blank" rel="noopener">GitHub</a>
    <a href="https://github.com/jack-chaudier/tropical-mcp" target="_blank" rel="noopener">tropical-mcp</a>
    <a href="mailto:jackgaff@umich.edu">Contact</a>
    <a href="https://x.com/J_C_Gaffney" target="_blank" rel="noopener">X / updates</a>
  </nav>
</footer>
```

- [ ] **Step 9: Verify the landing page renders correctly**

Load in preview. Check:
- Nav bar renders with "Overview" active
- Hero section with correct copy
- Stat callout styled with accent border
- Interactive demo slider works (move it, see metrics change)
- "How it works" three-column layout
- Install code block
- Footer with links
- Dark/light theme toggle
- Scroll animations trigger on scroll
- No console errors

- [ ] **Step 10: Check mobile responsiveness**

Use `preview_resize` with mobile preset. Verify:
- Nav collapses or simplifies
- Columns stack vertically
- Slider is usable on touch
- No horizontal overflow

- [ ] **Step 11: Commit**

```bash
git add site/index.html
git commit -m "feat: rewrite landing page with story-first hero and focused narrative"
```

---

## Chunk 3: Evidence Page + KaTeX

### Task 4: Evidence Page Restructure (evidence.html)

**Files:**
- Restructure: `site/evidence.html`

- [ ] **Step 1: Read the current evidence.html fully**

Read all ~324 lines. Note the existing sections, data structures, and links to artifacts.

- [ ] **Step 2: Add KaTeX to the page**

Add KaTeX CSS and JS to the `<head>`. Use a CDN with SRI hashes or self-host. CDN is simpler for now:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" integrity="sha384-..." crossorigin="anonymous">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js" integrity="sha384-..." crossorigin="anonymous"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js" integrity="sha384-..." crossorigin="anonymous"></script>
```

Update the CSP in `vercel.json` to allow `cdn.jsdelivr.net` for styles and scripts.

- [ ] **Step 3: Restructure the page sections**

New section order:
1. Replay Witness (existing, polished)
2. Certificate Viewer (existing, polished)
3. Mathematical Foundations (new — moved from landing page)
4. Validation Pipeline (existing, polished)
5. Evidence Boundaries (moved from landing page)
6. Reproduction Path (expanded from existing)

Remove the old page header and replace with just the `<main>` content (nav comes from app.js).

- [ ] **Step 4: Add the Mathematical Foundations section**

```html
<section class="section fade-up">
  <p class="section-label">Mathematical Foundations</p>
  <h2>Core Formulas</h2>
  <div class="card-grid card-grid--2col">
    <div class="card katex-card">
      <h3 class="card-label">Core Contract</h3>
      <div class="katex-display">$$d_{\text{pre}} \geq k$$</div>
      <p>Guarded compaction is certified safe only when the pivot retains its required predecessor depth.</p>
    </div>
    <div class="card katex-card">
      <h3 class="card-label">Frontier Feasibility</h3>
      <div class="katex-display">$$W[k] = -\infty \implies \text{infeasible}$$</div>
      <p>If the k-slot frontier is negative infinity, no valid completion exists for that retained context.</p>
    </div>
    <div class="card katex-card">
      <h3 class="card-label">Raw Validity</h3>
      <div class="katex-display">$$\text{raw} = \max(\text{primary\_full}, \text{decoy\_full})$$</div>
      <p>Answerability alone can stay high even when pivot identity has silently changed.</p>
    </div>
    <div class="card katex-card">
      <h3 class="card-label">Mirage Gap</h3>
      <div class="katex-display">$$\delta = \text{raw} - \text{pivot\_preservation}$$</div>
      <p>Large positive gap indicates a validity mirage regime rather than true semantic stability.</p>
    </div>
  </div>
</section>
```

Add auto-render initialization at the bottom:
```html
<script>
  document.addEventListener('DOMContentLoaded', function() {
    if (typeof renderMathInElement === 'function') {
      renderMathInElement(document.body, {
        delimiters: [
          {left: '$$', right: '$$', display: true},
          {left: '$', right: '$', display: false}
        ]
      });
    }
  });
</script>
```

- [ ] **Step 5: Add the Evidence Boundaries section**

Move the "Evidence Boundaries" content from the current index.html to evidence.html. This includes the honest scope limitations.

- [ ] **Step 6: Add the Reproduction Path section**

Expand the existing reproduction guidance with step-by-step instructions from the README.

- [ ] **Step 7: Polish existing sections**

Update the Replay Witness and Certificate sections to use new CSS classes. Ensure all data links point to correct paths. Update styling to match new design system.

- [ ] **Step 8: Verify evidence page**

Load `/evidence.html` in preview. Check:
- Nav bar renders with "Evidence" active
- All sections display correctly
- KaTeX formulas render (not raw LaTeX)
- Data links work
- Collapsible sections expand/collapse
- Dark/light theme works
- No console errors

- [ ] **Step 9: Commit**

```bash
git add site/evidence.html vercel.json
git commit -m "feat: restructure evidence page with KaTeX math and expanded sections"
```

---

## Chunk 4: Papers Page + Subpage Polish

### Task 5: Papers Page (papers.html) — NEW

**Files:**
- Create: `site/papers.html`

- [ ] **Step 1: Identify all papers and their metadata**

Check `papers/` directory for PDFs and any metadata. The current footer references:
- Paper 00: Continuous Control
- Paper 01: Absorbing States
- Paper 02: Streaming Traps
- Paper 03: Validity Mirage (flagship)
- Paper I: Tropical Algebra

Get file sizes, read any available abstracts from the TeX sources if accessible.

- [ ] **Step 2: Write papers.html**

Full page with:
- Standard `<head>` (same pattern as index.html — theme detection script, OG tags, styles.css, app.js)
- `<main>` with hero: "Research Papers" heading + "Start with the flagship paper, then follow the thread" subtitle
- Flagship paper (03) gets a larger, visually prominent card
- Remaining papers in a grid, numbered, with abstracts and PDF links
- Each card: number badge, title, one-paragraph abstract, key contribution, PDF link with file size, relationship note

```html
<section class="section">
  <div class="paper-card paper-card--flagship fade-up">
    <span class="paper-number">03</span>
    <h2>The Validity Mirage</h2>
    <p class="paper-subtitle">Compression-induced task drift in AI agents</p>
    <p>Context compression can look valid while the governing task has drifted...</p>
    <p class="paper-contribution"><strong>Key contribution:</strong> Formal definition of the validity mirage, empirical measurement across 164 degraded responses, and a tractable detection method.</p>
    <a href="/papers/paper_03_validity_mirage_compression.pdf" target="_blank" rel="noopener" class="btn">Read PDF <span class="external-arrow">&nearr;</span></a>
  </div>

  <p class="section-label" style="margin-top:3rem">Supporting Papers</p>
  <div class="card-grid card-grid--2col">
    <!-- Paper 00, 01, 02, I cards -->
  </div>
</section>
```

- [ ] **Step 3: Add reading guide**

After the paper cards, add a "Suggested reading order" section explaining the relationship between papers.

- [ ] **Step 4: Verify papers page**

Load `/papers.html` in preview. Check:
- Nav bar with "Papers" active
- Flagship paper is visually prominent
- All PDF links work
- Dark/light theme
- Mobile responsive

- [ ] **Step 5: Commit**

```bash
git add site/papers.html
git commit -m "feat: add papers catalog page with abstracts and reading guide"
```

### Task 6: Topology Demo Polish

**Files:**
- Modify: `site/topology-demo.html`
- Modify: `site/topology-demo.css`

- [ ] **Step 1: Read topology-demo.html and topology-demo.css fully**

Understand the current structure and what the page-specific CSS covers.

- [ ] **Step 2: Update topology-demo.html**

- Remove the ad-hoc "Return to the main artifact" header
- Add the standard `<head>` pattern (theme detection script, link to styles.css AND topology-demo.css, script for app.js)
- The nav bar will be injected by app.js
- Update body classes and section styling to use new design system classes
- Keep all canvas/interactive elements and their IDs unchanged
- Keep the topology-demo.js script tag

- [ ] **Step 3: Update topology-demo.css**

- Replace hardcoded colors with CSS custom property references (`var(--bg)`, `var(--ink)`, etc.)
- Update font-family references to use `var(--serif)`, `var(--mono)`
- Adjust spacing to match the new design system
- Keep canvas-specific styles (dimensions, positioning) unchanged

- [ ] **Step 4: Verify topology demo**

Load `/topology-demo.html` in preview. Check:
- Shared nav bar renders
- Interactive visualization works (sliders, canvas)
- Text styling matches the landing page
- Dark/light theme works on all elements including canvas
- No JS errors

- [ ] **Step 5: Commit**

```bash
git add site/topology-demo.html site/topology-demo.css
git commit -m "feat: polish topology demo with shared nav and design system"
```

### Task 7: Grok Mirage Shelf Polish

**Files:**
- Modify: `site/mirage-shelf-grok-2026-03.html`

- [ ] **Step 1: Read mirage-shelf-grok-2026-03.html fully**

Understand the current structure, sections (Findings, Methods, Artifacts), and inline styles.

- [ ] **Step 2: Update the page**

- Replace the `hero-topline` header with the standard `<head>` pattern (theme detection, styles.css, app.js)
- Remove inline header HTML (nav comes from app.js)
- Update section styling to use new design system classes
- Replace inline styles with CSS classes where possible
- Polish the data cards (Findings, Methods, Artifacts) with consistent card styling
- Ensure all links work

- [ ] **Step 3: Verify mirage shelf page**

Load `/mirage-shelf-grok-2026-03.html` in preview. Check:
- Shared nav bar renders
- All sections display with consistent styling
- Data is readable and well-formatted
- Dark/light theme works
- Links to evidence, artifacts work

- [ ] **Step 4: Commit**

```bash
git add site/mirage-shelf-grok-2026-03.html
git commit -m "feat: polish Grok mirage shelf with shared nav and design system"
```

---

## Chunk 5: README + Config + Final Polish

### Task 8: README Rewrite

**Files:**
- Rewrite: `README.md`

- [ ] **Step 1: Read the current README.md**

Already read — 169 lines, 20+ links, reviewer-focused.

- [ ] **Step 2: Write the new README**

Target ~60 lines. Structure:
1. `# dreams: The Validity Mirage` + DOI badge
2. One-sentence description
3. `## What is the validity mirage?` — 2 sentences
4. `## See it live` — link to website
5. `## Try it yourself` — 3-line install + smoke test
6. `## Verify the claims` — reproduction steps (condensed from current)
7. `## Read the research` — 5 papers, one line each
8. `## Repository structure` — keep the current tree diagram
9. `## Citation` — BibTeX block
10. `## Links` — condensed essential links (5-6 max)

- [ ] **Step 3: Verify README renders correctly on GitHub**

Check that markdown formatting, badges, and links are correct. Use `preview_eval` or manual review.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: rewrite README to be concise and point to site"
```

### Task 9: Vercel Config + Sitemap Updates

**Files:**
- Modify: `vercel.json`
- Modify: `site/sitemap.xml`

- [ ] **Step 1: Update vercel.json routes**

Add explicit routes for new pages:
```json
{
  "rewrites": [
    { "source": "/papers/:path*", "destination": "/papers/:path*" },
    { "source": "/results/:path*", "destination": "/results/:path*" },
    { "source": "/evidence", "destination": "/site/evidence" },
    { "source": "/papers", "destination": "/site/papers" },
    { "source": "/topology-demo", "destination": "/site/topology-demo" },
    { "source": "/mirage-shelf-grok-2026-03", "destination": "/site/mirage-shelf-grok-2026-03" },
    { "source": "/(.*)", "destination": "/site/$1" }
  ]
}
```

Update CSP header to allow KaTeX CDN if using CDN approach:
- Add `cdn.jsdelivr.net` to `style-src` and `script-src`
- Add `fonts.googleapis.com` and `fonts.gstatic.com` to `font-src` if KaTeX needs Google Fonts

- [ ] **Step 2: Update sitemap.xml**

Add entries for `/papers`, `/topology-demo`, `/mirage-shelf-grok-2026-03`.

- [ ] **Step 3: Commit**

```bash
git add vercel.json site/sitemap.xml
git commit -m "chore: update vercel routes and sitemap for new pages"
```

### Task 10: Cross-Page Verification

- [ ] **Step 1: Full site walkthrough**

Navigate through every page in the preview:
1. Landing page (/) — hero, demo slider, how it works, install, footer
2. Evidence (/evidence) — all sections, KaTeX rendering, collapsibles
3. Papers (/papers) — all cards, PDF links
4. Topology demo (/topology-demo) — interactive visualization
5. Grok shelf (/mirage-shelf-grok-2026-03) — data sections

Verify on each:
- Shared nav bar with correct active state
- Dark/light theme toggle works
- Scroll animations trigger
- No console errors
- All links work (internal navigation and external)

- [ ] **Step 2: Mobile verification**

Use `preview_resize` with mobile preset. Check all 5 pages for:
- No horizontal overflow
- Readable text
- Usable navigation
- Functional interactive elements

- [ ] **Step 3: Light theme verification**

Switch to light theme and verify all 5 pages look correct with the cream background palette.

- [ ] **Step 4: Fix any issues found**

Address visual bugs, broken links, or missing styles discovered during verification.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "fix: address cross-page verification issues"
```
