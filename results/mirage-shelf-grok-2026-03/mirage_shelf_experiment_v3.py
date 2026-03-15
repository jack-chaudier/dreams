#!/usr/bin/env python3
"""
mirage_shelf_experiment.py v3
Measures the mirage gap on Grok: answer accuracy vs witness accuracy
across context lengths, with a witness-removal causal control.

Run order:
    1. python mirage.py generate
    2. [paste generation prompt into Grok/Claude, save output to data/items.jsonl]
    3. python mirage.py build
    4. python mirage.py run --pilot
    5. python mirage.py score --run pilot
    6. [manually inspect 10 pilot outputs]
    7. python mirage.py run --full
    8. python mirage.py score --run full
    9. python mirage.py plot --run full
"""

import json, os, random, hashlib, argparse, time, re, sys
from pathlib import Path
from dataclasses import dataclass, asdict
from difflib import SequenceMatcher

XAI_API_BASE = "https://api.x.ai/v1"
DATA = Path("data")
RESULTS = Path("results")
DEFAULT_USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/122.0.0.0 Safari/537.36"
)

TOKENS_PER_CHAR = 0.33

PILOT = {"n": 30, "lengths": [4_000, 32_000, 128_000], "conditions": ["normal", "witness_removed"]}
FULL  = {
    "n": 200,
    "normal_lengths":  [4_000, 16_000, 64_000, 256_000, 512_000],
    "removed_lengths": [4_000, 64_000, 256_000],  # 3 key points suffice for control
}

DOMAINS = [
    "infrastructure/deployment", "infrastructure/monitoring",
    "data-pipeline/ingestion", "data-pipeline/validation",
    "security/access-control", "security/incident-response",
    "ml-ops/model-serving", "ml-ops/training-pipeline",
    "product/launch-readiness", "product/feature-rollout",
    "compliance/audit", "compliance/data-retention",
]

BANNED_META_PHRASES = [
    "near-miss", "near miss", "distractor", "decoy", "trap",
    "correct choice", "correct answer", "good to go",
]


def load_dotenv_if_present(path=Path(".env")):
    if not path.exists():
        return

    for raw_line in path.read_text().splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        if not key or key in os.environ:
            continue
        value = value.strip().strip('"').strip("'")
        os.environ[key] = value


# ── Data ──────────────────────────────────────────────────────────

@dataclass
class Item:
    id: str
    domain: str
    question: str
    option_a: str
    option_b: str
    correct_answer: str
    witness_lines: list[str]
    near_miss_lines: list[str]
    distractor_paragraphs: list[str]

    def to_dict(self): return asdict(self)

    @classmethod
    def from_dict(cls, d): return cls(**d)


# ── Generate ──────────────────────────────────────────────────────

GENERATION_PROMPT = """Generate {n} test items for a memory experiment. Output a JSON array.

Each item:
- "id": "item_XXXX"
- "domain": one of {domains}
- "question": "Based on the document, should the team proceed with Option A or Option B?"
- "option_a": specific realistic action (1-2 sentences)
- "option_b": specific realistic alternative (1-2 sentences)
- "correct_answer": "A" or "B" (balance 50/50)
- "witness_lines": EXACTLY 3 sentences. Each MUST contain a specific number AND a
  proper noun. These are the evidence that justifies the correct answer.
  Every sentence must include an explicit named entity such as a person, product,
  cluster, policy ID, deployment codename, or document title. Generic phrases like
  "the SLA", "the audit policy", or "the monitoring system" do NOT count.
  Example:
    "The Meridian-7 pipeline reported a 4.2% error rate on March 3rd."
    "Lead engineer Sarah Chen flagged 14 false alerts last week."
    "The SLA window closes at 72 hours; 68 have elapsed."
- "near_miss_lines": EXACTLY 3 sentences structurally identical to witness_lines
  but with CHANGED numbers and names. Must NOT support the correct answer.
  Every sentence must also include an explicit named entity; generic phrases do NOT count.
  Example:
    "The Meridian-9 pipeline reported a 4.8% error rate on March 5th."
    "Lead engineer David Park flagged 11 false alerts last week."
    "The SLA window closes at 96 hours; 71 have elapsed."
- "distractor_paragraphs": 25 paragraphs (3-5 sentences each) in the SAME domain,
  similar vocabulary. Scatter near_miss_lines inside some paragraphs naturally.
  Other paragraphs: related but different scenarios. Do NOT repeat witness_lines.

CRITICAL: near_miss_lines must be close enough to confuse a skimming reader.
Change numbers by small amounts. Change names to similar ones. Keep structure identical."""
GENERATION_PROMPT += """

ADDITIONAL VALIDITY CONSTRAINT:
- The question must be genuinely ambiguous without the witness evidence.
- Both options must sound equally reasonable in the abstract.
- The witness lines must be the ONLY way to determine the correct answer.
- If someone could guess the right answer from the question and options alone,
  the item is invalid and must be rewritten.
- Do NOT use the words "near-miss", "near miss", "distractor", "decoy", or
  "trap" anywhere in the output.
- Distractor paragraphs must read like ordinary document prose. Do NOT label any
  sentence as a clue, witness, wrong answer, or correct answer.
- Every distractor paragraph must contain 3-5 ordinary sentences with normal
  punctuation. Avoid fragments, lists, or colon-labeled commentary.
- Each corresponding witness_line and near_miss_line pair must differ in at
  least 3 factual anchor tokens total across numbers, names, IDs, or codenames.
- Scatter near_miss_lines naturally across separate paragraphs. Do NOT stack all
  three near_miss_lines into one paragraph.
"""


def cmd_generate(args):
    prompt = GENERATION_PROMPT.format(n=args.n_items, domains=json.dumps(DOMAINS))
    print("=" * 70)
    print("COPY THIS PROMPT INTO GROK OR CLAUDE:")
    print("=" * 70)
    print(prompt)
    print("=" * 70)
    print(f"\nSave JSON output to: {DATA}/items.jsonl (one object per line)")
    print("Tip: ask for 50 at a time if the model truncates.")


# ── Build Prompts ─────────────────────────────────────────────────

def build_prompt(item, target_tokens, condition="normal", position="random", rng=None):
    """Build (api_request, metadata). Metadata stored separately from API request."""
    if rng is None:
        rng = random.Random(42)

    target_chars = int(target_tokens / TOKENS_PER_CHAR)

    # Witness block: present in normal, absent in witness_removed
    if condition == "normal":
        witness_block = "\n".join(item.witness_lines)
    else:
        witness_block = ""

    # Build distractor pool
    pool = item.distractor_paragraphs[:]
    while len("\n\n".join(pool)) < target_chars * 1.2:
        pool.extend(item.distractor_paragraphs)

    parts = []
    budget = target_chars - len(witness_block) - 500
    chars = 0
    for p in pool:
        if chars + len(p) > budget:
            break
        parts.append(p)
        chars += len(p) + 2

    # Insert witness (or nothing) at position
    n = len(parts)
    if n == 0:
        parts = [witness_block] if witness_block else ["[document]"]
        idx = 0
    elif position == "beginning":
        idx = max(1, n // 10)
    elif position == "end":
        idx = n - max(1, n // 10)
    elif position == "middle":
        idx = n // 2
    else:
        idx = rng.randint(n // 4, 3 * n // 4)

    if witness_block:
        parts.insert(idx, witness_block)
    document = "\n\n".join(parts)

    system = (
        "You are an analyst. Read the document carefully, then:\n"
        "1. Choose Option A or Option B based on the evidence.\n"
        "2. Copy the EXACT sentences from the document that justify your choice.\n\n"
        "Format:\n"
        "ANSWER: A\n"
        "EVIDENCE:\n"
        "- [exact sentence 1]\n"
        "- [exact sentence 2]\n"
        "- [exact sentence 3]"
    )
    user = (
        f"DOCUMENT:\n{document}\n\n"
        f"QUESTION: {item.question}\n\n"
        f"Option A: {item.option_a}\n"
        f"Option B: {item.option_b}\n\n"
        "State your answer (A or B), then cite the exact evidence sentences."
    )

    cid = f"{item.id}__{target_tokens}__{condition}__{position}"

    request = {
        "custom_id": cid,
        "method": "POST",
        "url": "/v1/chat/completions",
        "body": {
            "model": "",
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "max_tokens": 512,
            "temperature": 0.0,
        }
    }
    metadata = {
        "custom_id": cid,
        "item_id": item.id,
        "correct_answer": item.correct_answer,
        "witness_lines": item.witness_lines,
        "near_miss_lines": item.near_miss_lines,
        "context_tokens": target_tokens,
        "condition": condition,
        "witness_position": position,
        "approx_tokens": int(len(document) * TOKENS_PER_CHAR),
    }
    return request, metadata


def cmd_build(args):
    items = load_items()
    validate_items_or_die(items)
    rng = random.Random(42)

    # Pilot: both conditions, all pilot lengths
    write_prompts("pilot", items[:PILOT["n"]], PILOT["lengths"], PILOT["conditions"], rng)

    # Full: normal at all lengths + witness_removed at key lengths
    full_specs = []
    for cl in FULL["normal_lengths"]:
        full_specs.append((cl, "normal"))
    for cl in FULL["removed_lengths"]:
        full_specs.append((cl, "witness_removed"))
    write_prompts_from_specs("full", items[:FULL["n"]], full_specs, rng)


def write_prompts(tag, items, lengths, conditions, rng):
    out = DATA / "prompts" / tag
    out.mkdir(parents=True, exist_ok=True)
    reqs, metas = [], []
    for cl in lengths:
        for cond in conditions:
            for item in items:
                r, m = build_prompt(item, cl, cond, "random", rng)
                reqs.append(r)
                metas.append(m)
    save_prompts(out, reqs, metas, tag)


def write_prompts_from_specs(tag, items, specs, rng):
    out = DATA / "prompts" / tag
    out.mkdir(parents=True, exist_ok=True)
    reqs, metas = [], []
    for cl, cond in specs:
        for item in items:
            r, m = build_prompt(item, cl, cond, "random", rng)
            reqs.append(r)
            metas.append(m)
    save_prompts(out, reqs, metas, tag)


def save_prompts(out, reqs, metas, tag):
    with open(out / "requests.jsonl", "w") as f:
        for r in reqs:
            f.write(json.dumps(r) + "\n")
    with open(out / "metadata.jsonl", "w") as f:
        for m in metas:
            f.write(json.dumps(m) + "\n")

    total_tok = sum(m["approx_tokens"] for m in metas)
    cost = (total_tok / 1e6) * 0.10 + (len(reqs) * 512 / 1e6) * 0.25
    by_cond = {}
    for m in metas:
        by_cond.setdefault(m["condition"], 0)
        by_cond[m["condition"]] += 1
    cond_str = ", ".join(f"{v} {k}" for k, v in by_cond.items())
    print(f"[{tag}] {len(reqs)} prompts ({cond_str})")
    print(f"[{tag}] ~{total_tok/1e6:.1f}M tokens → ~${cost:.2f} (batch)")


# ── Run ───────────────────────────────────────────────────────────

def cmd_run(args):
    tag = "pilot" if args.pilot else "full"
    req_file = DATA / "prompts" / tag / "requests.jsonl"
    if not req_file.exists():
        sys.exit(f"ERROR: {req_file} not found. Run 'build' first.")

    load_dotenv_if_present()
    api_key = os.environ.get("XAI_API_KEY", "")
    if not api_key:
        sys.exit("ERROR: set XAI_API_KEY environment variable.")

    out_dir = DATA / "results" / tag
    out_dir.mkdir(parents=True, exist_ok=True)
    run_batch(req_file, args.model, api_key, out_dir)


def run_batch(req_file, model, api_key, out_dir):
    import requests as rq

    def get_batch_state(batch_id):
        resp = rq.get(f"{XAI_API_BASE}/batches/{batch_id}", headers=h)
        resp.raise_for_status()
        return resp.json().get("state", {})

    # Inject model
    reqs = []
    with open(req_file) as f:
        for line in f:
            r = json.loads(line)
            r["body"]["model"] = model
            reqs.append(r)

    h = {
        "Authorization": f"Bearer {api_key}",
        "User-Agent": DEFAULT_USER_AGENT,
        "Accept": "application/json",
    }

    # Create batch
    batch_name = f"{out_dir.name}-{int(time.time())}"
    resp = rq.post(f"{XAI_API_BASE}/batches", headers={**h, "Content-Type": "application/json"},
                   json={"name": batch_name})
    resp.raise_for_status()
    bid = resp.json().get("batch_id") or resp.json().get("id")
    print(f"Batch: {bid}")
    (out_dir / "batch_id.txt").write_text(bid)

    # Add requests in xAI's current batch format
    batch_requests = []
    for r in reqs:
        batch_requests.append({
            "batch_request_id": r["custom_id"],
            "batch_request": {
                "chat_get_completion": r["body"],
            },
        })

    queued_total = 0
    for idx, item in enumerate(batch_requests, start=1):
        while True:
            try:
                resp = rq.post(
                    f"{XAI_API_BASE}/batches/{bid}/requests",
                    headers={**h, "Content-Type": "application/json"},
                    json={"batch_requests": [item]},
                    timeout=120,
                )
                resp.raise_for_status()
                queued_total = idx
                print(f"Queued: {queued_total}/{len(batch_requests)} requests")
                break
            except Exception as exc:
                state = get_batch_state(bid)
                already_queued = state.get("num_requests", 0)
                if already_queued >= idx:
                    queued_total = idx
                    print(f"Queued: {queued_total}/{len(batch_requests)} requests")
                    break
                print(f"Retrying queue {idx}/{len(batch_requests)} after error: {exc}")
                time.sleep(5)

    # Poll
    while True:
        state = get_batch_state(bid)
        pending = state.get("num_pending", 0)
        success = state.get("num_success", 0)
        error = state.get("num_error", 0)
        cancelled = state.get("num_cancelled", 0)
        print(f"  pending={pending} success={success} error={error} cancelled={cancelled}")
        if pending == 0:
            break
        time.sleep(30)

    # Download paginated results and normalize to the legacy jsonl format used by score()
    results = []
    pagination_token = None
    while True:
        params = {"limit": 500}
        if pagination_token:
            params["pagination_token"] = pagination_token
        resp = rq.get(f"{XAI_API_BASE}/batches/{bid}/results", headers=h, params=params)
        resp.raise_for_status()
        page = resp.json()
        for item in page.get("results", []):
            body = item.get("batch_result", {}).get("response", {}).get("chat_get_completion")
            if not body:
                continue
            results.append({
                "custom_id": item["batch_request_id"],
                "response": {"body": body},
            })
        pagination_token = page.get("pagination_token")
        if not pagination_token:
            break

    out_path = out_dir / "output.jsonl"
    with open(out_path, "w") as f:
        for item in results:
            f.write(json.dumps(item) + "\n")
    print(f"Results → {out_path}")


# ── Score ─────────────────────────────────────────────────────────

def parse_answer(text):
    m = re.search(r'ANSWER\s*:\s*([AB])', text, re.IGNORECASE)
    if m: return m.group(1).upper()
    m = re.search(r'(?:answer|option|choose)\s*[:\-]?\s*([AB])\b', text, re.IGNORECASE)
    if m: return m.group(1).upper()
    return "?"


def parse_evidence(text):
    lines = []
    in_ev = False
    for line in text.split("\n"):
        s = line.strip()
        if re.match(r'(?:EVIDENCE|JUSTIFICATION|CITATIONS?)\s*:', s, re.IGNORECASE):
            in_ev = True
            continue
        if in_ev and s:
            clean = normalize_sentence(s)
            if clean and not re.match(r'ANSWER', clean, re.IGNORECASE):
                lines.append(clean)
            if len(lines) >= 5:
                break
    return lines


def sim(a, b):
    return SequenceMatcher(None, normalize_sentence(a).lower(), normalize_sentence(b).lower()).ratio()


def normalize_sentence(text):
    clean = text.strip()
    clean = re.sub(r'^(?:[-•*]\s*|\d+[.)]\s*)', '', clean)
    clean = re.sub(r'^(?:another|last)\s+near[- ]miss\s*:\s*', '', clean, flags=re.IGNORECASE)
    clean = re.sub(r'^near[- ]miss(?:\s+\w+)?\s*:\s*', '', clean, flags=re.IGNORECASE)
    clean = re.sub(r'^last distractor with near[- ]miss\s*:\s*', '', clean, flags=re.IGNORECASE)
    clean = clean.strip().strip('"').strip("'").strip()
    clean = re.sub(r'\s+', ' ', clean)
    return clean


def extract_line_anchors(text):
    raw = normalize_sentence(text)
    numbers = set(re.findall(r'\b\d+(?:\.\d+)?%?\b', raw))
    names = set(m.group(0).lower() for m in re.finditer(r'\b[A-Z][a-z]+(?: [A-Z][a-z]+)+\b', raw))
    ids = set()
    for token in re.findall(r'\b[A-Za-z0-9_.-]+\b', raw):
        if "-" in token and any(ch.isalpha() for ch in token):
            ids.add(token.lower())
        elif any(ch.isdigit() for ch in token) and any(ch.isalpha() for ch in token):
            ids.add(token.lower())
    return numbers, names | ids


def anchor_overlap(a, b):
    a_numbers, a_names = extract_line_anchors(a)
    b_numbers, b_names = extract_line_anchors(b)
    parts = []
    if b_numbers:
        parts.append(len(a_numbers & b_numbers) / len(b_numbers))
    if b_names:
        parts.append(len(a_names & b_names) / len(b_names))
    if not parts:
        return 0.0
    return sum(parts) / len(parts)


def anchor_bag(text):
    numbers, names = extract_line_anchors(text)
    return {f"num:{n}" for n in numbers} | {f"anchor:{n}" for n in names}


def is_strong_anchor_hit(hits):
    has_number = any(hit.startswith("num:") for hit in hits)
    has_named_anchor = any(hit.startswith("anchor:") for hit in hits)
    return len(hits) >= 2 or (has_number and has_named_anchor)


def classify_citation_for_pair(cited, witness, near_miss):
    cited_anchors = anchor_bag(cited)
    witness_anchors = anchor_bag(witness)
    near_anchors = anchor_bag(near_miss)

    witness_only = witness_anchors - near_anchors
    near_only = near_anchors - witness_anchors

    witness_hits = cited_anchors & witness_only
    near_hits = cited_anchors & near_only
    witness_sim = sim(cited, witness)
    near_sim = sim(cited, near_miss)

    witness_rank = (len(witness_hits), round(witness_sim, 3))
    near_rank = (len(near_hits), round(near_sim, 3))

    if witness_rank > near_rank and (is_strong_anchor_hit(witness_hits) or witness_sim >= 0.92):
        return "witness", len(witness_hits), witness_sim
    if near_rank > witness_rank and (is_strong_anchor_hit(near_hits) or near_sim >= 0.92):
        return "near_miss", len(near_hits), near_sim
    return "other", max(len(witness_hits), len(near_hits)), max(witness_sim, near_sim)


def score_witness(cited, witnesses, near_misses, threshold=0.55):
    witness_results = []
    for idx, w in enumerate(witnesses):
        nm = near_misses[idx] if idx < len(near_misses) else ""
        labels = [classify_citation_for_pair(c, w, nm) for c in cited]
        recovered = any(label == "witness" for label, _, _ in labels)
        best_w_score = max((score for label, _, score in labels if label == "witness"), default=0.0)
        witness_results.append({
            "line": w,
            "status": "recovered" if recovered else "missing",
            "match_score": round(best_w_score, 3),
        })

    near_miss_results = []
    for idx, nm in enumerate(near_misses):
        w = witnesses[idx] if idx < len(witnesses) else ""
        labels = [classify_citation_for_pair(c, w, nm) for c in cited]
        contaminated = any(label == "near_miss" for label, _, _ in labels)
        best_nm_score = max((score for label, _, score in labels if label == "near_miss"), default=0.0)
        near_miss_results.append({
            "line": nm,
            "status": "cited" if contaminated else "not_cited",
            "match_score": round(best_nm_score, 3),
        })

    witness_n = max(len(witness_results), 1)
    near_n = max(len(near_miss_results), 1)
    recovery = sum(1 for r in witness_results if r["status"] == "recovered") / witness_n
    corruption = sum(1 for r in near_miss_results if r["status"] == "cited") / near_n
    return {
        "recovery": recovery,
        "corruption": corruption,
        "missing": sum(1 for r in witness_results if r["status"] == "missing") / witness_n,
        "mixed": 1.0 if recovery > 0 and corruption > 0 else 0.0,
        "details": {
            "witness": witness_results,
            "near_miss": near_miss_results,
        },
    }


def cmd_score(args):
    tag = args.run
    meta_file = DATA / "prompts" / tag / "metadata.jsonl"
    result_file = DATA / "results" / tag / "output.jsonl"

    if not result_file.exists():
        sys.exit(f"ERROR: {result_file} not found. Run the batch first.")

    meta_map = {}
    with open(meta_file) as f:
        for line in f:
            m = json.loads(line)
            meta_map[m["custom_id"]] = m

    scored = []
    with open(result_file) as f:
        for line in f:
            r = json.loads(line)
            cid = r["custom_id"]
            meta = meta_map.get(cid)
            if not meta:
                continue
            text = r["response"]["body"]["choices"][0]["message"]["content"]
            ans = parse_answer(text)
            cited = parse_evidence(text)
            ws = score_witness(cited, meta["witness_lines"], meta.get("near_miss_lines", []))

            scored.append({
                "custom_id": cid,
                "item_id": meta["item_id"],
                "context_tokens": meta["context_tokens"],
                "condition": meta["condition"],
                "answer_correct": ans == meta["correct_answer"],
                "parsed_answer": ans,
                "witness_recovery": ws["recovery"],
                "witness_corruption": ws["corruption"],
                "mixed_evidence": ws["mixed"],
                "n_cited": len(cited),
                "preview": text[:150],
            })

    # Aggregate by (condition, context_length)
    agg = {}
    for s in scored:
        key = (s["condition"], s["context_tokens"])
        if key not in agg:
            agg[key] = {"answer": [], "witness": [], "corruption": [], "mixed": []}
        agg[key]["answer"].append(s["answer_correct"])
        agg[key]["witness"].append(s["witness_recovery"])
        agg[key]["corruption"].append(s["witness_corruption"])
        agg[key]["mixed"].append(s["mixed_evidence"])

    summary = {}
    for (cond, cl), d in sorted(agg.items()):
        n = len(d["answer"])
        aa = sum(d["answer"]) / n
        wa = sum(d["witness"]) / n
        cr = sum(d["corruption"]) / n
        mr = sum(d["mixed"]) / n
        key = f"{cond}_{cl}"
        summary[key] = {
            "condition": cond, "context_tokens": cl, "n": n,
            "answer_accuracy": round(aa, 4),
            "witness_accuracy": round(wa, 4),
            "mirage_gap": round(aa - wa, 4),
            "corruption_rate": round(cr, 4),
            "mixed_rate": round(mr, 4),
        }

    out = RESULTS / tag
    out.mkdir(parents=True, exist_ok=True)
    with open(out / "scores.json", "w") as f:
        json.dump(summary, f, indent=2)
    with open(out / "scored_items.jsonl", "w") as f:
        for s in scored:
            f.write(json.dumps(s) + "\n")

    # Print table
    print(f"\n{'Condition':<18} {'Context':>8} {'N':>4} {'Answer':>8} {'Witness':>8} "
          f"{'Gap':>8} {'Corrupt':>8} {'Mixed':>8}")
    print("-" * 82)
    for k in sorted(summary, key=lambda x: (summary[x]["condition"], summary[x]["context_tokens"])):
        d = summary[k]
        cl = f"{d['context_tokens']//1000}K"
        print(f"{d['condition']:<18} {cl:>8} {d['n']:>4} {d['answer_accuracy']:>8.3f} "
              f"{d['witness_accuracy']:>8.3f} {d['mirage_gap']:>+8.3f} {d['corruption_rate']:>8.3f} "
              f"{d['mixed_rate']:>8.3f}")


# ── Plot ──────────────────────────────────────────────────────────

def cmd_plot(args):
    import plotly.graph_objects as go
    from plotly.subplots import make_subplots

    with open(RESULTS / args.run / "scores.json") as f:
        raw = json.load(f)

    # Separate by condition
    normal = {v["context_tokens"]: v for v in raw.values() if v["condition"] == "normal"}
    removed = {v["context_tokens"]: v for v in raw.values() if v["condition"] == "witness_removed"}

    n_cls = sorted(normal.keys())
    r_cls = sorted(removed.keys())
    n_labels = [f"{c//1000}K" for c in n_cls]
    r_labels = [f"{c//1000}K" for c in r_cls]

    fig = make_subplots(
        rows=1, cols=2, subplot_titles=("The Mirage Shelf", "Causal Control"),
        column_widths=[0.6, 0.4], horizontal_spacing=0.08,
    )

    # Left panel: normal condition — answer vs witness
    n_ans = [normal[c]["answer_accuracy"] for c in n_cls]
    n_wit = [normal[c]["witness_accuracy"] for c in n_cls]

    # Gap shading
    fig.add_trace(go.Scatter(
        x=n_labels + n_labels[::-1], y=n_ans + n_wit[::-1],
        fill="toself", fillcolor="rgba(239,68,68,0.1)",
        line=dict(width=0), name="Mirage Gap", showlegend=True,
    ), row=1, col=1)

    fig.add_trace(go.Scatter(
        x=n_labels, y=n_ans, name="Answer Accuracy",
        line=dict(color="#2563eb", width=3.5), mode="lines+markers", marker=dict(size=9),
    ), row=1, col=1)
    fig.add_trace(go.Scatter(
        x=n_labels, y=n_wit, name="Witness Accuracy",
        line=dict(color="#dc2626", width=3.5, dash="dash"), mode="lines+markers", marker=dict(size=9),
    ), row=1, col=1)

    # Right panel: normal vs removed answer accuracy
    fig.add_trace(go.Scatter(
        x=r_labels, y=[normal[c]["answer_accuracy"] for c in r_cls],
        name="With Witness", line=dict(color="#2563eb", width=3), mode="lines+markers",
        marker=dict(size=9),
    ), row=1, col=2)
    fig.add_trace(go.Scatter(
        x=r_labels, y=[removed[c]["answer_accuracy"] for c in r_cls],
        name="Witness Removed", line=dict(color="#f59e0b", width=3, dash="dot"),
        mode="lines+markers", marker=dict(size=9, symbol="x"),
    ), row=1, col=2)

    # Chance line
    fig.add_hline(y=0.5, line_dash="dot", line_color="gray", opacity=0.5, row=1, col=2)
    fig.add_annotation(x=r_labels[-1], y=0.52, text="chance", showarrow=False,
                       font=dict(color="gray", size=11), row=1, col=2)

    fig.update_yaxes(range=[0.35, 1.02], row=1, col=1, title_text="Accuracy")
    fig.update_yaxes(range=[0.35, 1.02], row=1, col=2)
    fig.update_xaxes(title_text="Context Length", row=1, col=1)
    fig.update_xaxes(title_text="Context Length", row=1, col=2)

    fig.update_layout(
        template="plotly_white",
        font=dict(size=14, family="Inter, system-ui, sans-serif"),
        legend=dict(x=0.02, y=0.02, bgcolor="rgba(255,255,255,0.85)"),
        width=1400, height=600,
        margin=dict(t=60),
    )

    out = RESULTS / args.run / "mirage_shelf.png"
    fig.write_image(str(out), scale=3)
    print(f"Chart → {out}")


# ── Helpers ───────────────────────────────────────────────────────

def sentence_count(text):
    parts = re.split(r'(?<=[.!?])\s+', text.strip())
    return len([p for p in parts if p.strip()])


def anchor_delta_count(a, b):
    a_numbers, a_names = extract_line_anchors(a)
    b_numbers, b_names = extract_line_anchors(b)
    return len(a_numbers ^ b_numbers) + len(a_names ^ b_names)


def validate_item(item):
    problems = []

    if item.correct_answer not in {"A", "B"}:
        problems.append("invalid_correct_answer")
    if item.domain not in DOMAINS:
        problems.append("invalid_domain")
    if len(item.witness_lines) != 3 or len(item.near_miss_lines) != 3:
        problems.append("invalid_line_count")
    if len(item.distractor_paragraphs) != 25:
        problems.append("invalid_distractor_count")

    for label, lines in [("witness", item.witness_lines), ("near_miss", item.near_miss_lines)]:
        for idx, line in enumerate(lines, start=1):
            numbers, names = extract_line_anchors(line)
            if not numbers or not names:
                problems.append(f"{label}_line_{idx}_missing_anchor")

    for idx, (w, nm) in enumerate(zip(item.witness_lines, item.near_miss_lines), start=1):
        if anchor_delta_count(w, nm) < 3:
            problems.append(f"line_pair_{idx}_too_similar")

    distractor_blob = "\n".join(item.distractor_paragraphs)
    lowered_blob = distractor_blob.lower()
    for phrase in BANNED_META_PHRASES:
        if phrase in lowered_blob:
            problems.append(f"banned_phrase:{phrase}")
    if any(normalize_sentence(w) in normalize_sentence(distractor_blob) for w in item.witness_lines):
        problems.append("witness_leaked_into_distractors")

    normalized_near = [normalize_sentence(nm) for nm in item.near_miss_lines]
    for idx, paragraph in enumerate(item.distractor_paragraphs, start=1):
        if not 3 <= sentence_count(paragraph) <= 5:
            problems.append(f"paragraph_{idx}_bad_sentence_count")
        hits = sum(1 for nm in normalized_near if nm and nm in normalize_sentence(paragraph))
        if hits > 1:
            problems.append(f"paragraph_{idx}_stacked_near_misses")

    return sorted(set(problems))


def collect_item_issues(items):
    issues = []
    for item in items:
        problems = validate_item(item)
        if problems:
            issues.append({"item_id": item.id, "problems": problems})
    return issues


def validate_items_or_die(items):
    issues = collect_item_issues(items)
    if not issues:
        return

    reason_counts = {}
    for issue in issues:
        for problem in issue["problems"]:
            reason_counts[problem] = reason_counts.get(problem, 0) + 1

    print("Item validation failed:")
    for reason, count in sorted(reason_counts.items(), key=lambda kv: (-kv[1], kv[0])):
        print(f"  {reason}: {count}")
    for issue in issues[:5]:
        print(f"  {issue['item_id']}: {', '.join(issue['problems'])}")
    sys.exit("ERROR: items.jsonl failed validation. Clean the items or run 'validate-items' for details.")


def cmd_validate_items(args):
    items = load_items()
    issues = collect_item_issues(items)
    if not issues:
        print(f"All {len(items)} items passed validation.")
        return

    reason_counts = {}
    for issue in issues:
        for problem in issue["problems"]:
            reason_counts[problem] = reason_counts.get(problem, 0) + 1

    print(f"{len(issues)} of {len(items)} items failed validation.")
    for reason, count in sorted(reason_counts.items(), key=lambda kv: (-kv[1], kv[0])):
        print(f"  {reason}: {count}")
    for issue in issues[: args.limit]:
        print(f"  {issue['item_id']}: {', '.join(issue['problems'])}")
    if args.strict:
        sys.exit(1)


def load_items():
    path = DATA / "items.jsonl"
    if not path.exists():
        sys.exit(f"ERROR: {path} not found. Run 'generate' and save items first.")
    items = []
    with open(path) as f:
        for line in f:
            if line.strip():
                items.append(Item.from_dict(json.loads(line)))
    print(f"Loaded {len(items)} items")
    return items


# ── CLI ───────────────────────────────────────────────────────────

def main():
    p = argparse.ArgumentParser(description="Mirage Shelf Experiment v3")
    sub = p.add_subparsers(dest="cmd")

    gen = sub.add_parser("generate")
    gen.add_argument("--n-items", type=int, default=200)

    sub.add_parser("build")

    val = sub.add_parser("validate-items")
    val.add_argument("--limit", type=int, default=10)
    val.add_argument("--strict", action="store_true")

    run = sub.add_parser("run")
    g = run.add_mutually_exclusive_group(required=True)
    g.add_argument("--pilot", action="store_true")
    g.add_argument("--full", action="store_true")
    run.add_argument("--model", default="grok-4-1-fast-non-reasoning")

    sc = sub.add_parser("score")
    sc.add_argument("--run", required=True, choices=["pilot", "full"])

    pl = sub.add_parser("plot")
    pl.add_argument("--run", default="full", choices=["pilot", "full"])

    args = p.parse_args()
    if not args.cmd:
        p.print_help()
        return

    {"generate": cmd_generate, "build": cmd_build, "validate-items": cmd_validate_items,
     "run": cmd_run, "score": cmd_score, "plot": cmd_plot}[args.cmd](args)


if __name__ == "__main__":
    main()
