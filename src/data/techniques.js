export const RAG_TECHNIQUES = [
  {
    id: "naive-rag",
    name: "Naive RAG",
    category: "Foundation",
    difficulty: "beginner",
    icon: "🔧",
    tagline: "Index → Retrieve → Generate",
    overview:
      "The baseline RAG pattern: chunk documents, embed them, store in a vector DB, retrieve top-K by cosine similarity, stuff into context, generate.",
    whenToUse: [
      "Quick proof-of-concept with clean, short documents",
      "Domain where context window fits retrieved chunks comfortably",
      "When latency budget is tight and accuracy needs are moderate",
    ],
    weaknesses: [
      "Poor multi-hop reasoning — single retrieval step misses chained facts",
      "Sensitive to chunk size and overlap tuning",
      "No query understanding — verbatim embedding may miss intent",
      "Hallucination when retrieved docs are tangentially related",
    ],
    components: [
      { id: "loader", label: "Document Loader", color: "#6366f1" },
      { id: "chunker", label: "Chunker", color: "#8b5cf6" },
      { id: "embedder", label: "Embedder", color: "#a855f7" },
      { id: "vectordb", label: "Vector DB", color: "#d946ef" },
      { id: "retriever", label: "Top-K Retriever", color: "#ec4899" },
      { id: "llm", label: "LLM Generator", color: "#f43f5e" },
    ],
    flow: [
      ["loader", "chunker"],
      ["chunker", "embedder"],
      ["embedder", "vectordb"],
      ["vectordb", "retriever"],
      ["retriever", "llm"],
    ],
    metrics: {
      latency: 2,
      accuracy: 2,
      complexity: 1,
      cost: 1,
      scalability: 3,
    },
    codeSnippet: `# Naive RAG — core loop
from langchain.vectorstores import Chroma
from langchain.embeddings import OpenAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(chunk_size=512, chunk_overlap=64)
chunks   = splitter.split_documents(docs)

vectordb = Chroma.from_documents(chunks, OpenAIEmbeddings())
retriever = vectordb.as_retriever(search_kwargs={"k": 4})

def answer(query: str) -> str:
    ctx = retriever.get_relevant_documents(query)
    prompt = build_prompt(query, ctx)
    return llm.invoke(prompt)`,
    tradeoffs: {
      pros: ["Simple to implement", "Low latency", "Easy to debug"],
      cons: [
        "Low recall on complex queries",
        "Chunk boundary artifacts",
        "No iterative refinement",
      ],
    },
  },
  {
    id: "hyde",
    name: "HyDE",
    category: "Query Transformation",
    difficulty: "intermediate",
    icon: "🪄",
    tagline: "Generate hypothetical answer → embed → retrieve",
    overview:
      "Hypothetical Document Embeddings: ask the LLM to generate a *hypothetical* answer, embed that answer, then retrieve real documents using the hypothetical embedding. Bridges vocabulary mismatch between question and answer space.",
    whenToUse: [
      "Questions phrased very differently from how documents are written",
      "Short keyword-style queries missing context",
      "Domain-specific jargon heavy corpora",
    ],
    weaknesses: [
      "LLM call before retrieval adds latency",
      "Hallucinated hypothetical can steer retrieval wrong",
      "Poor when LLM has no domain knowledge to generate the hypothetical",
    ],
    components: [
      { id: "query", label: "User Query", color: "#06b6d4" },
      { id: "hypo-gen", label: "Hypothetical Doc Generator (LLM)", color: "#0891b2" },
      { id: "embedder", label: "Embedder", color: "#0e7490" },
      { id: "vectordb", label: "Vector DB", color: "#155e75" },
      { id: "retriever", label: "Retriever", color: "#164e63" },
      { id: "llm", label: "LLM Generator", color: "#f43f5e" },
    ],
    flow: [
      ["query", "hypo-gen"],
      ["hypo-gen", "embedder"],
      ["embedder", "vectordb"],
      ["vectordb", "retriever"],
      ["retriever", "llm"],
    ],
    metrics: {
      latency: 2,
      accuracy: 4,
      complexity: 2,
      cost: 2,
      scalability: 3,
    },
    codeSnippet: `# HyDE implementation
HYPO_PROMPT = """Write a paragraph that would answer: {query}
Answer as if writing documentation."""

def hyde_retrieve(query: str, k: int = 4):
    hypothetical = llm.invoke(HYPO_PROMPT.format(query=query))
    hypo_embedding = embedder.embed_query(hypothetical)
    return vectordb.similarity_search_by_vector(hypo_embedding, k=k)`,
    tradeoffs: {
      pros: [
        "Better recall for mismatch queries",
        "Works with existing vector indexes",
      ],
      cons: [
        "Extra LLM call cost",
        "Can amplify hallucination risk at retrieval stage",
      ],
    },
  },
  {
    id: "multi-query",
    name: "Multi-Query Retrieval",
    category: "Query Transformation",
    difficulty: "intermediate",
    icon: "🔀",
    tagline: "One query → N variants → union of results",
    overview:
      "Generate multiple restatements of the user query from different angles, retrieve for each, then deduplicate and merge. Reduces sensitivity to exact wording.",
    whenToUse: [
      "Ambiguous or broad queries",
      "When single retrieval returns low recall",
      "Multi-faceted questions touching several sub-topics",
    ],
    weaknesses: [
      "N× retrieval cost",
      "Deduplication logic needed",
      "More tokens stuffed into context window",
    ],
    components: [
      { id: "query", label: "User Query", color: "#f59e0b" },
      { id: "query-gen", label: "Query Generator (LLM)", color: "#d97706" },
      { id: "retriever1", label: "Retriever Q1", color: "#b45309" },
      { id: "retriever2", label: "Retriever Q2", color: "#92400e" },
      { id: "retriever3", label: "Retriever Q3", color: "#78350f" },
      { id: "dedup", label: "Dedup + Merge", color: "#451a03" },
      { id: "llm", label: "LLM Generator", color: "#f43f5e" },
    ],
    flow: [
      ["query", "query-gen"],
      ["query-gen", "retriever1"],
      ["query-gen", "retriever2"],
      ["query-gen", "retriever3"],
      ["retriever1", "dedup"],
      ["retriever2", "dedup"],
      ["retriever3", "dedup"],
      ["dedup", "llm"],
    ],
    metrics: {
      latency: 2,
      accuracy: 4,
      complexity: 2,
      cost: 3,
      scalability: 3,
    },
    codeSnippet: `# Multi-Query RAG
MULTI_QUERY_PROMPT = """Generate {n} different phrasings of: {query}
Return one per line."""

def multi_query_retrieve(query: str, n: int = 3) -> list:
    variants = llm.invoke(MULTI_QUERY_PROMPT.format(query=query, n=n))
    queries  = [query] + variants.strip().split("\\n")

    seen, results = set(), []
    for q in queries:
        for doc in retriever.get_relevant_documents(q):
            if doc.page_content not in seen:
                seen.add(doc.page_content)
                results.append(doc)
    return results`,
    tradeoffs: {
      pros: ["Higher recall", "Robust to phrasing"],
      cons: ["N× retrieval latency", "Larger context to manage"],
    },
  },
  {
    id: "rag-fusion",
    name: "RAG Fusion",
    category: "Query Transformation",
    difficulty: "intermediate",
    icon: "⚡",
    tagline: "Multi-query + Reciprocal Rank Fusion",
    overview:
      "Extends Multi-Query by using Reciprocal Rank Fusion (RRF) to merge ranked lists from multiple retrievals. Documents consistently ranked across queries score highest — robust to outlier retrievals.",
    whenToUse: [
      "When you have diverse query angles and need reliable ranking",
      "Ensemble of multiple retrieval systems (dense + sparse)",
      "High-stakes retrieval where single-system failures are costly",
    ],
    weaknesses: [
      "More compute than multi-query alone",
      "RRF constant k needs tuning",
      "Still limited by the quality of generated sub-queries",
    ],
    components: [
      { id: "query", label: "User Query", color: "#10b981" },
      { id: "query-gen", label: "Sub-query Generator", color: "#059669" },
      { id: "retriever-a", label: "Dense Retriever", color: "#047857" },
      { id: "retriever-b", label: "Sparse Retriever", color: "#065f46" },
      { id: "rrf", label: "RRF Fusion", color: "#064e3b" },
      { id: "reranker", label: "Re-ranker", color: "#022c22" },
      { id: "llm", label: "LLM Generator", color: "#f43f5e" },
    ],
    flow: [
      ["query", "query-gen"],
      ["query-gen", "retriever-a"],
      ["query-gen", "retriever-b"],
      ["retriever-a", "rrf"],
      ["retriever-b", "rrf"],
      ["rrf", "reranker"],
      ["reranker", "llm"],
    ],
    metrics: {
      latency: 2,
      accuracy: 5,
      complexity: 3,
      cost: 3,
      scalability: 3,
    },
    codeSnippet: `# Reciprocal Rank Fusion
def rrf(ranked_lists: list[list], k: int = 60) -> list:
    scores = {}
    for ranked in ranked_lists:
        for rank, doc in enumerate(ranked):
            key = doc.page_content
            scores[key] = scores.get(key, 0) + 1 / (k + rank + 1)

    # Sort by fused score descending
    return sorted(scores.items(), key=lambda x: x[1], reverse=True)`,
    tradeoffs: {
      pros: ["More stable ranking", "Combines heterogeneous retrievers"],
      cons: ["Higher latency", "Complexity in dedup / key selection"],
    },
  },
  {
    id: "hybrid-search",
    name: "Hybrid Search",
    category: "Retrieval",
    difficulty: "intermediate",
    icon: "🔍",
    tagline: "Dense (semantic) + Sparse (BM25) fusion",
    overview:
      "Combines dense vector search (semantic similarity) with sparse BM25 (keyword exact match) to get both semantic relevance and keyword precision. RRF or weighted sum merges the ranked lists.",
    whenToUse: [
      "Corpora with technical jargon, product names, or code",
      "When pure semantic search misses exact keyword matches",
      "Most production RAG deployments as a default",
    ],
    weaknesses: [
      "Two indexes to maintain (vector + inverted)",
      "Fusion weight α is another hyperparameter",
      "BM25 index rebuild cost on updates",
    ],
    components: [
      { id: "query", label: "User Query", color: "#8b5cf6" },
      { id: "dense", label: "Dense Retriever (ANN)", color: "#7c3aed" },
      { id: "sparse", label: "Sparse Retriever (BM25)", color: "#6d28d9" },
      { id: "fusion", label: "Score Fusion (RRF/α-blend)", color: "#5b21b6" },
      { id: "llm", label: "LLM Generator", color: "#f43f5e" },
    ],
    flow: [
      ["query", "dense"],
      ["query", "sparse"],
      ["dense", "fusion"],
      ["sparse", "fusion"],
      ["fusion", "llm"],
    ],
    metrics: {
      latency: 2,
      accuracy: 4,
      complexity: 2,
      cost: 2,
      scalability: 4,
    },
    codeSnippet: `# Hybrid search with BM25 + dense
from rank_bm25 import BM25Okapi

# Dense path
dense_results = vectordb.similarity_search(query, k=20)

# Sparse path
tokenized_corpus = [d.page_content.split() for d in corpus]
bm25 = BM25Okapi(tokenized_corpus)
sparse_scores = bm25.get_scores(query.split())
sparse_results = sorted(zip(corpus, sparse_scores), key=lambda x: -x[1])[:20]

# Fuse with RRF
final = rrf([dense_results, [d for d, _ in sparse_results]])`,
    tradeoffs: {
      pros: [
        "Best of both worlds",
        "Handles acronyms and exact terms well",
        "Production standard",
      ],
      cons: ["Two indexes", "Weight tuning needed", "More infra"],
    },
  },
  {
    id: "reranking",
    name: "Re-ranking",
    category: "Retrieval",
    difficulty: "intermediate",
    icon: "📊",
    tagline: "Retrieve many → rerank with cross-encoder → keep top-N",
    overview:
      "Two-stage retrieval: fast bi-encoder retrieves a large candidate set (top-50+), then a slow but accurate cross-encoder re-scores all candidates jointly with the query. Cross-encoders see both query+doc together — far more accurate than dot-product similarity.",
    whenToUse: [
      "When retrieval recall is fine but ranking quality is poor",
      "High-precision use cases (legal, medical)",
      "After hybrid search to get a clean top-K",
    ],
    weaknesses: [
      "Cross-encoder is O(N×D) — quadratic at large N",
      "Adds 100–400ms latency for typical batch sizes",
      "Requires a separate reranker model or API call",
    ],
    components: [
      { id: "query", label: "User Query", color: "#ec4899" },
      { id: "retriever", label: "Fast Retriever (top-50)", color: "#db2777" },
      { id: "cross-encoder", label: "Cross-encoder Reranker", color: "#be185d" },
      { id: "selector", label: "Top-N Selector", color: "#9d174d" },
      { id: "llm", label: "LLM Generator", color: "#f43f5e" },
    ],
    flow: [
      ["query", "retriever"],
      ["retriever", "cross-encoder"],
      ["cross-encoder", "selector"],
      ["selector", "llm"],
    ],
    metrics: {
      latency: 2,
      accuracy: 5,
      complexity: 2,
      cost: 3,
      scalability: 3,
    },
    codeSnippet: `# Two-stage retrieval with Cohere Rerank
import cohere

co = cohere.Client("API_KEY")

# Stage 1: broad retrieval
candidates = retriever.get_relevant_documents(query, k=40)

# Stage 2: rerank with cross-encoder
results = co.rerank(
    model="rerank-english-v3.0",
    query=query,
    documents=[d.page_content for d in candidates],
    top_n=5,
)
reranked = [candidates[r.index] for r in results.results]`,
    tradeoffs: {
      pros: ["Significant precision improvement", "Works on any retriever output"],
      cons: ["Latency hit", "API cost for cloud rerankers"],
    },
  },
  {
    id: "contextual-compression",
    name: "Contextual Compression",
    category: "Retrieval",
    difficulty: "intermediate",
    icon: "🗜️",
    tagline: "Retrieve → compress each chunk to relevant fragment",
    overview:
      "After retrieval, pass each document through an LLM or extractive model to extract only the sentence(s) relevant to the query. Strips noise before generation — reduces hallucination from irrelevant text in the context window.",
    whenToUse: [
      "Large chunks with mixed topics",
      "Context window is the bottleneck",
      "When retrieved docs are broadly related but contain noise",
    ],
    weaknesses: [
      "LLM extraction call per chunk adds latency and cost",
      "Extractor may drop relevant context if poorly prompted",
      "Added complexity in the pipeline",
    ],
    components: [
      { id: "query", label: "User Query", color: "#14b8a6" },
      { id: "retriever", label: "Base Retriever", color: "#0d9488" },
      { id: "compressor", label: "LLM Compressor", color: "#0f766e" },
      { id: "filter", label: "Relevance Filter", color: "#115e59" },
      { id: "llm", label: "LLM Generator", color: "#f43f5e" },
    ],
    flow: [
      ["query", "retriever"],
      ["retriever", "compressor"],
      ["compressor", "filter"],
      ["filter", "llm"],
    ],
    metrics: {
      latency: 2,
      accuracy: 4,
      complexity: 3,
      cost: 3,
      scalability: 3,
    },
    codeSnippet: `# Contextual compression
from langchain.retrievers.document_compressors import LLMChainExtractor
from langchain.retrievers import ContextualCompressionRetriever

compressor = LLMChainExtractor.from_llm(llm)
compression_retriever = ContextualCompressionRetriever(
    base_compressor=compressor,
    base_retriever=retriever
)

compressed_docs = compression_retriever.get_relevant_documents(query)`,
    tradeoffs: {
      pros: ["Cleaner context", "Better precision", "Reduces context stuffing"],
      cons: ["N LLM calls for N chunks", "Risk of over-compression"],
    },
  },
  {
    id: "self-rag",
    name: "Self-RAG",
    category: "Agentic RAG",
    difficulty: "advanced",
    icon: "🔄",
    tagline: "Generate, critique, retrieve-if-needed, regenerate",
    overview:
      "The model itself decides whether to retrieve, evaluates the relevance of retrieved passages (ISREL), and assesses if its own output is grounded (ISSUP) and useful (ISUSE). Special reflection tokens guide adaptive retrieval — no retrieval for factual, yes for uncertain queries.",
    whenToUse: [
      "Mixed corpus where retrieval is not always needed",
      "When hallucination detection at generation time is critical",
      "Fine-tuned model environments (Self-RAG is a trained model variant)",
    ],
    weaknesses: [
      "Requires specially fine-tuned model with reflection tokens",
      "Complex inference loop",
      "Harder to evaluate than standard RAG",
    ],
    components: [
      { id: "query", label: "User Query", color: "#f97316" },
      { id: "generator", label: "LLM Generator", color: "#ea580c" },
      { id: "retrieve-decision", label: "Retrieve? (ISREL)", color: "#c2410c" },
      { id: "retriever", label: "Retriever", color: "#9a3412" },
      { id: "critique", label: "Critique (ISSUP/ISUSE)", color: "#7c2d12" },
      { id: "output", label: "Final Output", color: "#431407" },
    ],
    flow: [
      ["query", "generator"],
      ["generator", "retrieve-decision"],
      ["retrieve-decision", "retriever"],
      ["retriever", "generator"],
      ["generator", "critique"],
      ["critique", "output"],
    ],
    metrics: {
      latency: 1,
      accuracy: 5,
      complexity: 5,
      cost: 3,
      scalability: 2,
    },
    codeSnippet: `# Self-RAG conceptual loop
def self_rag(query: str) -> str:
    # Step 1: Generate without retrieval
    draft, needs_retrieval = generate_with_reflection(query)

    if not needs_retrieval:
        return draft  # Model is confident

    # Step 2: Retrieve
    docs = retriever.get_relevant_documents(query)

    # Step 3: Generate with context + evaluate
    for doc in docs:
        candidate = generate_with_context(query, doc)
        is_supported = critique_isrel(candidate, doc)
        is_useful    = critique_isuse(candidate, query)
        if is_supported and is_useful:
            return candidate

    return draft  # Fallback`,
    tradeoffs: {
      pros: ["Adaptive retrieval", "Self-grounding", "Reduces unnecessary retrieval"],
      cons: ["Needs specialized model", "Complex training", "Slow inference"],
    },
  },
  {
    id: "crag",
    name: "Corrective RAG (CRAG)",
    category: "Agentic RAG",
    difficulty: "advanced",
    icon: "🩺",
    tagline: "Retrieve → evaluate quality → correct or search web",
    overview:
      "Adds a retrieval evaluator that scores document relevance as CORRECT / AMBIGUOUS / INCORRECT. If documents are low quality, CRAG triggers a web search (or secondary retrieval) to supplement. A knowledge refiner strips noise from results before generation.",
    whenToUse: [
      "Dynamic domains where corpus may be stale",
      "When retrieval quality is unpredictable",
      "Hybrid local + web knowledge scenarios",
    ],
    weaknesses: [
      "Web search adds latency and non-determinism",
      "Evaluator accuracy bottlenecks the whole pipeline",
      "More failure modes to handle",
    ],
    components: [
      { id: "query", label: "User Query", color: "#ef4444" },
      { id: "retriever", label: "Retriever", color: "#dc2626" },
      { id: "evaluator", label: "Relevance Evaluator", color: "#b91c1c" },
      { id: "refiner", label: "Knowledge Refiner", color: "#991b1b" },
      { id: "web-search", label: "Web Search (fallback)", color: "#7f1d1d" },
      { id: "llm", label: "LLM Generator", color: "#f43f5e" },
    ],
    flow: [
      ["query", "retriever"],
      ["retriever", "evaluator"],
      ["evaluator", "refiner"],
      ["evaluator", "web-search"],
      ["web-search", "refiner"],
      ["refiner", "llm"],
    ],
    metrics: {
      latency: 1,
      accuracy: 5,
      complexity: 4,
      cost: 4,
      scalability: 3,
    },
    codeSnippet: `# CRAG pipeline
def crag(query: str) -> str:
    docs = retriever.get_relevant_documents(query)
    score = evaluator.score(query, docs)  # CORRECT/AMBIGUOUS/INCORRECT

    if score == "CORRECT":
        knowledge = refine(docs)
    elif score == "AMBIGUOUS":
        web_docs = web_search(query)
        knowledge = refine(docs + web_docs)
    else:  # INCORRECT
        knowledge = refine(web_search(query))

    return llm.invoke(build_prompt(query, knowledge))`,
    tradeoffs: {
      pros: ["Handles stale corpus", "Self-correcting", "High accuracy ceiling"],
      cons: ["Complex orchestration", "Web search cost", "Non-deterministic"],
    },
  },
  {
    id: "raptor",
    name: "RAPTOR",
    category: "Indexing",
    difficulty: "advanced",
    icon: "🦖",
    tagline: "Hierarchical summarization tree for multi-level retrieval",
    overview:
      "Recursive Abstractive Processing for Tree-Organized Retrieval: cluster leaf chunks, summarize each cluster into parent nodes, repeat. Build a tree from raw chunks to document-level summaries. At query time, retrieve at any level of abstraction.",
    whenToUse: [
      "Long documents requiring high-level synthesis AND detail",
      "Questions that span multiple sections of a corpus",
      "Research papers, books, technical documentation",
    ],
    weaknesses: [
      "Expensive offline build (many LLM calls)",
      "Summary quality limits retrieval ceiling",
      "Tree depth is another hyperparameter",
    ],
    components: [
      { id: "chunks", label: "Leaf Chunks", color: "#22c55e" },
      { id: "cluster", label: "Gaussian Mixture Clustering", color: "#16a34a" },
      { id: "summarizer", label: "LLM Summarizer", color: "#15803d" },
      { id: "tree", label: "Summary Tree", color: "#166534" },
      { id: "retriever", label: "Tree Traversal Retriever", color: "#14532d" },
      { id: "llm", label: "LLM Generator", color: "#f43f5e" },
    ],
    flow: [
      ["chunks", "cluster"],
      ["cluster", "summarizer"],
      ["summarizer", "tree"],
      ["tree", "retriever"],
      ["retriever", "llm"],
    ],
    metrics: {
      latency: 2,
      accuracy: 5,
      complexity: 5,
      cost: 4,
      scalability: 3,
    },
    codeSnippet: `# RAPTOR — build the summary tree
from sklearn.mixture import GaussianMixture
import numpy as np

def build_raptor_tree(chunks, max_levels=3):
    current_level = chunks
    tree = [current_level]

    for _ in range(max_levels):
        embeddings = embed_all(current_level)
        n_clusters = max(2, len(current_level) // 4)

        gmm = GaussianMixture(n_components=n_clusters)
        labels = gmm.fit_predict(np.array(embeddings))

        summaries = []
        for cluster_id in set(labels):
            cluster_docs = [c for c, l in zip(current_level, labels)
                           if l == cluster_id]
            summary = llm.invoke(summarize_prompt(cluster_docs))
            summaries.append(summary)

        tree.append(summaries)
        current_level = summaries

    return tree`,
    tradeoffs: {
      pros: ["Multi-level abstraction", "Handles long docs", "Better synthesis"],
      cons: ["Expensive to build", "LLM summary quality matters", "Complex to query"],
    },
  },
  {
    id: "graph-rag",
    name: "GraphRAG",
    category: "Indexing",
    difficulty: "advanced",
    icon: "🕸️",
    tagline: "Knowledge graph + community detection + local/global retrieval",
    overview:
      "Microsoft's GraphRAG extracts entities and relationships to build a knowledge graph, then runs community detection (Leiden algorithm) to create hierarchical cluster summaries. Supports local search (entity-centric) and global search (community summary) query modes.",
    whenToUse: [
      "Questions requiring global reasoning over entire corpus",
      "Entity-relationship heavy domains (e.g., enterprise, life sciences)",
      "\"What are the main themes?\" style sensemaking queries",
    ],
    weaknesses: [
      "Very expensive to build (many LLM calls for extraction)",
      "Entity extraction errors propagate to graph",
      "Not suited for precise factual lookups",
    ],
    components: [
      { id: "docs", label: "Documents", color: "#a855f7" },
      { id: "extractor", label: "Entity/Relation Extractor", color: "#9333ea" },
      { id: "graph", label: "Knowledge Graph", color: "#7e22ce" },
      { id: "community", label: "Community Detection (Leiden)", color: "#6b21a8" },
      { id: "summarizer", label: "Community Summarizer", color: "#581c87" },
      { id: "local-search", label: "Local Search", color: "#3b0764" },
      { id: "global-search", label: "Global Search", color: "#2e1065" },
      { id: "llm", label: "LLM Generator", color: "#f43f5e" },
    ],
    flow: [
      ["docs", "extractor"],
      ["extractor", "graph"],
      ["graph", "community"],
      ["community", "summarizer"],
      ["summarizer", "local-search"],
      ["summarizer", "global-search"],
      ["local-search", "llm"],
      ["global-search", "llm"],
    ],
    metrics: {
      latency: 1,
      accuracy: 5,
      complexity: 5,
      cost: 5,
      scalability: 2,
    },
    codeSnippet: `# GraphRAG — conceptual pipeline
# Phase 1: Indexing (run once)
entities, relations = extract_graph(documents, llm)
graph = build_knowledge_graph(entities, relations)
communities = leiden_algorithm(graph)
community_summaries = summarize_communities(communities, llm)

# Phase 2: Query
def graphrag_query(query: str, mode: str = "global"):
    if mode == "global":
        # Aggregate over community summaries
        relevant = select_communities(community_summaries, query)
        context  = build_global_context(relevant)
    else:
        # Entity-centric vector search
        entities = extract_query_entities(query, llm)
        context  = expand_entity_neighborhood(entities, graph)

    return llm.invoke(build_prompt(query, context))`,
    tradeoffs: {
      pros: ["Global reasoning", "Rich entity context", "Sensemaking queries"],
      cons: ["Very expensive build", "Graph quality depends on extraction", "Complex ops"],
    },
  },
  {
    id: "agentic-rag",
    name: "Agentic RAG",
    category: "Agentic RAG",
    difficulty: "advanced",
    icon: "🤖",
    tagline: "LLM agent decides when/what/how to retrieve",
    overview:
      "The LLM acts as an orchestrator with access to multiple retrieval tools (vector search, SQL, APIs, web search). It plans multi-step retrieval strategies, decides tool order, validates intermediate results, and synthesizes a final answer — like a ReAct agent with RAG tools.",
    whenToUse: [
      "Multi-hop questions requiring chained lookups",
      "Heterogeneous data sources (SQL + vector + API)",
      "Open-ended research tasks where retrieval path is unknown upfront",
    ],
    weaknesses: [
      "Unpredictable latency (unbounded tool calls)",
      "Harder to debug and test",
      "Risk of infinite loops without stop conditions",
      "Higher cost from multiple LLM calls",
    ],
    components: [
      { id: "query", label: "User Query", color: "#06b6d4" },
      { id: "agent", label: "LLM Agent (ReAct)", color: "#0891b2" },
      { id: "vector-tool", label: "Vector Search Tool", color: "#0e7490" },
      { id: "sql-tool", label: "SQL Tool", color: "#155e75" },
      { id: "api-tool", label: "API Tool", color: "#164e63" },
      { id: "web-tool", label: "Web Search Tool", color: "#083344" },
      { id: "memory", label: "Working Memory", color: "#1e3a5f" },
      { id: "synthesizer", label: "Synthesizer", color: "#f43f5e" },
    ],
    flow: [
      ["query", "agent"],
      ["agent", "vector-tool"],
      ["agent", "sql-tool"],
      ["agent", "api-tool"],
      ["agent", "web-tool"],
      ["vector-tool", "memory"],
      ["sql-tool", "memory"],
      ["api-tool", "memory"],
      ["web-tool", "memory"],
      ["memory", "agent"],
      ["agent", "synthesizer"],
    ],
    metrics: {
      latency: 1,
      accuracy: 5,
      complexity: 5,
      cost: 5,
      scalability: 2,
    },
    codeSnippet: `# Agentic RAG with LangGraph
from langgraph.graph import StateGraph
from langchain.tools import Tool

tools = [
    Tool("vector_search", vectordb.similarity_search, "Search knowledge base"),
    Tool("sql_query",     sql_db.run,                 "Query structured data"),
    Tool("web_search",    web_search.run,              "Search the internet"),
]

agent = create_react_agent(llm, tools)

# LangGraph for controlled agentic flow
workflow = StateGraph(AgentState)
workflow.add_node("agent",  agent_node)
workflow.add_node("tools",  tool_node)
workflow.add_conditional_edges("agent", should_continue)
workflow.add_edge("tools", "agent")`,
    tradeoffs: {
      pros: ["Most flexible", "Handles complex multi-hop", "Extensible"],
      cons: ["Unpredictable cost/latency", "Hard to test", "Debugging nightmare"],
    },
  },
  {
    id: "hierarchical-indexing",
    name: "Hierarchical Indexing",
    category: "Indexing",
    difficulty: "intermediate",
    icon: "🏗️",
    tagline: "Parent-child chunks: retrieve small, return large",
    overview:
      "Index small child chunks for precise retrieval, but return their larger parent chunk to the LLM for richer context. Solves the tension between retrieval precision (small chunks) and generation context (large chunks).",
    whenToUse: [
      "Documents with clear hierarchical structure (sections → paragraphs)",
      "When small chunks retrieve well but lack context for generation",
      "Standard production RAG architecture recommendation",
    ],
    weaknesses: [
      "More complex chunk mapping to maintain",
      "Parent fetch adds a lookup step",
      "Parent chunk boundary choices matter",
    ],
    components: [
      { id: "docs", label: "Documents", color: "#f59e0b" },
      { id: "parent-chunk", label: "Parent Chunks (large)", color: "#d97706" },
      { id: "child-chunk", label: "Child Chunks (small)", color: "#b45309" },
      { id: "child-index", label: "Child Vector Index", color: "#92400e" },
      { id: "retriever", label: "Retrieve Child Chunks", color: "#78350f" },
      { id: "parent-store", label: "Fetch Parent Chunks", color: "#451a03" },
      { id: "llm", label: "LLM Generator", color: "#f43f5e" },
    ],
    flow: [
      ["docs", "parent-chunk"],
      ["parent-chunk", "child-chunk"],
      ["child-chunk", "child-index"],
      ["child-index", "retriever"],
      ["retriever", "parent-store"],
      ["parent-store", "llm"],
    ],
    metrics: {
      latency: 3,
      accuracy: 4,
      complexity: 3,
      cost: 2,
      scalability: 4,
    },
    codeSnippet: `# Hierarchical / Parent-Document Retriever
from langchain.retrievers import ParentDocumentRetriever
from langchain.storage import InMemoryStore
from langchain.text_splitter import RecursiveCharacterTextSplitter

parent_splitter = RecursiveCharacterTextSplitter(chunk_size=2000)
child_splitter  = RecursiveCharacterTextSplitter(chunk_size=400)
docstore = InMemoryStore()

retriever = ParentDocumentRetriever(
    vectorstore=vectordb,
    docstore=docstore,
    child_splitter=child_splitter,
    parent_splitter=parent_splitter,
)
retriever.add_documents(docs)`,
    tradeoffs: {
      pros: [
        "Best of small+large chunk",
        "Precise retrieval, rich context",
        "Simple to implement with LangChain",
      ],
      cons: ["Two stores to manage", "Parent boundary matters a lot"],
    },
  },
  {
    id: "reliable-rag",
    name: "Reliable RAG",
    category: "Quality & Reliability",
    difficulty: "advanced",
    icon: "🛡️",
    tagline: "Retrieve → Grade → Generate → Verify → Highlight Sources",
    overview:
      "Production-grade RAG with explicit quality gates at every stage: relevancy grading filters noisy retrieved chunks before generation, a hallucination detector verifies the answer is grounded in context, and a source highlighter maps each claim back to the originating document span. Only answers that clear all gates are returned — others are flagged or regenerated.",
    whenToUse: [
      "High-stakes domains where hallucination is unacceptable (medical, legal, finance)",
      "Production systems requiring answer traceability and citation",
      "When users need to trust and verify AI responses",
      "Compliance environments needing audit trails per answer",
    ],
    weaknesses: [
      "Each gate adds latency — budget 200–600ms extra versus Naive RAG",
      "Gate thresholds need calibration per domain (avoid over-filtering)",
      "More LLM calls = higher cost per query",
      "False-positive hallucination flags can reject valid inferences",
    ],
    components: [
      { id: "query", label: "User Query", color: "#6366f1" },
      { id: "retriever", label: "Retriever (top-20)", color: "#8b5cf6" },
      { id: "rel-grader", label: "Relevancy Grader", color: "#f59e0b" },
      { id: "ctx-filter", label: "Context Filter (≥0.6)", color: "#d97706" },
      { id: "llm", label: "LLM Generator", color: "#10b981" },
      { id: "halluc-check", label: "Hallucination Detector", color: "#ef4444" },
      { id: "src-highlighter", label: "Source Highlighter", color: "#3b82f6" },
      { id: "confidence", label: "Confidence Scorer", color: "#a855f7" },
      { id: "output", label: "Verified Response + Sources", color: "#22c55e" },
    ],
    flow: [
      ["query", "retriever"],
      ["retriever", "rel-grader"],
      ["rel-grader", "ctx-filter"],
      ["ctx-filter", "llm"],
      ["llm", "halluc-check"],
      ["halluc-check", "src-highlighter"],
      ["src-highlighter", "confidence"],
      ["confidence", "output"],
    ],
    metrics: {
      latency: 1,
      accuracy: 5,
      complexity: 4,
      cost: 4,
      scalability: 3,
    },
    codeSnippet: `# Reliable RAG — full quality-gated pipeline
import anthropic
from dataclasses import dataclass

client = anthropic.Anthropic()

@dataclass
class GatedResponse:
    answer: str
    sources: list[dict]          # [{text, doc_id, score, spans}]
    relevancy_scores: list[float]
    hallucination_score: float   # 0=grounded, 1=hallucinated
    confidence: float
    passed_all_gates: bool

# ── Gate 1: Relevancy Grader ─────────────────────────────────────
def grade_relevancy(query: str, doc: str) -> float:
    """Score 0-1: how relevant is this doc to the query?"""
    resp = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=10,
        system="Return only a decimal between 0 and 1.",
        messages=[{"role": "user", "content":
            f"Relevancy score for answering: '{query}'\\nDocument: {doc[:500]}"}]
    )
    try:
        return float(resp.content[0].text.strip())
    except ValueError:
        return 0.0

# ── Gate 2: Hallucination Detector ───────────────────────────────
def detect_hallucination(answer: str, context: str) -> float:
    """NLI-style: what fraction of answer claims lack context support?"""
    resp = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=10,
        system="Return only a decimal 0-1. 0=fully grounded, 1=fully hallucinated.",
        messages=[{"role": "user", "content":
            f"Context:\\n{context}\\n\\nAnswer:\\n{answer}\\n\\n"
            "Hallucination score (fraction of claims NOT supported by context):"}]
    )
    try:
        return float(resp.content[0].text.strip())
    except ValueError:
        return 1.0

# ── Gate 3: Source Highlighter ────────────────────────────────────
def highlight_sources(answer: str, docs: list[str]) -> list[dict]:
    """Map each answer sentence to the supporting doc span."""
    resp = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=[{"role": "user", "content":
            f"Answer: {answer}\\n\\nDocs: {docs}\\n\\n"
            "For each answer sentence, output JSON: "
            "[{{sentence, doc_index, supporting_span, confidence}}]"}]
    )
    import json, re
    raw = resp.content[0].text
    match = re.search(r'\\[.*\\]', raw, re.DOTALL)
    return json.loads(match.group()) if match else []

# ── Pipeline ──────────────────────────────────────────────────────
def reliable_rag(query: str,
                 relevancy_threshold: float = 0.6,
                 halluc_threshold: float = 0.25) -> GatedResponse:
    # Retrieve
    raw_docs = retriever.get_relevant_documents(query, k=20)

    # Gate 1 — Relevancy grading
    scored = [(doc, grade_relevancy(query, doc.page_content))
              for doc in raw_docs]
    filtered = [(doc, s) for doc, s in scored if s >= relevancy_threshold]

    if not filtered:
        return GatedResponse(
            answer="I couldn't find sufficiently relevant information.",
            sources=[], relevancy_scores=[s for _, s in scored],
            hallucination_score=0.0, confidence=0.0, passed_all_gates=False
        )

    context = "\\n\\n".join(doc.page_content for doc, _ in filtered[:5])

    # Gate 2 — Generate
    answer_resp = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system="Answer using ONLY the provided context. "
               "If the context doesn't contain the answer, say so.",
        messages=[{"role": "user", "content":
            f"Context:\\n{context}\\n\\nQuestion: {query}"}]
    )
    answer = answer_resp.content[0].text

    # Gate 3 — Hallucination check
    halluc_score = detect_hallucination(answer, context)
    if halluc_score > halluc_threshold:
        # Attempt regeneration with stricter prompt
        answer_resp = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            system="Answer ONLY what is explicitly stated in the context. "
                   "Quote directly when uncertain.",
            messages=[{"role": "user", "content":
                f"Context:\\n{context}\\n\\nQuestion: {query}"}]
        )
        answer = answer_resp.content[0].text
        halluc_score = detect_hallucination(answer, context)

    # Gate 4 — Source highlighting
    doc_texts = [doc.page_content for doc, _ in filtered[:5]]
    sources   = highlight_sources(answer, doc_texts)

    confidence = (1 - halluc_score) * (
        sum(s for _, s in filtered[:5]) / len(filtered[:5])
    )

    return GatedResponse(
        answer=answer,
        sources=sources,
        relevancy_scores=[s for _, s in scored],
        hallucination_score=halluc_score,
        confidence=confidence,
        passed_all_gates=halluc_score <= halluc_threshold,
    )`,
    tradeoffs: {
      pros: [
        "Dramatically reduced hallucination rate in production",
        "Full answer traceability — every claim maps to a source span",
        "Configurable thresholds per domain / risk tolerance",
        "Users see confidence score and can drill into evidence",
      ],
      cons: [
        "3–5 extra LLM calls per query (cost + latency)",
        "Threshold tuning required — too strict = low recall, too loose = misses hallucinations",
        "Source highlighter accuracy depends on LLM's attribution quality",
        "Adds pipeline complexity and more failure points to monitor",
      ],
    },
    // ── Quality Gates definition (unique to this technique) ──────────────
    qualityGates: [
      {
        id: "relevancy-grader",
        name: "Relevancy Grader",
        icon: "🎯",
        color: "#f59e0b",
        phase: "Pre-Generation",
        description:
          "Scores each retrieved chunk 0–1 against the query using an LLM judge. Chunks below threshold (default 0.6) are filtered before the context is assembled.",
        inputLabel: "Retrieved chunks (top-20)",
        outputLabel: "Filtered chunks (≥ threshold)",
        thresholdKey: "relevancy_threshold",
        thresholdDefault: 0.6,
        thresholdMin: 0.3,
        thresholdMax: 0.95,
        passCondition: "score ≥ threshold",
        failAction: "Drop chunk from context",
        latencyMs: "80–150ms per chunk (batched)",
        implementation:
          "LLM-as-judge (fast model) or cross-encoder classifier. Cohere Rerank v3 gives relevancy scores natively.",
        simulatedDocs: [
          {
            id: "d1",
            text: "Aspirin (acetylsalicylic acid) inhibits COX-1 and COX-2 enzymes, reducing prostaglandin synthesis and thereby decreasing inflammation, pain, and fever.",
            score: 0.92,
            source: "pharmacology_handbook.pdf · p.142",
          },
          {
            id: "d2",
            text: "The hospital was founded in 1954 and has 450 beds across three buildings on the main campus.",
            score: 0.11,
            source: "hospital_brochure.pdf · p.3",
          },
          {
            id: "d3",
            text: "NSAIDs including aspirin carry a risk of gastrointestinal bleeding, especially with long-term use or in patients over 65.",
            score: 0.87,
            source: "drug_safety_guide.pdf · p.67",
          },
          {
            id: "d4",
            text: "Clinical trials for the new cardiology wing were completed in Q3 2023 with favorable outcomes for the institution.",
            score: 0.08,
            source: "annual_report_2023.pdf · p.12",
          },
          {
            id: "d5",
            text: "Low-dose aspirin (75–100 mg/day) is recommended for secondary prevention of cardiovascular events in high-risk patients.",
            score: 0.89,
            source: "cardiology_guidelines.pdf · p.31",
          },
        ],
        simulatedQuery: "What are the mechanisms and risks of aspirin?",
      },
      {
        id: "hallucination-detector",
        name: "Hallucination Detector",
        icon: "🔬",
        color: "#ef4444",
        phase: "Post-Generation",
        description:
          "Uses Natural Language Inference (NLI) or an LLM judge to check whether each claim in the generated answer is entailed by the retrieved context. Returns a hallucination score 0–1.",
        inputLabel: "Generated answer + context",
        outputLabel: "Hallucination score + flagged claims",
        thresholdKey: "halluc_threshold",
        thresholdDefault: 0.25,
        thresholdMin: 0.05,
        thresholdMax: 0.6,
        passCondition: "halluc_score ≤ threshold",
        failAction: "Regenerate with stricter prompt OR refuse answer",
        latencyMs: "100–250ms (single LLM call)",
        implementation:
          "SelfCheckGPT (sample multiple responses, check consistency), NLI model (DeBERTa-based), or LLM-as-judge with chain-of-thought.",
        simulatedClaims: [
          {
            claim: "Aspirin inhibits COX-1 and COX-2 enzymes.",
            supported: true,
            confidence: 0.97,
            sourceSpan: "pharmacology_handbook.pdf · p.142",
          },
          {
            claim: "Long-term use increases GI bleeding risk.",
            supported: true,
            confidence: 0.93,
            sourceSpan: "drug_safety_guide.pdf · p.67",
          },
          {
            claim: "Aspirin should never be given to children under 18.",
            supported: false,
            confidence: 0.31,
            sourceSpan: null,
            note: "Reye's syndrome risk not mentioned in retrieved context",
          },
          {
            claim: "Low-dose aspirin is used for cardiovascular prevention.",
            supported: true,
            confidence: 0.95,
            sourceSpan: "cardiology_guidelines.pdf · p.31",
          },
        ],
      },
      {
        id: "source-highlighter",
        name: "Source Highlighter",
        icon: "💡",
        color: "#3b82f6",
        phase: "Post-Generation",
        description:
          "Maps every sentence in the final answer back to the exact span in the source document that supports it. Provides inline citations so users can verify claims directly.",
        inputLabel: "Final answer + filtered context",
        outputLabel: "Answer with inline citations + highlighted spans",
        latencyMs: "50–120ms",
        implementation:
          "String matching + embedding similarity for fuzzy span matching, or LLM attribution prompt asking for exact quotes.",
        simulatedAnswer:
          "Aspirin inhibits COX-1 and COX-2 enzymes [1], reducing prostaglandin synthesis to decrease inflammation and pain. Long-term use carries a risk of gastrointestinal bleeding [2], particularly in elderly patients. For cardiovascular patients, low-dose aspirin (75–100 mg/day) is recommended for secondary prevention [3].",
        simulatedCitations: [
          {
            marker: "[1]",
            source: "pharmacology_handbook.pdf",
            page: 142,
            span: "inhibits COX-1 and COX-2 enzymes, reducing prostaglandin synthesis",
            confidence: 0.97,
          },
          {
            marker: "[2]",
            source: "drug_safety_guide.pdf",
            page: 67,
            span: "risk of gastrointestinal bleeding, especially with long-term use",
            confidence: 0.93,
          },
          {
            marker: "[3]",
            source: "cardiology_guidelines.pdf",
            page: 31,
            span: "Low-dose aspirin (75–100 mg/day) is recommended for secondary prevention",
            confidence: 0.95,
          },
        ],
      },
      {
        id: "confidence-scorer",
        name: "Confidence Scorer",
        icon: "📊",
        color: "#a855f7",
        phase: "Post-Generation",
        description:
          "Aggregates signals from all upstream gates into a single confidence score (0–1) returned alongside the answer. Drives UI indicators (green/amber/red) and can trigger human escalation.",
        inputLabel: "Relevancy scores + hallucination score + citation coverage",
        outputLabel: "Confidence score + answer disposition",
        latencyMs: "< 5ms (arithmetic aggregation)",
        implementation:
          "Weighted formula: confidence = (avg_relevancy × 0.4) + ((1 − halluc_score) × 0.4) + (citation_coverage × 0.2). Thresholds: ≥0.85 = auto-return, 0.65–0.84 = return with warning, <0.65 = escalate or refuse.",
        simulatedFormula: {
          avgRelevancy: 0.89,
          hallucScore: 0.07,
          citationCoverage: 0.92,
          weights: { relevancy: 0.4, hallucination: 0.4, citation: 0.2 },
          result: 0.88,
          disposition: "auto-return",
        },
      },
    ],
  },
];

export const CATEGORIES = [...new Set(RAG_TECHNIQUES.map((t) => t.category))];
export const DIFFICULTIES = ["beginner", "intermediate", "advanced"];
