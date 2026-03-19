(function() {
  'use strict';

  function pct(v) { return Math.round(v * 100) + '%'; }

  function generateReport(mirage) {
    var levels = mirage.retention_levels.slice().sort(function(a,b){ return b - a; });
    var rows = [];
    for (var i = 0; i < levels.length; i++) {
      var r = levels[i];
      var key = String(r);
      if (key.indexOf('.') === -1) key += '.0';
      var naive = mirage.policies.recency[key];
      var guarded = mirage.policies.l2_guarded[key];
      if (!naive || !guarded) continue;
      rows.push({
        retention: r,
        naive_validity: Math.max(naive.decoy_full_rate || 0, naive.primary_full_rate || 0),
        naive_pivot: naive.pivot_preservation_rate,
        naive_contract: naive.contract_satisfied_rate,
        guarded_validity: Math.max(guarded.decoy_full_rate || 0, guarded.primary_full_rate || 0),
        guarded_pivot: guarded.pivot_preservation_rate,
        guarded_contract: guarded.contract_satisfied_rate,
        mirage: naive.pivot_preservation_rate < 0.05 && Math.max(naive.decoy_full_rate || 0, naive.primary_full_rate || 0) > 0.9
      });
    }
    return rows;
  }

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
        '<td>' + (r.mirage ? 'YES' : '\u2014') + '</td>' +
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
    var lines = [
      '| Retention | Naive Validity | Naive Pivot | Guarded Validity | Guarded Pivot | Contract | Mirage |',
      '|-----------|---------------|-------------|-----------------|--------------|----------|--------|'
    ];
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      lines.push('| ' + [pct(r.retention), pct(r.naive_validity), pct(r.naive_pivot), pct(r.guarded_validity), pct(r.guarded_pivot), pct(r.guarded_contract), r.mirage ? 'YES' : '\u2014'].join(' | ') + ' |');
    }
    downloadFile(lines.join('\n'), 'mirage-report.md', 'text/markdown');
  }

  window.MirageReport = {
    generate: generateReport,
    render: renderReportTable,
    exportJSON: exportJSON,
    exportCSV: exportCSV,
    exportMarkdown: exportMarkdown
  };
})();
