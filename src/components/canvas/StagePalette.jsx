import { useState } from "react";
import { STAGES, STAGE_COLORS } from "../../data/ragStages";
import { PATTERNS } from "../../data/architecturePatterns";

export default function StagePalette({ activePattern, onTogglePattern, onInspect }) {
  const [expanded, setExpanded] = useState({}); // { stageId: bool }

  const toggleExpand = (e, stageId) => {
    e.stopPropagation();
    setExpanded(prev => ({ ...prev, [stageId]: !prev[stageId] }));
  };

  const onDragStart = (e, stageId) => {
    e.dataTransfer.setData("stageId", stageId);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="w-56 flex-shrink-0 flex flex-col bg-slate-950/80 border-r border-slate-800 overflow-y-auto">
      {/* Stages section */}
      <div className="px-3 pt-3 pb-1">
        <div className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mb-2 px-1">
          Pipeline Stages
        </div>
        <div className="text-[9px] text-slate-600 mb-2 px-1">Drag to canvas · click ▸ to browse</div>

        <div className="flex flex-col gap-1">
          {STAGES.map(stage => {
            const color = STAGE_COLORS[stage.id];
            const isOpen = !!expanded[stage.id];

            return (
              <div key={stage.id}>
                {/* Stage header row */}
                <div
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg select-none"
                  style={{
                    background: color.bg,
                    border: `1px solid ${isOpen ? color.border : color.border + "60"}`,
                    borderRadius: isOpen ? "8px 8px 0 0" : "8px",
                  }}
                >
                  {/* Drag handle area */}
                  <div
                    draggable
                    onDragStart={(e) => onDragStart(e, stage.id)}
                    className="flex items-center gap-1.5 flex-1 min-w-0 cursor-grab active:cursor-grabbing"
                    title="Drag onto canvas"
                  >
                    <span className="text-slate-700 text-xs flex-shrink-0">⠿</span>
                    <span className="text-sm flex-shrink-0">{stage.icon}</span>
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold truncate" style={{ color: color.text }}>
                        {stage.label}
                      </div>
                      <div className="text-[9px] text-slate-600">{stage.techniques.length} techniques</div>
                    </div>
                  </div>

                  {/* Expand toggle */}
                  <button
                    onClick={(e) => toggleExpand(e, stage.id)}
                    className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded transition-colors hover:bg-slate-700/60"
                    title={isOpen ? "Collapse" : "Browse techniques"}
                    style={{ color: isOpen ? color.text : "#475569" }}
                  >
                    <span className="text-[10px]" style={{ display: "inline-block", transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>
                      ▸
                    </span>
                  </button>
                </div>

                {/* Technique list (expanded) */}
                {isOpen && (
                  <div
                    className="rounded-b-lg overflow-hidden"
                    style={{
                      background: color.bg + "80",
                      border: `1px solid ${color.border}60`,
                      borderTop: "none",
                    }}
                  >
                    {stage.techniques.map((tech, i) => (
                      <TechniqueRow
                        key={tech.id}
                        tech={tech}
                        color={color}
                        isLast={i === stage.techniques.length - 1}
                        onInspect={() => onInspect?.(tech, stage)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="mx-3 my-2 border-t border-slate-800" />

      {/* Patterns section */}
      <div className="px-3 pb-3">
        <div className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mb-2 px-1">
          Architecture Patterns
        </div>
        <div className="text-[9px] text-slate-600 mb-2 px-1">Click to apply overlay →</div>
        <div className="flex flex-col gap-1.5">
          {PATTERNS.map(pattern => {
            const isActive = activePattern === pattern.id;
            return (
              <button
                key={pattern.id}
                onClick={() => onTogglePattern(pattern.id)}
                className="flex items-start gap-2 px-2.5 py-2 rounded-lg text-left transition-all w-full"
                style={{
                  background: isActive ? pattern.color + "20" : "transparent",
                  border: `1px solid ${isActive ? pattern.color : "#1e293b"}`,
                }}
              >
                <span className="text-sm flex-shrink-0 mt-0.5">{pattern.icon}</span>
                <div className="min-w-0">
                  <div
                    className="text-[11px] font-semibold"
                    style={{ color: isActive ? pattern.color : "#94a3b8" }}
                  >
                    {pattern.name}
                  </div>
                  <div className="text-[9px] text-slate-600 leading-tight mt-0.5 line-clamp-2">
                    {pattern.description.slice(0, 70)}…
                  </div>
                </div>
                {isActive && (
                  <span
                    className="flex-shrink-0 ml-auto text-[9px] font-bold px-1 py-0.5 rounded"
                    style={{ background: pattern.color + "30", color: pattern.color }}
                  >
                    ON
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TechniqueRow({ tech, color, isLast, onInspect }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="group px-2.5 py-1.5 cursor-default transition-colors"
      style={{
        background: hovered ? color.border + "15" : "transparent",
        borderBottom: isLast ? "none" : `1px solid ${color.border}20`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-start gap-1.5">
        {/* Dot indicator */}
        <span
          className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0"
          style={{ background: color.border + "80" }}
        />

        {/* Name + tagline */}
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-medium text-slate-300 leading-tight">{tech.name}</div>
          <div
            className="text-[9px] text-slate-600 leading-tight mt-0.5 transition-all"
            style={{
              maxHeight: hovered ? "60px" : "0px",
              overflow: "hidden",
              opacity: hovered ? 1 : 0,
            }}
          >
            {tech.tagline}
          </div>
        </div>

        {/* Details button — always visible on hover */}
        <button
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-[9px] font-medium px-1.5 py-0.5 rounded transition-all"
          style={{
            color: color.text,
            background: color.border + "25",
            border: `1px solid ${color.border}40`,
          }}
          onClick={onInspect}
          title="Open technique details"
        >
          →
        </button>
      </div>
    </div>
  );
}
