import "@xyflow/react/dist/style.css";
import { useState, useCallback, useRef } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
} from "@xyflow/react";

import { STAGES_BY_ID, STAGE_COLORS } from "../data/ragStages";
import { PATTERNS_BY_ID } from "../data/architecturePatterns";
import { EXAMPLE_PIPELINES } from "../data/examplePipelines";
import { useIsMobile } from "../hooks/useIsMobile";

import StageNode from "../components/canvas/StageNode";
import StagePalette from "../components/canvas/StagePalette";
import PatternOverlay from "../components/canvas/PatternOverlay";
import AnalysisPanel from "../components/canvas/AnalysisPanel";
import TechniqueDetailPanel from "../components/canvas/TechniqueDetailPanel";

// CRITICAL: define outside component to prevent infinite re-renders
const nodeTypes = { stageNode: StageNode };

const defaultEdgeOptions = {
  type: "smoothstep",
  animated: true,
  style: { stroke: "#6366f1", strokeWidth: 2 },
};

function CanvasInner({ nodes, setNodes, edges, setEdges, onNodesChange, onEdgesChange, activePattern, setInspectedTech }) {
  const { screenToFlowPosition, fitView } = useReactFlow();
  const nodeIdCounter = useRef(0);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, ...defaultEdgeOptions }, eds)),
    [setEdges]
  );

  // Update a node's data (called from within StageNode)
  const updateNodeData = useCallback((nodeId, updates) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id !== nodeId) return n;
        return { ...n, data: { ...n.data, ...updates } };
      })
    );
  }, [setNodes]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    const stageId = e.dataTransfer.getData("stageId");
    if (!stageId) return;

    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    nodeIdCounter.current += 1;
    const newId = `${stageId}-${nodeIdCounter.current}`;

    // Determine pattern context for this stage
    const patternHighlight = activePattern
      ? (PATTERNS_BY_ID[activePattern]?.affectedStages?.includes(stageId) ? activePattern : null)
      : null;

    const patternTechniques = activePattern && patternHighlight
      ? Object.values(PATTERNS_BY_ID[activePattern]?.addsTechniques?.[stageId] || [])
      : [];

    const newNode = {
      id: newId,
      type: "stageNode",
      position,
      data: {
        stageId,
        activeTechniques: [],
        patternHighlight,
        patternTechniques,
        onUpdate: (updates) => updateNodeData(newId, updates),
        onInspect: (tech, stage) => setInspectedTech({ tech, stage }),
      },
    };

    setNodes((nds) => nds.concat(newNode));
  }, [screenToFlowPosition, setNodes, activePattern, updateNodeData, setInspectedTech]);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  // Re-attach callbacks when nodes change (needed because closures capture stale state)
  const nodesWithCallbacks = nodes.map(n => ({
    ...n,
    data: {
      ...n.data,
      onUpdate: (updates) => updateNodeData(n.id, updates),
      onInspect: (tech, stage) => setInspectedTech({ tech, stage }),
    },
  }));

  // Apply pattern highlights to existing nodes when pattern changes
  const nodesWithPattern = nodesWithCallbacks.map(n => {
    const patternHighlight = activePattern
      ? (PATTERNS_BY_ID[activePattern]?.affectedStages?.includes(n.data.stageId) ? activePattern : null)
      : null;
    const patternTechniques = patternHighlight
      ? (PATTERNS_BY_ID[activePattern]?.addsTechniques?.[n.data.stageId] || [])
      : [];
    return { ...n, data: { ...n.data, patternHighlight, patternTechniques } };
  });

  // Edge color based on active pattern
  const edgeStyle = activePattern
    ? { stroke: PATTERNS_BY_ID[activePattern]?.color || "#6366f1", strokeWidth: 2 }
    : { stroke: "#6366f1", strokeWidth: 2 };

  const edgesStyled = edges.map(e => ({
    ...e,
    style: e.style || edgeStyle,
  }));

  return (
    <div className="flex-1 relative" onDrop={onDrop} onDragOver={onDragOver}>
      <ReactFlow
        nodes={nodesWithPattern}
        edges={edgesStyled}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.3}
        maxZoom={2}
        style={{ background: "#020617" }}
        deleteKeyCode="Delete"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1e293b" />
        <Controls
          style={{ background: "#0f172a", border: "1px solid #1e293b" }}
          showInteractive={false}
        />
        <MiniMap
          style={{ background: "#0f172a", border: "1px solid #1e293b" }}
          nodeColor={(n) => {
            const color = STAGE_COLORS[n.data?.stageId];
            return color?.border || "#6366f1";
          }}
          maskColor="rgba(2,6,23,0.7)"
        />
      </ReactFlow>
    </div>
  );
}

export default function PipelineCanvas() {
  const isMobile = useIsMobile();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [activePattern, setActivePattern] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [inspectedTech, setInspectedTech] = useState(null); // { tech, stage }
  const [loadedMsg, setLoadedMsg] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const togglePattern = (patternId) => {
    setActivePattern(prev => prev === patternId ? null : patternId);
  };

  const loadTemplate = (templateId) => {
    const tpl = EXAMPLE_PIPELINES.find(t => t.id === templateId);
    if (!tpl) return;
    setNodes(tpl.nodes);
    setEdges(tpl.edges);
    setActivePattern(tpl.appliedPattern || null);
    setShowAnalysis(false);
    setInspectedTech(null);
    setLoadedMsg(`Loaded: ${tpl.name}`);
    setTimeout(() => setLoadedMsg(null), 2500);
  };

  const clearCanvas = () => {
    setNodes([]);
    setEdges([]);
    setActivePattern(null);
    setShowAnalysis(false);
    setInspectedTech(null);
  };

  return (
    // Break out of App.jsx's padding wrapper
    <div className="-mx-4 sm:-mx-6 -my-8 flex flex-col overflow-hidden" style={{ height: "calc(100vh - 56px)" }}>

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-950/90 border-b border-slate-800 flex-shrink-0 z-10">
        {/* Mobile sidebar toggle */}
        <button
          className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors flex-shrink-0"
          onClick={() => setSidebarOpen(prev => !prev)}
          title="Toggle sidebar"
        >
          <span className="text-sm">☰</span>
        </button>

        {/* Template selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 hidden sm:block">Load:</span>
          <select
            onChange={(e) => { if (e.target.value) { loadTemplate(e.target.value); e.target.value = ""; } }}
            defaultValue=""
            className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-600"
          >
            <option value="" disabled>📋 Example…</option>
            {EXAMPLE_PIPELINES.map(tpl => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name} ({tpl.badge})
              </option>
            ))}
          </select>
        </div>

        {/* Loaded message */}
        {loadedMsg && (
          <span className="text-xs text-emerald-400 animate-fade-in hidden sm:block">{loadedMsg}</span>
        )}

        <div className="flex-1" />

        {/* Active pattern badge */}
        {activePattern && (
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
            style={{
              background: PATTERNS_BY_ID[activePattern]?.color + "20",
              color: PATTERNS_BY_ID[activePattern]?.color,
              border: `1px solid ${PATTERNS_BY_ID[activePattern]?.color}40`,
            }}
          >
            <span>{PATTERNS_BY_ID[activePattern]?.icon}</span>
            <span>{PATTERNS_BY_ID[activePattern]?.name}</span>
          </div>
        )}

        {/* Clear */}
        {(nodes.length > 0) && (
          <button
            onClick={clearCanvas}
            className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
          >
            Clear
          </button>
        )}

        {/* Analyze */}
        <button
          onClick={() => setShowAnalysis(prev => !prev)}
          className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            showAnalysis
              ? "bg-indigo-700 text-white"
              : "bg-indigo-600 hover:bg-indigo-500 text-white"
          }`}
        >
          <span>📊</span>
          <span className="hidden sm:inline">Analyze Pipeline</span>
          <span className="sm:hidden">Analyze</span>
        </button>
      </div>

      {/* Main body */}
      <div className="flex flex-1 overflow-hidden">
        <ReactFlowProvider>
          {/* Mobile sidebar backdrop */}
          {isMobile && sidebarOpen && (
            <div
              className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Left sidebar — always visible on desktop, overlay on mobile */}
          <div
            className={`
              ${isMobile
                ? `fixed inset-y-0 left-0 z-40 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`
                : "relative"
              }
            `}
          >
            <StagePalette
              activePattern={activePattern}
              onTogglePattern={togglePattern}
              onInspect={(tech, stage) => { setInspectedTech({ tech, stage }); if (isMobile) setSidebarOpen(false); }}
              onClose={isMobile ? () => setSidebarOpen(false) : undefined}
            />
          </div>

          {/* Canvas + overlays */}
          <div className="flex-1 relative overflow-hidden flex flex-col">
            {/* Pattern overlay banner */}
            <PatternOverlay
              activePatternId={activePattern}
              onClear={() => setActivePattern(null)}
            />

            {/* Empty state */}
            {nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="text-center space-y-2 px-6">
                  <div className="text-4xl">🔗</div>
                  <div className="text-slate-500 text-sm font-medium">
                    {isMobile ? "Tap ☰ to open the sidebar and add stages" : "Drag stages from the sidebar to build your pipeline"}
                  </div>
                  <div className="text-slate-700 text-xs">or load an example from the toolbar above</div>
                </div>
              </div>
            )}

            {/* Canvas area + detail panel */}
            <div className="flex flex-1 overflow-hidden min-h-0">
              <CanvasInner
                nodes={nodes}
                setNodes={setNodes}
                edges={edges}
                setEdges={setEdges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                activePattern={activePattern}
                setInspectedTech={setInspectedTech}
              />

              {/* Technique detail panel — right side on desktop, bottom sheet on mobile */}
              {inspectedTech && (
                <TechniqueDetailPanel
                  tech={inspectedTech.tech}
                  stage={inspectedTech.stage}
                  onClose={() => setInspectedTech(null)}
                  isMobile={isMobile}
                />
              )}
            </div>

            {/* Analysis panel */}
            {showAnalysis && (
              <AnalysisPanel
                nodes={nodes}
                activePatternId={activePattern}
                onClose={() => setShowAnalysis(false)}
                isMobile={isMobile}
              />
            )}
          </div>
        </ReactFlowProvider>
      </div>
    </div>
  );
}
