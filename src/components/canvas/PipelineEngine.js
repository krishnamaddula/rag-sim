// PipelineEngine — pure logic for scoring, narrative, challenges, and comparison
// No React imports — all functions are deterministic given the same inputs

import { TECHNIQUES_BY_ID, STAGES_BY_ID } from "../../data/ragStages";
import { PATTERNS_BY_ID } from "../../data/architecturePatterns";
import { EXAMPLE_PIPELINES } from "../../data/examplePipelines";

// ─── SCORING ────────────────────────────────────────────────────────────────

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function scorePipeline(nodes, activePatternId) {
  const allTechIds = [];
  nodes.forEach(n => {
    (n.data.activeTechniques || []).forEach(id => allTechIds.push(id));
  });

  if (allTechIds.length === 0) return null;

  const scores = allTechIds
    .map(id => TECHNIQUES_BY_ID[id]?.scores)
    .filter(Boolean);

  if (scores.length === 0) return null;

  const n = scores.length;
  const base = {
    latency:     clamp(Math.round(scores.reduce((s, b) => s + b.latency,     0) / n), 1, 5),
    cost:        clamp(Math.round(scores.reduce((s, b) => s + b.cost,        0) / n), 1, 5),
    accuracy:    clamp(Math.max(...scores.map(b => b.accuracy)),                       1, 5),
    complexity:  clamp(Math.round(scores.reduce((s, b) => s + b.complexity,  0) / n * 1.2), 1, 5),
    scalability: clamp(Math.min(...scores.map(b => b.scalability)),                    1, 5),
  };

  // Pattern deltas
  const PATTERN_DELTAS = {
    "self-rag":      { latency: +1, cost: +1, accuracy: +1, complexity: +1, scalability: 0 },
    "crag":          { latency: +2, cost: +1, accuracy: +1, complexity: +1, scalability: -1 },
    "graph-rag":     { latency: +2, cost: +2, accuracy: +2, complexity: +2, scalability: -1 },
    "agentic-rag":   { latency: +2, cost: +2, accuracy: +2, complexity: +2, scalability: 0 },
    "raptor-pattern":{ latency: +1, cost: +2, accuracy: +1, complexity: +1, scalability: 0 },
  };

  const delta = activePatternId ? (PATTERN_DELTAS[activePatternId] || {}) : {};
  return {
    latency:     clamp((base.latency     + (delta.latency     || 0)), 1, 5),
    cost:        clamp((base.cost        + (delta.cost        || 0)), 1, 5),
    accuracy:    clamp((base.accuracy    + (delta.accuracy    || 0)), 1, 5),
    complexity:  clamp((base.complexity  + (delta.complexity  || 0)), 1, 5),
    scalability: clamp((base.scalability + (delta.scalability || 0)), 1, 5),
  };
}

export const SCORE_LABELS = {
  latency:     { low: "Very Fast (<100ms)", high: "Very Slow (>2s)" },
  cost:        { low: "<$0.001/query", high: ">$0.10/query" },
  accuracy:    { low: "Keyword-match quality", high: "Near-human SOTA" },
  complexity:  { low: "Trivial to maintain", high: "Needs ML/DevOps team" },
  scalability: { low: "Single-server only", high: "Multi-region, millions/day" },
};

// ─── NARRATIVE ──────────────────────────────────────────────────────────────

const TECH_SENTENCES = {
  "basic-rag-pdf":    "Text and PDF ingestion uses standard document loading — straightforward and well-supported by LangChain/LlamaIndex.",
  "rag-csv":          "CSV data is ingested with row-level granularity, preserving column semantics as metadata for downstream filtering.",
  "rag-json":         "JSON documents are flattened or selectively extracted, maintaining field-key context to aid embedding quality.",
  "doc-augmentation": "Document Augmentation pre-generates hypothetical Q&A pairs at index time, dramatically improving recall for question-style queries without any runtime overhead.",
  "multimodal":       "Multi-modal ingestion extends the corpus to images and video — captions or CLIP embeddings bridge the text-vision modality gap.",

  "optimize-chunk":   "Chunk size is empirically tuned — this signals awareness that retrieval quality is highly sensitive to chunk granularity.",
  "proposition":      "Proposition Chunking decomposes text into self-contained atomic claims. Every chunk can be understood without context — ideal for high-precision fact retrieval.",
  "semantic":         "Semantic Chunking splits on topic boundaries rather than character counts, preserving coherent units that align with how humans read.",
  "ctx-headers":      "Contextual Chunk Headers prepend document and section context to each chunk before embedding — solving the 'lost-in-the-middle' problem for corpora with many similar documents.",
  "segment-extract":  "Relevant Segment Extraction dynamically assembles multi-chunk answers at query time, eliminating the need for large overlaps.",
  "ctx-window":       "Context Window Enhancement indexes at sentence precision but returns surrounding sentences — best-of-both between precision and context completeness.",

  "hierarchical":     "Hierarchical Indices create a two-tier structure: document summaries for routing, detailed chunks for retrieval. Reduces cross-document noise at scale.",
  "raptor":           "RAPTOR builds a recursive summarization tree. The pipeline can retrieve at any abstraction level — from specific sentences to high-level themes — from a single index.",
  "hype":             "HyPE pre-computes hypothetical question embeddings at index time, achieving HyDE-level accuracy without any per-query LLM overhead.",
  "knowledge-graph":  "Knowledge Graph Integration enables multi-hop reasoning by explicitly modeling entity relationships — capturing connections that vector similarity cannot surface.",
  "graphrag-ms":      "Microsoft GraphRAG extracts entities and community structure, enabling both local entity-level retrieval and global thematic synthesis across document sets.",
  "graph-milvus":     "Graph RAG with Milvus provides unified vector + graph storage, combining semantic similarity and relationship traversal in production scale.",

  "query-transforms": "Query Transformations improve recall by rewriting queries, applying step-back prompting for broader context, and decomposing complex questions into sub-queries.",
  "hyde":             "HyDE generates a hypothetical answer and embeds it instead of the raw query — bridging the distributional gap between short queries and long documents.",
  "adaptive":         "Adaptive Retrieval classifies each query by intent and routes it to the most appropriate retrieval strategy — avoiding unnecessary overhead on simple factual queries.",

  "fusion":           "Fusion Retrieval combines BM25 sparse and dense vector search via RRF — the production-grade default that outperforms either method alone.",
  "multi-filter":     "Multi-faceted Filtering applies metadata, similarity thresholds, and diversity constraints to retrieved results — reducing noise in the context window.",
  "dartboard":        "Dartboard Retrieval jointly optimizes relevance and diversity in a single scoring pass — a more principled approach than post-hoc MMR.",
  "ctx-compression":  "Contextual Compression strips retrieved chunks of query-irrelevant sentences before generation — reducing token cost and hallucination risk.",

  "reranking":        "Intelligent Reranking applies a cross-encoder or LLM-based scorer to re-order retrieved candidates — capturing nuanced relevance that bi-encoder retrieval misses.",

  "reliable-rag":     "Reliable RAG adds a pre-generation relevance gate — filtering out off-topic context and falling back gracefully rather than hallucinating from weak evidence.",
  "memorag":          "MemoRAG adds a persistent memory layer with key-value extraction — enabling effective RAG over ultra-long contexts and multi-session continuity.",

  "corrective-rag":   "Corrective RAG (CRAG) grades retrieval quality and triggers web search when the knowledge base is insufficient — creating a self-correcting fallback loop.",
  "self-rag":         "Self-RAG gives the LLM conditional retrieval control and self-critique capability — skipping retrieval for simple queries and flagging unsupported claims.",
  "feedback-loops":   "Retrieval with Feedback Loops continuously learns from user interactions — compounding quality improvements over time through explicit and implicit signals.",

  "explainable":      "Explainable Retrieval surfaces why content was retrieved and how it contributed to the answer — essential for trust, audit, and debugging.",

  "deepeval":         "DeepEval provides a comprehensive LLM-judge evaluation suite (faithfulness, contextual precision, recall) suitable for CI/CD regression testing.",
  "grouse":           "GroUSE evaluates groundedness, usefulness, and sensibleness with a custom LLM judge — particularly strong for assessing grounding quality.",
  "e2e-eval":         "End-to-End RAG Evaluation integrates RAGAS metrics with automated test set generation for a complete quality audit before deployment.",
  "open-rag-eval":    "Open-RAG-Eval provides fully auditable evaluation via UMBRELA scoring and citation detection — ideal for open-source or research contexts.",
};

const COMBO_OBSERVATIONS = [
  {
    check: (ids) => ids.includes("hyde") && ids.includes("hype"),
    text: "⚠️ HyDE and HyPE overlap significantly — HyPE pre-computes what HyDE does at runtime. Consider using HyPE alone to eliminate the per-query LLM call."
  },
  {
    check: (ids) => ids.includes("self-rag") && ids.includes("corrective-rag"),
    text: "Self-RAG and CRAG both address retrieval failures, but at different levels: Self-RAG controls whether to retrieve; CRAG corrects after retrieval. Together they create deep redundancy — ensure they're not triggering competing correction loops."
  },
  {
    check: (ids) => ids.includes("fusion") && ids.includes("dartboard"),
    text: "Fusion Retrieval followed by Dartboard scoring is a strong combination: fusion ensures broad recall, dartboard optimizes the final selection for relevance + diversity."
  },
  {
    check: (ids) => ids.includes("raptor") && ids.includes("hierarchical"),
    text: "RAPTOR and Hierarchical Indices both build multi-level structures. Consider your document type: Hierarchical Indices respect author-defined section boundaries; RAPTOR discovers emergent clusters. Both together is powerful but expensive."
  },
  {
    check: (ids) => ids.includes("reranking") && ids.includes("ctx-compression"),
    text: "Reranking + Contextual Compression is an excellent post-retrieval stack: reranking surfaces the best candidates, compression ensures only the relevant sentences reach the generation stage."
  },
  {
    check: (ids) => ids.includes("proposition") && ids.includes("ctx-headers"),
    text: "Proposition Chunking + Contextual Headers is a premium chunking combination: propositions ensure atomic precision, headers ensure each chunk carries its document context. High accuracy, high index cost."
  },
];

export function generateNarrative(nodes, activePatternId, scores) {
  const allTechIds = new Set();
  const stageIds = new Set();
  nodes.forEach(n => {
    stageIds.add(n.data.stageId);
    (n.data.activeTechniques || []).forEach(id => allTechIds.add(id));
  });

  if (allTechIds.size === 0 && stageIds.size === 0) {
    return null;
  }

  const stageList = [...stageIds].map(id => STAGES_BY_ID[id]?.label).filter(Boolean).join(" → ");
  const techCount = allTechIds.size;

  const sections = [];

  // Opening
  sections.push({
    heading: "Architecture Overview",
    text: `This pipeline covers ${stageIds.size} stage${stageIds.size > 1 ? "s" : ""} (${stageList}) with ${techCount} technique${techCount !== 1 ? "s" : ""} applied.${activePatternId ? ` The ${PATTERNS_BY_ID[activePatternId]?.name} architecture pattern shapes the overall control flow.` : ""}`,
  });

  // Per-stage sections
  const STAGE_ORDER = ["ingestion", "chunking", "indexing", "query", "retrieval", "reranking", "generation", "validation", "explainability", "evaluation"];
  for (const stageId of STAGE_ORDER) {
    const node = nodes.find(n => n.data.stageId === stageId);
    if (!node) continue;
    const stage = STAGES_BY_ID[stageId];
    const techsInStage = (node.data.activeTechniques || []).filter(id => TECH_SENTENCES[id]);
    if (techsInStage.length === 0) continue;

    sections.push({
      heading: `${stage.icon} ${stage.label}`,
      text: techsInStage.map(id => TECH_SENTENCES[id]).join(" "),
    });
  }

  // Pattern section
  if (activePatternId) {
    const pattern = PATTERNS_BY_ID[activePatternId];
    if (pattern) {
      sections.push({
        heading: `${pattern.icon} ${pattern.name} Pattern`,
        text: `${pattern.description} Control flow: ${pattern.controlFlow}`,
      });
    }
  }

  // Combination observations
  const idsArray = [...allTechIds];
  const observations = COMBO_OBSERVATIONS
    .filter(obs => obs.check(idsArray))
    .map(obs => obs.text);

  if (observations.length > 0) {
    sections.push({
      heading: "Architectural Observations",
      text: observations.join("\n\n"),
    });
  }

  // Closing
  if (scores) {
    const warnings = [];
    if (scores.complexity >= 4) warnings.push("This is a high-complexity pipeline — plan for dedicated ML engineering support and thorough observability.");
    if (scores.latency >= 4) warnings.push("Cumulative stage latency is high — this pipeline is not suitable for interactive sub-200ms use cases without caching.");
    if (scores.cost >= 4) warnings.push("Per-query cost is elevated — budget carefully and consider caching frequent queries.");
    if (scores.scalability <= 2) warnings.push("Scalability is constrained — identify your bottleneck stage and plan capacity accordingly.");
    if (warnings.length > 0) {
      sections.push({ heading: "Production Considerations", text: warnings.join(" ") });
    }
  }

  return sections;
}

// ─── CHALLENGES ─────────────────────────────────────────────────────────────

const TECH_CHALLENGES = {
  "proposition": [
    {
      q: "You chose Proposition Chunking. Explain the trade-off between proposition-level precision and indexing cost. When would you NOT use it?",
      a: "Proposition Chunking requires an LLM call per paragraph to extract atomic claims — typically 10-50x more expensive than fixed-size chunking. At 1M chunks, this can cost $500-2000 just for indexing. Don't use it for: (1) corpora with narrative content where propositions lose flow (fiction, conversation), (2) cost-sensitive real-time indexing pipelines, (3) simple lookup use cases where fixed-size chunking is sufficient. Use it when: correctness at the claim level matters (medical, legal), or when building knowledge bases that feed evaluation pipelines."
    },
    {
      q: "How would you evaluate whether Proposition Chunking actually improves your specific use case vs. sentence-level chunking?",
      a: "Run an A/B retrieval evaluation: build two indices — one with proposition chunks, one with sentence-level chunks — on the same corpus. Evaluate using 100+ labeled (query, relevant_passage) pairs. Metrics: MRR@5 (ranking quality), Recall@10 (coverage), chunk precision (% retrieved chunks actually relevant). If MRR improvement is <5%, proposition chunking is not worth the cost. Also measure false negative rate — propositions can split compound claims, losing the full claim context."
    }
  ],
  "hyde": [
    {
      q: "HyDE is in your query processing stage. Describe the distributional mismatch problem it solves and a scenario where it would hurt retrieval.",
      a: "Distributional mismatch: user queries are typically short (5-15 words), abstract, and in question form. Corpus documents are long (200-2000 words), declarative, and domain-specific. Embedding space has a gap between these distributions — short abstract questions cluster away from long technical documents. HyDE bridges this by generating a hypothetical answer (same distribution as corpus), then embedding that. Where it hurts: (1) when the hypothesis LLM hallucinates domain-specific terms not in the real corpus, leading retrieval astray, (2) low-quality base models generating poor hypotheses, (3) very specific factual queries where the LLM guesses wrong facts."
    }
  ],
  "fusion": [
    {
      q: "You're using Fusion Retrieval (BM25 + Dense + RRF). When would pure dense retrieval outperform fusion, and vice versa?",
      a: "Pure dense wins when: queries and documents share vocabulary (no vocabulary mismatch), domain is narrow and well-represented in training data of the embedding model, or when latency matters and BM25 overhead is prohibitive. Fusion wins when: (1) entity names, product IDs, or technical terms must be matched exactly (BM25 handles these better), (2) query vocabulary differs from document vocabulary (cross-lingual, informal vs formal), (3) you have no domain-specific embedding model fine-tuning. The RRF weighting (α=0.5 default) can be tuned — run experiments on your validation set to find the optimal α."
    }
  ],
  "reranking": [
    {
      q: "Cross-encoder reranking adds 100-500ms. Describe a production strategy to get the quality benefits while controlling latency.",
      a: "Three strategies: (1) Two-stage: retrieve 50 candidates with fast bi-encoder, rerank top 50 with cross-encoder — only runs reranker on pre-filtered set. (2) Async reranking: return preliminary results immediately, run reranker async, update UI if reranking changes top-3 (works for non-time-critical UIs). (3) Cache reranking results: for repeated or semantically similar queries, cache reranked results with TTL. Also: distill a smaller cross-encoder (MiniLM 6 layers vs 12) — 60% latency reduction with ~5% quality loss. Track p99 reranking latency separately from retrieval latency to isolate bottlenecks."
    }
  ],
  "graphrag-ms": [
    {
      q: "GraphRAG builds community summaries via Leiden algorithm. Explain how you'd handle knowledge graph updates when new documents arrive.",
      a: "This is one of GraphRAG's main production challenges. Options: (1) Incremental entity extraction — extract entities from new documents, merge into existing graph. However, community structure changes require re-running Leiden on the updated graph. (2) Versioned snapshots — keep previous graph, build new graph weekly/monthly, route queries to both and merge results. (3) Hybrid: maintain a 'hot' standard RAG index for new documents + 'cold' GraphRAG index for the stable corpus. Route recent-document queries to hot index, thematic/synthesis queries to cold. Full graph rebuild on a schedule (weekly) is practical for corpora that don't change faster than that."
    }
  ],
  "self-rag": [
    {
      q: "In Self-RAG, the ISREL/ISSUP/ISUSE tokens control retrieval and output quality. How do you validate these tokens are well-calibrated in production?",
      a: "Calibration testing: sample 500 (query, context, answer) triples, have humans label actual relevance/support/usefulness, compare against Self-RAG token predictions. Calibration gap = |P(ISREL=1) - fraction_human_labeled_relevant|. Gap >15% needs correction. In production: track ISREL token distribution (if >80% ISREL=1, the model is too permissive), ISSUP distribution (if <40% ISSUP=1 on grounded answers, the model is too strict). Log token values alongside answers. A/B test: compare faithfulness scores (DeepEval) between queries where ISREL was triggered vs not — gap validates the token is doing something useful."
    }
  ],
  "corrective-rag": [
    {
      q: "CRAG triggers web search when retrieval quality is 'INCORRECT'. Design the retrieval evaluator. What model do you use and how do you prevent false negatives?",
      a: "The evaluator is a fine-tuned classifier (DeBERTa-small or T5-base works well) trained on (query, passage, label) triples where labels are CORRECT/INCORRECT. For training data: generate pairs with GPT-4 labeling 5K (query, passage) pairs — takes ~4 hours, costs ~$30. Preventing false negatives (marking relevant passages as INCORRECT): (1) set threshold conservatively — trigger web search only at high confidence INCORRECT, (2) use AMBIGUOUS class for borderline cases (don't skip, do refinement), (3) evaluate calibration with held-out set. False negatives cost: missed relevant context → degraded answer. False positives cost: unnecessary web search → latency + cost. Usually prefer lower precision (more web searches) over lower recall."
    }
  ],
  "raptor": [
    {
      q: "RAPTOR's recursive summarization creates a hierarchical index. How do you decide which level of the tree to retrieve from at query time?",
      a: "Query classification determines retrieval level: (1) Specific factual queries → leaf level (chunks). (2) Summary/overview queries → level 1-2 summaries. (3) Thematic/synthesis queries → highest level summaries. Implementation: classify query intent (lightweight classifier or few-shot LLM), then retrieve from the appropriate level + one level below (covers uncertainty). Alternatively: retrieve from all levels simultaneously (multi-level retrieval), then rerank across levels — more expensive but more robust. Evaluate by asking: 'If I only retrieved from level X, what % of queries are well-answered?' Build a retrieval level → RAGAS score matrix to find the optimal level per query type."
    }
  ],
  "deepeval": [
    {
      q: "You're using DeepEval with an LLM judge. What are the failure modes of LLM-as-judge evaluation and how do you detect them?",
      a: "Main failure modes: (1) Positional bias — LLM judges prefer first-presented answers. Mitigation: randomize ordering, run each comparison twice with reversed order. (2) Verbosity bias — longer answers rated higher regardless of quality. Mitigation: normalize by length, check correlation between answer length and score. (3) Self-consistency — same (query, answer) pair gets different scores across runs. Mitigation: run each eval 3x, flag high-variance cases. (4) Hallucination about evaluation — judge makes up facts not in context. Mitigation: use chain-of-thought evaluation prompts that require explicit evidence citation. Track judge-human agreement on 200-question calibration set. Agreement <80% means the judge needs a better model or revised prompt."
    }
  ],
};

const STAGE_CHALLENGES = {
  ingestion: {
    q: "Your pipeline starts with document ingestion. How would you handle schema drift — when the format of incoming documents changes unexpectedly?",
    a: "Schema drift is a common production failure. Defense in depth: (1) Document validation layer before ingestion — validate format, required fields, character encoding. Alert on validation failures instead of silently ingesting garbage. (2) Version-aware parsers — tag each document with its parser version, so you can reindex when parsers improve. (3) Canary ingestion — process 1% of new documents with a new parser before rolling out to 100%. (4) Monitor downstream quality: sudden drop in retrieval precision after a new batch often signals ingestion issues. Track: ingestion error rate, document field coverage %, average chunk count per document."
  },
  evaluation: {
    q: "Your pipeline includes an evaluation stage. How do you handle evaluation set drift over time as your knowledge base evolves?",
    a: "Evaluation set drift: your test queries become stale as documents change. Strategy: (1) Evergreen subset — keep 30-40% of test queries that are time-independent (definitional questions, stable concepts). (2) Rolling window — replace 20% of test queries quarterly with newly generated ones from current document corpus. Use LLM to generate (question, answer, source_chunk) triples from new documents, then human-validate 20% spot-check. (3) Synthetic evaluation tracks absolute quality; user feedback tracks perceived quality. Both should trend together — divergence signals evaluation set staleness. Tool: RAGAs test-set-generation module automates synthetic Q&A creation."
  },
};

export function generateChallenges(nodes, activePatternId) {
  const allTechIds = new Set();
  nodes.forEach(n => {
    (n.data.activeTechniques || []).forEach(id => allTechIds.add(id));
  });

  const challenges = [];

  // Technique-specific challenges
  const priorityOrder = [
    "self-rag", "corrective-rag", "graphrag-ms", "raptor", "hyde", "reranking",
    "proposition", "fusion", "deepeval", "hype", "adaptive", "memorag",
  ];

  for (const techId of priorityOrder) {
    if (allTechIds.has(techId) && TECH_CHALLENGES[techId]) {
      challenges.push(...TECH_CHALLENGES[techId]);
      if (challenges.length >= 4) break;
    }
  }

  // Pattern-specific challenge
  if (activePatternId && challenges.length < 3) {
    const pattern = PATTERNS_BY_ID[activePatternId];
    if (pattern?.interviewQuestions) {
      challenges.push(...pattern.interviewQuestions);
    }
  }

  // Stage-level fallbacks
  if (challenges.length < 2) {
    nodes.forEach(n => {
      if (STAGE_CHALLENGES[n.data.stageId]) {
        challenges.push(STAGE_CHALLENGES[n.data.stageId]);
      }
    });
  }

  // Generic fallback
  if (challenges.length === 0) {
    challenges.push({
      q: "You've built a RAG pipeline. Walk me through how you would debug a drop in retrieval quality after a new batch of documents was ingested.",
      a: "Systematic debugging: (1) Isolate: compare retrieval metrics on old test queries (pre-ingestion baseline) vs current. If metrics dropped only for queries related to new content → ingestion issue. (2) Check ingestion: verify chunk count/sizes are normal, embedding dimensions are correct, no parser errors. (3) Check index: confirm new embeddings were indexed correctly (spot-check 10 chunks — retrieve by ID, verify content matches source). (4) Check query processing: run same queries with and without new documents in the index — if excluding new docs restores quality, the new docs are the problem. (5) Root causes: document format changed, encoding issues, chunk sizes wildly different, embedding model version mismatch."
    });
  }

  // Return first 3 unique
  const seen = new Set();
  return challenges.filter(c => {
    if (seen.has(c.q)) return false;
    seen.add(c.q);
    return true;
  }).slice(0, 3);
}

// ─── COMPARISON ─────────────────────────────────────────────────────────────

export function comparePipeline(nodes, activePatternId) {
  // Collect all technique ids and stage ids in current pipeline
  const currentTechs = new Set();
  const currentStages = new Set();
  nodes.forEach(n => {
    currentStages.add(n.data.stageId);
    (n.data.activeTechniques || []).forEach(id => currentTechs.add(id));
  });

  return EXAMPLE_PIPELINES.map(template => {
    const templateTechs = new Set();
    const templateStages = new Set();
    template.nodes.forEach(n => {
      templateStages.add(n.data.stageId);
      (n.data.activeTechniques || []).forEach(id => templateTechs.add(id));
    });

    // Jaccard similarity on techniques + stages combined
    const allIds = new Set([...currentTechs, ...currentStages, ...templateTechs, ...templateStages]);
    const intersection = [...allIds].filter(id =>
      (currentTechs.has(id) || currentStages.has(id)) &&
      (templateTechs.has(id) || templateStages.has(id))
    ).length;
    const similarity = allIds.size > 0 ? Math.round((intersection / allIds.size) * 100) : 0;

    // What's present and what's missing
    const present = [...templateTechs].filter(id => currentTechs.has(id));
    const missingTechs = [...templateTechs].filter(id => !currentTechs.has(id));
    const missingStages = [...templateStages].filter(id => !currentStages.has(id));

    const missingTechNames = missingTechs
      .map(id => TECHNIQUES_BY_ID[id]?.name)
      .filter(Boolean)
      .slice(0, 4);

    const missingStagNames = missingStages
      .map(id => STAGES_BY_ID[id]?.label)
      .filter(Boolean)
      .slice(0, 3);

    const patternMatch = template.appliedPattern === activePatternId;

    return {
      templateId: template.id,
      name: template.name,
      badge: template.badge,
      badgeColor: template.badgeColor,
      similarity,
      presentCount: present.length,
      totalTechs: templateTechs.size,
      missingTechNames,
      missingStagNames,
      patternMatch,
    };
  }).sort((a, b) => b.similarity - a.similarity);
}
