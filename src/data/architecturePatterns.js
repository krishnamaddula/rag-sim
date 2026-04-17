// Architecture Patterns — cross-stage RAG patterns applied as overlays
// Each pattern highlights the stages it affects and explains its control flow

export const PATTERNS = [
  {
    id: "self-rag",
    name: "Self-RAG",
    icon: "🔁",
    color: "#6366f1",
    badge: "Adaptive",
    description: "LLM decides whether to retrieve, evaluates retrieved passages, then critiques its own output before answering.",
    affectedStages: ["query", "retrieval", "generation", "validation"],
    controlFlow: "Query → [Retrieve?] → Retrieval → [Passage Relevant?] → Generation → [Answer Supported?] → Output",
    addsTechniques: {
      validation: ["self-rag"],
    },
    interviewQuestions: [
      {
        q: "When would you choose Self-RAG over CRAG? What are the key trade-offs?",
        a: "Self-RAG is better when your query load is mixed — some queries don't need retrieval at all (conversational, factual recall), so the conditional retrieval saves significant latency and cost. CRAG is better when retrieval fails frequently and you need a reliable fallback (web search). Self-RAG requires training or careful prompting to generate ISREL/ISSUP/ISUSE tokens reliably, while CRAG is more plug-and-play. In production, I'd use Self-RAG when latency matters and queries are diverse; CRAG when knowledge base coverage is the primary concern.",
      },
      {
        q: "How do you evaluate whether Self-RAG's self-critique tokens are working correctly?",
        a: "Track ISREL/ISSUP/ISUSE token calibration: compare token predictions against human-labeled relevance/support annotations on a held-out set. Calibration gap > 15% signals a problem. Also monitor retrieval skip rate — if Self-RAG skips retrieval for 80%+ of queries, it's probably under-retrieving. A/B test self-critique enabled vs disabled on faithfulness metrics (RAGAS faithfulness score).",
      },
    ],
  },
  {
    id: "crag",
    name: "Corrective RAG (CRAG)",
    icon: "🔄",
    color: "#10b981",
    badge: "Corrective",
    description: "Evaluates retrieval quality. If insufficient, triggers web search. Creates a self-correcting fallback loop.",
    affectedStages: ["retrieval", "validation"],
    controlFlow: "Retrieval → [Evaluator: CORRECT/INCORRECT/AMBIGUOUS] → (if INCORRECT: Web Search) → Refine → Generation",
    addsTechniques: {
      validation: ["corrective-rag"],
    },
    interviewQuestions: [
      {
        q: "Design the retrieval evaluator in CRAG. What model do you use and how do you handle the AMBIGUOUS class?",
        a: "The evaluator can be a fine-tuned T5/DeBERTa classifier trained on (query, passage, label) triples where labels are CORRECT/INCORRECT. For AMBIGUOUS, I use knowledge refinement — decompose the passage into knowledge strips, filter irrelevant strips, then proceed. The key insight is that AMBIGUOUS is common (40-60% of cases) and the strip-level refinement is what makes CRAG practical. For production, I'd fine-tune on domain data using LLM-labeled training data (GPT-4 labels), then use a small classifier for latency.",
      },
      {
        q: "CRAG adds web search as a fallback. What are the reliability and latency implications in production?",
        a: "Web search adds 200-800ms latency and introduces content that's not in your knowledge base (potential quality risk). Mitigation: set a strict timeout (500ms), cache frequent web search results, and run web search in parallel with refined corpus retrieval. Reliability: web search results vary significantly — use source filtering (allow-list of trusted domains) and apply the same relevance evaluator to web results. Track web search trigger rate: >20% suggests your knowledge base has gaps that should be addressed at index time.",
      },
    ],
  },
  {
    id: "graph-rag",
    name: "Graph RAG",
    icon: "🕸️",
    color: "#f59e0b",
    badge: "Structural",
    description: "Builds a knowledge graph of entities and relationships. Enables multi-hop reasoning and community-level insights.",
    affectedStages: ["indexing", "retrieval", "generation"],
    controlFlow: "Documents → Entity Extraction → Graph Build → [Local: Entity Traversal | Global: Community Summaries] → Generation",
    addsTechniques: {
      indexing: ["knowledge-graph", "graphrag-ms"],
    },
    interviewQuestions: [
      {
        q: "When would you recommend Graph RAG over standard dense retrieval? What's the threshold?",
        a: "Graph RAG wins when: (1) queries require multi-hop reasoning ('Who manages the person responsible for X?'), (2) you need global insights ('What are the main themes across all Q4 reports?'), (3) domain has dense entity relationships (biomedical, legal, organizational). The cost is high — Microsoft's GraphRAG can cost $1-10 per document for index build. I'd recommend it when >20% of your query set requires multi-hop or thematic analysis. For purely factual single-hop queries, standard dense retrieval is 10x cheaper and nearly as accurate.",
      },
      {
        q: "Describe the community detection step in Microsoft GraphRAG and why it matters for 'global' queries.",
        a: "GraphRAG uses the Leiden algorithm to partition the knowledge graph into communities (groups of densely connected entities). For each community, it generates a hierarchical summary at multiple levels (C0: fine-grained, C3: abstract themes). Global queries ('What are the major risks in these contracts?') are answered by synthesizing across community summaries rather than retrieving specific chunks. This is fundamentally different from vector search — it's thematic aggregation, not similarity lookup. The community hierarchy lets you control query resolution: use C0 for detailed analysis, C2/C3 for executive summaries.",
      },
    ],
  },
  {
    id: "agentic-rag",
    name: "Agentic RAG",
    icon: "🤖",
    color: "#ec4899",
    badge: "Agentic",
    description: "Agent orchestrates multi-step retrieval, tool use, and reasoning loops for complex, non-trivial questions.",
    affectedStages: ["query", "retrieval", "generation"],
    controlFlow: "Query → Agent Plan → [Tool: Retrieve | Tool: Search | Tool: Calculate] → Observe → Reason → [Loop or Answer]",
    addsTechniques: {
      generation: ["memorag"],
    },
    interviewQuestions: [
      {
        q: "How do you prevent infinite loops in an agentic RAG system? What are the failure modes?",
        a: "Primary safeguards: (1) Max iteration limit (5-10 steps), (2) Semantic deduplication — if the agent retrieves the same chunk twice, force a different action, (3) Progress detection — if no new information retrieved in 2 consecutive steps, terminate. Failure modes: (a) tool hallucination — agent calls a tool with invented parameters; mitigate with strict tool schema validation, (b) irrelevant retrieval loops — agent keeps retrieving slightly different but unhelpful content; mitigate with retrieved-context deduplication, (c) goal drift — agent loses track of original query in long chains; mitigate with explicit goal anchoring in every system prompt.",
      },
      {
        q: "Design a routing layer for an agentic RAG system that handles both simple and complex queries efficiently.",
        a: "Two-tier routing: (1) Query complexity classifier (lightweight embedding model) routes simple factual queries to standard RAG (skip agent overhead), complex/multi-hop queries to the agent. Classifier trained on (query, complexity_label) data. (2) Within the agent, a tool-selection layer determines which tools are available for this query class. For production: simple queries (<70% confidence in classifier) get standard RAG + 1 fallback agent step; complex queries get full agent pipeline with max 7 steps. Track agent trigger rate, step count distribution, and cost per query class to tune the classifier threshold.",
      },
    ],
  },
  {
    id: "raptor-pattern",
    name: "RAPTOR",
    icon: "🌳",
    color: "#14b8a6",
    badge: "Hierarchical",
    description: "Recursively summarizes and clusters chunks into a tree. Retrieval at any abstraction level from sentence to theme.",
    affectedStages: ["indexing", "retrieval"],
    controlFlow: "Chunks → Cluster → Summarize → [Recursive: Cluster Summaries → Summarize] → Multi-level Index → Query-level Routing",
    addsTechniques: {
      indexing: ["raptor"],
    },
    interviewQuestions: [
      {
        q: "RAPTOR builds a tree via recursive summarization. How do you choose the right tree depth and cluster size?",
        a: "Tree depth 3-4 levels works for most corpora. Rule of thumb: depth = log_k(N) where N=chunk count and k=cluster size. Cluster size 3-7 chunks per cluster. Evaluate via multi-level retrieval: run test queries at each tree level, measure precision/recall. Optimal depth is where you start getting diminishing returns — typically at the level where summaries become too abstract to be useful. For a 10K chunk corpus: depth 3, cluster size 5 works well. Monitor: if level-2 summaries consistently outperform level-0 for your queries, your corpus has high redundancy and RAPTOR adds real value.",
      },
      {
        q: "How does RAPTOR differ from Hierarchical Indices? When would you pick one over the other?",
        a: "Key difference: Hierarchical Indices use document/section structure (author-defined boundaries), RAPTOR uses emergent clustering (similarity-based, structure-agnostic). Choose Hierarchical Indices when documents have clear structure (chapters, sections) and you want to respect those boundaries. Choose RAPTOR when: content is unstructured or cross-document, you need emergent theme discovery, or document structure is inconsistent. RAPTOR is more expensive (recursive summarization) but discovers latent structure Hierarchical Indices miss. Production: combine both — document hierarchy for navigation, RAPTOR for thematic retrieval.",
      },
    ],
  },
];

export const PATTERNS_BY_ID = Object.fromEntries(PATTERNS.map(p => [p.id, p]));
