import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import TechniquesLibrary from "./pages/TechniquesLibrary";
import TechniqueDetail from "./pages/TechniqueDetail";
import InterviewPrep from "./pages/InterviewPrep";
import ScenarioSimulator from "./pages/ScenarioSimulator";
import ComparisonMatrix from "./pages/ComparisonMatrix";
import EvaluationLab from "./pages/EvaluationLab";

const NAV = [
  { id: "home", label: "Home", icon: "🏠" },
  { id: "techniques", label: "Techniques", icon: "🧩" },
  { id: "scenarios", label: "Simulator", icon: "⚙️" },
  { id: "interview", label: "Interview Prep", icon: "🎯" },
  { id: "comparison", label: "Compare", icon: "📊" },
  { id: "evaluation", label: "Eval Lab", icon: "🧬", disabled: true },
];

export default function App() {
  const [page, setPage] = useState("home");
  const [selectedTechnique, setSelectedTechnique] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigateTo = (p) => {
    setPage(p);
    setSelectedTechnique(null);
    setMobileMenuOpen(false);
  };

  const openTechnique = (id) => {
    setSelectedTechnique(id);
    setPage("technique-detail");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <button
            onClick={() => navigateTo("home")}
            className="flex items-center gap-2 font-bold text-white"
          >
            <span className="text-xl">🔍</span>
            <span className="text-sm font-mono hidden sm:block text-indigo-300">
              RAG Sim Lab
            </span>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => !n.disabled && navigateTo(n.id)}
                disabled={n.disabled}
                title={n.disabled ? "Coming soon" : undefined}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  n.disabled
                    ? "text-slate-600 cursor-not-allowed opacity-50"
                    : page === n.id || (page === "technique-detail" && n.id === "techniques")
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                }`}
              >
                <span>{n.icon}</span>
                {n.label}
                {n.disabled && <span className="text-[10px] leading-none ml-0.5">(soon)</span>}
              </button>
            ))}
          </nav>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden text-slate-400 hover:text-white p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 px-4 py-3 space-y-1">
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => !n.disabled && navigateTo(n.id)}
                disabled={n.disabled}
                title={n.disabled ? "Coming soon" : undefined}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                  n.disabled
                    ? "text-slate-600 cursor-not-allowed opacity-50"
                    : page === n.id
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-slate-100"
                }`}
              >
                {n.icon} {n.label}
                {n.disabled && <span className="text-[10px] leading-none">(soon)</span>}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Main */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        {page === "home" && <Dashboard setPage={navigateTo} />}

        {page === "techniques" && (
          <TechniquesLibrary onSelectTechnique={openTechnique} />
        )}

        {page === "technique-detail" && selectedTechnique && (
          <TechniqueDetail
            techniqueId={selectedTechnique}
            onBack={() => navigateTo("techniques")}
          />
        )}

        {page === "interview" && <InterviewPrep />}

        {page === "scenarios" && (
          <ScenarioSimulator onSelectTechnique={openTechnique} />
        )}

        {page === "comparison" && <ComparisonMatrix />}

        {page === "evaluation" && <EvaluationLab />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-4 text-center text-xs text-slate-600">
        RAG Simulation Lab — Staff & Architect Interview Prep · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
