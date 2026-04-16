import { useState } from "react";
import RAGASExplorer from "../components/eval/RAGASExplorer";
import ParameterTuner from "../components/eval/ParameterTuner";
import PipelineProfiler from "../components/eval/PipelineProfiler";
import ABTestDesigner from "../components/eval/ABTestDesigner";

const TABS = [
  {
    id: "ragas",
    label: "RAGAS Metrics",
    icon: "🧪",
    desc: "Understand all 5 RAGAS metrics with a live interactive example",
  },
  {
    id: "params",
    label: "Parameter Tuner",
    icon: "🎛️",
    desc: "Tune chunk size, top-K, reranker, and models — see metric impact instantly",
  },
  {
    id: "profiler",
    label: "Pipeline Profiler",
    icon: "⏱️",
    desc: "Map every stage's latency contribution and hit your SLA budget",
  },
  {
    id: "abtest",
    label: "A/B Test Designer",
    icon: "🔬",
    desc: "Design statistically valid experiments before shipping RAG changes",
  },
];

export default function EvaluationLab() {
  const [activeTab, setActiveTab] = useState("ragas");

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🧬</span>
          <div>
            <h1 className="text-2xl font-bold text-white">Evaluation Lab</h1>
            <p className="text-sm text-slate-400">
              Production-grade tooling for measuring, profiling, and shipping RAG improvements safely.
            </p>
          </div>
        </div>

        {/* Callout */}
        <div className="mt-4 bg-indigo-950/40 border border-indigo-800/40 rounded-xl p-4 flex gap-3">
          <span className="text-lg flex-shrink-0">💡</span>
          <p className="text-sm text-indigo-200 leading-relaxed">
            Production RAG systems fail silently — a parameter tweak that looks good on latency can tank
            faithfulness or recall. This lab gives you four interconnected lenses: <strong>metric understanding</strong>,{" "}
            <strong>parameter sensitivity</strong>, <strong>latency budgeting</strong>, and{" "}
            <strong>experiment design</strong>. Master all four before touching prod.
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-900/60 border border-slate-800 rounded-2xl p-1.5 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-fit flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/40"
                : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
            }`}
          >
            <span>{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Active tab description */}
      {(() => {
        const t = TABS.find((t) => t.id === activeTab);
        return (
          <p className="text-xs text-slate-500 -mt-2 px-1">{t?.desc}</p>
        );
      })()}

      {/* Tab content */}
      <div className="animate-fade-in">
        {activeTab === "ragas"    && <RAGASExplorer />}
        {activeTab === "params"   && <ParameterTuner />}
        {activeTab === "profiler" && <PipelineProfiler />}
        {activeTab === "abtest"   && <ABTestDesigner />}
      </div>
    </div>
  );
}
