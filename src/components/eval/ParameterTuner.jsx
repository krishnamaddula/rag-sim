import { useState } from "react";
import { simulateMetrics } from "./simulationEngine";

const CHUNK_SIZES = [128, 256, 512, 1024, 2048];
const EMBEDDING_MODELS = [
  { id: "text-embedding-3-small", label: "text-embedding-3-small", note: "Fast · cheap" },
  { id: "text-embedding-3-large", label: "text-embedding-3-large", note: "Better quality" },
  { id: "voyage-large-2",         label: "voyage-large-2",         note: "Top-tier general" },
  { id: "domain-fine-tuned",      label: "Domain fine-tuned",      note: "Best for your corpus" },
];
const LLM_MODELS = [
  { id: "gpt-4o-mini",   label: "GPT-4o mini",      note: "Fastest · cheapest" },
  { id: "claude-haiku",  label: "Claude Haiku",      note: "Fast · balanced" },
  { id: "gpt-4o",        label: "GPT-4o",            note: "Balanced baseline" },
  { id: "claude-sonnet", label: "Claude Sonnet",     note: "High quality" },
  { id: "claude-opus",   label: "Claude Opus",       note: "Best quality" },
];

const METRIC_META = {
  contextPrecision: { label: "Context Precision",  color: "#6366f1", invert: false, tip: "Higher = less noisy context" },
  contextRecall:    { label: "Context Recall",     color: "#10b981", invert: false, tip: "Higher = fewer missed facts" },
  faithfulness:     { label: "Faithfulness",       color: "#f59e0b", invert: false, tip: "Higher = less hallucination" },
  answerRelevancy:  { label: "Answer Relevancy",   color: "#a855f7", invert: false, tip: "Higher = more on-topic answers" },
  f1:               { label: "F1 Score",           color: "#ec4899", invert: false, tip: "Harmonic mean of precision+recall" },
  latencyMs:        { label: "Latency (ms)",       color: "#ef4444", invert: true,  tip: "Lower = faster response" },
  costPerQuery:     { label: "Cost / query ($)",   color: "#64748b", invert: true,  tip: "Lower = cheaper at scale" },
};

function Slider({ label, value, min, max, step = 1, onChange, format = (v) => v, hint }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-slate-300">{label}</span>
        <span className="text-sm font-bold text-indigo-300 font-mono">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-indigo-500"
      />
      {hint && <p className="text-xs text-slate-600 mt-0.5">{hint}</p>}
    </div>
  );
}

function Toggle({ label, value, onChange, hint }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-300">{label}</p>
        {hint && <p className="text-xs text-slate-600">{hint}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
          value ? "bg-indigo-600" : "bg-slate-700"
        }`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            value ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function MetricRow({ metricKey, current, baseline }) {
  const m = METRIC_META[metricKey];
  const isMs   = metricKey === "latencyMs";
  const isCost = metricKey === "costPerQuery";
  const fmt = isMs ? (v) => `${v}ms` : isCost ? (v) => `$${v.toFixed(4)}` : (v) => `${(v * 100).toFixed(1)}%`;

  const delta = current - baseline;
  const better = m.invert ? delta < 0 : delta > 0;
  const worse  = m.invert ? delta > 0 : delta < 0;
  const sign   = delta > 0 ? "+" : "";
  const deltaFmt = isMs
    ? `${sign}${Math.round(delta)}ms`
    : isCost
    ? `${sign}$${delta.toFixed(4)}`
    : `${sign}${(delta * 100).toFixed(1)}%`;

  const barPct = isMs
    ? Math.min(100, (current / 1000) * 100)
    : isCost
    ? Math.min(100, (current / 0.1) * 100)
    : current * 100;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: m.color }} />
          <span className="text-xs text-slate-400">{m.label}</span>
          <span className="text-xs text-slate-600 hidden lg:block">{m.tip}</span>
        </div>
        <div className="flex items-center gap-2">
          {delta !== 0 && (
            <span
              className={`text-xs font-mono px-1.5 py-0.5 rounded font-semibold ${
                better
                  ? "bg-emerald-900/50 text-emerald-400"
                  : worse
                  ? "bg-red-900/50 text-red-400"
                  : "bg-slate-800 text-slate-500"
              }`}
            >
              {deltaFmt}
            </span>
          )}
          <span className="text-sm font-bold text-white font-mono w-20 text-right">
            {fmt(current)}
          </span>
        </div>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${Math.max(2, Math.min(100, barPct))}%`, background: m.color }}
        />
      </div>
    </div>
  );
}

// Radar chart (SVG pentagon)
function RadarChart({ scores, baseline }) {
  const metrics = ["contextPrecision", "contextRecall", "faithfulness", "answerRelevancy", "f1"];
  const N = metrics.length;
  const cx = 110, cy = 110, r = 85;
  const angles = metrics.map((_, i) => (2 * Math.PI * i) / N - Math.PI / 2);

  const pt = (metric, data, scale = r) => {
    const i = metrics.indexOf(metric);
    const v = Math.min(1, data[metric] || 0);
    return {
      x: cx + scale * v * Math.cos(angles[i]),
      y: cy + scale * v * Math.sin(angles[i]),
    };
  };

  const toPath = (data, scale = r) =>
    metrics
      .map((m, i) => {
        const v = Math.min(1, data[m] || 0);
        const x = cx + scale * v * Math.cos(angles[i]);
        const y = cy + scale * v * Math.sin(angles[i]);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ") + "Z";

  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  return (
    <svg width={220} height={220} className="mx-auto">
      {/* Grid rings */}
      {gridLevels.map((level) => (
        <polygon
          key={level}
          points={angles
            .map((a) => `${(cx + r * level * Math.cos(a)).toFixed(1)},${(cy + r * level * Math.sin(a)).toFixed(1)}`)
            .join(" ")}
          fill="none"
          stroke="#1e293b"
          strokeWidth="1"
        />
      ))}
      {/* Spokes */}
      {angles.map((a, i) => (
        <line key={i}
          x1={cx} y1={cy}
          x2={(cx + r * Math.cos(a)).toFixed(1)}
          y2={(cy + r * Math.sin(a)).toFixed(1)}
          stroke="#1e293b" strokeWidth="1"
        />
      ))}
      {/* Baseline area */}
      <path d={toPath(baseline)} fill="#6366f122" stroke="#6366f155" strokeWidth="1.5" />
      {/* Current area */}
      <path d={toPath(scores)} fill="#10b98122" stroke="#10b981" strokeWidth="2" />
      {/* Dots */}
      {metrics.map((m) => {
        const p = pt(m, scores);
        return <circle key={m} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="4" fill="#10b981" />;
      })}
      {/* Labels */}
      {metrics.map((m, i) => {
        const lx = cx + (r + 18) * Math.cos(angles[i]);
        const ly = cy + (r + 18) * Math.sin(angles[i]);
        return (
          <text key={m} x={lx.toFixed(1)} y={ly.toFixed(1)}
            textAnchor="middle" dominantBaseline="middle"
            fill="#94a3b8" fontSize="9" fontFamily="monospace">
            {METRIC_META[m]?.label.split(" ")[0]}
          </text>
        );
      })}
    </svg>
  );
}

const DEFAULT_PARAMS = {
  chunkSize: 512,
  topK: 5,
  relevancyThreshold: 0,
  useReranker: false,
  useHallucinationGate: false,
  embeddingModel: "text-embedding-3-small",
  llmModel: "gpt-4o",
  rerankerCandidates: 20,
};

export default function ParameterTuner() {
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const set = (key) => (val) => setParams((p) => ({ ...p, [key]: val }));

  const current  = simulateMetrics(params);
  const baseline = simulateMetrics(DEFAULT_PARAMS);

  const INSIGHT_RULES = [
    {
      condition: params.topK >= 15 && !params.useReranker,
      level: "warn",
      msg: "High top-K without a reranker floods the context with noise — consider adding cross-encoder reranking.",
    },
    {
      condition: params.chunkSize <= 128,
      level: "warn",
      msg: "128-token chunks are too small for most prose — retrieval precision looks good but context lacks surrounding information.",
    },
    {
      condition: params.useHallucinationGate && current.latencyMs > 600,
      level: "warn",
      msg: `Total latency is ${current.latencyMs}ms — hallucination gate adds ~185ms. Consider fast-model gating (Claude Haiku) to reduce overhead.`,
    },
    {
      condition: params.useReranker && params.rerankerCandidates >= 40,
      level: "info",
      msg: `Reranking ${params.rerankerCandidates} candidates adds ${Math.round(6 * params.rerankerCandidates + 20)}ms. For strict latency SLAs, cap candidates at 20.`,
    },
    {
      condition: params.relevancyThreshold >= 0.8,
      level: "warn",
      msg: "Relevancy threshold ≥ 0.8 aggressively filters chunks — context recall drops significantly. Monitor for 'I don't have enough info' responses.",
    },
    {
      condition: params.embeddingModel === "domain-fine-tuned" && params.llmModel === "claude-opus",
      level: "info",
      msg: "Domain embedding + Opus LLM is your highest-quality configuration — but also most expensive. Best for high-stakes, low-volume queries.",
    },
    {
      condition: params.llmModel === "gpt-4o-mini" && !params.useHallucinationGate,
      level: "info",
      msg: "Smaller LLMs hallucinate more — consider adding the hallucination gate when using mini/haiku models.",
    },
  ].filter((r) => r.condition);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🎛️</span>
          <div>
            <h3 className="font-bold text-white mb-1">Parameter Tuning Lab</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Adjust each parameter and watch all metrics update in real time.
              <span className="text-indigo-400"> Blue line</span> = baseline (default config).
              <span className="text-emerald-400"> Green line</span> = your config.
              Deltas show vs. baseline.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Controls ─────────────────────────────────────────────────── */}
        <div className="space-y-5">
          {/* Chunking */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h4 className="font-semibold text-white text-sm flex items-center gap-2">
              <span className="text-base">📄</span> Indexing
            </h4>
            <div>
              <p className="text-sm font-medium text-slate-300 mb-2">Chunk Size</p>
              <div className="flex gap-1.5 flex-wrap">
                {CHUNK_SIZES.map((cs) => (
                  <button
                    key={cs}
                    onClick={() => set("chunkSize")(cs)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold border transition-all ${
                      params.chunkSize === cs
                        ? "bg-indigo-600 border-indigo-500 text-white"
                        : "border-slate-700 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    {cs}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-600 mt-1.5">
                {params.chunkSize < 256 ? "↑ Precision ↓ Recall — too granular for prose"
                : params.chunkSize > 1024 ? "↓ Precision ↑ Recall — noisy context"
                : "✓ Sweet spot for most RAG systems"}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-300 mb-2">Embedding Model</p>
              <div className="space-y-1.5">
                {EMBEDDING_MODELS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => set("embeddingModel")(m.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition-all ${
                      params.embeddingModel === m.id
                        ? "border-indigo-500 bg-indigo-900/30 text-white"
                        : "border-slate-700 text-slate-400 hover:border-slate-600"
                    }`}
                  >
                    <span className="font-medium">{m.label}</span>
                    <span className="text-slate-500 ml-2">{m.note}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Retrieval */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h4 className="font-semibold text-white text-sm flex items-center gap-2">
              <span className="text-base">🔍</span> Retrieval
            </h4>
            <Slider
              label="Top-K"
              value={params.topK}
              min={1} max={20}
              onChange={set("topK")}
              hint="More K → higher recall, more noise, higher cost"
            />
            <Toggle
              label="Cross-encoder Reranker"
              value={params.useReranker}
              onChange={set("useReranker")}
              hint="+130–380ms · +$0.012 · ↑ precision"
            />
            {params.useReranker && (
              <Slider
                label="Reranker Candidates"
                value={params.rerankerCandidates}
                min={10} max={60} step={5}
                onChange={set("rerankerCandidates")}
                hint="More candidates → better selection, more latency"
              />
            )}
          </div>

          {/* Quality Gates */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h4 className="font-semibold text-white text-sm flex items-center gap-2">
              <span className="text-base">🛡️</span> Quality Gates
            </h4>
            <Slider
              label="Relevancy Threshold"
              value={params.relevancyThreshold}
              min={0} max={0.9} step={0.05}
              onChange={set("relevancyThreshold")}
              format={(v) => v === 0 ? "disabled" : v.toFixed(2)}
              hint="0 = disabled · 0.6 typical · >0.8 over-filters"
            />
            <Toggle
              label="Hallucination Gate"
              value={params.useHallucinationGate}
              onChange={set("useHallucinationGate")}
              hint="+185ms · +$0.016 · ↑ faithfulness"
            />
          </div>

          {/* LLM */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <h4 className="font-semibold text-white text-sm flex items-center gap-2 mb-3">
              <span className="text-base">🤖</span> LLM Model
            </h4>
            <div className="space-y-1.5">
              {LLM_MODELS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => set("llmModel")(m.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition-all ${
                    params.llmModel === m.id
                      ? "border-indigo-500 bg-indigo-900/30 text-white"
                      : "border-slate-700 text-slate-400 hover:border-slate-600"
                  }`}
                >
                  <span className="font-medium">{m.label}</span>
                  <span className="text-slate-500 ml-2">{m.note}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setParams(DEFAULT_PARAMS)}
            className="w-full text-sm text-slate-500 hover:text-slate-300 py-2 border border-slate-800 rounded-xl transition-colors"
          >
            ↺ Reset to baseline
          </button>
        </div>

        {/* ── Metrics panel ────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Radar */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Quality Profile — Your Config vs. Baseline
            </p>
            <RadarChart scores={current} baseline={baseline} />
            <div className="flex justify-center gap-6 mt-2 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-indigo-400 opacity-60" />
                <span className="text-slate-500">Baseline (default)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-emerald-400" />
                <span className="text-slate-300">Your config</span>
              </div>
            </div>
          </div>

          {/* Metric bars */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              All Metrics — delta vs. baseline
            </p>
            {Object.keys(METRIC_META).map((k) => (
              <MetricRow
                key={k}
                metricKey={k}
                current={current[k]}
                baseline={baseline[k]}
              />
            ))}
          </div>

          {/* Insights */}
          {INSIGHT_RULES.length > 0 && (
            <div className="space-y-2">
              {INSIGHT_RULES.map((r, i) => (
                <div
                  key={i}
                  className={`rounded-xl border p-3.5 flex items-start gap-3 ${
                    r.level === "warn"
                      ? "bg-amber-950/30 border-amber-900/60"
                      : "bg-blue-950/30 border-blue-900/60"
                  }`}
                >
                  <span className="text-base flex-shrink-0">
                    {r.level === "warn" ? "⚠️" : "💡"}
                  </span>
                  <p className={`text-xs leading-relaxed ${
                    r.level === "warn" ? "text-amber-300" : "text-blue-300"
                  }`}>
                    {r.msg}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Summary card */}
          <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Production Summary
            </p>
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { label: "Latency p99", val: `~${current.latencyMs}ms`, ok: current.latencyMs < 500 },
                { label: "Cost / query", val: `$${current.costPerQuery.toFixed(4)}`, ok: current.costPerQuery < 0.05 },
                { label: "Daily cost (10K QPS)", val: `$${(current.costPerQuery * 10000 * 86400 / 1000).toFixed(0)}`, ok: true },
              ].map((s) => (
                <div key={s.label}>
                  <p className={`text-lg font-bold ${s.ok ? "text-white" : "text-amber-400"}`}>{s.val}</p>
                  <p className="text-xs text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
