const slider = document.getElementById("retentionSlider");
const retentionValue = document.getElementById("retentionValue");

const recencyPivot = document.getElementById("recencyPivot");
const recencyPrimary = document.getElementById("recencyPrimary");
const recencyDecoy = document.getElementById("recencyDecoy");
const recencyContract = document.getElementById("recencyContract");

const guardedPivot = document.getElementById("guardedPivot");
const guardedPrimary = document.getElementById("guardedPrimary");
const guardedDecoy = document.getElementById("guardedDecoy");
const guardedContract = document.getElementById("guardedContract");

const deltaText = document.getElementById("deltaText");
const witnessClaim = document.getElementById("witnessClaim");
const witnessRegret = document.getElementById("witnessRegret");
const certificatePreview = document.getElementById("certificatePreview");

function pct(value) {
  return `${Math.round(value * 100)}%`;
}

function contractDisplay(value) {
  if (value === 1) return "Yes";
  if (value === 0) return "No";
  return "N/A";
}

async function loadData() {
  const [mirageRes, certRes] = await Promise.all([
    fetch("./data_miragekit.json"),
    fetch("./data_certificate.json"),
  ]);
  const mirage = await mirageRes.json();
  const cert = await certRes.json();

  witnessClaim.textContent = mirage.witness.claim;
  witnessRegret.textContent = mirage.witness.semantic_regret_example.toFixed(3);
  certificatePreview.textContent = JSON.stringify(cert, null, 2);

  const levels = mirage.retention_levels.map(String);

  function render(index) {
    const level = levels[index];
    const rec = mirage.policies.recency[level];
    const l2 = mirage.policies.l2_guarded[level];

    retentionValue.textContent = `${Math.round(Number(level) * 100)}%`;

    recencyPivot.textContent = pct(rec.pivot_preservation_rate);
    recencyPrimary.textContent = pct(rec.primary_full_rate);
    recencyDecoy.textContent = pct(rec.decoy_full_rate);
    recencyContract.textContent = contractDisplay(rec.contract_satisfied_rate);

    guardedPivot.textContent = pct(l2.pivot_preservation_rate);
    guardedPrimary.textContent = pct(l2.primary_full_rate);
    guardedDecoy.textContent = pct(l2.decoy_full_rate);
    guardedContract.textContent = contractDisplay(l2.contract_satisfied_rate);

    const pivotDelta = l2.pivot_preservation_rate - rec.pivot_preservation_rate;
    deltaText.textContent =
      pivotDelta > 0
        ? `At this budget, guarded compaction preserves pivot continuity by +${Math.round(pivotDelta * 100)} points.`
        : "At this budget, both policies are similar on this fixture.";
  }

  slider.addEventListener("input", () => render(Number(slider.value)));
  render(Number(slider.value));
}

loadData().catch((error) => {
  deltaText.textContent = `Failed to load demo data: ${error.message}`;
});
