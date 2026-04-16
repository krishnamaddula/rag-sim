import { useState } from "react";
import { RAG_TECHNIQUES } from "../data/techniques";

const METRIC_LABELS = {
  latency: "Latency (1=fast)",
  accuracy: "Accuracy",
  complexity: "Complexity",
  cost: "Cost",
  scalability: "Scalability",
};

function Cell({ value, metric }) {
  // For latency/complexity/cost: lower is better (green). For accuracy/scalability: higher is better.
  const invertedMetrics = ["latency", "complexity", "cost"];
  const isGood = invertedMetrics.includes(metric) ? value <= 2 : value >= 4;
  const isMid = !isGood && (invertedMetrics.includes(metric) ? value === 3 : value === 3);
  const isBad = !isGood && !isMid;

  const cls = isGood
    ? "bg-emerald-900/40 text-emerald-300"
    : isMid
    ? "bg-amber-900/40 text-amber-300"
    : "bg-red-900/40 text-red-300";

  return (
    <td className={`px-3 py-2 text-center text-sm font-medium ${cls}`}>
      {"●".repeat(value)}{"○".repeat(5 - value)}
    </td>
  );
}

export default function ComparisonMatrix() {
  const [selected, setSelected] = useState(
    RAG_TECHNIQUES.slice(0, 6).map((t) => t.id)
  );
  const [sortBy, setSortBy] = useState("accuracy");

  const toggled = (id) =>
    selected.includes(id)
      ? selected.filter((x) => x !== id)
      : [...selected, id];

  const visibleTechniques = RAG_TECHNIQUES.filter((t) => selected.includes(t.id)).sort(
    (a, b) => b.metrics[sortBy] - a.metrics[sortBy]
  );

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-1">Comparison Matrix</h2>
        <p className="text-slate-400 text-sm">
          Side-by-side performance profiles — select techniques to compare
        </p>
      </div>

      {/* Technique selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {RAG_TECHNIQUES.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelected(toggled(t.id))}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1 ${
              selected.includes(t.id)
                ? "bg-indigo-600 border-indigo-500 text-white"
                : "border-slate-700 text-slate-400 hover:border-slate-500"
            }`}
          >
            {t.icon} {t.name}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs text-slate-500">Sort by:</span>
        {Object.entries(METRIC_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSortBy(key)}
            className={`text-xs px-2 py-1 rounded transition-all ${
              sortBy === key
                ? "bg-indigo-700 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {label.split(" ")[0]}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-900/80">
              <th className="text-left px-4 py-3 text-slate-400 font-semibold whitespace-nowrap">
                Technique
              </th>
              <th className="text-left px-4 py-3 text-slate-400 font-semibold">
                Category
              </th>
              {Object.entries(METRIC_LABELS).map(([key, label]) => (
                <th
                  key={key}
                  className={`px-3 py-3 text-slate-400 font-semibold whitespace-nowrap text-center cursor-pointer hover:text-slate-200 transition-colors ${
                    sortBy === key ? "text-indigo-400" : ""
                  }`}
                  onClick={() => setSortBy(key)}
                >
                  {label}
                </th>
              ))}
              <th className="px-4 py-3 text-slate-400 font-semibold">Best For</th>
            </tr>
          </thead>
          <tbody>
            {visibleTechniques.map((t, i) => (
              <tr
                key={t.id}
                className={`border-t border-slate-800/60 ${
                  i % 2 === 0 ? "bg-slate-900/20" : ""
                }`}
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span>{t.icon}</span>
                    <span className="font-medium text-white">{t.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-slate-400">{t.category}</span>
                </td>
                {Object.keys(METRIC_LABELS).map((metric) => (
                  <Cell key={metric} value={t.metrics[metric]} metric={metric} />
                ))}
                <td className="px-4 py-3 text-slate-400 text-xs max-w-xs">
                  {t.whenToUse[0]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <span className="text-emerald-400">●</span> Good
        </div>
        <div className="flex items-center gap-1">
          <span className="text-amber-400">●</span> Moderate
        </div>
        <div className="flex items-center gap-1">
          <span className="text-red-400">●</span> Poor / High
        </div>
        <span className="ml-2">Latency/Complexity/Cost: lower = greener. Accuracy/Scalability: higher = greener.</span>
      </div>
    </div>
  );
}
