import { useState } from "react";
import { RAGAS_EXAMPLE } from "./simulationEngine";

const METRICS_EXPLAINER = {
  contextPrecision: {
    label: "Context Precision",
    color: "#6366f1",
    formula: "relevant_retrieved / total_retrieved",
    description:
      "Of the chunks you retrieved, what fraction were actually relevant to the query? High precision = low noise in context.",
    tip: "Improve with: higher relevancy threshold, cross-encoder reranking, better metadata filtering.",
  },
  contextRecall: {
    label: "Context Recall",
    color: "#10b981",
    formula: "relevant_retrieved / total_relevant_in_corpus",
    description:
      "Of all the relevant chunks in the corpus, what fraction did you actually retrieve? High recall = you didn't miss important information.",
    tip: "Improve with: higher top-K, multi-query retrieval, HyDE, hybrid search (BM25 + dense).",
  },
  faithfulness: {
    label: "Faithfulness",
    color: "#f59e0b",
    formula: "supported_claims / total_claims",
    description:
      "Of all the claims in the generated answer, what fraction are supported by the retrieved context? High faithfulness = low hallucination.",
    tip: "Improve with: stricter system prompt, hallucination gate, relevancy grading (fewer noisy chunks = less hallucination surface area).",
  },
  answerRelevancy: {
    label: "Answer Relevancy",
    color: "#a855f7",
    formula: "cosine_sim(answer_embedding, query_embedding)",
    description:
      "Does the answer actually address what the user asked? Computed as cosine similarity between answer and query embeddings. High relevancy = answer stays on topic.",
    tip: "Improve with: explicit instruction in system prompt to address the question directly, query decomposition for multi-faceted questions.",
  },
  answerCorrectness: {
    label: "Answer Correctness",
    color: "#ec4899",
    formula: "F1(answer_claims ∩ ground_truth) = 2·P·R / (P+R)",
    description:
      "Does the answer match the ground truth? Requires a labeled dataset. F1 between answer claims and ground truth claims.",
    tip: "The only metric requiring human-labeled ground truth. Expensive to compute at scale — use LLM-judge as a proxy.",
  },
};

function MetricCard({ metricKey, score, active, onClick }) {
  const m = METRICS_EXPLAINER[metricKey];
  const pct = Math.round(score * 100);
  const color = score >= 0.8 ? "#22c55e" : score >= 0.6 ? "#f59e0b" : "#ef4444";

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border p-4 transition-all ${
        active
          ? "border-2 shadow-lg"
          : "border-slate-700 bg-slate-900/40 hover:border-slate-600"
      }`}
      style={active ? { borderColor: m.color, background: m.color + "12" } : {}}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {m.label}
        </span>
        <span className="text-xl font-bold" style={{ color }}>
          {pct}%
        </span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: m.color }}
        />
      </div>
    </button>
  );
}

function ScoreGauge({ label, score, color }) {
  const r = 34;
  const circ = 2 * Math.PI * r;
  const dash = circ * score;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="84" height="84" viewBox="0 0 84 84">
        <circle cx="42" cy="42" r={r} fill="none" stroke="#1e293b" strokeWidth="8" />
        <circle
          cx="42" cy="42" r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 42 42)"
          style={{ transition: "stroke-dasharray 0.5s ease" }}
        />
        <text x="42" y="42" textAnchor="middle" dominantBaseline="middle"
          fill="white" fontSize="14" fontWeight="700">
          {Math.round(score * 100)}%
        </text>
      </svg>
      <span className="text-xs text-slate-400 text-center">{label}</span>
    </div>
  );
}

export default function RAGASExplorer() {
  const ex = RAGAS_EXAMPLE;
  const [retrievedIds, setRetrievedIds] = useState(["c1", "c2", "c3", "c4"]);
  const [activeMetric, setActiveMetric] = useState("contextPrecision");

  const toggleChunk = (id) => {
    setRetrievedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Compute live RAGAS metrics based on selected chunks
  const relevant = retrievedIds.filter(
    (id) => ex.chunks.find((c) => c.id === id)?.groundTruthRelevant
  );
  const totalGroundTruthRelevant = ex.chunks.filter((c) => c.groundTruthRelevant).length;

  const contextPrecision = retrievedIds.length > 0
    ? relevant.length / retrievedIds.length
    : 0;
  const contextRecall = totalGroundTruthRelevant > 0
    ? relevant.length / totalGroundTruthRelevant
    : 0;

  // Faithfulness: only count claims whose supporting chunk was retrieved
  const supportedClaims = ex.claims.filter(
    (cl) => cl.supported && retrievedIds.includes(cl.supportedBy)
  );
  const faithfulness = ex.claims.length > 0
    ? supportedClaims.length / ex.claims.length
    : 0;

  // Answer relevancy: fixed for this example (embedding similarity)
  const answerRelevancy = 0.86;

  // Answer correctness: F1 between supported claims and ground truth facts
  const gtFacts = ex.claims.filter((c) => c.supported).length;
  const answerPrecision = ex.claims.length > 0 ? supportedClaims.length / ex.claims.length : 0;
  const answerRecallGT = gtFacts > 0 ? supportedClaims.length / gtFacts : 0;
  const answerCorrectness = answerPrecision + answerRecallGT > 0
    ? (2 * answerPrecision * answerRecallGT) / (answerPrecision + answerRecallGT)
    : 0;

  const scores = { contextPrecision, contextRecall, faithfulness, answerRelevancy, answerCorrectness };
  const activeM = METRICS_EXPLAINER[activeMetric];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-2xl">🧪</span>
          <div>
            <h3 className="font-bold text-white mb-1">RAGAS Metrics — Live Example</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Toggle which chunks are retrieved to see how all 5 RAGAS metrics update in real time.
              Click any metric card to see its formula, what it measures, and how to improve it.
            </p>
          </div>
        </div>
        <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Query</p>
          <p className="text-slate-200 font-medium text-sm">"{ex.query}"</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* ── Left: chunk selector ─────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Retrieved Chunks — toggle to simulate different top-K / threshold configurations
          </p>
          {ex.chunks.map((chunk) => {
            const retrieved = retrievedIds.includes(chunk.id);
            return (
              <button
                key={chunk.id}
                onClick={() => toggleChunk(chunk.id)}
                className={`w-full text-left rounded-xl border p-3.5 transition-all ${
                  retrieved
                    ? chunk.groundTruthRelevant
                      ? "border-emerald-700 bg-emerald-950/30"
                      : "border-amber-700 bg-amber-950/20"
                    : "border-slate-800 bg-slate-900/20 opacity-40"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center mt-0.5 text-xs font-bold ${
                    retrieved ? "bg-indigo-600 text-white" : "border border-slate-600"
                  }`}>
                    {retrieved ? "✓" : ""}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                        chunk.groundTruthRelevant
                          ? "bg-emerald-900/60 text-emerald-400"
                          : "bg-slate-800 text-slate-500"
                      }`}>
                        {chunk.groundTruthRelevant ? "✓ relevant" : "○ not relevant"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-snug line-clamp-2">{chunk.text}</p>
                    <p className="text-xs text-slate-600 mt-1">{chunk.source}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Right: metrics ───────────────────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-5">
          {/* Gauges row */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Live RAGAS Scores
            </p>
            <div className="flex flex-wrap justify-around gap-4">
              {Object.entries(scores).map(([k, v]) => (
                <button key={k} onClick={() => setActiveMetric(k)}>
                  <ScoreGauge
                    label={METRICS_EXPLAINER[k].label}
                    score={v}
                    color={activeMetric === k ? METRICS_EXPLAINER[k].color : "#475569"}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Metric cards (clickable) */}
          <div className="grid grid-cols-1 gap-2">
            {Object.entries(scores).map(([k, v]) => (
              <MetricCard
                key={k}
                metricKey={k}
                score={v}
                active={activeMetric === k}
                onClick={() => setActiveMetric(k)}
              />
            ))}
          </div>

          {/* Active metric explainer */}
          {activeM && (
            <div
              className="rounded-2xl border p-5 space-y-3 animate-fade-in"
              style={{ borderColor: activeM.color + "50", background: activeM.color + "0d" }}
            >
              <h4 className="font-bold text-white flex items-center gap-2">
                <span style={{ color: activeM.color }}>{activeM.label}</span>
                <span className="text-slate-400 font-normal text-sm">
                  = {Math.round(scores[activeMetric] * 100)}%
                </span>
              </h4>
              <div className="bg-slate-900/60 rounded-lg px-3 py-2 border border-slate-800">
                <code className="text-xs font-mono" style={{ color: activeM.color }}>
                  {activeM.formula}
                </code>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{activeM.description}</p>
              <div className="bg-slate-900/40 rounded-lg p-3 border border-slate-800">
                <p className="text-xs font-semibold text-slate-400 mb-1">HOW TO IMPROVE</p>
                <p className="text-xs text-slate-300">{activeM.tip}</p>
              </div>
            </div>
          )}

          {/* Faithfulness claim breakdown */}
          {activeMetric === "faithfulness" && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3 animate-fade-in">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Claim-level analysis — {supportedClaims.length}/{ex.claims.length} supported
              </p>
              {ex.claims.map((cl) => {
                const chunkRetrieved = cl.supportedBy ? retrievedIds.includes(cl.supportedBy) : false;
                const isSupported = cl.supported && chunkRetrieved;
                return (
                  <div
                    key={cl.id}
                    className={`rounded-xl p-3 border flex items-start gap-3 ${
                      isSupported
                        ? "border-emerald-800/50 bg-emerald-950/20"
                        : "border-red-800/50 bg-red-950/20"
                    }`}
                  >
                    <span className={`text-base flex-shrink-0 ${isSupported ? "text-emerald-400" : "text-red-400"}`}>
                      {isSupported ? "✓" : "✗"}
                    </span>
                    <div>
                      <p className="text-sm text-slate-200">"{cl.text}"</p>
                      {cl.supported && cl.supportedBy && (
                        <p className={`text-xs mt-0.5 ${chunkRetrieved ? "text-emerald-500" : "text-slate-500"}`}>
                          {chunkRetrieved
                            ? `Grounded in ${ex.chunks.find(c => c.id === cl.supportedBy)?.source}`
                            : `Supporting chunk not retrieved — adjust top-K or threshold`}
                        </p>
                      )}
                      {!cl.supported && (
                        <p className="text-xs text-red-400 mt-0.5">{cl.note}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
