import { useState } from "react";

// ── sub-views for each gate type ───────────────────────────────────────────

function RelevancyGraderView({ gate, threshold, setThreshold }) {
  const passing = gate.simulatedDocs.filter((d) => d.score >= threshold);
  const failing = gate.simulatedDocs.filter((d) => d.score < threshold);

  return (
    <div className="space-y-5">
      {/* Query */}
      <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700">
        <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-semibold">
          Query
        </p>
        <p className="text-slate-200 font-medium">"{gate.simulatedQuery}"</p>
      </div>

      {/* Threshold slider */}
      <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-300">
            Relevancy Threshold
          </span>
          <span
            className="text-lg font-bold"
            style={{ color: gate.color }}
          >
            {threshold.toFixed(2)}
          </span>
        </div>
        <input
          type="range"
          min={gate.thresholdMin}
          max={gate.thresholdMax}
          step={0.05}
          value={threshold}
          onChange={(e) => setThreshold(parseFloat(e.target.value))}
          className="w-full accent-amber-500"
        />
        <div className="flex justify-between text-xs text-slate-600 mt-1">
          <span>{gate.thresholdMin} (lenient)</span>
          <span>{gate.thresholdMax} (strict)</span>
        </div>
      </div>

      {/* Docs */}
      <div className="space-y-2">
        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
          Retrieved Chunks — {passing.length} pass, {failing.length} filtered
        </p>
        {gate.simulatedDocs.map((doc) => {
          const pass = doc.score >= threshold;
          return (
            <div
              key={doc.id}
              className={`rounded-xl p-4 border transition-all ${
                pass
                  ? "border-emerald-700/60 bg-emerald-950/30"
                  : "border-slate-700/40 bg-slate-900/30 opacity-50"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Score bar */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0 w-12">
                  <span
                    className="text-sm font-bold"
                    style={{ color: pass ? "#34d399" : "#94a3b8" }}
                  >
                    {doc.score.toFixed(2)}
                  </span>
                  <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${doc.score * 100}%`,
                        background: pass ? "#34d399" : "#64748b",
                      }}
                    />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-300 leading-snug">{doc.text}</p>
                  <p className="text-xs text-slate-600 mt-1">{doc.source}</p>
                </div>

                <span
                  className={`text-xs font-bold flex-shrink-0 ${
                    pass ? "text-emerald-400" : "text-slate-600"
                  }`}
                >
                  {pass ? "✓ PASS" : "✗ DROP"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-amber-950/30 border border-amber-900/50 rounded-xl p-3">
        <p className="text-xs text-amber-300">
          <span className="font-semibold">Impact:</span> Context reduced from{" "}
          {gate.simulatedDocs.length} chunks → {passing.length} chunks. Noisy
          chunks removed before generation reduces hallucination surface area.
        </p>
      </div>
    </div>
  );
}

function HallucinationDetectorView({ gate, threshold, setThreshold }) {
  const hallucScore =
    gate.simulatedClaims.filter((c) => !c.supported).length /
    gate.simulatedClaims.length;
  const passes = hallucScore <= threshold;

  return (
    <div className="space-y-5">
      {/* Score summary */}
      <div
        className={`rounded-xl p-4 border ${
          passes
            ? "bg-emerald-950/30 border-emerald-700"
            : "bg-red-950/30 border-red-700"
        }`}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-white">Hallucination Score</span>
          <span
            className={`text-2xl font-bold ${
              passes ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {hallucScore.toFixed(2)}
          </span>
        </div>
        <p
          className={`text-sm ${passes ? "text-emerald-300" : "text-red-300"}`}
        >
          {passes
            ? `✓ PASS — score ${hallucScore.toFixed(2)} ≤ threshold ${threshold.toFixed(2)}`
            : `✗ FAIL — score ${hallucScore.toFixed(2)} > threshold ${threshold.toFixed(2)} → Regenerate`}
        </p>
      </div>

      {/* Threshold */}
      <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-300">
            Hallucination Threshold
          </span>
          <span className="text-lg font-bold text-red-400">
            {threshold.toFixed(2)}
          </span>
        </div>
        <input
          type="range"
          min={gate.thresholdMin}
          max={gate.thresholdMax}
          step={0.05}
          value={threshold}
          onChange={(e) => setThreshold(parseFloat(e.target.value))}
          className="w-full accent-red-500"
        />
        <div className="flex justify-between text-xs text-slate-600 mt-1">
          <span>{gate.thresholdMin} (strict)</span>
          <span>{gate.thresholdMax} (lenient)</span>
        </div>
      </div>

      {/* Claims */}
      <div className="space-y-2">
        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
          Claim-level Analysis
        </p>
        {gate.simulatedClaims.map((claim, i) => (
          <div
            key={i}
            className={`rounded-xl p-4 border ${
              claim.supported
                ? "border-emerald-800/60 bg-emerald-950/20"
                : "border-red-800/60 bg-red-950/20"
            }`}
          >
            <div className="flex items-start gap-3">
              <span className={`text-lg flex-shrink-0 ${claim.supported ? "text-emerald-400" : "text-red-400"}`}>
                {claim.supported ? "✓" : "✗"}
              </span>
              <div className="flex-1">
                <p className="text-sm text-slate-200 mb-1">"{claim.claim}"</p>
                {claim.supported ? (
                  <p className="text-xs text-emerald-500">
                    Supported · conf {claim.confidence.toFixed(2)} · {claim.sourceSpan}
                  </p>
                ) : (
                  <p className="text-xs text-red-400">
                    Not in context — {claim.note}
                  </p>
                )}
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden mt-1.5">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${claim.confidence * 100}%`,
                      background: claim.supported ? "#34d399" : "#ef4444",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!passes && (
        <div className="bg-red-950/30 border border-red-800 rounded-xl p-3">
          <p className="text-xs text-red-300">
            <span className="font-semibold">Action:</span> Regenerate with stricter
            prompt: "Answer ONLY what is explicitly stated in the context. Quote
            directly when uncertain."
          </p>
        </div>
      )}
    </div>
  );
}

function SourceHighlighterView({ gate }) {
  const [activeCitation, setActiveCitation] = useState(null);

  // Parse the answer and make citation markers clickable
  const renderAnswer = () => {
    let text = gate.simulatedAnswer;
    const parts = [];
    let last = 0;
    const regex = /\[(\d+)\]/g;
    let m;
    while ((m = regex.exec(text)) !== null) {
      parts.push(
        <span key={last} className="text-slate-200">
          {text.slice(last, m.index)}
        </span>
      );
      const marker = m[0];
      const cit = gate.simulatedCitations.find((c) => c.marker === marker);
      parts.push(
        <button
          key={m.index}
          onClick={() => setActiveCitation(activeCitation === marker ? null : marker)}
          className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold transition-all mx-0.5 ${
            activeCitation === marker
              ? "bg-blue-500 text-white"
              : "bg-blue-900/60 text-blue-300 hover:bg-blue-800/60"
          }`}
        >
          {marker}
        </button>
      );
      last = m.index + m[0].length;
    }
    parts.push(
      <span key="end" className="text-slate-200">
        {text.slice(last)}
      </span>
    );
    return parts;
  };

  const activeCit = gate.simulatedCitations.find(
    (c) => c.marker === activeCitation
  );

  return (
    <div className="space-y-5">
      {/* Answer with clickable citations */}
      <div className="bg-slate-800/60 rounded-xl p-5 border border-slate-700">
        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">
          Answer with Inline Citations — click a marker to inspect
        </p>
        <p className="text-slate-200 leading-relaxed text-sm">{renderAnswer()}</p>
      </div>

      {/* Active citation detail */}
      {activeCit && (
        <div className="bg-blue-950/40 border border-blue-700 rounded-xl p-4 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-blue-500 text-white px-2 py-0.5 rounded text-xs font-bold">
              {activeCit.marker}
            </span>
            <span className="text-blue-300 font-semibold text-sm">
              {activeCit.source} · p.{activeCit.page}
            </span>
            <span className="ml-auto text-xs text-blue-400">
              conf {activeCit.confidence.toFixed(2)}
            </span>
          </div>
          <div className="bg-blue-900/30 rounded-lg p-3 border border-blue-800">
            <p className="text-xs text-blue-300 mb-1 uppercase tracking-wider">
              Supporting span:
            </p>
            <p className="text-sm text-white font-medium">
              "…{activeCit.span}…"
            </p>
          </div>
        </div>
      )}

      {/* Citation list */}
      <div className="space-y-2">
        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
          All Citations ({gate.simulatedCitations.length})
        </p>
        {gate.simulatedCitations.map((cit) => (
          <button
            key={cit.marker}
            onClick={() =>
              setActiveCitation(activeCitation === cit.marker ? null : cit.marker)
            }
            className={`w-full text-left rounded-xl p-3 border transition-all ${
              activeCitation === cit.marker
                ? "border-blue-500 bg-blue-900/30"
                : "border-slate-700 bg-slate-800/40 hover:border-slate-600"
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="bg-blue-700 text-white px-1.5 py-0.5 rounded text-xs font-bold flex-shrink-0">
                {cit.marker}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 mb-0.5">
                  {cit.source} · p.{cit.page}
                </p>
                <p className="text-xs text-slate-300 truncate">
                  "…{cit.span}…"
                </p>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="text-xs text-blue-400 font-mono">
                  {cit.confidence.toFixed(2)}
                </div>
                <div className="w-12 h-1 bg-slate-700 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full rounded-full bg-blue-400"
                    style={{ width: `${cit.confidence * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ConfidenceScorerView({ gate }) {
  const { simulatedFormula: f } = gate;
  const computedScore =
    f.avgRelevancy * f.weights.relevancy +
    (1 - f.hallucScore) * f.weights.hallucination +
    f.citationCoverage * f.weights.citation;

  const scoreColor =
    computedScore >= 0.85
      ? "#22c55e"
      : computedScore >= 0.65
      ? "#f59e0b"
      : "#ef4444";

  const dispositionLabel =
    computedScore >= 0.85
      ? "auto-return ✓"
      : computedScore >= 0.65
      ? "return with warning ⚠"
      : "escalate / refuse ✗";

  const components = [
    {
      label: "Avg Relevancy Score",
      raw: f.avgRelevancy,
      weight: f.weights.relevancy,
      contribution: f.avgRelevancy * f.weights.relevancy,
      color: "#f59e0b",
    },
    {
      label: "Groundedness (1 − halluc)",
      raw: 1 - f.hallucScore,
      weight: f.weights.hallucination,
      contribution: (1 - f.hallucScore) * f.weights.hallucination,
      color: "#ef4444",
    },
    {
      label: "Citation Coverage",
      raw: f.citationCoverage,
      weight: f.weights.citation,
      contribution: f.citationCoverage * f.weights.citation,
      color: "#3b82f6",
    },
  ];

  return (
    <div className="space-y-5">
      {/* Big score */}
      <div className="bg-slate-800/60 rounded-xl p-6 border border-slate-700 text-center">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
          Final Confidence Score
        </p>
        <div
          className="text-6xl font-bold mb-2"
          style={{ color: scoreColor }}
        >
          {computedScore.toFixed(2)}
        </div>
        <div
          className="inline-flex px-3 py-1 rounded-full text-sm font-semibold border"
          style={{
            color: scoreColor,
            borderColor: scoreColor + "60",
            background: scoreColor + "15",
          }}
        >
          {dispositionLabel}
        </div>
      </div>

      {/* Formula breakdown */}
      <div className="bg-slate-800/40 rounded-xl p-5 border border-slate-700">
        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-4">
          Score Breakdown
        </p>
        <div className="space-y-4">
          {components.map((comp, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: comp.color }}
                  />
                  <span className="text-sm text-slate-300">{comp.label}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-slate-500">
                    {comp.raw.toFixed(2)} × {comp.weight}
                  </span>
                  <span className="font-bold" style={{ color: comp.color }}>
                    = {comp.contribution.toFixed(3)}
                  </span>
                </div>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${comp.contribution * 100 / computedScore}%`,
                    background: comp.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-700 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-300">
            Total confidence
          </span>
          <span className="font-bold text-lg" style={{ color: scoreColor }}>
            {computedScore.toFixed(3)}
          </span>
        </div>
      </div>

      {/* Disposition table */}
      <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700">
        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">
          Disposition Rules
        </p>
        {[
          { range: "≥ 0.85", label: "Auto-return", color: "#22c55e", desc: "High confidence — return immediately" },
          { range: "0.65 – 0.84", label: "Return with warning", color: "#f59e0b", desc: "Show confidence badge, suggest review" },
          { range: "< 0.65", label: "Escalate / Refuse", color: "#ef4444", desc: "Route to human or decline to answer" },
        ].map((row) => (
          <div
            key={row.range}
            className={`flex items-center gap-3 py-2 border-b border-slate-700/50 last:border-0 ${
              computedScore >= 0.85 && row.range === "≥ 0.85"
                ? "opacity-100"
                : computedScore >= 0.65 && computedScore < 0.85 && row.range === "0.65 – 0.84"
                ? "opacity-100"
                : computedScore < 0.65 && row.range === "< 0.65"
                ? "opacity-100"
                : "opacity-40"
            }`}
          >
            <code
              className="text-xs font-mono px-2 py-0.5 rounded flex-shrink-0"
              style={{ background: row.color + "20", color: row.color }}
            >
              {row.range}
            </code>
            <span className="text-sm font-medium text-slate-300">{row.label}</span>
            <span className="text-xs text-slate-500 ml-auto">{row.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main simulator ─────────────────────────────────────────────────────────

const GATE_VIEWS = {
  "relevancy-grader": RelevancyGraderView,
  "hallucination-detector": HallucinationDetectorView,
  "source-highlighter": SourceHighlighterView,
  "confidence-scorer": ConfidenceScorerView,
};

const PHASE_COLOR = {
  "Pre-Generation": "bg-amber-900/40 text-amber-300 border-amber-800",
  "Post-Generation": "bg-blue-900/40 text-blue-300 border-blue-800",
};

export default function QualityGateSimulator({ qualityGates }) {
  const [activeGate, setActiveGate] = useState(qualityGates[0]?.id ?? null);
  const [thresholds, setThresholds] = useState(
    Object.fromEntries(
      qualityGates
        .filter((g) => g.thresholdKey)
        .map((g) => [g.id, g.thresholdDefault])
    )
  );

  const gate = qualityGates.find((g) => g.id === activeGate);
  const GateView = gate ? GATE_VIEWS[gate.id] : null;

  return (
    <div className="space-y-6">
      {/* Pipeline stepper */}
      <div className="bg-slate-900/60 rounded-2xl p-5 border border-slate-800">
        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-4">
          Quality Gate Pipeline — click a gate to simulate
        </p>

        {/* Desktop horizontal stepper */}
        <div className="flex items-stretch gap-0 overflow-x-auto pb-2">
          {qualityGates.map((g, i) => (
            <div key={g.id} className="flex items-center">
              <button
                onClick={() => setActiveGate(g.id)}
                className={`flex flex-col items-center gap-2 px-4 py-3 rounded-xl border transition-all min-w-[110px] ${
                  activeGate === g.id
                    ? "border-2 shadow-lg"
                    : "border-slate-700/60 hover:border-slate-600"
                }`}
                style={
                  activeGate === g.id
                    ? {
                        borderColor: g.color,
                        background: g.color + "15",
                      }
                    : {}
                }
              >
                <span className="text-2xl">{g.icon}</span>
                <span
                  className="text-xs font-semibold text-center leading-tight"
                  style={{ color: activeGate === g.id ? g.color : "#94a3b8" }}
                >
                  {g.name}
                </span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded border ${
                    PHASE_COLOR[g.phase] || "bg-slate-800 text-slate-400"
                  }`}
                >
                  {g.phase}
                </span>
              </button>
              {i < qualityGates.length - 1 && (
                <div className="flex items-center px-1">
                  <div className="w-8 h-px bg-slate-600" />
                  <span className="text-slate-600 text-xs">→</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Gate detail */}
      {gate && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: meta */}
          <div className="space-y-4">
            <div
              className="rounded-2xl p-5 border"
              style={{
                borderColor: gate.color + "50",
                background: gate.color + "0d",
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{gate.icon}</span>
                <div>
                  <h3 className="font-bold text-white">{gate.name}</h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded border ${
                      PHASE_COLOR[gate.phase] || ""
                    }`}
                  >
                    {gate.phase}
                  </span>
                </div>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                {gate.description}
              </p>
            </div>

            <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800 space-y-3">
              {[
                { label: "Input", value: gate.inputLabel },
                { label: "Output", value: gate.outputLabel },
                { label: "Latency", value: gate.latencyMs },
                gate.passCondition && {
                  label: "Pass if",
                  value: gate.passCondition,
                },
                gate.failAction && {
                  label: "On fail",
                  value: gate.failAction,
                },
              ]
                .filter(Boolean)
                .map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">
                      {label}
                    </p>
                    <p className="text-sm text-slate-300">{value}</p>
                  </div>
                ))}
            </div>

            {gate.implementation && (
              <div className="bg-slate-900/40 rounded-xl p-4 border border-slate-800">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-semibold">
                  Implementation Options
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {gate.implementation}
                </p>
              </div>
            )}
          </div>

          {/* Right: interactive simulation */}
          <div className="lg:col-span-2 bg-slate-900/60 rounded-2xl p-5 border border-slate-800">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-4">
              Live Simulation
            </p>
            {GateView && (
              <GateView
                gate={gate}
                threshold={thresholds[gate.id] ?? gate.thresholdDefault}
                setThreshold={(v) =>
                  setThresholds((prev) => ({ ...prev, [gate.id]: v }))
                }
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
