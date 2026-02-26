(function () {
  'use strict';

  var METRICS = [
    { key: 'raw_validity', label: 'Raw Validity' },
    { key: 'pivot_preservation_rate', label: 'Pivot Preserved' },
    { key: 'primary_full_rate', label: 'Primary Arc Survival' },
    { key: 'contract_satisfied_rate', label: 'Contract Satisfied' },
  ];

  var EXPLAINER_HIGH = 'Both methods safe at this retention. Drag left to see divergence.';
  var EXPLAINER_MID = 'Degradation zone. Predecessor support thinning.';
  var EXPLAINER_LOW = 'Mirage active. Naive solver substituted pivot identity.';

  // DOM refs
  var slider = document.getElementById('retentionSlider');
  var retentionDisplay = document.getElementById('retentionValue');
  var naiveMetricsEl = document.getElementById('naiveMetrics');
  var guardedMetricsEl = document.getElementById('guardedMetrics');
  var naiveContractEl = document.getElementById('naiveContract');
  var guardedContractEl = document.getElementById('guardedContract');
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

  function pct(value) {
    return Math.round(value * 100) + '%';
  }

  // String(1.0) → "1" but JSON key is "1.0", so normalize
  function levelKey(level) {
    var s = String(level);
    if (s.indexOf('.') === -1) s += '.0';
    return s;
  }

  function interpolate(retention, levels, policyData) {
    // levels must be sorted ascending
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
    // Raw validity: the model can still answer *something* (decoy or primary survives)
    // This is always ~1.0 for naive recency, creating the mirage
    copy.raw_validity = Math.max(copy.decoy_full_rate || 0, copy.primary_full_rate || 0);
    return copy;
  }

  function buildMetricBars(container) {
    container.innerHTML = '';
    var bars = {};
    for (var i = 0; i < METRICS.length; i++) {
      var m = METRICS[i];
      var div = document.createElement('div');
      div.className = 'metric';

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
      container.appendChild(div);

      bars[m.key] = { value: value, fill: barFill };
    }
    return bars;
  }

  function updateMetrics(bars, data) {
    for (var i = 0; i < METRICS.length; i++) {
      var m = METRICS[i];
      var val = data[m.key];
      var b = bars[m.key];
      b.value.textContent = pct(val);
      b.fill.style.width = (val * 100) + '%';
      b.fill.style.backgroundColor = metricColor(val);
      b.value.style.color = metricColor(val);
    }
  }

  function updateContractBadge(el, data) {
    var satisfied = data.contract_satisfied_rate >= 0.5;
    var dPre = Math.round(3 * data.primary_full_rate);
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

  async function init() {
    var responses = await Promise.all([
      fetch('./data_miragekit.json'),
      fetch('./data_certificate.json'),
    ]);
    var mirage = await responses[0].json();
    var cert = await responses[1].json();

    // Sort levels ascending for interpolation
    var levels = mirage.retention_levels.slice().sort(function (a, b) { return a - b; });

    // Build metric bars
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

    // Render
    function render(retentionPct) {
      var retention = retentionPct / 100;
      retentionDisplay.textContent = retentionPct + '%';

      var naive = interpolate(retention, levels, mirage.policies.recency);
      var guarded = interpolate(retention, levels, mirage.policies.l2_guarded);

      updateMetrics(naiveBars, naive);
      updateMetrics(guardedBars, guarded);
      updateContractBadge(naiveContractEl, naive);
      updateContractBadge(guardedContractEl, guarded);

      // Mirage warning: show when naive pivot is near 0 but raw validity is high
      if (naive.pivot_preservation_rate < 0.05 && naive.raw_validity > 0.9) {
        mirageWarning.classList.remove('hidden');
      } else {
        mirageWarning.classList.add('hidden');
      }

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
  }

  init().catch(function (err) {
    console.error('Failed to load demo data:', err);
    if (explainerText) {
      explainerText.textContent = 'Failed to load demo data: ' + err.message;
    }
  });
})();
