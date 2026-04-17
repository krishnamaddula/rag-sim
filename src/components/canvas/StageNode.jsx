import { Handle, Position } from "@xyflow/react";
import { useState } from "react";
import { STAGES_BY_ID, STAGE_COLORS } from "../../data/ragStages";
import { PATTERNS_BY_ID } from "../../data/architecturePatterns";
import TechniqueSelector from "./TechniqueSelector";

export default function StageNode({ data, selected }) {
  const { stageId, activeTechniques = [], patternHighlight } = data;
  const stage = STAGES_BY_ID[stageId];
  const color = STAGE_COLORS[stageId] || { border: "#6366f1", bg: "#1e1b4b", text: "#a5b4fc", glow: "rgba(99,102,241,0.35)" };
  const [showSelector, setShowSelector] = useState(false);

  if (!stage) return null;

  const pattern = patternHighlight ? PATTERNS_BY_ID[patternHighlight] : null;
  const glowColor = pattern ? pattern.color : color.border;
  const glowStyle = (selected || patternHighlight)
    ? { boxShadow: `0 0 0 2px ${glowColor}, 0 0 20px ${patternHighlight ? glowColor + "55" : color.glow}` }
    : {};

  return (
    <div
      className="rounded-xl min-w-[220px] max-w-[280px] relative"
      style={{
        background: color.bg,
        border: `1.5px solid ${patternHighlight ? glowColor : color.border}`,
        ...glowStyle,
      }}
    >
      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: color.border, width: 10, height: 10, border: "2px solid #0f172a" }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: color.border, width: 10, height: 10, border: "2px solid #0f172a" }}
      />

      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-t-xl"
        style={{ borderBottom: `1px solid ${color.border}30` }}
      >
        <span className="text-base">{stage.icon}</span>
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: color.text }}>
          {stage.label}
        </span>
        {pattern && (
          <span
            className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: pattern.color + "30", color: pattern.color, border: `1px solid ${pattern.color}50` }}
          >
            {pattern.icon} {pattern.name}
          </span>
        )}
      </div>

      {/* Technique pills */}
      <div className="px-3 py-2 flex flex-col gap-1.5 min-h-[40px]">
        {activeTechniques.length === 0 && (
          <span className="text-[11px] text-slate-600 italic">No techniques selected</span>
        )}
        {activeTechniques.map(techId => {
          const tech = stage.techniques?.find(t => t.id === techId);
          if (!tech) return null;
          return (
            <div
              key={techId}
              className="flex items-center gap-1.5 group"
            >
              <span
                className="flex-1 text-[11px] font-medium px-2 py-0.5 rounded-full truncate"
                style={{
                  background: color.border + "20",
                  color: color.text,
                  border: `1px solid ${color.border}40`,
                }}
                title={tech.tagline}
              >
                {tech.name}
              </span>
              <button
                onMouseDown={(e) => {
                  e.stopPropagation();
                  const updated = activeTechniques.filter(id => id !== techId);
                  data.onUpdate?.({ activeTechniques: updated });
                }}
                className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 text-xs leading-none transition-opacity"
                title="Remove"
              >
                ×
              </button>
            </div>
          );
        })}

        {/* Pattern-injected techniques (read-only) */}
        {(data.patternTechniques || []).map((name, i) => (
          <div
            key={`pt-${i}`}
            className="flex items-center gap-1.5"
          >
            <span
              className="flex-1 text-[11px] font-medium px-2 py-0.5 rounded-full truncate"
              style={{
                background: (pattern?.color || "#6366f1") + "15",
                color: pattern?.color || "#a5b4fc",
                border: `1px solid ${(pattern?.color || "#6366f1")}30`,
              }}
              title="Added by pattern"
            >
              ◈ {name}
            </span>
          </div>
        ))}
      </div>

      {/* Add technique button */}
      <div className="px-3 pb-2">
        <button
          onMouseDown={(e) => { e.stopPropagation(); setShowSelector(true); }}
          className="w-full text-[11px] text-slate-500 hover:text-slate-200 border border-dashed border-slate-700 hover:border-slate-500 rounded-lg py-1 transition-colors"
        >
          + Add technique
        </button>
      </div>

      {/* Technique selector popup */}
      {showSelector && (
        <TechniqueSelector
          stage={stage}
          colorScheme={color}
          activeTechniques={activeTechniques}
          onToggle={(techId) => {
            const updated = activeTechniques.includes(techId)
              ? activeTechniques.filter(id => id !== techId)
              : [...activeTechniques, techId];
            data.onUpdate?.({ activeTechniques: updated });
          }}
          onClose={() => setShowSelector(false)}
          onInspect={(tech) => data.onInspect?.(tech, stage)}
        />
      )}
    </div>
  );
}
