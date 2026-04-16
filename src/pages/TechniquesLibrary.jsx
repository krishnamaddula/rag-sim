import { useState } from "react";
import { RAG_TECHNIQUES, CATEGORIES, DIFFICULTIES } from "../data/techniques";

const DIFF_COLOR = {
  beginner: "border-emerald-700 text-emerald-400",
  intermediate: "border-amber-700 text-amber-400",
  advanced: "border-red-700 text-red-400",
};

const CAT_BG = {
  Foundation: "bg-violet-500/10 hover:bg-violet-500/20 border-violet-800",
  "Query Transformation": "bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-800",
  Retrieval: "bg-pink-500/10 hover:bg-pink-500/20 border-pink-800",
  Indexing: "bg-lime-500/10 hover:bg-lime-500/20 border-lime-800",
  "Agentic RAG": "bg-orange-500/10 hover:bg-orange-500/20 border-orange-800",
  "Quality & Reliability": "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-800",
};

export default function TechniquesLibrary({ onSelectTechnique }) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeDiff, setActiveDiff] = useState("All");

  const filtered = RAG_TECHNIQUES.filter((t) => {
    const matchSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase()) ||
      t.overview.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === "All" || t.category === activeCategory;
    const matchDiff = activeDiff === "All" || t.difficulty === activeDiff;
    return matchSearch && matchCat && matchDiff;
  });

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-1">Techniques Library</h2>
        <p className="text-slate-400 text-sm">
          {RAG_TECHNIQUES.length} RAG building blocks — click any to deep-dive
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search techniques..."
          className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 w-64"
        />

        <div className="flex gap-2 flex-wrap">
          {["All", ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                activeCategory === cat
                  ? "bg-indigo-600 border-indigo-500 text-white"
                  : "border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {["All", ...DIFFICULTIES].map((d) => (
            <button
              key={d}
              onClick={() => setActiveDiff(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize ${
                activeDiff === d
                  ? "bg-indigo-600 border-indigo-500 text-white"
                  : "border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((technique) => (
          <button
            key={technique.id}
            onClick={() => onSelectTechnique(technique.id)}
            className={`text-left rounded-2xl border p-5 transition-all duration-200 group cursor-pointer ${
              CAT_BG[technique.category] ||
              "bg-slate-800/40 hover:bg-slate-800/70 border-slate-700"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-3xl">{technique.icon}</span>
              <span
                className={`text-xs border rounded-full px-2 py-0.5 ${DIFF_COLOR[technique.difficulty]}`}
              >
                {technique.difficulty}
              </span>
            </div>

            <h3 className="font-bold text-white text-lg mb-1 group-hover:text-indigo-300 transition-colors">
              {technique.name}
            </h3>
            <p className="text-xs text-slate-500 font-mono mb-3">{technique.tagline}</p>
            <p className="text-slate-400 text-sm leading-snug line-clamp-2">
              {technique.overview}
            </p>

            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs text-slate-500 bg-slate-800/60 rounded px-2 py-1">
                {technique.category}
              </span>
              <span className="text-xs text-slate-600 ml-auto group-hover:text-indigo-400 transition-colors">
                Explore →
              </span>
            </div>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          No techniques match your filters.
        </div>
      )}
    </div>
  );
}
