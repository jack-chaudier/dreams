(function () {
  'use strict';

  var METRICS = [
    { key: 'raw_validity', label: 'Raw Validity' },
    { key: 'pivot_preservation_rate', label: 'Pivot Preserved' },
    { key: 'primary_full_rate', label: 'Primary Arc Survival' },
    { key: 'contract_satisfied_rate', label: 'Contract Satisfied' },
  ];

  var EXPLAINER_HIGH = 'No compression yet: both methods preserve the pivot. Only the guarded policy enforces a safety contract when pressure rises.';
  var EXPLAINER_MID = 'Degradation zone: predecessor support is thinning. Guarded retention preserves the governing pivot.';
  var EXPLAINER_LOW = 'Mirage active: naive recency still scores high on raw validity while answering for the wrong pivot.';
  var MIRAGE_NOTE = 'Still high while pivot collapses: this is the mirage.';

  // DOM refs
  var slider = document.getElementById('retentionSlider');
  var retentionDisplay = document.getElementById('retentionValue');
  var naiveMetricsEl = document.getElementById('naiveMetrics');
  var guardedMetricsEl = document.getElementById('guardedMetrics');
  var naiveContractEl = document.getElementById('naiveContract');
  var guardedContractEl = document.getElementById('guardedContract');
  var cardNaive = document.getElementById('cardNaive');
  var cardGuarded = document.getElementById('cardGuarded');
  var naiveStatusEl = document.getElementById('naiveStatus');
  var guardedStatusEl = document.getElementById('guardedStatus');
  var mirageWarning = document.getElementById('mirageWarning');
  var explainerText = document.getElementById('explainerText');
  var deepToggle = document.getElementById('deepToggle');
  var deepContent = document.getElementById('deepContent');
  var toggleIcon = document.getElementById('toggleIcon');
  var witnessClaimEl = document.getElementById('witnessClaim');
  var witnessTropicalEl = document.getElementById('witnessTropical');
  var witnessRegretEl = document.getElementById('witnessRegret');
  var witnessNotesEl = document.getElementById('witnessNotes');
  var certificateJsonEl = document.getElementById('certificateJson');

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function metricColor(value) {
    if (value >= 0.8) return '#6db85a';
    if (value >= 0.4) return '#d4af37';
    return '#e05555';
  }

  function metricClassName(key) {
    return key.replace(/_/g, '-');
  }

  function pct(value) {
    return Math.round(value * 100) + '%';
  }

  // String(1.0) -> "1" but JSON key is "1.0", so normalize
  function levelKey(level) {
    var s = String(level);
    if (s.indexOf('.') === -1) s += '.0';
    return s;
  }

  function getCardState(data) {
    if (data.pivot_preservation_rate >= 0.8) return 'healthy';
    if (data.pivot_preservation_rate >= 0.3) return 'degraded';
    return 'critical';
  }

  function getStatusLabel(state) {
    if (state === 'healthy') return 'SAFE';
    if (state === 'degraded') return 'DEGRADED';
    return 'CRITICAL';
  }

  function interpolate(retention, levels, policyData) {
    if (retention <= levels[0]) {
      var d = policyData[levelKey(levels[0])];
      return addRawValidity(d);
    }
    if (retention >= levels[levels.length - 1]) {
      var d2 = policyData[levelKey(levels[levels.length - 1])];
      return addRawValidity(d2);
    }

    var lower, upper;
    for (var i = 0; i < levels.length - 1; i++) {
      if (retention >= levels[i] && retention <= levels[i + 1]) {
        lower = levels[i];
        upper = levels[i + 1];
        break;
      }
    }

    var t = (retention - lower) / (upper - lower);
    var lData = policyData[levelKey(lower)];
    var uData = policyData[levelKey(upper)];

    var result = {};
    var keys = ['pivot_preservation_rate', 'primary_full_rate', 'decoy_full_rate', 'contract_satisfied_rate'];
    for (var j = 0; j < keys.length; j++) {
      result[keys[j]] = lerp(lData[keys[j]], uData[keys[j]], t);
    }
    return addRawValidity(result);
  }

  function addRawValidity(d) {
    var copy = {};
    for (var k in d) {
      if (d.hasOwnProperty(k)) copy[k] = d[k];
    }
    copy.raw_validity = Math.max(copy.decoy_full_rate || 0, copy.primary_full_rate || 0);
    return copy;
  }

  function buildMetricBars(container) {
    container.innerHTML = '';
    var bars = {};
    for (var i = 0; i < METRICS.length; i++) {
      var m = METRICS[i];
      var div = document.createElement('div');
      div.className = 'metric metric-' + metricClassName(m.key);

      var header = document.createElement('div');
      header.className = 'metric-header';

      var label = document.createElement('span');
      label.className = 'metric-label';
      label.textContent = m.label;

      var value = document.createElement('span');
      value.className = 'metric-value mono';
      value.textContent = '\u2014';

      header.appendChild(label);
      header.appendChild(value);

      var barOuter = document.createElement('div');
      barOuter.className = 'metric-bar';

      var barFill = document.createElement('div');
      barFill.className = 'metric-fill';

      barOuter.appendChild(barFill);
      div.appendChild(header);
      div.appendChild(barOuter);

      var note = document.createElement('div');
      note.className = 'metric-note hidden';
      div.appendChild(note);

      container.appendChild(div);

      bars[m.key] = { value: value, fill: barFill, row: div, note: note };
    }
    return bars;
  }

  function updateMetrics(bars, data, options) {
    var showMirageContradiction = Boolean(
      options &&
      options.highlightMirage &&
      data.raw_validity >= 0.95 &&
      data.pivot_preservation_rate <= 0.15
    );
    var noContract = Boolean(options && options.noContract);

    for (var i = 0; i < METRICS.length; i++) {
      var m = METRICS[i];
      var val = data[m.key];
      var b = bars[m.key];
      var color = metricColor(val);
      var isContractMetric = m.key === 'contract_satisfied_rate';

      b.row.classList.remove('metric-na');
      b.row.classList.remove('mirage-contradiction');
      b.note.classList.add('hidden');

      if (noContract && isContractMetric) {
        b.value.textContent = 'N/A';
        b.fill.style.width = '0%';
        b.fill.style.backgroundColor = 'rgba(220, 215, 200, 0.22)';
        b.value.style.color = 'rgba(220, 215, 200, 0.78)';
        b.row.classList.add('metric-na');
        b.note.textContent = 'No contract in recency baseline.';
        b.note.classList.remove('hidden');
        continue;
      }

      if (m.key === 'raw_validity' && showMirageContradiction) {
        color = '#57b8ff';
      }

      b.value.textContent = pct(val);
      b.fill.style.width = (val * 100) + '%';
      b.fill.style.backgroundColor = color;
      b.value.style.color = color;

      if (m.key === 'raw_validity' && showMirageContradiction) {
        b.row.classList.add('mirage-contradiction');
        b.note.textContent = MIRAGE_NOTE;
        b.note.classList.remove('hidden');
      }
    }
  }

  function updateCardState(cardEl, statusEl, data) {
    var state = getCardState(data);
    cardEl.classList.remove('state-healthy', 'state-degraded', 'state-critical');
    cardEl.classList.add('state-' + state);
    statusEl.textContent = getStatusLabel(state);
  }

  function updateContractBadge(el, data, options) {
    var mode = options && options.mode ? options.mode : 'enforced';
    var satisfied = data.contract_satisfied_rate >= 0.5;
    var dPre = Math.round(3 * data.primary_full_rate);

    if (mode === 'none') {
      el.className = 'contract-badge not-applicable';
      el.textContent = '\u25E6 No contract enforced \u00b7 baseline recency';
      return;
    }

    if (satisfied) {
      el.className = 'contract-badge satisfied';
      el.textContent = '\u2726 Contract Satisfied \u00b7 d_pre = ' + dPre;
    } else {
      el.className = 'contract-badge violated';
      el.textContent = '\u2727 Contract Violated \u00b7 d_pre = ' + dPre;
    }
  }

  function getExplainer(retention) {
    if (retention >= 0.8) return EXPLAINER_HIGH;
    if (retention >= 0.5) return EXPLAINER_MID;
    return EXPLAINER_LOW;
  }

  // Scroll reveal with IntersectionObserver
  function initScrollReveal() {
    var revealEls = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      // Fallback: just reveal everything
      for (var i = 0; i < revealEls.length; i++) {
        revealEls[i].classList.add('revealed');
      }
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          entries[i].target.classList.add('revealed');
          observer.unobserve(entries[i].target);
        }
      }
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    for (var j = 0; j < revealEls.length; j++) {
      observer.observe(revealEls[j]);
    }
  }

  async function init() {
    var responses = await Promise.all([
      fetch('./data_miragekit.json'),
      fetch('./data_certificate.json'),
    ]);
    var mirage = await responses[0].json();
    var cert = await responses[1].json();

    var levels = mirage.retention_levels.slice().sort(function (a, b) { return a - b; });

    var naiveBars = buildMetricBars(naiveMetricsEl);
    var guardedBars = buildMetricBars(guardedMetricsEl);

    // Populate deep section
    witnessClaimEl.textContent = mirage.witness.claim;
    witnessTropicalEl.textContent = cert.full_context.W[cert.full_context.W.length - 1].toFixed(1);
    witnessRegretEl.textContent = mirage.witness.semantic_regret_example.toFixed(3);

    if (mirage.witness.notes && mirage.witness.notes.length) {
      var html = '';
      for (var n = 0; n < mirage.witness.notes.length; n++) {
        html += '<p>\u2014 ' + mirage.witness.notes[n] + '</p>';
      }
      witnessNotesEl.innerHTML = html;
    }

    certificateJsonEl.textContent = JSON.stringify(cert, null, 2);

    var prevMirageVisible = false;

    function render(retentionPct) {
      var retention = retentionPct / 100;
      retentionDisplay.textContent = retentionPct + '%';

      // Color the retention display based on danger level
      if (retention < 0.5) {
        retentionDisplay.classList.add('danger');
      } else {
        retentionDisplay.classList.remove('danger');
      }

      var naive = interpolate(retention, levels, mirage.policies.recency);
      var guarded = interpolate(retention, levels, mirage.policies.l2_guarded);

      updateMetrics(naiveBars, naive, { highlightMirage: true, noContract: true });
      updateMetrics(guardedBars, guarded, { highlightMirage: false, noContract: false });
      updateCardState(cardNaive, naiveStatusEl, naive);
      updateCardState(cardGuarded, guardedStatusEl, guarded);
      updateContractBadge(naiveContractEl, naive, { mode: 'none' });
      updateContractBadge(guardedContractEl, guarded, { mode: 'enforced' });

      // Mirage warning
      var shouldShowMirage = naive.pivot_preservation_rate < 0.05 && naive.raw_validity > 0.9;
      if (shouldShowMirage && !prevMirageVisible) {
        mirageWarning.classList.remove('hidden');
        // Re-trigger animation by cloning
        var icon = mirageWarning.querySelector('.mirage-icon');
        if (icon) {
          icon.style.animation = 'none';
          icon.offsetHeight; // force reflow
          icon.style.animation = '';
        }
      } else if (!shouldShowMirage) {
        mirageWarning.classList.add('hidden');
      }
      prevMirageVisible = shouldShowMirage;

      explainerText.textContent = getExplainer(retention);
    }

    slider.addEventListener('input', function () {
      render(Number(slider.value));
    });
    render(Number(slider.value));

    // Deep toggle
    deepToggle.addEventListener('click', function () {
      var isHidden = deepContent.classList.contains('hidden');
      deepContent.classList.toggle('hidden');
      toggleIcon.classList.toggle('open');
      deepToggle.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
      if (isHidden) {
        deepToggle.style.borderRadius = '12px 12px 0 0';
      } else {
        deepToggle.style.borderRadius = '12px';
      }
    });

    // Init scroll reveals
    initScrollReveal();
  }

  init().catch(function (err) {
    console.error('Failed to load demo data:', err);
    if (explainerText) {
      explainerText.textContent = 'Failed to load demo data: ' + err.message;
    }
  });
})();
