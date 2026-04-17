import { useState } from "react";
import { STAGE_COLORS } from "../../data/ragStages";

function PanelContent({ activeTab, tech, color }) {
  return (
    <>
      {activeTab === "about" && (
        <div className="space-y-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">What it does</div>
            <p className="text-xs text-slate-300 leading-relaxed">{tech.description}</p>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">When to use</div>
            <p className="text-xs text-slate-400 leading-relaxed">{tech.useCase}</p>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-1.5">Pros</div>
            <div className="space-y-1">
              {tech.pros.map((p, i) => (
                <div key={i} className="flex gap-2 text-xs text-slate-400">
                  <span className="text-emerald-500 flex-shrink-0 mt-0.5">+</span>
                  <span>{p}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-red-600 mb-1.5">Cons</div>
            <div className="space-y-1">
              {tech.cons.map((c, i) => (
                <div key={i} className="flex gap-2 text-xs text-slate-400">
                  <span className="text-red-500 flex-shrink-0 mt-0.5">−</span>
                  <span>{c}</span>
                </div>
              ))}
            </div>
          </div>
          {tech.scores && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Stage contribution</div>
              <div className="space-y-1.5">
                {Object.entries(tech.scores).map(([key, val]) => {
                  const pct = ((val - 1) / 4) * 100;
                  const lowerIsBetter = ["latency", "cost", "complexity"].includes(key);
                  const good = lowerIsBetter ? val <= 2 : val >= 4;
                  const bad = lowerIsBetter ? val >= 4 : val <= 2;
                  const barColor = good ? "#10b981" : bad ? "#ef4444" : "#f59e0b";
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <div className="w-20 text-[10px] text-slate-500 capitalize text-right">{key}</div>
                      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: barColor }} />
                      </div>
                      <div className="text-[10px] font-mono" style={{ color: barColor }}>{val}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "params" && (
        <div className="space-y-4">
          {(!tech.params || tech.params.length === 0) ? (
            <div className="text-xs text-slate-600 text-center py-4">No configurable parameters.</div>
          ) : (
            tech.params.map(param => (
              <ParamControl key={param.key} param={param} color={color} />
            ))
          )}
        </div>
      )}
    </>
  );
}

export default function TechniqueDetailPanel({ tech, stage, onClose, isMobile }) {
  const [activeTab, setActiveTab] = useState("about");
  const color = STAGE_COLORS[stage?.id] || { border: "#6366f1", bg: "#1e1b4b", text: "#a5b4fc" };

  if (!tech) return null;

  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <div className="fixed inset-0 z-40 bg-black/60" onClick={onClose} />
        {/* Bottom sheet */}
        <div
          className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl animate-slide-in-up"
          style={{ background: "#080f1a", maxHeight: "85vh", overflow: "hidden", borderTop: `2px solid ${color.border}` }}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-2 pb-1 flex-shrink-0">
            <div className="w-10 h-1 rounded-full bg-slate-700" />
          </div>
          {/* Header */}
          <div className="px-4 py-3 flex items-start gap-2 border-b border-slate-800 flex-shrink-0" style={{ background: color.bg }}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm">{stage?.icon}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: color.text }}>{stage?.label}</span>
              </div>
              <div className="text-sm font-bold text-white leading-tight">{tech.name}</div>
              <div className="text-[11px] text-slate-400 mt-0.5 leading-tight">{tech.tagline}</div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-200 flex-shrink-0 text-2xl leading-none w-10 h-10 flex items-center justify-center"
            >
              ×
            </button>
          </div>
          {/* Tab bar */}
          <div className="flex gap-1 p-2 border-b border-slate-800 flex-shrink-0">
            {["about", "params"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all capitalize ${
                  activeTab === tab ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                {tab === "about" ? "About" : "Params"}
              </button>
            ))}
          </div>
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <PanelContent activeTab={activeTab} tech={tech} color={color} />
          </div>
        </div>
      </>
    );
  }

  return (
    <div
      className="w-80 flex-shrink-0 flex flex-col border-l border-slate-800 animate-slide-in-right min-h-0"
      style={{ background: "#080f1a", overflow: "hidden" }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-start gap-2 border-b border-slate-800 flex-shrink-0"
        style={{ background: color.bg }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm">{stage?.icon}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: color.text }}>
              {stage?.label}
            </span>
          </div>
          <div className="text-sm font-bold text-white leading-tight">{tech.name}</div>
          <div className="text-[11px] text-slate-400 mt-0.5 leading-tight">{tech.tagline}</div>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-200 flex-shrink-0 text-lg leading-none mt-0.5">×</button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-2 border-b border-slate-800 flex-shrink-0">
        {["about", "params"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
              activeTab === tab
                ? "bg-indigo-600 text-white"
                : "text-slate-500 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            {tab === "about" ? "About" : "Params"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <PanelContent activeTab={activeTab} tech={tech} color={color} />
      </div>
    </div>
  );
}

function ParamControl({ param, color }) {
  const [value, setValue] = useState(param.default);

  const format = param.format ? param.format : (v) => {
    if (typeof v === "boolean") return v ? "On" : "Off";
    return String(v);
  };

  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-xs font-medium text-slate-300">{param.label}</span>
        <span className="text-xs font-bold font-mono" style={{ color: color.text }}>
          {param.type === "toggle" ? (value ? "On" : "Off") : format(value)}
        </span>
      </div>

      {param.type === "slider" && (
        <input
          type="range"
          min={param.min} max={param.max} step={param.step}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="w-full accent-indigo-500"
          style={{ accentColor: color.border }}
        />
      )}

      {param.type === "toggle" && (
        <button
          onClick={() => setValue(!value)}
          className={`relative w-11 h-6 rounded-full transition-colors ${value ? "" : "bg-slate-700"}`}
          style={{ background: value ? color.border : undefined }}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${value ? "translate-x-5" : ""}`}
          />
        </button>
      )}

      {param.type === "select" && (
        <select
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none"
          style={{ borderColor: color.border + "60" }}
        >
          {param.options?.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      )}

      {param.hint && (
        <div className="text-[10px] text-slate-600 mt-1">{param.hint}</div>
      )}
    </div>
  );
}
