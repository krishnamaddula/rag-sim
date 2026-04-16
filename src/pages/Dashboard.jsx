import { RAG_TECHNIQUES, CATEGORIES } from "../data/techniques";
import { INTERVIEW_QUESTIONS } from "../data/interviewQuestions";
import { SCENARIOS } from "../data/scenarios";

const STAT_CARDS = [
  { label: "RAG Techniques", value: RAG_TECHNIQUES.length, icon: "🧩", color: "from-indigo-600 to-violet-600" },
  { label: "Architecture Patterns", value: CATEGORIES.length, icon: "🏗️", color: "from-cyan-600 to-blue-600" },
  { label: "Interview Questions", value: INTERVIEW_QUESTIONS.length, icon: "🎯", color: "from-rose-600 to-pink-600" },
  { label: "Design Scenarios", value: SCENARIOS.length, icon: "⚙️", color: "from-amber-600 to-orange-600" },
];

const LEARNING_PATHS = [
  {
    title: "RAG Foundations",
    steps: ["Naive RAG", "Chunking Strategies", "Hybrid Search", "Re-ranking"],
    color: "border-emerald-700",
    badge: "Beginner",
    badgeColor: "bg-emerald-900/60 text-emerald-300",
  },
  {
    title: "Production RAG",
    steps: ["Hierarchical Indexing", "RAG Fusion", "Contextual Compression", "Evaluation"],
    color: "border-blue-700",
    badge: "Intermediate",
    badgeColor: "bg-blue-900/60 text-blue-300",
  },
  {
    title: "Advanced Patterns",
    steps: ["Self-RAG", "CRAG", "RAPTOR", "GraphRAG", "Agentic RAG"],
    color: "border-rose-700",
    badge: "Advanced / Staff",
    badgeColor: "bg-rose-900/60 text-rose-300",
  },
];

export default function Dashboard({ setPage }) {
  return (
    <div>
      {/* Hero */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 bg-indigo-900/40 border border-indigo-800 rounded-full px-4 py-1.5 text-indigo-300 text-xs font-medium mb-4">
          🤖 Staff & Architect Interview Prep
        </div>
        <h1 className="text-4xl font-bold text-white mb-3 leading-tight">
          RAG Architecture
          <br />
          <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            Simulation Lab
          </span>
        </h1>
        <p className="text-slate-400 max-w-2xl leading-relaxed">
          Master every RAG building block from Naive RAG to GraphRAG. Practice
          system design scenarios, simulate retrieval architectures, and prepare for
          Staff/Architect-level interviews with progressive answer reveals.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {STAT_CARDS.map((s) => (
          <div
            key={s.label}
            className="bg-slate-900/60 rounded-2xl p-5 border border-slate-800"
          >
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-xl mb-3`}
            >
              {s.icon}
            </div>
            <div className="text-3xl font-bold text-white mb-1">{s.value}</div>
            <div className="text-xs text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          {
            title: "Browse Techniques",
            desc: "Explore all RAG patterns with architecture diagrams, code, and trade-offs",
            icon: "🧩",
            page: "techniques",
            color: "hover:border-indigo-600",
          },
          {
            title: "Scenario Simulator",
            desc: "Pick a real-world use case, design your architecture, get expert feedback",
            icon: "⚙️",
            page: "scenarios",
            color: "hover:border-cyan-600",
          },
          {
            title: "Interview Prep",
            desc: "Staff/Architect Q&A with progressive reveals and follow-up questions",
            icon: "🎯",
            page: "interview",
            color: "hover:border-rose-600",
          },
          {
            title: "Comparison Matrix",
            desc: "Side-by-side performance profiles for any combination of techniques",
            icon: "📊",
            page: "comparison",
            color: "hover:border-amber-600",
          },
        ].map((card) => (
          <button
            key={card.page}
            onClick={() => setPage(card.page)}
            className={`text-left bg-slate-900/40 border border-slate-800 ${card.color} rounded-2xl p-5 transition-all duration-200 group cursor-pointer`}
          >
            <span className="text-3xl block mb-3">{card.icon}</span>
            <h3 className="font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
              {card.title}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">{card.desc}</p>
          </button>
        ))}
      </div>

      {/* Learning Paths */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-white mb-4">Learning Paths</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {LEARNING_PATHS.map((path) => (
            <div
              key={path.title}
              className={`bg-slate-900/40 border ${path.color} rounded-2xl p-5`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white">{path.title}</h3>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${path.badgeColor}`}
                >
                  {path.badge}
                </span>
              </div>
              <ol className="space-y-2">
                {path.steps.map((step, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 text-xs flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <button
                      onClick={() => setPage("techniques")}
                      className="text-sm text-slate-300 hover:text-white transition-colors text-left"
                    >
                      {step}
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </div>

      {/* RAG Evolution Timeline */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-5">RAG Evolution Timeline</h2>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-700" />
          {[
            { year: "2020", event: "Dense Passage Retrieval (DPR) — bi-encoder retrieval breakthrough", color: "bg-slate-600" },
            { year: "2020", event: "RAG paper (Lewis et al., Meta) — first unified RAG framework", color: "bg-indigo-600" },
            { year: "2022", event: "InstructGPT + ChatGPT explosion drives enterprise RAG adoption", color: "bg-violet-600" },
            { year: "2023", event: "HyDE, Multi-Query, RAG Fusion — query transformation techniques emerge", color: "bg-cyan-600" },
            { year: "2023", event: "LlamaIndex & LangChain standardize RAG component APIs", color: "bg-blue-600" },
            { year: "2024", event: "Self-RAG, CRAG, RAPTOR — adaptive & corrective RAG matures", color: "bg-pink-600" },
            { year: "2024", event: "GraphRAG (Microsoft) — entity-graph augmented retrieval", color: "bg-rose-600" },
            { year: "2024", event: "Agentic RAG with LangGraph/CrewAI — multi-tool orchestration", color: "bg-orange-600" },
            { year: "2025", event: "Long-context LLMs (Gemini 1M, Claude 200K) reshape RAG trade-offs", color: "bg-amber-600" },
          ].map((item, i) => (
            <div key={i} className="relative pl-10 pb-5">
              <div
                className={`absolute left-2.5 top-1 w-3 h-3 rounded-full ${item.color} border-2 border-slate-900 -translate-x-1/2`}
              />
              <span className="text-xs font-mono text-slate-500 mr-3">{item.year}</span>
              <span className="text-sm text-slate-300">{item.event}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
