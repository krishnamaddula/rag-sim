/**
 * Simulation engine — realistic metric models based on production RAG data.
 * All functions are deterministic given the same params so the UI stays stable.
 */

// ── Clamp helper ──────────────────────────────────────────────────────────
const clamp = (v, lo = 0.01, hi = 0.99) => Math.min(hi, Math.max(lo, v));

// ── Base production metrics (well-tuned naive RAG, 512 chunk, k=5, no rerank)
const BASE = {
  contextPrecision: 0.68,
  contextRecall: 0.78,
  faithfulness: 0.74,
  answerRelevancy: 0.82,
  latencyMs: 310,
  costPerQuery: 0.022,
};

// ── Chunk size delta table (offset from 512-token base) ──────────────────
const CHUNK_DELTAS = {
  128:  { prec: +0.11, rec: -0.18, lat: -20, cost: -0.004 },
  256:  { prec: +0.06, rec: -0.09, lat: -10, cost: -0.002 },
  512:  { prec:  0.00, rec:  0.00, lat:   0, cost:  0.000 },
  1024: { prec: -0.07, rec: +0.06, lat: +14, cost: +0.005 },
  2048: { prec: -0.15, rec: +0.10, lat: +30, cost: +0.011 },
};

// ── Embedding model delta table ───────────────────────────────────────────
const EMBED_DELTAS = {
  "text-embedding-3-small": { prec:  0.00, rec:  0.00, lat:  0, cost:  0.000 },
  "text-embedding-3-large": { prec: +0.06, rec: +0.04, lat: +18, cost: +0.005 },
  "voyage-large-2":         { prec: +0.09, rec: +0.05, lat: +22, cost: +0.006 },
  "domain-fine-tuned":      { prec: +0.15, rec: +0.09, lat: +38, cost: +0.008 },
};

// ── LLM model delta table ─────────────────────────────────────────────────
const LLM_DELTAS = {
  "gpt-4o-mini":    { faith: -0.06, rel: -0.04, lat: +0,   cost: -0.010 },
  "claude-haiku":   { faith: -0.04, rel: -0.02, lat: +0,   cost: -0.008 },
  "gpt-4o":         { faith:  0.00, rel:  0.00, lat: +0,   cost:  0.000 },
  "claude-sonnet":  { faith: +0.03, rel: +0.02, lat: +15,  cost: +0.005 },
  "claude-opus":    { faith: +0.06, rel: +0.04, lat: +40,  cost: +0.020 },
};

/**
 * Core simulation function.
 * Returns all key RAG metrics for a given parameter configuration.
 */
export function simulateMetrics(params) {
  const {
    chunkSize = 512,
    topK = 5,
    relevancyThreshold = 0,   // 0 = disabled
    useReranker = false,
    useHallucinationGate = false,
    embeddingModel = "text-embedding-3-small",
    llmModel = "gpt-4o",
    rerankerCandidates = 20,
  } = params;

  let prec  = BASE.contextPrecision;
  let rec   = BASE.contextRecall;
  let faith = BASE.faithfulness;
  let rel   = BASE.answerRelevancy;
  let lat   = BASE.latencyMs;
  let cost  = BASE.costPerQuery;

  // ── Chunk size ────────────────────────────────────────────────────────
  const cd = CHUNK_DELTAS[chunkSize] ?? CHUNK_DELTAS[512];
  prec += cd.prec;
  rec  += cd.rec;
  lat  += cd.lat;
  cost += cd.cost;

  // ── Top-K (base = 5) ─────────────────────────────────────────────────
  const kDelta = topK - 5;
  rec   = clamp(rec  + kDelta * 0.020);
  prec  = clamp(prec - kDelta * 0.022);
  cost += kDelta * 0.0018;
  lat  += kDelta * 3;

  // ── Relevancy threshold gate ──────────────────────────────────────────
  if (relevancyThreshold > 0) {
    // precision improves, recall drops, and effect accelerates non-linearly
    const t = relevancyThreshold;
    prec  = clamp(prec  + t * 0.28  - t * t * 0.12);
    rec   = clamp(rec   - t * 0.45  + t * t * 0.08);
    faith = clamp(faith + t * 0.10);
    lat  += 95;   // relevancy scoring adds latency
    cost += 0.008;
  }

  // ── Reranker ──────────────────────────────────────────────────────────
  if (useReranker) {
    prec  = clamp(prec  + 0.14);
    faith = clamp(faith + 0.08);
    rel   = clamp(rel   + 0.04);
    // Latency depends on candidate count scored by cross-encoder
    lat  += Math.round(6 * rerankerCandidates + 20);
    cost += 0.012;
  }

  // ── Hallucination gate ────────────────────────────────────────────────
  if (useHallucinationGate) {
    faith = clamp(faith + 0.11);
    prec  = clamp(prec  + 0.03);
    lat  += 185;
    cost += 0.016;
  }

  // ── Embedding model ───────────────────────────────────────────────────
  const ed = EMBED_DELTAS[embeddingModel] ?? EMBED_DELTAS["text-embedding-3-small"];
  prec  = clamp(prec  + ed.prec);
  rec   = clamp(rec   + ed.rec);
  lat  += ed.lat;
  cost += ed.cost;

  // ── LLM model ─────────────────────────────────────────────────────────
  const ld = LLM_DELTAS[llmModel] ?? LLM_DELTAS["gpt-4o"];
  faith = clamp(faith + ld.faith);
  rel   = clamp(rel   + ld.rel);
  lat  += ld.lat;
  cost += ld.cost;

  const f1 = (2 * prec * rec) / (prec + rec + 1e-9);

  return {
    contextPrecision:  parseFloat(prec.toFixed(3)),
    contextRecall:     parseFloat(rec.toFixed(3)),
    faithfulness:      parseFloat(faith.toFixed(3)),
    answerRelevancy:   parseFloat(rel.toFixed(3)),
    f1:                parseFloat(f1.toFixed(3)),
    latencyMs:         Math.max(60, Math.round(lat)),
    costPerQuery:      parseFloat(Math.max(0.001, cost).toFixed(4)),
    // breakdown for profiler
    breakdown: buildLatencyBreakdown(params, lat),
  };
}

function buildLatencyBreakdown(params, totalLat) {
  const { useReranker, rerankerCandidates = 20, useHallucinationGate, relevancyThreshold, llmModel } = params;
  const llmBase = { "gpt-4o-mini": 120, "claude-haiku": 130, "gpt-4o": 185, "claude-sonnet": 200, "claude-opus": 225 };

  return [
    { label: "Embedding", ms: 12,   color: "#6366f1", phase: "pre" },
    { label: "ANN Search", ms: 22,  color: "#8b5cf6", phase: "pre" },
    { label: "BM25 Search", ms: 28, color: "#a855f7", phase: "pre" },
    { label: "RRF Fusion",  ms: 5,  color: "#d946ef", phase: "pre" },
    { label: "Relevancy Grading",  ms: relevancyThreshold > 0 ? 95 : 0,  color: "#f59e0b", phase: "gate" },
    { label: "Cross-encoder Rerank", ms: useReranker ? Math.round(6 * rerankerCandidates + 20) : 0, color: "#ec4899", phase: "retrieval" },
    { label: "LLM Generation",      ms: llmBase[llmModel] ?? 185, color: "#10b981", phase: "generation" },
    { label: "Hallucination Gate",  ms: useHallucinationGate ? 185 : 0,   color: "#ef4444", phase: "gate" },
    { label: "Source Highlighting", ms: useHallucinationGate ? 55 : 0,    color: "#3b82f6", phase: "gate" },
  ].filter(s => s.ms > 0);
}

// ── A/B test statistics ───────────────────────────────────────────────────

/**
 * Required sample size per arm for a two-proportion z-test.
 * p1 = baseline, p2 = p1 + mde (minimum detectable effect).
 * alpha = significance level (two-tailed), power = 1 - beta.
 */
export function requiredSampleSize({ baseline, mde, alpha = 0.05, power = 0.80 }) {
  const p1 = baseline;
  const p2 = Math.min(0.999, baseline + mde);
  const zAlpha = alpha === 0.05 ? 1.96 : alpha === 0.01 ? 2.576 : 1.645;
  const zBeta  = power === 0.80 ? 0.842 : power === 0.90 ? 1.282 : 0.674;

  const pooled = (p1 + p2) / 2;
  const n = Math.ceil(
    ((zAlpha * Math.sqrt(2 * pooled * (1 - pooled)) +
      zBeta  * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2))) ** 2) /
    ((p2 - p1) ** 2)
  );
  return Math.max(50, n);
}

// ── RAGAS simulation data ─────────────────────────────────────────────────

export const RAGAS_EXAMPLE = {
  query: "What are the mechanisms and contraindications of aspirin?",
  groundTruth:
    "Aspirin inhibits COX-1 and COX-2 enzymes, reducing prostaglandin synthesis. It is contraindicated in patients with peptic ulcers, bleeding disorders, and should be avoided in children under 12 due to Reye's syndrome risk.",
  chunks: [
    {
      id: "c1",
      source: "pharmacology_handbook.pdf · p.142",
      text: "Aspirin (acetylsalicylic acid) irreversibly inhibits COX-1 and COX-2 enzymes, thereby reducing the synthesis of prostaglandins and thromboxane A2. This underlies its analgesic, antipyretic, and anti-inflammatory effects.",
      groundTruthRelevant: true,
    },
    {
      id: "c2",
      source: "drug_safety_guide.pdf · p.67",
      text: "Aspirin is contraindicated in patients with known hypersensitivity, active peptic ulcer disease, or bleeding disorders. Long-term use increases risk of gastrointestinal bleeding.",
      groundTruthRelevant: true,
    },
    {
      id: "c3",
      source: "pediatric_formulary.pdf · p.19",
      text: "Aspirin should not be given to children or teenagers with viral infections due to the risk of Reye's syndrome, a rare but serious condition causing liver and brain damage.",
      groundTruthRelevant: true,
    },
    {
      id: "c4",
      source: "cardiology_guidelines.pdf · p.31",
      text: "Low-dose aspirin (75–100 mg/day) is recommended for secondary prevention of cardiovascular events in high-risk patients, including those with prior MI or stroke.",
      groundTruthRelevant: false,
    },
    {
      id: "c5",
      source: "hospital_formulary.pdf · p.8",
      text: "The hospital's formulary lists aspirin in 81mg, 325mg, and 500mg tablet formulations. Enteric-coated versions are preferred for chronic use to reduce gastric irritation.",
      groundTruthRelevant: false,
    },
  ],
  // Claims in the generated answer — each maps to a chunk
  claims: [
    {
      id: "cl1",
      text: "Aspirin irreversibly inhibits COX-1 and COX-2 enzymes.",
      supportedBy: "c1",
      supported: true,
    },
    {
      id: "cl2",
      text: "This reduces prostaglandin synthesis, producing analgesic and anti-inflammatory effects.",
      supportedBy: "c1",
      supported: true,
    },
    {
      id: "cl3",
      text: "It is contraindicated in patients with peptic ulcer disease and bleeding disorders.",
      supportedBy: "c2",
      supported: true,
    },
    {
      id: "cl4",
      text: "Aspirin is avoided in children under 12 due to Reye's syndrome risk.",
      supportedBy: "c3",
      supported: true,
    },
    {
      id: "cl5",
      text: "Aspirin was first synthesized by Felix Hoffmann at Bayer in 1897.",
      supportedBy: null,
      supported: false,
      note: "Hallucinated — not in any retrieved chunk",
    },
  ],
};

// ── Pipeline stage catalogue ──────────────────────────────────────────────

export const PIPELINE_STAGES = [
  {
    id: "embed",
    label: "Query Embedding",
    group: "Pre-Retrieval",
    color: "#6366f1",
    baseMs: 12,
    description: "Encode the user query into a dense vector. Typically 10–20ms for a dedicated embedding service.",
    tunable: false,
  },
  {
    id: "ann",
    label: "ANN Search (HNSW)",
    group: "Retrieval",
    color: "#8b5cf6",
    baseMs: 22,
    description: "Approximate nearest-neighbor search in the vector index. ef_search controls recall–speed trade-off.",
    tunable: true,
    tunableLabel: "ef_search",
    tunableRange: [32, 64, 128, 200],
    tunableEffect: [14, 22, 38, 58], // ms at each ef_search
  },
  {
    id: "bm25",
    label: "BM25 Sparse Retrieval",
    group: "Retrieval",
    color: "#a855f7",
    baseMs: 28,
    description: "Keyword-based BM25 search (Elasticsearch). Constant ~25–35ms. Can be disabled for pure dense retrieval.",
    tunable: false,
    optional: true,
  },
  {
    id: "rrf",
    label: "RRF Fusion",
    group: "Retrieval",
    color: "#d946ef",
    baseMs: 5,
    description: "Reciprocal Rank Fusion merges ANN and BM25 ranked lists. Pure arithmetic — always <10ms.",
    tunable: false,
  },
  {
    id: "relgrade",
    label: "Relevancy Grader",
    group: "Quality Gate",
    color: "#f59e0b",
    baseMs: 95,
    description: "LLM-as-judge scores each chunk 0–1. Fast model (Haiku/mini) batch-scored. Adds ~80–120ms.",
    tunable: false,
    optional: true,
  },
  {
    id: "rerank",
    label: "Cross-encoder Rerank",
    group: "Quality Gate",
    color: "#ec4899",
    baseMs: 140,
    description: "Cross-encoder scores query+doc jointly. Dramatically improves precision but adds 100–200ms.",
    tunable: true,
    tunableLabel: "Candidates (N)",
    tunableRange: [10, 20, 40, 60],
    tunableEffect: [80, 140, 260, 380],
    optional: true,
  },
  {
    id: "llm",
    label: "LLM Generation",
    group: "Generation",
    color: "#10b981",
    baseMs: 185,
    description: "Prompt + context → answer tokens. Latency scales with output length and model size.",
    tunable: true,
    tunableLabel: "Model",
    tunableRange: ["Haiku", "GPT-4o-mini", "GPT-4o", "Sonnet", "Opus"],
    tunableEffect: [130, 120, 185, 200, 225],
    optional: false,
  },
  {
    id: "hallucgate",
    label: "Hallucination Detector",
    group: "Quality Gate",
    color: "#ef4444",
    baseMs: 185,
    description: "NLI or LLM judge verifies each answer claim against retrieved context. Adds 150–220ms.",
    tunable: false,
    optional: true,
  },
  {
    id: "srchighlight",
    label: "Source Highlighter",
    group: "Quality Gate",
    color: "#3b82f6",
    baseMs: 55,
    description: "Maps answer sentences to source document spans. LLM attribution or embedding similarity.",
    tunable: false,
    optional: true,
  },
];
