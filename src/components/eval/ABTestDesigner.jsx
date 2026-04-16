import { useState } from "react";
import { requiredSampleSize } from "./simulationEngine";

const METRIC_OPTIONS = [
  { id: "faithfulness",      label: "Faithfulness",       baseline: 0.74, unit: "%",  description: "Fraction of claims grounded in context" },
  { id: "contextPrecision",  label: "Context Precision",  baseline: 0.68, unit: "%",  description: "Fraction of retrieved chunks that are relevant" },
  { id: "contextRecall",     label: "Context Recall",     baseline: 0.78, unit: "%",  description: "Fraction of relevant chunks retrieved" },
  { id: "answerRelevancy",   label: "Answer Relevancy",   baseline: 0.82, unit: "%",  description: "Answer addresses the query" },
  { id: "thumbsUp",          label: "Thumbs-up Rate",     baseline: 0.61, unit: "%",  description: "Fraction of responses rated positively by users" },
  { id: "hallucRate",        label: "Hallucination Rate", baseline: 0.14, unit: "%",  description: "Fraction of answers with hallucinated claims (lower = better)" },
  { id: "latency",           label: "p99 Latency",        baseline: 0.78, unit: "ms", description: "99th percentile response time (proxy as 0–1 for calc)" },
];

const CHANGE_TYPES = [
  { id: "retrieval",   label: "Retrieval Strategy",  examples: "BM25 → Hybrid · Add reranker · Raise top-K" },
  { id: "chunking",    label: "Chunking Strategy",   examples: "512→256 tokens · Semantic splitting · Hierarchical" },
  { id: "embedding",   label: "Embedding Model",     examples: "text-embedding-3-small → large · Domain fine-tuned" },
  { id: "llm",         label: "LLM Model / Prompt",  examples: "GPT-4o → Sonnet · Stricter grounding prompt" },
  { id: "quality",     label: "Quality Gate",        examples: "Add relevancy grader · Enable hallucination gate" },
];

const ALPHA_OPTIONS  = [
  { val: 0.05, label: "α = 0.05 (95% confidence)", desc: "Standard for most A/B tests" },
  { val: 0.01, label: "α = 0.01 (99% confidence)", desc: "Use for high-stakes changes (patient safety, financial)" },
];
const POWER_OPTIONS  = [
  { val: 0.80, label: "80% power (standard)", desc: "Industry default — 20% chance of missing a real effect" },
  { val: 0.90, label: "90% power (high)",     desc: "Use when false negatives are costly" },
];
const TRAFFIC_OPTIONS = [100, 500, 1000, 5000, 10000, 50000];

function StatCard({ label, value, sub, color = "#6366f1" }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center">
      <div className="text-2xl font-bold mb-0.5" style={{ color }}>{value}</div>
      <div className="text-xs font-semibold text-slate-300">{label}</div>
      {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}

const STEPS = ["Define", "Configure", "Size", "Instrument", "Analyze"];

export default function ABTestDesigner() {
  const [step,       setStep]       = useState(0);
  const [metric,     setMetric]     = useState(METRIC_OPTIONS[0]);
  const [changeType, setChangeType] = useState(CHANGE_TYPES[0]);
  const [baseline,   setBaseline]   = useState(0.74);
  const [mde,        setMde]        = useState(0.05); // 5% absolute
  const [alpha,      setAlpha]      = useState(0.05);
  const [power,      setPower]      = useState(0.80);
  const [trafficQPS, setTrafficQPS] = useState(1000);
  const [splitPct,   setSplitPct]   = useState(10);  // % of traffic to experiment arm

  const experiment = Math.min(0.999, baseline + mde);
  const n = requiredSampleSize({ baseline, mde, alpha, power });
  const queriesPerDay = trafficQPS * 86400 * (splitPct / 100);
  const daysNeeded = Math.ceil(n / queriesPerDay);
  const powerPct = Math.round(power * 100);
  const confPct  = Math.round((1 - alpha) * 100);

  const CI_HALF = alpha === 0.05 ? 1.96 : 2.576;
  const se = Math.sqrt((baseline * (1 - baseline) + experiment * (1 - experiment)) / n);
  const ciLow  = Math.max(0, mde - CI_HALF * se);
  const ciHigh = mde + CI_HALF * se;

  const STEPS_CONTENT = [
    // Step 0: Define
    () => (
      <div className="space-y-5">
        <h4 className="font-bold text-white">What are you changing?</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CHANGE_TYPES.map((ct) => (
            <button
              key={ct.id}
              onClick={() => setChangeType(ct)}
              className={`text-left rounded-xl border p-4 transition-all ${
                changeType.id === ct.id
                  ? "border-indigo-500 bg-indigo-900/30"
                  : "border-slate-700 hover:border-slate-600"
              }`}
            >
              <p className="font-semibold text-white text-sm">{ct.label}</p>
              <p className="text-xs text-slate-500 mt-1">{ct.examples}</p>
            </button>
          ))}
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-300 mb-3">Primary metric to measure</p>
          <div className="space-y-2">
            {METRIC_OPTIONS.map((m) => (
              <button
                key={m.id}
                onClick={() => { setMetric(m); setBaseline(m.baseline); }}
                className={`w-full text-left rounded-xl border p-3 transition-all flex items-center gap-3 ${
                  metric.id === m.id
                    ? "border-indigo-500 bg-indigo-900/30"
                    : "border-slate-700 hover:border-slate-600"
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                  metric.id === m.id ? "border-indigo-400 bg-indigo-400" : "border-slate-600"
                }`} />
                <div>
                  <p className="text-sm font-medium text-white">{m.label}</p>
                  <p className="text-xs text-slate-500">{m.description}</p>
                </div>
                <span className="ml-auto text-xs font-mono text-slate-400">
                  baseline {(m.baseline * 100).toFixed(0)}%
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    ),

    // Step 1: Configure
    () => (
      <div className="space-y-5">
        <h4 className="font-bold text-white">Set baseline and target</h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm text-slate-300">Baseline {metric.label}</span>
              <span className="font-bold text-slate-200 font-mono">{(baseline * 100).toFixed(1)}%</span>
            </div>
            <input type="range" min={0.1} max={0.99} step={0.01} value={baseline}
              onChange={(e) => setBaseline(parseFloat(e.target.value))}
              className="w-full accent-slate-400" />
            <p className="text-xs text-slate-600 mt-1">Current production metric value</p>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm text-slate-300">Minimum Detectable Effect</span>
              <span className="font-bold text-indigo-300 font-mono">+{(mde * 100).toFixed(1)}%</span>
            </div>
            <input type="range" min={0.01} max={0.20} step={0.01} value={mde}
              onChange={(e) => setMde(parseFloat(e.target.value))}
              className="w-full accent-indigo-500" />
            <p className="text-xs text-slate-600 mt-1">Smallest change worth detecting</p>
          </div>
        </div>

        <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700">
          <p className="text-xs text-slate-500 mb-3">Hypothesis</p>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-300">{(baseline * 100).toFixed(1)}%</div>
              <div className="text-xs text-slate-500">Control (baseline)</div>
            </div>
            <div className="text-slate-600 text-xl">→</div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-300">{(experiment * 100).toFixed(1)}%</div>
              <div className="text-xs text-slate-500">Experiment (target)</div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-lg font-bold text-emerald-400">+{(mde * 100).toFixed(1)}%</div>
              <div className="text-xs text-slate-500">Absolute lift</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-300 mb-2">Significance level</p>
            {ALPHA_OPTIONS.map((a) => (
              <button key={a.val} onClick={() => setAlpha(a.val)}
                className={`w-full text-left rounded-lg border p-3 mb-2 transition-all ${
                  alpha === a.val ? "border-indigo-500 bg-indigo-900/30" : "border-slate-700 hover:border-slate-600"
                }`}>
                <p className="text-xs font-medium text-white">{a.label}</p>
                <p className="text-xs text-slate-500">{a.desc}</p>
              </button>
            ))}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-300 mb-2">Statistical power</p>
            {POWER_OPTIONS.map((p) => (
              <button key={p.val} onClick={() => setPower(p.val)}
                className={`w-full text-left rounded-lg border p-3 mb-2 transition-all ${
                  power === p.val ? "border-indigo-500 bg-indigo-900/30" : "border-slate-700 hover:border-slate-600"
                }`}>
                <p className="text-xs font-medium text-white">{p.label}</p>
                <p className="text-xs text-slate-500">{p.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    ),

    // Step 2: Sample size
    () => (
      <div className="space-y-5">
        <h4 className="font-bold text-white">Required sample size</h4>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Per arm" value={n.toLocaleString()} sub="queries needed" color="#6366f1" />
          <StatCard label="Total" value={(n * 2).toLocaleString()} sub="both arms" color="#a855f7" />
          <StatCard label="Confidence" value={`${confPct}%`} sub={`α = ${alpha}`} color="#10b981" />
          <StatCard label="Power" value={`${powerPct}%`} sub={`β = ${1-power}`} color="#f59e0b" />
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Traffic split & timeline
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-slate-300">Daily query volume (QPS)</span>
                <span className="font-bold text-slate-200 font-mono">{trafficQPS.toLocaleString()}</span>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {TRAFFIC_OPTIONS.map((v) => (
                  <button key={v} onClick={() => setTrafficQPS(v)}
                    className={`px-2 py-1 rounded text-xs font-mono border transition-all ${
                      trafficQPS === v
                        ? "bg-indigo-600 border-indigo-500 text-white"
                        : "border-slate-700 text-slate-400 hover:border-slate-500"
                    }`}>
                    {v >= 1000 ? `${v/1000}K` : v}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-slate-300">Experiment traffic split</span>
                <span className="font-bold text-indigo-300 font-mono">{splitPct}%</span>
              </div>
              <input type="range" min={5} max={50} step={5} value={splitPct}
                onChange={(e) => setSplitPct(Number(e.target.value))}
                className="w-full accent-indigo-500" />
              <p className="text-xs text-slate-600 mt-0.5">of traffic goes to experiment arm</p>
            </div>
          </div>

          <div className={`rounded-xl border p-4 text-center ${
            daysNeeded <= 7
              ? "border-emerald-700 bg-emerald-950/20"
              : daysNeeded <= 30
              ? "border-amber-700 bg-amber-950/20"
              : "border-red-700 bg-red-950/20"
          }`}>
            <div className={`text-4xl font-bold mb-1 ${
              daysNeeded <= 7 ? "text-emerald-400" : daysNeeded <= 30 ? "text-amber-400" : "text-red-400"
            }`}>
              {daysNeeded} {daysNeeded === 1 ? "day" : "days"}
            </div>
            <p className="text-sm text-slate-400">
              {Math.round(queriesPerDay).toLocaleString()} experiment queries/day
              → {n.toLocaleString()} queries needed
            </p>
            {daysNeeded > 30 && (
              <p className="text-xs text-red-400 mt-2">
                ⚠ Test too long — increase traffic split, accept larger MDE, or reduce power requirement.
              </p>
            )}
          </div>
        </div>

        {/* Confidence interval visualization */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Expected 95% confidence interval at n={n.toLocaleString()}
          </p>
          <div className="relative h-12 mb-3">
            <div className="absolute inset-y-0 left-0 right-0 flex items-center">
              <div className="w-full h-0.5 bg-slate-700" />
            </div>
            {/* Zero line */}
            <div className="absolute top-0 bottom-0 w-0.5 bg-slate-500" style={{ left: "30%" }} />
            {/* CI bar */}
            <div
              className="absolute top-1/2 -translate-y-1/2 h-3 bg-indigo-600/40 border border-indigo-500 rounded"
              style={{
                left: `${30 + (ciLow / 0.3) * 40}%`,
                width: `${((ciHigh - ciLow) / 0.3) * 40}%`,
              }}
            />
            {/* MDE point */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-emerald-400"
              style={{ left: `${30 + (mde / 0.3) * 40}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>CI low: +{(ciLow * 100).toFixed(1)}%</span>
            <span className="text-emerald-400">MDE: +{(mde * 100).toFixed(1)}%</span>
            <span>CI high: +{(ciHigh * 100).toFixed(1)}%</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            With {n.toLocaleString()} samples, you'll detect a true effect of +{(mde * 100).toFixed(1)}%
            with a confidence interval of [+{(ciLow * 100).toFixed(1)}%, +{(ciHigh * 100).toFixed(1)}%].
          </p>
        </div>
      </div>
    ),

    // Step 3: Instrumentation
    () => (
      <div className="space-y-5">
        <h4 className="font-bold text-white">How to instrument this test</h4>

        {[
          {
            title: "1 — Feature flag",
            color: "#6366f1",
            content: `Add a feature flag that routes ${splitPct}% of queries to the experiment configuration. Use deterministic hashing on user_id (not query) so the same user always sees the same arm.`,
            code: `# Deterministic assignment
import hashlib
def get_arm(user_id: str, experiment_id: str = "exp-001") -> str:
    h = int(hashlib.md5(f"{user_id}:{experiment_id}".encode()).hexdigest(), 16)
    return "experiment" if h % 100 < ${splitPct} else "control"`,
          },
          {
            title: "2 — Log the right signals",
            color: "#10b981",
            content: `For each query, log: query_id, arm (control/experiment), retrieved_doc_ids, context_token_count, generated_answer_hash, latency_ms, user_feedback (if available). Tag all spans with experiment_id and arm.`,
            code: `# Per-query event
{
  "query_id":       "q_abc123",
  "experiment_id":  "exp-001",
  "arm":            "experiment",
  "metric_faithfulness": 0.91,
  "latency_ms":     342,
  "user_thumbs_up": null  // filled when feedback received
}`,
          },
          {
            title: "3 — Compute the primary metric",
            color: "#f59e0b",
            content: `${metric.label} is your primary metric. Compute it for every query using your automated scorer (LLM judge / NLI). Aggregate daily. Set up an alerting rule: if the experiment arm's score drops >2% below control → auto-pause experiment.`,
            code: `# Daily metric rollup (SQL)
SELECT
  arm,
  AVG(metric_faithfulness) AS avg_faithfulness,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY latency_ms) AS p99_latency,
  COUNT(*) AS n_queries
FROM experiment_events
WHERE experiment_id = 'exp-001'
  AND DATE(ts) = CURRENT_DATE - 1
GROUP BY arm;`,
          },
          {
            title: "4 — Guard rails",
            color: "#ef4444",
            content: `Define guardrails that auto-pause the experiment regardless of primary metric:\n• p99 latency > ${Math.round(500 * 1.5)}ms (50% regression)\n• Hallucination rate > 20% absolute\n• Error rate > 1%\nThese protect users even if your primary metric is improving.`,
            code: `# Guardrail check (runs every 30 min)
guardrails = {
    "p99_latency_ms":   {"threshold": ${Math.round(500 * 1.5)}, "direction": "max"},
    "hallucination_rate": {"threshold": 0.20, "direction": "max"},
    "error_rate":       {"threshold": 0.01, "direction": "max"},
}
if any(metrics[k] > v["threshold"] for k, v in guardrails.items()):
    pause_experiment("exp-001", reason="guardrail_breach")`,
          },
        ].map((item) => (
          <div key={item.title} className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-800 flex items-center gap-2"
              style={{ background: item.color + "12" }}>
              <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
              <h5 className="font-semibold text-white text-sm">{item.title}</h5>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed">{item.content}</p>
              <pre className="bg-slate-950 rounded-lg p-3 text-xs font-mono text-emerald-300 overflow-x-auto border border-slate-800">
                <code>{item.code}</code>
              </pre>
            </div>
          </div>
        ))}
      </div>
    ),

    // Step 4: Analysis
    () => (
      <div className="space-y-5">
        <h4 className="font-bold text-white">How to analyze results</h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              title: "Two-proportion z-test",
              code: `from scipy import stats
import numpy as np

# n_control = n_experiment = ${n}
control_successes    = int(${n} * ${baseline.toFixed(3)})
experiment_successes = int(${n} * ${experiment.toFixed(3)})

z, p_value = stats.proportions_ztest(
    [experiment_successes, control_successes],
    [${n}, ${n}],
    alternative='larger'
)
print(f"p-value: {p_value:.4f}")
print("Significant!" if p_value < ${alpha} else "Not significant")`,
              note: "Use when metric is a proportion (faithfulness %, thumbs-up rate)",
              color: "#6366f1",
            },
            {
              title: "Bayesian A/B test",
              code: `# Beta-Binomial Bayesian A/B
import numpy as np

alpha_prior = beta_prior = 1  # uninformative prior

def posterior_prob_b_better(n_a, k_a, n_b, k_b, n_samples=100_000):
    a = np.random.beta(alpha_prior + k_a, beta_prior + n_a - k_a, n_samples)
    b = np.random.beta(alpha_prior + k_b, beta_prior + n_b - k_b, n_samples)
    return (b > a).mean()

prob = posterior_prob_b_better(
    n_a=${n}, k_a=int(${n}*${baseline.toFixed(3)}),
    n_b=${n}, k_b=int(${n}*${experiment.toFixed(3)})
)
print(f"P(experiment > control) = {prob:.3f}")`,
              note: "Better for small samples — gives probability rather than binary reject/fail",
              color: "#10b981",
            },
          ].map((item) => (
            <div key={item.title} className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800" style={{ background: item.color + "12" }}>
                <p className="font-semibold text-sm text-white">{item.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{item.note}</p>
              </div>
              <pre className="p-4 text-xs font-mono text-emerald-300 overflow-x-auto">
                <code>{item.code}</code>
              </pre>
            </div>
          ))}
        </div>

        {/* Decision framework */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Decision Framework
          </p>
          {[
            {
              condition: `p-value < ${alpha} AND guardrails pass`,
              action: "Ship the experiment",
              color: "#22c55e",
              detail: "Effect is statistically significant and no regressions. Gradual rollout: 10% → 50% → 100%.",
            },
            {
              condition: "p-value ≥ 0.05 AND ran full duration",
              action: "Abandon or iterate",
              color: "#64748b",
              detail: "No detectable effect after sufficient samples. Don't extend — you'll inflate Type I error.",
            },
            {
              condition: "Guardrail triggered",
              action: "Pause and investigate",
              color: "#ef4444",
              detail: "Something regressed. Roll back experiment arm, debug root cause before re-running.",
            },
            {
              condition: "p-value < 0.05 AND guardrail ALSO triggered",
              action: "Ship with fix",
              color: "#f59e0b",
              detail: "Primary metric improved but a secondary metric degraded. Fix the guardrail issue before shipping.",
            },
          ].map((row) => (
            <div key={row.action} className="flex items-start gap-3 bg-slate-800/40 rounded-xl p-3.5">
              <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ background: row.color }} />
              <div>
                <p className="text-xs font-mono text-slate-300 mb-1">{row.condition}</p>
                <p className="text-sm font-bold" style={{ color: row.color }}>{row.action}</p>
                <p className="text-xs text-slate-500 mt-0.5">{row.detail}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Common pitfalls */}
        <div className="bg-amber-950/20 border border-amber-900/50 rounded-2xl p-5">
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-3">
            Common Pitfalls to Avoid
          </p>
          <ul className="space-y-2">
            {[
              "Peeking: stopping early when results look significant. Fix: pre-commit to sample size N and run to completion, or use sequential testing (SPRT).",
              "Multiple metrics: testing 10 metrics at α=0.05 gives 40% chance of at least one false positive. Use Bonferroni correction or designate one primary metric.",
              "Query distribution shift: if experiment period has different query mix (e.g., weekend traffic), results are confounded. Stratify by query type.",
              "Unit of randomization: randomize on user_id, not query_id. Otherwise same user may see both arms → contamination.",
              "Novelty effect: users engage more with any change. Run for at least 2 weeks to see past initial novelty.",
            ].map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-amber-200/80">
                <span className="text-amber-500 flex-shrink-0 mt-0.5">→</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
    ),
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🔬</span>
          <div>
            <h3 className="font-bold text-white mb-1">A/B Test Designer</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Design statistically rigorous A/B experiments for RAG improvements.
              Walk through each step: define hypothesis → configure stats → calculate sample size
              → instrument → analyze results.
            </p>
          </div>
        </div>
      </div>

      {/* Step progress */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <button
              onClick={() => setStep(i)}
              className={`flex flex-col items-center gap-1 px-2 transition-all ${step === i ? "opacity-100" : "opacity-50 hover:opacity-80"}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                i < step
                  ? "bg-indigo-600 border-indigo-500 text-white"
                  : step === i
                  ? "border-indigo-400 text-indigo-300"
                  : "border-slate-700 text-slate-600"
              }`}>
                {i < step ? "✓" : i + 1}
              </div>
              <span className="text-xs text-slate-500 hidden sm:block">{s}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 ${i < step ? "bg-indigo-600" : "bg-slate-800"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        {STEPS_CONTENT[step]?.()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className="px-5 py-2.5 border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 rounded-xl text-sm disabled:opacity-30 transition-all"
        >
          ← Back
        </button>
        <button
          onClick={() => setStep(Math.min(STEPS.length - 1, step + 1))}
          disabled={step === STEPS.length - 1}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm disabled:opacity-30 transition-all font-semibold"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
