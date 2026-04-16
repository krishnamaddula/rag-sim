export const SCENARIOS = [
  // ── Foundation ──────────────────────────────────────────────────────────────
  {
    id: "s1",
    title: "Customer Support Bot",
    description:
      "SaaS company, 5,000 support articles. Queries are short, conversational, mostly single-hop. Volume: 50K queries/day.",
    constraints: ["<300ms p99", "Low cost", "High recall"],
    recommended: ["naive-rag", "hybrid-search", "hierarchical-indexing"],
    antipatterns: ["graph-rag", "raptor", "agentic-rag"],
    rationale:
      "Short docs, single-hop, latency-sensitive → Naive RAG + Hybrid Search is sufficient. Hierarchical indexing helps with long articles. GraphRAG/RAPTOR are overkill for this volume and query type. Agentic RAG adds unpredictable latency.",
  },
  {
    id: "s2",
    title: "Legal Research Assistant",
    description:
      "50M legal documents, complex multi-paragraph questions, precise citations required, 99.9% uptime, <500ms SLA.",
    constraints: ["High precision", "Citations required", "<500ms SLA", "50M docs"],
    recommended: ["hybrid-search", "reranking", "hierarchical-indexing", "rag-fusion"],
    antipatterns: ["naive-rag", "self-rag"],
    rationale:
      "Precision matters → reranking is essential. Scale → hybrid search + sharded HNSW. Hierarchical indexing for long docs. Self-RAG needs a specially fine-tuned model — not practical off-the-shelf.",
  },
  {
    id: "s3",
    title: "Enterprise Research Analyst",
    description:
      "10,000 internal reports. Synthesis queries: 'What are the key risks across all 2023 reports?' No strict latency SLA.",
    constraints: ["Global synthesis", "No latency SLA", "Entity awareness"],
    recommended: ["graph-rag", "raptor"],
    antipatterns: ["naive-rag", "hyde"],
    rationale:
      "Global sensemaking queries → GraphRAG community summaries or RAPTOR tree. Naive RAG fails for cross-document synthesis. HyDE only helps with vocabulary mismatch, not synthesis.",
  },
  {
    id: "s4",
    title: "Multi-Source Financial Assistant",
    description:
      "Answers from vector KB (earnings reports), SQL DB (metrics), and live web (news). Multi-hop: 'Compare Apple Q3 revenue to analyst estimates.'",
    constraints: ["3 data sources", "Multi-hop", "Freshness"],
    recommended: ["agentic-rag", "multi-query", "reranking"],
    antipatterns: ["naive-rag", "raptor"],
    rationale:
      "Multi-source + multi-hop → Agentic RAG with tool use. Multi-query helps when analyst estimates need different query angles. RAPTOR doesn't address real-time data or SQL.",
  },
  {
    id: "s5",
    title: "Code Documentation Search",
    description:
      "50K functions across a monorepo. Queries: 'How does the auth middleware work?' AST-aware chunking needed for symbol resolution.",
    constraints: ["AST-aware chunking", "Symbol resolution", "<200ms latency"],
    recommended: ["hierarchical-indexing", "hybrid-search", "contextual-compression"],
    antipatterns: ["graph-rag", "self-rag"],
    rationale:
      "Code → function-level child chunks + file-level parent chunks. Hybrid search handles both semantic and symbol-name queries. Compression strips boilerplate. GraphRAG overkill for code search.",
  },
  {
    id: "s6",
    title: "Medical Literature QA",
    description:
      "PubMed corpus (35M papers). Clinicians ask: 'What treatments show efficacy for drug-resistant TB in immunocompromised patients?' Hallucination is patient-safety risk.",
    constraints: ["Zero hallucination tolerance", "High precision", "Citations mandatory"],
    recommended: ["reliable-rag", "crag", "reranking", "contextual-compression"],
    antipatterns: ["naive-rag", "hyde"],
    rationale:
      "Medical + hallucination risk → Reliable RAG quality gates (relevancy grader + hallucination detector + source highlighter). CRAG for stale-corpus fallback. HyDE can steer retrieval toward hallucinated medical content — dangerous.",
  },
  // ── Enterprise Internal ─────────────────────────────────────────────────────
  {
    id: "s7",
    title: "HR Policy & Benefits Bot",
    description:
      "Internal chatbot for 20,000 employees. Questions about PTO, health benefits, promotion criteria. Corpus: 200 policy PDFs updated quarterly.",
    constraints: ["Authoritative answers only", "No hallucination", "Multi-language"],
    recommended: ["reliable-rag", "hierarchical-indexing", "hybrid-search"],
    antipatterns: ["agentic-rag", "graph-rag", "self-rag"],
    rationale:
      "Small authoritative corpus, policy answers must be exact → Reliable RAG gates prevent wrong advice. Hierarchical indexing for long policy docs. Multi-language: embed with multilingual model (e.g., multilingual-e5-large). Agentic RAG adds unnecessary complexity and failure modes.",
  },
  {
    id: "s8",
    title: "DevOps Runbook & Incident Response",
    description:
      "On-call engineers query 500 runbooks during live incidents. P1 incidents require answers in <10s. Queries: 'How do I roll back the payments service?'",
    constraints: ["<10s response", "Always available", "Exact procedure steps"],
    recommended: ["naive-rag", "hybrid-search", "contextual-compression"],
    antipatterns: ["agentic-rag", "raptor", "graph-rag"],
    rationale:
      "Incident response → minimize latency and failure points. Naive RAG + hybrid search fast enough for 500 runbooks. Contextual compression extracts just the relevant steps. Agentic RAG and GraphRAG add latency and unreliability during incidents.",
  },
  {
    id: "s9",
    title: "Compliance & Regulatory Q&A",
    description:
      "Banking firm with 10,000 regulatory documents (FDIC, OCC, Basel III). Risk officers ask: 'What is our capital adequacy requirement under Basel III Tier 1?' Answers must be auditable.",
    constraints: ["Full traceability", "No hallucination", "Jurisdiction filtering", "Audit log"],
    recommended: ["reliable-rag", "hybrid-search", "reranking", "hierarchical-indexing"],
    antipatterns: ["naive-rag", "agentic-rag", "self-rag"],
    rationale:
      "Compliance requires end-to-end auditability → Reliable RAG source highlighting gives regulators traceable citations. Jurisdiction metadata filtering narrows search space. Agentic RAG's non-determinism is incompatible with audit requirements.",
  },
  {
    id: "s10",
    title: "Real-Time Call Center Agent Assist",
    description:
      "Voice-to-text transcription fed into RAG in real time. Agent needs relevant policy snippets within 2s while customer is speaking. 5M call transcripts as corpus.",
    constraints: ["<2s E2E latency", "Streaming output", "High volume (10K concurrent)"],
    recommended: ["naive-rag", "hybrid-search", "contextual-compression"],
    antipatterns: ["reranking", "agentic-rag", "graph-rag", "raptor"],
    rationale:
      "Real-time streaming + 2s budget eliminates cross-encoder reranking (~150ms). Hybrid search for keyword-heavy customer queries. Contextual compression fits more signal in the 2s window. GraphRAG/RAPTOR build time doesn't justify the gain for short Q&A pairs.",
  },
  // ── Knowledge-Intensive & Research ─────────────────────────────────────────
  {
    id: "s11",
    title: "Patent Search & Prior Art Discovery",
    description:
      "IP law firm queries 120M USPTO patent documents. Queries: 'Find prior art for a transformer-based image segmentation method filed before 2020.'",
    constraints: ["120M docs", "Boolean + semantic hybrid", "Date filtering", "Claim-level precision"],
    recommended: ["hybrid-search", "reranking", "rag-fusion", "multi-query"],
    antipatterns: ["naive-rag", "self-rag"],
    rationale:
      "Patent language is highly technical → hybrid search needed for claim keywords + semantic similarity. Multi-query generates query variants (technical, plain language, synonym) to improve recall. Reranking selects closest prior art from top-100 candidates. Date filtering via metadata reduces search space dramatically.",
  },
  {
    id: "s12",
    title: "Academic Research Discovery",
    description:
      "University library: 5M papers + preprints. Researchers ask broad: 'What are the current open problems in protein folding?' and narrow: 'What did Zhang et al. 2022 show about AlphaFold accuracy?'",
    constraints: ["Broad + narrow queries", "Citation graph awareness", "Cross-paper synthesis"],
    recommended: ["raptor", "graph-rag", "multi-query", "hyde"],
    antipatterns: ["naive-rag", "naive-rag"],
    rationale:
      "Broad synthesis → GraphRAG or RAPTOR. Narrow lookup → hybrid search. HyDE helps bridge natural-language questions to paper-writing style. Citation graph as edges in GraphRAG enables 'what papers cite this?' queries. Multi-query covers both plain and technical phrasings.",
  },
  {
    id: "s13",
    title: "E-Commerce Product Q&A",
    description:
      "Marketplace with 2M product listings + reviews. Queries: 'Does this laptop have a backlit keyboard?' and 'Which headphones have the best bass under $100?'",
    constraints: ["2M dynamic docs", "Real-time inventory", "Structured + unstructured data"],
    recommended: ["hybrid-search", "agentic-rag", "contextual-compression"],
    antipatterns: ["graph-rag", "raptor", "self-rag"],
    rationale:
      "Structured product specs (SQL) + unstructured reviews (vector) → Agentic RAG with both sql_query and vector_search tools. Hybrid search for spec keywords ('backlit', 'USB-C'). Contextual compression extracts relevant spec lines from long product descriptions.",
  },
  {
    id: "s14",
    title: "Security Threat Intelligence",
    description:
      "SOC analysts query CVE database + threat feeds + internal incident logs. Queries: 'Is CVE-2024-1234 exploited in the wild? What's the recommended mitigation?'",
    constraints: ["Real-time freshness", "Multi-source correlation", "Structured CVE + unstructured reports"],
    recommended: ["crag", "agentic-rag", "hybrid-search", "reliable-rag"],
    antipatterns: ["naive-rag", "raptor"],
    rationale:
      "Threat intel goes stale in hours → CRAG's web-search fallback keeps answers fresh. Agentic RAG correlates CVE DB + threat feeds + internal logs. Reliable RAG gates ensure no hallucinated mitigation steps (could cause a security incident). RAPTOR's static summaries can't handle real-time freshness.",
  },
  {
    id: "s15",
    title: "Pharmaceutical Drug Interaction Checker",
    description:
      "Pharmacists query FDA drug labels + clinical literature. 'What are the interactions between warfarin and aspirin in patients with CKD stage 3?'",
    constraints: ["Zero hallucination tolerance", "Multi-document synthesis", "Patient-safety critical"],
    recommended: ["reliable-rag", "multi-query", "reranking", "contextual-compression"],
    antipatterns: ["naive-rag", "hyde", "self-rag"],
    rationale:
      "Patient safety → Reliable RAG's hallucination gate is non-negotiable. Multi-query generates variants (warfarin+aspirin, anticoagulant+NSAID, CKD interaction) to improve recall. Contextual compression extracts exact interaction sentences from long drug labels. HyDE risks generating plausible-sounding but wrong pharmacology.",
  },
  {
    id: "s16",
    title: "Contract Analysis & Negotiation",
    description:
      "M&A legal team analyzes 500-page acquisition contracts. Queries: 'What are the indemnification caps across all vendor agreements?' and 'Identify non-standard IP assignment clauses.'",
    constraints: ["Long documents (500+ pages)", "Cross-document comparison", "Clause-level precision"],
    recommended: ["raptor", "hierarchical-indexing", "reranking", "contextual-compression"],
    antipatterns: ["naive-rag", "hyde"],
    rationale:
      "500-page contracts → RAPTOR or hierarchical indexing essential. RAPTOR's section summaries help with 'across all agreements' queries. Contextual compression extracts exact clause text. Hierarchical indexing enables clause-level retrieval with section context. HyDE can generate plausible-but-wrong legal language.",
  },
  {
    id: "s17",
    title: "Educational Tutoring Assistant",
    description:
      "K-12 platform with 100K textbook chapters + practice problems. Student asks: 'Can you explain photosynthesis using the diagram on page 42 of my biology book?'",
    constraints: ["Multimodal (text + diagrams)", "Grade-appropriate responses", "Curriculum-aligned"],
    recommended: ["hierarchical-indexing", "hyde", "contextual-compression"],
    antipatterns: ["graph-rag", "agentic-rag"],
    rationale:
      "Structured curriculum → hierarchical indexing (chapter → section → paragraph). HyDE helps bridge student's informal question to textbook's formal language. Diagram queries need multimodal indexing (image caption + embedding). GraphRAG overkill — curriculum is already hierarchically organized. Agentic RAG adds complexity without benefit.",
  },
  {
    id: "s18",
    title: "Real Estate Market Intelligence",
    description:
      "Agents query 1M property listings + local market reports + zoning regulations. 'What 3-bed homes in Austin under $500K have the best school ratings and sold in the last 60 days?'",
    constraints: ["Structured + unstructured", "Geospatial + temporal filters", "Real-time listings"],
    recommended: ["agentic-rag", "hybrid-search", "multi-query"],
    antipatterns: ["raptor", "graph-rag", "self-rag"],
    rationale:
      "Complex multi-criteria query over structured DB + unstructured market reports → Agentic RAG orchestrates SQL (filters: price, beds, date) + vector search (school ratings narrative, neighborhood reports). Multi-query covers different phrasings of neighborhood quality. RAPTOR/GraphRAG static indexes can't handle real-time listings.",
  },
  {
    id: "s19",
    title: "Customer Feedback Synthesis",
    description:
      "5M support tickets + NPS survey responses. Product team asks: 'What are the top 5 pain points driving churn in our enterprise segment this quarter?'",
    constraints: ["Global synthesis across millions", "Trend detection", "Segment filtering"],
    recommended: ["raptor", "graph-rag", "multi-query"],
    antipatterns: ["naive-rag", "reranking"],
    rationale:
      "Synthesis across millions of tickets → RAPTOR's cluster-summarize tree handles scale. GraphRAG surfaces entity clusters (product areas, customer segments). Reranking is for retrieval precision, not synthesis. Naive RAG's top-K retrieval samples too sparsely from 5M docs to answer 'top 5 pain points' reliably.",
  },
  {
    id: "s20",
    title: "Government Policy Knowledge Base",
    description:
      "State agency with 200,000 regulation documents. Citizens query: 'Am I eligible for the small business COVID relief grant if I started my business in March 2020?'",
    constraints: ["Eligibility logic (multi-condition)", "Plain language responses", "No hallucination"],
    recommended: ["reliable-rag", "hybrid-search", "reranking", "agentic-rag"],
    antipatterns: ["naive-rag", "raptor"],
    rationale:
      "Eligibility questions require satisfying multiple criteria across different regulation sections → Agentic RAG can decompose into sub-queries (start date, business type, grant criteria). Reliable RAG prevents wrong eligibility advice. Reranking ensures the exact regulation section with eligibility criteria surfaces. RAPTOR's summaries can lose specific eligibility thresholds.",
  },
];

export const SCENARIO_CATEGORIES = [
  { id: "all", label: "All Scenarios" },
  { id: "foundation", label: "Foundation" },
  { id: "enterprise", label: "Enterprise Internal" },
  { id: "research", label: "Knowledge-Intensive" },
  { id: "realtime", label: "Real-Time & High-Scale" },
];

export const SCENARIO_TAGS = {
  s1: "foundation",
  s2: "research",
  s3: "research",
  s4: "research",
  s5: "foundation",
  s6: "research",
  s7: "enterprise",
  s8: "realtime",
  s9: "enterprise",
  s10: "realtime",
  s11: "research",
  s12: "research",
  s13: "realtime",
  s14: "realtime",
  s15: "research",
  s16: "research",
  s17: "enterprise",
  s18: "realtime",
  s19: "enterprise",
  s20: "enterprise",
};
