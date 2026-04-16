import { useState } from "react";
import { SCENARIOS, SCENARIO_TAGS } from "../data/scenarios";
import { RAG_TECHNIQUES } from "../data/techniques";

const TECH_MAP = Object.fromEntries(RAG_TECHNIQUES.map((t) => [t.id, t]));

const CATEGORY_FILTERS = [
  { id: "all", label: "All", icon: "🗂️" },
  { id: "foundation", label: "Foundation", icon: "🔧" },
  { id: "enterprise", label: "Enterprise", icon: "🏢" },
  { id: "research", label: "Knowledge-Intensive", icon: "🔬" },
  { id: "realtime", label: "Real-Time & Scale", icon: "⚡" },
];

function ScenarioCard({ scenario, selected, onClick }) {
  const tag = SCENARIO_TAGS[scenario.id];
  const tagColors = {
    foundation: "bg-violet-900/40 text-violet-300",
    enterprise: "bg-blue-900/40 text-blue-300",
    research: "bg-amber-900/40 text-amber-300",
    realtime: "bg-rose-900/40 text-rose-300",
  };

  return (
    <button
      onClick={onClick}
      className={`text-left rounded-2xl border p-5 transition-all group ${
        selected
          ? "border-indigo-500 bg-indigo-900/30 shadow-lg shadow-indigo-900/20"
          : "border-slate-700 bg-slate-900/40 hover:border-slate-600 hover:bg-slate-900/60"
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-bold text-white text-sm leading-snug group-hover:text-indigo-200 transition-colors">
          {scenario.title}
        </h3>
        {tag && (
          <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${tagColors[tag] || "bg-slate-800 text-slate-400"}`}>
            {CATEGORY_FILTERS.find(f => f.id === tag)?.label || tag}
          </span>
        )}
      </div>
      <p className="text-xs text-slate-400 leading-snug mb-3 line-clamp-2">
        {scenario.description}
      </p>
      <div className="flex flex-wrap gap-1">
        {scenario.constraints.slice(0, 3).map((c) => (
          <span key={c} className="text-xs bg-slate-800/80 text-slate-500 rounded px-1.5 py-0.5">
            {c}
          </span>
        ))}
        {scenario.constraints.length > 3 && (
          <span className="text-xs text-slate-600">+{scenario.constraints.length - 3}</span>
        )}
      </div>
    </button>
  );
}

export default function ScenarioSimulator({ onSelectTechnique }) {
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [userPicks, setUserPicks] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchText, setSearchText] = useState("");

  const filteredScenarios = SCENARIOS.filter((s) => {
    const matchCat = categoryFilter === "all" || SCENARIO_TAGS[s.id] === categoryFilter;
    const matchSearch =
      !searchText ||
      s.title.toLowerCase().includes(searchText.toLowerCase()) ||
      s.description.toLowerCase().includes(searchText.toLowerCase()) ||
      s.constraints.some((c) => c.toLowerCase().includes(searchText.toLowerCase()));
    return matchCat && matchSearch;
  });

  const selectScenario = (s) => {
    setSelectedScenario(s);
    setUserPicks([]);
    setSubmitted(false);
    // Scroll to design panel
    setTimeout(() => {
      document.getElementById("design-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const togglePick = (id) => {
    if (submitted) return;
    setUserPicks((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const evaluate = () => setSubmitted(true);

  const score = submitted
    ? {
        correct: userPicks.filter((p) => selectedScenario.recommended.includes(p)).length,
        total: selectedScenario.recommended.length,
        falsePositives: userPicks.filter((p) => selectedScenario.antipatterns.includes(p)),
        missed: selectedScenario.recommended.filter((p) => !userPicks.includes(p)),
      }
    : null;

  const isPerfect = score?.correct === score?.total && score?.falsePositives.length === 0;

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-1">Scenario Simulator</h2>
        <p className="text-slate-400 text-sm">
          {SCENARIOS.length} real-world scenarios — pick your architecture, then get
          scored with expert rationale
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search scenarios..."
          className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 w-56"
        />
        <div className="flex gap-2 flex-wrap">
          {CATEGORY_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setCategoryFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1 ${
                categoryFilter === f.id
                  ? "bg-indigo-600 border-indigo-500 text-white"
                  : "border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200"
              }`}
            >
              {f.icon} {f.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-600 self-center ml-auto">
          {filteredScenarios.length} of {SCENARIOS.length} scenarios
        </span>
      </div>

      {/* Scenario Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-8">
        {filteredScenarios.map((s) => (
          <ScenarioCard
            key={s.id}
            scenario={s}
            selected={selectedScenario?.id === s.id}
            onClick={() => selectScenario(s)}
          />
        ))}
        {filteredScenarios.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500">
            No scenarios match your filters.
          </div>
        )}
      </div>

      {/* Design Panel */}
      {selectedScenario && (
        <div id="design-panel" className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          {/* Header */}
          <div className="mb-6 pb-5 border-b border-slate-800">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">{selectedScenario.title}</h3>
                <p className="text-slate-300 text-sm leading-relaxed max-w-2xl">
                  {selectedScenario.description}
                </p>
              </div>
              <button
                onClick={() => setSelectedScenario(null)}
                className="text-slate-600 hover:text-slate-400 text-xl flex-shrink-0"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {selectedScenario.constraints.map((c) => (
                <span
                  key={c}
                  className="text-xs bg-indigo-900/40 border border-indigo-800 text-indigo-300 rounded-full px-3 py-1"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* Technique picker */}
          <div className="mb-5">
            <p className="text-sm font-semibold text-slate-300 mb-1">
              Which RAG techniques would you use?
            </p>
            <p className="text-xs text-slate-500 mb-4">
              Select all that apply — you can pick multiple. Then click Evaluate.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {RAG_TECHNIQUES.map((t) => {
                const picked = userPicks.includes(t.id);
                const isRecommended = selectedScenario.recommended.includes(t.id);
                const isAntipattern = selectedScenario.antipatterns.includes(t.id);

                let cls = "border-slate-700 bg-slate-800/30 hover:border-slate-500";
                if (!submitted && picked) cls = "border-indigo-500 bg-indigo-900/30";
                if (submitted) {
                  if (isRecommended && picked) cls = "border-emerald-500 bg-emerald-900/30";
                  else if (isRecommended && !picked) cls = "border-emerald-800/60 bg-emerald-900/10";
                  else if (isAntipattern && picked) cls = "border-red-600 bg-red-900/30";
                  else cls = "border-slate-700/40 bg-slate-800/20 opacity-50";
                }

                return (
                  <button
                    key={t.id}
                    onClick={() => togglePick(t.id)}
                    disabled={submitted}
                    className={`text-left rounded-xl border p-2.5 transition-all ${cls} ${
                      submitted ? "cursor-default" : "cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-base">{t.icon}</span>
                      <span className="text-xs text-slate-300 font-medium leading-tight">
                        {t.name}
                      </span>
                    </div>
                    {submitted && isRecommended && (
                      <span className="text-xs text-emerald-400 block">
                        {picked ? "✓ correct" : "○ missed"}
                      </span>
                    )}
                    {submitted && isAntipattern && picked && (
                      <span className="text-xs text-red-400 block">✗ antipattern</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action */}
          {!submitted ? (
            <button
              onClick={evaluate}
              disabled={userPicks.length === 0}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all"
            >
              Evaluate My Design →
            </button>
          ) : (
            <div className="space-y-4">
              {/* Score banner */}
              <div
                className={`rounded-xl p-4 border ${
                  isPerfect
                    ? "bg-emerald-900/30 border-emerald-700"
                    : score.correct >= score.total * 0.5
                    ? "bg-amber-900/20 border-amber-800"
                    : "bg-slate-800/40 border-slate-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">
                    {isPerfect ? "🎯" : score.correct >= score.total * 0.5 ? "📊" : "💡"}
                  </span>
                  <div>
                    <p className="font-bold text-white text-lg">
                      {score.correct}/{score.total} recommended techniques identified
                    </p>
                    <div className="flex gap-4 text-sm mt-0.5">
                      {score.falsePositives.length > 0 && (
                        <span className="text-red-400">
                          {score.falsePositives.length} antipattern{score.falsePositives.length > 1 ? "s" : ""} picked
                        </span>
                      )}
                      {score.missed.length > 0 && (
                        <span className="text-amber-400">
                          {score.missed.length} technique{score.missed.length > 1 ? "s" : ""} missed
                        </span>
                      )}
                      {isPerfect && (
                        <span className="text-emerald-400">Perfect architecture!</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Missed techniques */}
              {score.missed.length > 0 && (
                <div className="bg-amber-950/20 border border-amber-900/50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
                    Techniques you missed
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {score.missed.map((id) => {
                      const t = TECH_MAP[id];
                      return (
                        <span key={id} className="flex items-center gap-1.5 bg-amber-900/20 border border-amber-800 rounded-lg px-2.5 py-1.5 text-xs text-amber-300">
                          {t?.icon} {t?.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Antipatterns picked */}
              {score.falsePositives.length > 0 && (
                <div className="bg-red-950/20 border border-red-900/50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">
                    Antipatterns you selected
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {score.falsePositives.map((id) => {
                      const t = TECH_MAP[id];
                      return (
                        <span key={id} className="flex items-center gap-1.5 bg-red-900/20 border border-red-800 rounded-lg px-2.5 py-1.5 text-xs text-red-300">
                          {t?.icon} {t?.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Rationale */}
              <div className="bg-slate-800/40 rounded-xl p-5 border border-slate-700">
                <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <span>💬</span> Expert Rationale
                </h4>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {selectedScenario.rationale}
                </p>
              </div>

              {/* Deep-dive links */}
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 font-semibold">
                  Deep-dive into recommended techniques
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedScenario.recommended.map((id) => {
                    const t = TECH_MAP[id];
                    return (
                      <button
                        key={id}
                        onClick={() => onSelectTechnique(id)}
                        className="flex items-center gap-2 bg-indigo-900/40 hover:bg-indigo-900/60 border border-indigo-700 rounded-lg px-3 py-2 text-sm text-indigo-300 transition-all"
                      >
                        {t?.icon} {t?.name} →
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Try again / next */}
              <div className="flex gap-4 pt-2">
                <button
                  onClick={() => { setSubmitted(false); setUserPicks([]); }}
                  className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
                >
                  ← Try again
                </button>
                <button
                  onClick={() => {
                    const idx = SCENARIOS.findIndex(s => s.id === selectedScenario.id);
                    const next = SCENARIOS[(idx + 1) % SCENARIOS.length];
                    selectScenario(next);
                  }}
                  className="text-sm text-indigo-400 hover:text-indigo-200 transition-colors"
                >
                  Next scenario →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
