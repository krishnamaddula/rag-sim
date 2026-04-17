import { useState, useRef, useEffect } from "react";

export default function TechniqueSelector({ stage, colorScheme, activeTechniques, onToggle, onClose, onInspect }) {
  const [hovered, setHovered] = useState(null);
  const [openAbove, setOpenAbove] = useState(false);
  const popupRef = useRef(null);
  const color = colorScheme;

  // Detect if there's enough room below, otherwise open above
  useEffect(() => {
    if (!popupRef.current) return;
    const rect = popupRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.top;
    if (spaceBelow < 320) setOpenAbove(true);
  }, []);

  const hoveredTech = hovered ? stage.techniques.find(t => t.id === hovered) : null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onMouseDown={onClose} />

      {/* Popup */}
      <div
        ref={popupRef}
        className={`absolute z-50 ${openAbove ? "bottom-full mb-2" : "top-full mt-2"} left-0 rounded-xl border border-slate-700 shadow-2xl`}
        style={{ background: "#0f172a", width: "min(600px, 90vw)" }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-2.5 rounded-t-xl"
          style={{ background: color.bg, borderBottom: `1px solid ${color.border}40` }}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">{stage.icon}</span>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: color.text }}>
              {stage.label} Techniques
            </span>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200 text-lg leading-none">×</button>
        </div>

        {/* Two-column layout */}
        <div className="flex" style={{ maxHeight: "min(60vh, 420px)" }}>
          {/* Technique list */}
          <div className="flex-1 overflow-y-auto py-1 min-w-0">
            {stage.techniques.map(tech => {
              const isActive = activeTechniques.includes(tech.id);
              const isHovered = hovered === tech.id;
              return (
                <div
                  key={tech.id}
                  className="flex items-start gap-2.5 px-3 py-2.5 cursor-pointer transition-colors"
                  style={{ background: isHovered ? color.bg : "transparent" }}
                  onMouseEnter={() => setHovered(tech.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => onToggle(tech.id)}
                >
                  {/* Checkbox */}
                  <div
                    className="mt-0.5 w-4 h-4 rounded flex-shrink-0 flex items-center justify-center"
                    style={{
                      background: isActive ? color.border : "transparent",
                      border: `1.5px solid ${isActive ? color.border : "#475569"}`,
                    }}
                  >
                    {isActive && <span className="text-[10px] text-white font-bold">✓</span>}
                  </div>

                  {/* Name + tagline */}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-slate-200">{tech.name}</div>
                    <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{tech.tagline}</div>
                  </div>

                  {/* Info button — opens full detail panel */}
                  <button
                    className="ml-2 flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-medium text-slate-500 hover:text-slate-200 hover:bg-slate-700 transition-colors border border-transparent hover:border-slate-600"
                    onMouseDown={(e) => { e.stopPropagation(); onInspect?.(tech, stage); onClose(); }}
                    title="Open full details panel"
                  >
                    Details →
                  </button>
                </div>
              );
            })}
          </div>

          {/* Preview pane — shown when hovering a technique */}
          {hoveredTech && (
            <div
              className="flex-shrink-0 overflow-y-auto border-l border-slate-800"
              style={{ width: "240px", background: color.bg + "cc" }}
            >
              <div className="p-4 space-y-3">
                <div>
                  <div className="text-xs font-bold text-white mb-0.5">{hoveredTech.name}</div>
                  <div
                    className="text-[9px] font-bold uppercase tracking-wider mb-1.5"
                    style={{ color: color.text }}
                  >
                    {hoveredTech.fullName}
                  </div>
                  <p className="text-[10px] text-slate-300 leading-relaxed">{hoveredTech.description}</p>
                </div>

                <div>
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">When to use</div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">{hoveredTech.useCase}</p>
                </div>

                <div>
                  <div className="text-[9px] font-bold uppercase tracking-wider text-emerald-500 mb-1">Pros</div>
                  {hoveredTech.pros.map((p, i) => (
                    <div key={i} className="text-[10px] text-slate-300 flex gap-1.5 mb-0.5">
                      <span className="text-emerald-500 flex-shrink-0">+</span>
                      <span>{p}</span>
                    </div>
                  ))}
                </div>

                <div>
                  <div className="text-[9px] font-bold uppercase tracking-wider text-red-500 mb-1">Cons</div>
                  {hoveredTech.cons.map((c, i) => (
                    <div key={i} className="text-[10px] text-slate-400 flex gap-1.5 mb-0.5">
                      <span className="text-red-500 flex-shrink-0">−</span>
                      <span>{c}</span>
                    </div>
                  ))}
                </div>

                {hoveredTech.scores && (
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Trade-offs</div>
                    {Object.entries(hoveredTech.scores).map(([key, val]) => {
                      const pct = ((val - 1) / 4) * 100;
                      const lowerIsBetter = ["latency", "cost", "complexity"].includes(key);
                      const good = lowerIsBetter ? val <= 2 : val >= 4;
                      const bad = lowerIsBetter ? val >= 4 : val <= 2;
                      const barColor = good ? "#10b981" : bad ? "#ef4444" : "#f59e0b";
                      return (
                        <div key={key} className="flex items-center gap-2 mb-1">
                          <div className="w-16 text-[9px] text-slate-500 capitalize">{key}</div>
                          <div className="flex-1 h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: barColor }} />
                          </div>
                          <div className="text-[9px] font-mono w-3" style={{ color: barColor }}>{val}</div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <button
                  className="w-full text-[10px] font-medium py-1.5 rounded-lg transition-colors text-center mt-1"
                  style={{
                    background: color.border + "30",
                    color: color.text,
                    border: `1px solid ${color.border}50`,
                  }}
                  onMouseDown={(e) => { e.stopPropagation(); onInspect?.(hoveredTech, stage); onClose(); }}
                >
                  Open full details →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 border-t border-slate-800 flex items-center justify-between rounded-b-xl">
          <span className="text-[10px] text-slate-600">
            {activeTechniques.length} selected · hover to preview · "Details →" for full view
          </span>
          <button
            onClick={onClose}
            className="text-xs font-medium px-3 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
}
