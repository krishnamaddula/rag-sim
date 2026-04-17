import { PATTERNS_BY_ID } from "../../data/architecturePatterns";
import { STAGES_BY_ID } from "../../data/ragStages";

export default function PatternOverlay({ activePatternId, onClear }) {
  if (!activePatternId) return null;
  const pattern = PATTERNS_BY_ID[activePatternId];
  if (!pattern) return null;

  const affectedLabels = pattern.affectedStages
    .map(id => STAGES_BY_ID[id]?.label)
    .filter(Boolean)
    .join(", ");

  return (
    <div
      className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-4 py-2 rounded-xl border shadow-lg"
      style={{
        background: pattern.color + "15",
        borderColor: pattern.color + "50",
        backdropFilter: "blur(8px)",
      }}
    >
      <span className="text-base">{pattern.icon}</span>
      <div>
        <span className="text-xs font-bold" style={{ color: pattern.color }}>{pattern.name} overlay active</span>
        <span className="text-xs text-slate-500 ml-2">affects: {affectedLabels}</span>
      </div>
      <button
        onClick={onClear}
        className="ml-2 text-xs text-slate-500 hover:text-slate-200 transition-colors"
        title="Remove pattern"
      >
        × remove
      </button>
    </div>
  );
}
