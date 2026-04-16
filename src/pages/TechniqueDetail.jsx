import { useState } from "react";
import { RAG_TECHNIQUES } from "../data/techniques";
import ArchitectureDiagram from "../components/ArchitectureDiagram";
import MetricBar from "../components/MetricBar";
import QualityGateSimulator from "../components/QualityGateSimulator";

const DIFF_COLOR = {
  beginner: "bg-emerald-900/60 text-emerald-300 border-emerald-700",
  intermediate: "bg-amber-900/60 text-amber-300 border-amber-700",
  advanced: "bg-red-900/60 text-red-300 border-red-700",
};

const CAT_COLOR = {
  Foundation: "bg-violet-900/40 text-violet-300",
  "Query Transformation": "bg-cyan-900/40 text-cyan-300",
  Retrieval: "bg-pink-900/40 text-pink-300",
  Indexing: "bg-lime-900/40 text-lime-300",
  "Agentic RAG": "bg-orange-900/40 text-orange-300",
  "Quality & Reliability": "bg-emerald-900/40 text-emerald-300",
};

export default function TechniqueDetail({ techniqueId, onBack }) {
  const technique = RAG_TECHNIQUES.find((t) => t.id === techniqueId);
  const [tab, setTab] = useState("overview");

  if (!technique) return null;

  const tabs = [
    "overview",
    "architecture",
    "code",
    "tradeoffs",
    ...(technique.qualityGates ? ["quality gates"] : []),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 p-6">
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-slate-400 hover:text-slate-100 transition-colors text-sm"
      >
        ← Back to Techniques
      </button>

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className="text-4xl">{technique.icon}</span>
            <h1 className="text-3xl font-bold text-white">{technique.name}</h1>
            <span
              className={`text-xs px-2 py-1 rounded-full border ${DIFF_COLOR[technique.difficulty]}`}
            >
              {technique.difficulty}
            </span>
            <span
              className={`text-xs px-2 py-1 rounded-full ${CAT_COLOR[technique.category] || "bg-slate-800 text-slate-300"}`}
            >
              {technique.category}
            </span>
          </div>
          <p className="text-slate-300 font-mono text-lg">{technique.tagline}</p>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-1 mb-6 bg-slate-900 rounded-xl p-1 w-fit">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                tab === t
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {tab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className="bg-slate-900/60 rounded-2xl p-6 border border-slate-800">
                <h2 className="text-lg font-semibold text-white mb-3">Overview</h2>
                <p className="text-slate-300 leading-relaxed">{technique.overview}</p>
              </div>

              <div className="bg-slate-900/60 rounded-2xl p-6 border border-slate-800">
                <h2 className="text-lg font-semibold text-emerald-400 mb-3">
                  When to Use
                </h2>
                <ul className="space-y-2">
                  {technique.whenToUse.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-300">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-900/60 rounded-2xl p-6 border border-slate-800">
                <h2 className="text-lg font-semibold text-red-400 mb-3">Weaknesses</h2>
                <ul className="space-y-2">
                  {technique.weaknesses.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-300">
                      <span className="text-red-400 mt-0.5">✗</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-900/60 rounded-2xl p-6 border border-slate-800">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Performance Profile
                </h2>
                <MetricBar metrics={technique.metrics} />
              </div>
            </div>
          </div>
        )}

        {tab === "architecture" && (
          <div className="bg-slate-900/60 rounded-2xl p-6 border border-slate-800">
            <h2 className="text-lg font-semibold text-white mb-6">Pipeline Architecture</h2>
            <ArchitectureDiagram technique={technique} />
            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
              {technique.components.map((comp) => (
                <div
                  key={comp.id}
                  className="flex items-center gap-2 bg-slate-800/60 rounded-lg p-2"
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: comp.color }}
                  />
                  <span className="text-xs text-slate-300">{comp.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "code" && (
          <div className="bg-slate-900/60 rounded-2xl p-6 border border-slate-800">
            <h2 className="text-lg font-semibold text-white mb-4">Code Example</h2>
            <pre className="bg-slate-950 rounded-xl p-5 overflow-x-auto text-sm font-mono text-emerald-300 leading-relaxed border border-slate-800">
              <code>{technique.codeSnippet}</code>
            </pre>
          </div>
        )}

        {tab === "tradeoffs" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-emerald-950/40 rounded-2xl p-6 border border-emerald-900">
              <h2 className="text-lg font-semibold text-emerald-400 mb-4">Pros</h2>
              <ul className="space-y-3">
                {technique.tradeoffs.pros.map((pro, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-300">
                    <span className="text-emerald-400 font-bold">+</span>
                    {pro}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-red-950/40 rounded-2xl p-6 border border-red-900">
              <h2 className="text-lg font-semibold text-red-400 mb-4">Cons</h2>
              <ul className="space-y-3">
                {technique.tradeoffs.cons.map((con, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-300">
                    <span className="text-red-400 font-bold">−</span>
                    {con}
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:col-span-2 bg-slate-900/60 rounded-2xl p-6 border border-slate-800">
              <h2 className="text-lg font-semibold text-white mb-4">
                Performance Profile
              </h2>
              <MetricBar metrics={technique.metrics} />
            </div>
          </div>
        )}

        {tab === "quality gates" && technique.qualityGates && (
          <div>
            <div className="mb-6 bg-emerald-950/30 border border-emerald-900/50 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🛡️</span>
                <div>
                  <h2 className="text-lg font-bold text-emerald-300 mb-1">
                    Interactive Quality Gate Simulator
                  </h2>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Step through each quality gate in the pipeline. Adjust thresholds
                    to see how they affect filtering decisions, and inspect how claims
                    are verified and sources are mapped back to the answer.
                  </p>
                </div>
              </div>
            </div>
            <QualityGateSimulator qualityGates={technique.qualityGates} />
          </div>
        )}
      </div>
    </div>
  );
}
