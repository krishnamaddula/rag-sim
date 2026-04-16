import { useState } from "react";
import { PIPELINE_STAGES, simulateMetrics } from "./simulationEngine";

const GROUP_COLORS = {
  "Pre-Retrieval": "#6366f1",
  "Retrieval":     "#a855f7",
  "Quality Gate":  "#f59e0b",
  "Generation":    "#10b981",
};

const SLA_PRESETS = [
  { label: "Chatbot (<300ms)", ms: 300, color: "#22c55e" },
  { label: "Search (<500ms)",  ms: 500, color: "#f59e0b" },
  { label: "Async (<2s)",      ms: 2000, color: "#ef4444" },
];

const EF_OPTIONS   = [32, 64, 128, 200];
const CAND_OPTIONS = [10, 20, 40, 60];
const LLM_OPTIONS  = [
  { label: "Haiku",      ms: 130 },
  { label: "GPT-4o mini",ms: 120 },
  { label: "GPT-4o",     ms: 185 },
  { label: "Sonnet",     ms: 200 },
  { label: "Opus",       ms: 225 },
];

export default function PipelineProfiler() {
  const [enabled, setEnabled] = useState({
    bm25: true,
    relgrade: false,
    rerank: false,
    hallucgate: false,
    srchighlight: false,
  });

  const [efSearch,        setEfSearch]        = useState(64);
  const [rerankerCands,   setRerankerCands]   = useState(20);
  const [llmIndex,        setLlmIndex]        = useState(2); // GPT-4o
  const [slaMs,           setSlaMs]           = useState(500);

  // Build active stage list
  const activeStages = PIPELINE_STAGES.map((s) => {
    let ms = s.baseMs;
    if (s.id === "ann") {
      const idx = EF_OPTIONS.indexOf(efSearch);
      ms = s.tunableEffect[idx] ?? s.baseMs;
    }
    if (s.id === "rerank") {
      const idx = CAND_OPTIONS.indexOf(rerankerCands);
      ms = s.tunableEffect[idx] ?? s.baseMs;
    }
    if (s.id === "llm") {
      ms = LLM_OPTIONS[llmIndex]?.ms ?? s.baseMs;
    }
    const isOptional = s.optional ?? false;
    const isOn = !isOptional || enabled[s.id] !== false;

    return { ...s, resolvedMs: isOn ? ms : 0, isOn };
  });

  const totalMs = activeStages.reduce((sum, s) => sum + s.resolvedMs, 0);
  const withinSla = totalMs <= slaMs;
  const slaPct = Math.min(100, (totalMs / slaMs) * 100);

  // Build Gantt bars (simplified — show as sequential horizontal bars)
  const maxBarMs = Math.max(totalMs, slaMs);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⏱️</span>
          <div>
            <h3 className="font-bold text-white mb-1">Pipeline Profiler</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Toggle stages, tune parameters, and instantly see your latency budget breakdown.
              This mirrors how production RAG engineers budget the request lifecycle.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Controls ─────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* SLA target */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <h4 className="font-semibold text-white text-sm mb-3">Target SLA</h4>
            <div className="flex gap-2 flex-wrap">
              {SLA_PRESETS.map((p) => (
                <button
                  key={p.ms}
                  onClick={() => setSlaMs(p.ms)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    slaMs === p.ms
                      ? "bg-indigo-600 border-indigo-500 text-white"
                      : "border-slate-700 text-slate-400 hover:border-slate-500"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Optional stages */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h4 className="font-semibold text-white text-sm">Optional Stages</h4>
            {[
              { id: "bm25",        label: "BM25 Sparse Search",    baseMs: 28,  color: "#a855f7" },
              { id: "relgrade",    label: "Relevancy Grader",       baseMs: 95,  color: "#f59e0b" },
              { id: "rerank",      label: "Cross-encoder Reranker", baseMs: 140, color: "#ec4899" },
              { id: "hallucgate",  label: "Hallucination Gate",     baseMs: 185, color: "#ef4444" },
              { id: "srchighlight",label: "Source Highlighter",     baseMs: 55,  color: "#3b82f6" },
            ].map((s) => (
              <div key={s.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                  <div>
                    <p className="text-xs text-slate-300">{s.label}</p>
                    <p className="text-xs text-slate-600">+{s.baseMs}ms base</p>
                  </div>
                </div>
                <button
                  onClick={() => setEnabled((e) => ({ ...e, [s.id]: !e[s.id] }))}
                  className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
                    enabled[s.id] ? "bg-indigo-600" : "bg-slate-700"
                  }`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    enabled[s.id] ? "translate-x-4" : "translate-x-0.5"
                  }`} />
                </button>
              </div>
            ))}
          </div>

          {/* Tunable params */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h4 className="font-semibold text-white text-sm">Tune Parameters</h4>
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-xs text-slate-400">ANN ef_search</span>
                <span className="text-xs font-mono text-indigo-300">{efSearch}</span>
              </div>
              <div className="flex gap-1.5">
                {EF_OPTIONS.map((v) => (
                  <button
                    key={v}
                    onClick={() => setEfSearch(v)}
                    className={`flex-1 py-1 rounded text-xs font-mono border transition-all ${
                      efSearch === v
                        ? "bg-indigo-600 border-indigo-500 text-white"
                        : "border-slate-700 text-slate-500 hover:border-slate-500"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-600 mt-1">Higher = better recall, slower ANN</p>
            </div>

            {enabled.rerank && (
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-xs text-slate-400">Reranker candidates</span>
                  <span className="text-xs font-mono text-pink-300">{rerankerCands}</span>
                </div>
                <div className="flex gap-1.5">
                  {CAND_OPTIONS.map((v) => (
                    <button
                      key={v}
                      onClick={() => setRerankerCands(v)}
                      className={`flex-1 py-1 rounded text-xs font-mono border transition-all ${
                        rerankerCands === v
                          ? "bg-pink-700 border-pink-600 text-white"
                          : "border-slate-700 text-slate-500 hover:border-slate-500"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-600 mt-1">More candidates → better ranking, more latency</p>
              </div>
            )}

            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-xs text-slate-400">LLM Model</span>
                <span className="text-xs font-mono text-emerald-300">{LLM_OPTIONS[llmIndex]?.label}</span>
              </div>
              <div className="flex gap-1 flex-wrap">
                {LLM_OPTIONS.map((m, i) => (
                  <button
                    key={m.label}
                    onClick={() => setLlmIndex(i)}
                    className={`px-2 py-1 rounded text-xs border transition-all ${
                      llmIndex === i
                        ? "bg-emerald-700 border-emerald-600 text-white"
                        : "border-slate-700 text-slate-500 hover:border-slate-500"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Profiler visualization ────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">
          {/* SLA meter */}
          <div className={`rounded-2xl border p-5 ${withinSla ? "border-emerald-700 bg-emerald-950/20" : "border-red-700 bg-red-950/20"}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-white text-lg">Total: {totalMs}ms</span>
              <span className={`font-semibold ${withinSla ? "text-emerald-400" : "text-red-400"}`}>
                {withinSla ? `✓ Within SLA (${slaMs}ms)` : `✗ Exceeds SLA by ${totalMs - slaMs}ms`}
              </span>
            </div>
            <div className="h-3 bg-slate-800 rounded-full overflow-hidden relative">
              <div
                className="h-full rounded-full transition-all duration-400"
                style={{
                  width: `${slaPct}%`,
                  background: withinSla ? "#22c55e" : "#ef4444",
                }}
              />
              {/* SLA marker */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white/40"
                style={{ left: "100%" }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>0ms</span>
              <span>SLA: {slaMs}ms</span>
            </div>
          </div>

          {/* Stage breakdown bars */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-5">
              Per-stage breakdown
            </p>
            <div className="space-y-3">
              {activeStages.map((s) => {
                if (!s.isOn) return null;
                const pct = Math.max(1, (s.resolvedMs / Math.max(totalMs, 1)) * 100);
                const absPct = Math.max(1, (s.resolvedMs / Math.max(maxBarMs, 1)) * 100);
                return (
                  <div key={s.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                        <span className="text-xs text-slate-300">{s.label}</span>
                        <span className="text-xs text-slate-600 hidden sm:inline">
                          [{GROUP_COLORS[s.group] ? s.group : ""}]
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">{pct.toFixed(1)}%</span>
                        <span className="text-xs font-bold font-mono text-white w-14 text-right">
                          {s.resolvedMs}ms
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${absPct}%`, background: s.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Stacked bar */}
            <div className="mt-5 pt-4 border-t border-slate-800">
              <p className="text-xs text-slate-500 mb-2">Timeline view</p>
              <div className="h-8 flex rounded-lg overflow-hidden">
                {activeStages
                  .filter((s) => s.isOn && s.resolvedMs > 0)
                  .map((s) => {
                    const w = (s.resolvedMs / Math.max(totalMs, 1)) * 100;
                    return (
                      <div
                        key={s.id}
                        className="h-full flex items-center justify-center relative group"
                        style={{ width: `${w}%`, background: s.color, minWidth: "2px" }}
                        title={`${s.label}: ${s.resolvedMs}ms`}
                      >
                        {w > 8 && (
                          <span className="text-xs text-white font-bold truncate px-1">
                            {s.resolvedMs}ms
                          </span>
                        )}
                      </div>
                    );
                  })}
                {/* SLA remainder */}
                {withinSla && (
                  <div
                    className="h-full"
                    style={{
                      width: `${((slaMs - totalMs) / Math.max(maxBarMs, 1)) * 100}%`,
                      background: "#1e293b",
                    }}
                  />
                )}
              </div>
              <div className="flex justify-between text-xs text-slate-600 mt-1">
                <span>0</span>
                <span>{totalMs}ms actual</span>
                {slaMs !== totalMs && <span>{slaMs}ms SLA</span>}
              </div>
            </div>
          </div>

          {/* Optimization tips */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Optimization Recommendations
            </p>
            {[
              {
                show: !withinSla && enabled.rerank && rerankerCands >= 40,
                text: `Reranking ${rerankerCands} candidates is your biggest single cost. Cap at 20 candidates to save ${Math.round((rerankerCands - 20) * 6)}ms.`,
                icon: "⚡",
              },
              {
                show: !withinSla && enabled.hallucgate,
                text: "Hallucination gate adds 185ms. Consider using a fast gate model (Haiku/mini) or running it asynchronously after initial response.",
                icon: "🔬",
              },
              {
                show: !withinSla && llmIndex >= 3,
                text: `${LLM_OPTIONS[llmIndex]?.label} is your highest-latency LLM option. GPT-4o saves ~${LLM_OPTIONS[llmIndex].ms - 185}ms for most queries.`,
                icon: "🤖",
              },
              {
                show: !withinSla && efSearch >= 128,
                text: `ef_search=${efSearch} provides high recall but adds latency. Try ef_search=64 — recall drops only ~1–2% in practice.`,
                icon: "🔍",
              },
              {
                show: withinSla && !enabled.rerank,
                text: `You have ${slaMs - totalMs}ms budget remaining. A cross-encoder reranker (base +140ms) would fit within SLA and meaningfully improve precision.`,
                icon: "💡",
              },
              {
                show: withinSla && !enabled.relgrade && slaMs - totalMs > 100,
                text: "You have budget to add a relevancy grader gate — filters noisy chunks before generation, reducing hallucination surface area by 10–15%.",
                icon: "💡",
              },
            ]
              .filter((r) => r.show)
              .map((r, i) => (
                <div key={i} className="flex gap-2.5 bg-slate-800/40 rounded-xl p-3">
                  <span className="text-base flex-shrink-0">{r.icon}</span>
                  <p className="text-xs text-slate-300 leading-relaxed">{r.text}</p>
                </div>
              ))}
            {withinSla && (
              <div className="flex gap-2.5 bg-emerald-950/30 border border-emerald-900/50 rounded-xl p-3">
                <span className="text-base">✓</span>
                <p className="text-xs text-emerald-300">
                  Configuration is within SLA with {slaMs - totalMs}ms headroom. Solid production configuration.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
