(function () {
  'use strict';

  var METRICS = [
    { key: 'raw_validity', label: 'Raw Validity' },
    { key: 'pivot_preservation_rate', label: 'Pivot Preserved' },
    { key: 'primary_full_rate', label: 'Primary Arc Survival' },
    { key: 'contract_satisfied_rate', label: 'Contract Satisfied' },
    { key: 'token_retention_mean', label: 'Realized Token Retention' },
  ];

  var EXPLAINER_HIGH = 'No compression yet: both methods preserve the pivot. Only the guarded policy enforces a safety contract when pressure rises.';
  var EXPLAINER_MID = 'Degradation zone: predecessor support is thinning. Guarded retention preserves the governing pivot.';
  var EXPLAINER_LOW = 'Mirage active: naive recency still scores high on raw validity while answering for the wrong pivot.';
  var MIRAGE_NOTE = 'Still high while pivot collapses: this is the mirage.';

  // DOM refs
  var slider = document.getElementById('retentionSlider');
  if (!slider) return;  // Only run on demo page

  var sliderTicksEl = document.getElementById('sliderTicks');
  var retentionDisplay = document.getElementById('retentionValue');
  var sliderContextEl = document.getElementById('sliderContext');
  var sliderTrackProgressEl = document.getElementById('sliderTrackProgress');
  var sliderRegimeEl = document.getElementById('sliderRegime');
  var sliderRegimeValueEl = document.getElementById('sliderRegimeValue');
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
  var witnessRegretContextValueEl = document.getElementById('witnessRegretContextValue');
  var witnessNotesEl = document.getElementById('witnessNotes');
  var recencyKeptListEl = document.getElementById('recencyKeptList');
  var recencyDroppedListEl = document.getElementById('recencyDroppedList');
  var guardedKeptListEl = document.getElementById('guardedKeptList');
  var guardedDroppedListEl = document.getElementById('guardedDroppedList');
  var recencyNoteEl = document.getElementById('recencyNote');
  var guardedNoteEl = document.getElementById('guardedNote');
  var recencyBadgeEl = document.getElementById('recencyBadge');
  var guardedBadgeEl = document.getElementById('guardedBadge');
  var certificateTokenSummaryEl = document.getElementById('certificateTokenSummary');
  var certificateJsonEl = document.getElementById('certificateJson');
  var semanticRegretEl = document.getElementById('semanticRegret');
  var semanticRegretValueEl = document.getElementById('semanticRegretValue');

  function metricColor(value) {
    if (value >= 0.8) return 'var(--safe)';
    if (value >= 0.4) return 'var(--warn)';
    return 'var(--danger)';
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

  function addRawValidity(d) {
    var copy = {};
    for (var k in d) {
      if (d.hasOwnProperty(k)) copy[k] = d[k];
    }
    copy.raw_validity = Math.max(copy.decoy_full_rate || 0, copy.primary_full_rate || 0);
    return copy;
  }

  function getExactPoint(policyData, retention) {
    var key = levelKey(retention);
    if (!policyData || !policyData[key]) {
      throw new Error('Missing policy checkpoint for retention=' + key);
    }
    return addRawValidity(policyData[key]);
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

  function buildSet(ids) {
    var out = {};
    if (!ids || !ids.length) return out;
    for (var i = 0; i < ids.length; i++) {
      out[ids[i]] = true;
    }
    return out;
  }

  function mergeSet(target, ids) {
    if (!ids || !ids.length) return;
    for (var i = 0; i < ids.length; i++) {
      target[ids[i]] = true;
    }
  }

  function classifyChunk(id, pivotId, protectedSet) {
    if (id === pivotId) return 'pivot';
    if (protectedSet[id]) return 'predecessor';
    if (/^hc/i.test(id)) return 'predecessor';
    if (/^n/i.test(id)) return 'noise';
    return 'context';
  }

  function renderChunkList(el, ids, options) {
    if (!el) return;
    el.innerHTML = '';

    if (!ids || !ids.length) {
      var empty = document.createElement('li');
      empty.className = 'chunk-empty';
      empty.textContent = 'none';
      el.appendChild(empty);
      return;
    }

    for (var i = 0; i < ids.length; i++) {
      var id = ids[i];
      var role = classifyChunk(id, options.pivotId, options.protectedSet);
      var li = document.createElement('li');
      li.className = 'chunk-item';

      if (role === 'pivot') li.classList.add('chunk-pivot');
      if (role === 'predecessor') li.classList.add('chunk-predecessor');
      if (role === 'noise') li.classList.add('chunk-noise');
      if (options.dropped) li.classList.add('chunk-dropped');
      if (options.highlightProtected && options.protectedSet[id]) li.classList.add('chunk-protected');

      var idEl = document.createElement('span');
      idEl.className = 'chunk-id mono';
      idEl.textContent = id;

      var roleEl = document.createElement('span');
      roleEl.className = 'chunk-role';
      roleEl.textContent = role;

      li.appendChild(idEl);
      li.appendChild(roleEl);
      el.appendChild(li);
    }
  }

  function joinIds(ids) {
    if (!ids || !ids.length) return 'none';
    return ids.join(', ');
  }

  function countByRole(ids, pivotId, protectedSet, role) {
    var count = 0;
    if (!ids) return count;
    for (var i = 0; i < ids.length; i++) {
      if (classifyChunk(ids[i], pivotId, protectedSet) === role) count++;
    }
    return count;
  }

  function renderCertificateComparison(cert) {
    var recency = cert.policies && cert.policies.recency ? cert.policies.recency : {};
    var guarded = cert.policies && cert.policies.l2_guarded ? cert.policies.l2_guarded : {};
    var recencyAudit = recency.audit || {};
    var guardedAudit = guarded.audit || {};
    var pivotId = cert.full_context && cert.full_context.pivot_id ? cert.full_context.pivot_id : '';

    var protectedSet = buildSet((cert.full_context && cert.full_context.protected_ids) || []);
    mergeSet(protectedSet, guardedAudit.protected_ids || []);

    var recencyKept = recency.kept_ids || [];
    var recencyDropped = recencyAudit.dropped_ids || [];
    var guardedKept = guarded.kept_ids || [];
    var guardedDropped = guardedAudit.dropped_ids || [];

    renderChunkList(recencyKeptListEl, recencyKept, {
      pivotId: pivotId,
      protectedSet: protectedSet,
      dropped: false,
      highlightProtected: false,
    });
    renderChunkList(recencyDroppedListEl, recencyDropped, {
      pivotId: pivotId,
      protectedSet: protectedSet,
      dropped: true,
      highlightProtected: false,
    });
    renderChunkList(guardedKeptListEl, guardedKept, {
      pivotId: pivotId,
      protectedSet: protectedSet,
      dropped: false,
      highlightProtected: true,
    });
    renderChunkList(guardedDroppedListEl, guardedDropped, {
      pivotId: pivotId,
      protectedSet: protectedSet,
      dropped: true,
      highlightProtected: false,
    });

    var recencyDroppedPred = [];
    for (var i = 0; i < recencyDropped.length; i++) {
      if (classifyChunk(recencyDropped[i], pivotId, protectedSet) === 'predecessor') {
        recencyDroppedPred.push(recencyDropped[i]);
      }
    }
    if (recencyDroppedPred.length) {
      recencyNoteEl.textContent = 'Dropped ' + joinIds(recencyDroppedPred) + ' — the pivot\'s causal predecessors.';
    } else {
      recencyNoteEl.textContent = 'No predecessor-chain drops in this fixture.';
    }

    var guardedProtectedKept = [];
    for (var id in protectedSet) {
      if (protectedSet.hasOwnProperty(id)) {
        for (var j = 0; j < guardedKept.length; j++) {
          if (guardedKept[j] === id) guardedProtectedKept.push(id);
        }
      }
    }
    guardedNoteEl.textContent = 'Protected chain retained: ' + joinIds(guardedProtectedKept) + '.';

    recencyBadgeEl.textContent = 'No contract \u00b7 guard not applicable';
    guardedBadgeEl.textContent = guardedAudit.contract_satisfied
      ? '\u2726 Contract satisfied \u00b7 guard active'
      : '\u2727 Contract not satisfied';

    var recencyBefore = typeof recencyAudit.tokens_before === 'number' ? recencyAudit.tokens_before : null;
    var recencyAfter = typeof recencyAudit.tokens_after === 'number' ? recencyAudit.tokens_after : null;
    var guardedBefore = typeof guardedAudit.tokens_before === 'number' ? guardedAudit.tokens_before : recencyBefore;
    var guardedAfter = typeof guardedAudit.tokens_after === 'number' ? guardedAudit.tokens_after : null;

    var recKeptNoise = countByRole(recencyKept, pivotId, protectedSet, 'noise');
    var recLostPred = countByRole(recencyDropped, pivotId, protectedSet, 'predecessor');
    var guardKeptPred = countByRole(guardedKept, pivotId, protectedSet, 'predecessor');
    var guardDroppedNoise = countByRole(guardedDropped, pivotId, protectedSet, 'noise');

    var recencyPhrase = (recKeptNoise > 0 && recLostPred > 0) ? 'kept noise, lost predecessors' : 'retained mostly recent context';
    var guardPhrase = (guardKeptPred > 0 && guardDroppedNoise > 0) ? 'kept predecessors, dropped noise' : 'preserved protected context';

    if (recencyBefore !== null && recencyAfter !== null && guardedBefore !== null && guardedAfter !== null) {
      certificateTokenSummaryEl.textContent =
        'Recency: ' + recencyBefore + ' \u2192 ' + recencyAfter + ' tokens (' + recencyPhrase + ') | ' +
        'Guard: ' + guardedBefore + ' \u2192 ' + guardedAfter + ' tokens (' + guardPhrase + ')';
    } else {
      certificateTokenSummaryEl.textContent = 'Token accounting unavailable for this certificate.';
    }

    certificateJsonEl.textContent = JSON.stringify(cert, null, 2);
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
        b.fill.style.backgroundColor = 'var(--rule-light)';
        b.value.style.color = 'var(--ink-3)';
        b.row.classList.add('metric-na');
        b.note.textContent = 'No contract in recency baseline.';
        b.note.classList.remove('hidden');
        continue;
      }

      if (m.key === 'raw_validity' && showMirageContradiction) {
        color = 'var(--mirage-blue)';
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
    var kValue = options && typeof options.k === 'number' ? options.k : null;
    var kText = kValue === null ? 'k' : 'k=' + kValue;

    if (mode === 'none') {
      el.className = 'contract-badge not-applicable';
      el.textContent = '\u25E6 No contract enforced \u00b7 baseline recency';
      return;
    }

    if (satisfied) {
      el.className = 'contract-badge satisfied';
      el.textContent = '\u2726 Contract Satisfied \u00b7 d_pre >= ' + kText;
    } else {
      el.className = 'contract-badge violated';
      el.textContent = '\u2727 Contract Violated \u00b7 d_pre < ' + kText;
    }
  }

  function getExplainer(retention) {
    if (retention >= 0.8) return EXPLAINER_HIGH;
    if (retention >= 0.5) return EXPLAINER_MID;
    return EXPLAINER_LOW;
  }

  function getSliderContext(naive, guarded, mirageGap) {
    if (naive.pivot_preservation_rate >= 0.99 && guarded.pivot_preservation_rate >= 0.99) {
      return 'Full context retained; both policies remain aligned.';
    }
    if (guarded.pivot_preservation_rate >= 0.99 && naive.pivot_preservation_rate >= 0.5) {
      return 'Compression pressure is visible, but the guarded policy still preserves the governing pivot.';
    }
    if (guarded.pivot_preservation_rate >= 0.95 && mirageGap >= 0.4) {
      return 'Naive recency is still answerable, but it has already drifted off the original causal anchor.';
    }
    return 'Compression pressure is now visible in both paths; inspect the witness and certificate before trusting the compressed state.';
  }

  function getSliderRegime(naive, guarded, mirageGap) {
    if (naive.pivot_preservation_rate >= 0.99 && guarded.pivot_preservation_rate >= 0.99) {
      return { label: 'Aligned', tone: 'safe' };
    }
    if (guarded.pivot_preservation_rate >= 0.99 && naive.pivot_preservation_rate >= 0.5) {
      return { label: 'Guard Active', tone: 'safe' };
    }
    if (guarded.pivot_preservation_rate >= naive.pivot_preservation_rate && mirageGap < 0.4) {
      return { label: 'Pressure Rising', tone: 'warn' };
    }
    return { label: 'Mirage Active', tone: 'danger' };
  }

  async function init() {
    var responses = await Promise.all([
      fetch('./data_miragekit.json'),
      fetch('./data_certificate.json'),
    ]);
    if (!responses[0].ok || !responses[1].ok) {
      throw new Error('Failed to fetch demo data assets');
    }
    var mirage = await responses[0].json();
    var cert = await responses[1].json();

    var levels = mirage.retention_levels.slice().sort(function (a, b) { return a - b; });
    slider.min = '0';
    slider.max = String(Math.max(levels.length - 1, 0));
    slider.step = '1';
    slider.value = slider.max;

    if (sliderTicksEl) {
      sliderTicksEl.innerHTML = '';
      for (var t = 0; t < levels.length; t++) {
        var tick = document.createElement('span');
        tick.textContent = pct(levels[t]);
        sliderTicksEl.appendChild(tick);
      }
    }

    var naiveBars = buildMetricBars(naiveMetricsEl);
    var guardedBars = buildMetricBars(guardedMetricsEl);

    // Populate deep section
    witnessClaimEl.textContent = mirage.witness.claim;
    witnessTropicalEl.textContent = cert.full_context.W[cert.full_context.W.length - 1].toFixed(1);
    witnessRegretEl.textContent = mirage.witness.semantic_regret_example.toFixed(3);
    witnessRegretContextValueEl.textContent = mirage.witness.semantic_regret_example.toFixed(3);

    if (mirage.witness.notes && mirage.witness.notes.length) {
      var html = '';
      for (var n = 0; n < mirage.witness.notes.length; n++) {
        html += '<p>\u2014 ' + mirage.witness.notes[n] + '</p>';
      }
      witnessNotesEl.innerHTML = html;
    }

    renderCertificateComparison(cert);

    // Wire up report
    if (window.MirageReport) {
      var reportRows = MirageReport.generate(mirage);
      var reportContainer = document.getElementById('reportContainer');
      if (reportContainer) {
        MirageReport.render(reportContainer, reportRows);
        var actions = document.getElementById('reportActions');
        if (actions) actions.style.display = 'flex';
        var btnJson = document.getElementById('exportJson');
        var btnCsv = document.getElementById('exportCsv');
        var btnMd = document.getElementById('exportMd');
        if (btnJson) btnJson.addEventListener('click', function(){ MirageReport.exportJSON(reportRows); });
        if (btnCsv) btnCsv.addEventListener('click', function(){ MirageReport.exportCSV(reportRows); });
        if (btnMd) btnMd.addEventListener('click', function(){ MirageReport.exportMarkdown(reportRows); });
      }
    }

    var prevMirageVisible = false;

    function render(checkpointIndex) {
      var safeIndex = Math.max(0, Math.min(levels.length - 1, checkpointIndex));
      var retention = levels[safeIndex];
      var progress = levels.length > 1 ? (safeIndex / (levels.length - 1)) * 100 : 100;
      var naive = getExactPoint(mirage.policies.recency, retention);
      var guarded = getExactPoint(mirage.policies.l2_guarded, retention);
      var mirageGap = naive.raw_validity - naive.pivot_preservation_rate;
      var regime = getSliderRegime(naive, guarded, mirageGap);
      var certK = typeof cert.k === 'number' ? cert.k : null;

      retentionDisplay.textContent = pct(retention);
      slider.setAttribute(
        'aria-valuetext',
        pct(retention) + ' retained; ' + regime.label.toLowerCase() + '; naive pivot ' +
          pct(naive.pivot_preservation_rate) + '; guarded pivot ' + pct(guarded.pivot_preservation_rate)
      );

      // Color the retention display based on danger level
      if (retention < 0.5) {
        retentionDisplay.classList.add('danger');
      } else {
        retentionDisplay.classList.remove('danger');
      }

      if (sliderContextEl) {
        sliderContextEl.textContent = getSliderContext(naive, guarded, mirageGap);
      }

      if (sliderTrackProgressEl) {
        sliderTrackProgressEl.style.width = progress + '%';
      }

      if (sliderRegimeEl && sliderRegimeValueEl) {
        sliderRegimeEl.classList.remove('safe', 'warn', 'danger');
        sliderRegimeEl.classList.add(regime.tone);
        sliderRegimeValueEl.textContent = regime.label;
      }

      if (sliderTicksEl) {
        var tickEls = sliderTicksEl.children;
        for (var tickIndex = 0; tickIndex < tickEls.length; tickIndex++) {
          tickEls[tickIndex].classList.toggle('past', tickIndex <= safeIndex);
          tickEls[tickIndex].classList.toggle('active', tickIndex === safeIndex);
        }
      }

      updateMetrics(naiveBars, naive, { highlightMirage: true, noContract: true });
      updateMetrics(guardedBars, guarded, { highlightMirage: false, noContract: false });
      updateCardState(cardNaive, naiveStatusEl, naive);
      updateCardState(cardGuarded, guardedStatusEl, guarded);
      updateContractBadge(naiveContractEl, naive, { mode: 'none' });
      updateContractBadge(guardedContractEl, guarded, { mode: 'enforced', k: certK });

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

      // Mirage gap is data-backed at each replay checkpoint
      if (semanticRegretEl && semanticRegretValueEl) {
        semanticRegretEl.classList.remove('hidden', 'neutral', 'warn', 'danger');
        semanticRegretEl.classList.add(mirageGap >= 0.4 ? 'danger' : mirageGap >= 0.1 ? 'warn' : 'neutral');
        semanticRegretValueEl.textContent = (mirageGap * 100).toFixed(1) + ' pp';
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
    });
  }

  init().catch(function (err) {
    console.error('Failed to load demo data:', err);
    if (explainerText) {
      explainerText.textContent = 'Failed to load demo data: ' + err.message;
    }
  });
})();
