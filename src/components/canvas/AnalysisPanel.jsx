import { useState } from "react";
import { generateNarrative, generateChallenges, scorePipeline, comparePipeline, SCORE_LABELS } from "./PipelineEngine";

const TABS = [
  { id: "explain",  label: "Explain",  icon: "📖" },
  { id: "challenge",label: "Challenge",icon: "🎯" },
  { id: "score",    label: "Score",    icon: "📊" },
  { id: "compare",  label: "Compare",  icon: "🔍" },
];

function ScoreBar({ label, value, scoreKey }) {
  const pct = ((value - 1) / 4) * 100;
  const color = value <= 2 ? "#10b981" : value === 3 ? "#f59e0b" : "#ef4444";
  // For latency/cost/complexity: lower is better. For accuracy/scalability: higher is better.
  const lowerIsBetter = ["latency", "cost", "complexity"].includes(scoreKey);
  const displayColor = lowerIsBetter
    ? (value <= 2 ? "#10b981" : value === 3 ? "#f59e0b" : "#ef4444")
    : (value >= 4 ? "#10b981" : value === 3 ? "#f59e0b" : "#ef4444");

  return (
    <div className="flex items-center gap-3">
      <div className="w-24 text-xs text-slate-400 text-right flex-shrink-0">{label}</div>
      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: displayColor }}
        />
      </div>
      <div className="w-6 text-xs font-mono font-bold flex-shrink-0" style={{ color: displayColor }}>
        {value}
      </div>
      <div className="w-36 text-[10px] text-slate-600 flex-shrink-0">
        {value <= 2 ? SCORE_LABELS[scoreKey]?.low : value >= 4 ? SCORE_LABELS[scoreKey]?.high : "moderate"}
      </div>
    </div>
  );
}

function ChallengeCard({ challenge, index }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
      <button
        className="w-full text-left px-4 py-3 flex items-start gap-3"
        onClick={() => setOpen(!open)}
      >
        <span className="text-indigo-400 font-bold text-sm flex-shrink-0 mt-0.5">Q{index + 1}</span>
        <span className="text-sm text-slate-200 flex-1 leading-snug">{challenge.q}</span>
        <span className="text-slate-600 flex-shrink-0 mt-0.5">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-slate-800">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 mb-2 mt-3">Model Answer</div>
          <div className="text-xs text-slate-400 leading-relaxed">{challenge.a}</div>
        </div>
      )}
    </div>
  );
}

function NarrativeSection({ sections }) {
  if (!sections || sections.length === 0) {
    return (
      <div className="text-center text-slate-600 py-8 text-sm">
        Add stages and techniques to the canvas to generate a pipeline narrative.
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {sections.map((section, i) => (
        <div key={i}>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">{section.heading}</div>
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{section.text}</p>
        </div>
      ))}
    </div>
  );
}

function CompareCard({ result }) {
  const pct = result.similarity;
  const barColor = pct >= 70 ? "#10b981" : pct >= 40 ? "#f59e0b" : "#64748b";
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white">{result.name}</div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${result.badgeColor}`}
          >
            {result.badge}
          </span>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-2xl font-bold" style={{ color: barColor }}>{pct}%</div>
          <div className="text-[10px] text-slate-600">match</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-3">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>

      {/* Present techniques */}
      {result.presentCount > 0 && (
        <div className="text-[10px] text-emerald-500 mb-1">
          ✓ {result.presentCount} of {result.totalTechs} techniques matched
        </div>
      )}

      {/* Missing */}
      {result.missingStagNames.length > 0 && (
        <div className="text-[10px] text-slate-600">
          Missing stages: {result.missingStagNames.join(", ")}
        </div>
      )}
      {result.missingTechNames.length > 0 && (
        <div className="text-[10px] text-slate-600 mt-0.5">
          Add to improve match: {result.missingTechNames.join(", ")}
        </div>
      )}
      {result.patternMatch && (
        <div className="text-[10px] text-indigo-400 mt-1">✓ Pattern overlay matches</div>
      )}
    </div>
  );
}

export default function AnalysisPanel({ nodes, activePatternId, onClose }) {
  const [activeTab, setActiveTab] = useState("explain");

  const scores = scorePipeline(nodes, activePatternId);
  const narrative = generateNarrative(nodes, activePatternId, scores);
  const challenges = generateChallenges(nodes, activePatternId);
  const comparisons = comparePipeline(nodes, activePatternId);

  const techCount = nodes.reduce((s, n) => s + (n.data.activeTechniques?.length || 0), 0);

  return (
    <div className="h-80 flex flex-col border-t border-slate-800 bg-slate-950 animate-slide-in-up">
      {/* Panel header */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-slate-800 flex-shrink-0">
        <span className="text-sm font-bold text-white">Pipeline Analysis</span>
        <span className="text-xs text-slate-600">{nodes.length} stages · {techCount} techniques</span>
        <div className="flex-1" />

        {/* Tab bar */}
        <div className="flex gap-1 bg-slate-900/60 border border-slate-800 rounded-xl p-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="text-slate-500 hover:text-slate-200 ml-2 text-lg leading-none"
        >
          ×
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "explain" && <NarrativeSection sections={narrative} />}

        {activeTab === "challenge" && (
          <div className="space-y-3">
            {challenges.length === 0 ? (
              <div className="text-center text-slate-600 py-8 text-sm">
                Add techniques to the canvas to generate interview challenges.
              </div>
            ) : (
              challenges.map((c, i) => <ChallengeCard key={i} challenge={c} index={i} />)
            )}
          </div>
        )}

        {activeTab === "score" && (
          <div>
            {!scores ? (
              <div className="text-center text-slate-600 py-8 text-sm">
                Add techniques to the canvas to see the scorecard.
              </div>
            ) : (
              <div className="space-y-3 max-w-2xl">
                <div className="text-xs text-slate-600 mb-4">
                  Scores are 1–5. Latency/Cost/Complexity: lower is better. Accuracy/Scalability: higher is better.
                  {activePatternId && <span className="text-indigo-400 ml-2">Pattern overlay applied.</span>}
                </div>
                <ScoreBar label="Latency"     value={scores.latency}     scoreKey="latency" />
                <ScoreBar label="Cost"        value={scores.cost}        scoreKey="cost" />
                <ScoreBar label="Accuracy"    value={scores.accuracy}    scoreKey="accuracy" />
                <ScoreBar label="Complexity"  value={scores.complexity}  scoreKey="complexity" />
                <ScoreBar label="Scalability" value={scores.scalability} scoreKey="scalability" />
              </div>
            )}
          </div>
        )}

        {activeTab === "compare" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {comparisons.map(r => <CompareCard key={r.templateId} result={r} />)}
          </div>
        )}
      </div>
    </div>
  );
}
