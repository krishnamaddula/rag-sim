import { useEffect, useRef } from "react";

export default function ArchitectureDiagram({ technique }) {
  const svgRef = useRef(null);

  const { components = [], flow = [] } = technique;

  // Layout: simple auto-layout in rows
  const COLS = 3;
  const CARD_W = 160;
  const CARD_H = 48;
  const GAP_X = 60;
  const GAP_Y = 70;
  const PAD = 30;

  // Position each component
  const positions = {};
  components.forEach((comp, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    positions[comp.id] = {
      x: PAD + col * (CARD_W + GAP_X),
      y: PAD + row * (CARD_H + GAP_Y),
    };
  });

  const totalCols = Math.min(components.length, COLS);
  const totalRows = Math.ceil(components.length / COLS);
  const svgW = PAD * 2 + totalCols * CARD_W + (totalCols - 1) * GAP_X;
  const svgH = PAD * 2 + totalRows * CARD_H + (totalRows - 1) * GAP_Y;

  const midX = (comp) => positions[comp]?.x + CARD_W / 2;
  const midY = (comp) => positions[comp]?.y + CARD_H / 2;

  const compMap = Object.fromEntries(components.map((c) => [c.id, c]));

  return (
    <div className="overflow-x-auto">
      <svg
        ref={svgRef}
        width={svgW}
        height={svgH}
        className="rounded-xl"
        style={{ background: "rgba(15,23,42,0.6)" }}
      >
        {/* Arrows */}
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
          </marker>
        </defs>
        {flow.map(([from, to], idx) => {
          const x1 = midX(from);
          const y1 = midY(from);
          const x2 = midX(to);
          const y2 = midY(to);
          return (
            <line
              key={idx}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#475569"
              strokeWidth="2"
              markerEnd="url(#arrow)"
              strokeDasharray="4 2"
            />
          );
        })}

        {/* Component boxes */}
        {components.map((comp) => {
          const pos = positions[comp.id];
          return (
            <g key={comp.id} transform={`translate(${pos.x},${pos.y})`}>
              <rect
                width={CARD_W}
                height={CARD_H}
                rx={10}
                fill={comp.color + "22"}
                stroke={comp.color}
                strokeWidth={1.5}
              />
              <text
                x={CARD_W / 2}
                y={CARD_H / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#e2e8f0"
                fontSize="12"
                fontFamily="monospace"
              >
                {comp.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
