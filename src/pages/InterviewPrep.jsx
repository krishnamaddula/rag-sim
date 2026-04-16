import { useState } from "react";
import { INTERVIEW_QUESTIONS, QUESTION_CATEGORIES, QUESTION_DIFFICULTIES } from "../data/interviewQuestions";

const DIFF_STYLE = {
  senior: "bg-sky-900/60 text-sky-300 border-sky-700",
  staff: "bg-violet-900/60 text-violet-300 border-violet-700",
  architect: "bg-rose-900/60 text-rose-300 border-rose-700",
};

function QuestionCard({ question }) {
  const [open, setOpen] = useState(false);
  const [revealAll, setRevealAll] = useState(false);
  const [visiblePoints, setVisiblePoints] = useState(0);
  const [mode, setMode] = useState("answer"); // answer | followups

  const handleToggle = () => {
    setOpen(!open);
    setRevealAll(false);
    setVisiblePoints(0);
    setMode("answer");
  };

  const revealNext = () => {
    if (visiblePoints < question.keyPoints.length) {
      setVisiblePoints((v) => v + 1);
    } else {
      setRevealAll(true);
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
      <button
        onClick={handleToggle}
        className="w-full text-left p-5 group"
      >
        <div className="flex flex-wrap gap-2 mb-3">
          <span
            className={`text-xs border rounded-full px-2 py-0.5 font-medium ${DIFF_STYLE[question.difficulty]}`}
          >
            {question.difficulty}
          </span>
          <span className="text-xs bg-slate-800 text-slate-400 rounded-full px-2 py-0.5">
            {question.category}
          </span>
          {question.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-slate-800/60 text-slate-500 rounded px-2 py-0.5"
            >
              #{tag}
            </span>
          ))}
        </div>
        <p className="text-white font-medium leading-relaxed group-hover:text-indigo-200 transition-colors">
          {question.question}
        </p>
        <span className="text-xs text-slate-500 mt-2 block">
          {open ? "▲ Collapse" : "▼ Show answer guide"}
        </span>
      </button>

      {open && (
        <div className="border-t border-slate-800 p-5">
          {/* Mode selector */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setMode("answer")}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                mode === "answer"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-slate-200 bg-slate-800"
              }`}
            >
              Key Points
            </button>
            <button
              onClick={() => setMode("followups")}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                mode === "followups"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-slate-200 bg-slate-800"
              }`}
            >
              Follow-up Qs
            </button>
          </div>

          {mode === "answer" && (
            <>
              <div className="space-y-3 mb-4">
                {question.keyPoints.slice(0, revealAll ? undefined : visiblePoints).map(
                  (point, i) => (
                    <div
                      key={i}
                      className="flex gap-3 bg-slate-800/40 rounded-xl p-3 animate-fade-in"
                    >
                      <span className="text-indigo-400 font-bold text-sm flex-shrink-0 mt-0.5">
                        {i + 1}.
                      </span>
                      <p className="text-slate-300 text-sm leading-relaxed">{point}</p>
                    </div>
                  )
                )}
              </div>

              {!revealAll && (
                <button
                  onClick={revealNext}
                  className="text-sm px-4 py-2 bg-indigo-700/40 hover:bg-indigo-700/60 border border-indigo-700 text-indigo-300 rounded-lg transition-all"
                >
                  {visiblePoints === 0
                    ? "Reveal first point"
                    : visiblePoints < question.keyPoints.length
                    ? `Reveal next point (${visiblePoints}/${question.keyPoints.length})`
                    : "Show all"}
                </button>
              )}
              {revealAll && (
                <p className="text-xs text-emerald-500 font-medium">
                  ✓ All {question.keyPoints.length} key points revealed
                </p>
              )}
            </>
          )}

          {mode === "followups" && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 mb-3">
                Interviewers at Staff/Architect level often dig deeper with these:
              </p>
              {question.followUps.map((fu, i) => (
                <div
                  key={i}
                  className="flex gap-3 bg-slate-800/40 rounded-xl p-3"
                >
                  <span className="text-amber-400 flex-shrink-0">→</span>
                  <p className="text-slate-300 text-sm">{fu}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function InterviewPrep() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeDiff, setActiveDiff] = useState("All");
  const [showTips, setShowTips] = useState(false);

  const filtered = INTERVIEW_QUESTIONS.filter((q) => {
    const matchCat = activeCategory === "All" || q.category === activeCategory;
    const matchDiff = activeDiff === "All" || q.difficulty === activeDiff;
    return matchCat && matchDiff;
  });

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-1">Interview Prep</h2>
        <p className="text-slate-400 text-sm">
          {INTERVIEW_QUESTIONS.length} Staff/Architect-level scenarios — reveal key
          points progressively, then practice follow-ups
        </p>
      </div>

      {/* Tips Toggle */}
      <button
        onClick={() => setShowTips(!showTips)}
        className="mb-6 text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
      >
        💡 {showTips ? "Hide" : "Show"} interview tips
      </button>

      {showTips && (
        <div className="mb-6 bg-amber-950/30 border border-amber-900/50 rounded-2xl p-5 space-y-2">
          <h3 className="font-semibold text-amber-300 mb-3">
            Staff/Architect RAG Interview Framework
          </h3>
          {[
            "Structure answers as: Requirements → Architecture → Trade-offs → Alternatives → Monitoring.",
            "Always quantify: 'p99 < 500ms', '100M vectors', '15% hallucination rate' — not vague statements.",
            "Acknowledge trade-offs proactively; interviewers respect engineers who see both sides.",
            "Tie technical choices to business impact: cost, reliability, developer velocity.",
            "For system design, start high-level then drill into one component deeply when asked.",
            "Know the numbers: HNSW indexing time, cross-encoder latency, typical embedding dimensions.",
          ].map((tip, i) => (
            <div key={i} className="flex gap-2 text-sm text-amber-200/80">
              <span className="text-amber-400 flex-shrink-0">→</span>
              {tip}
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex gap-2 flex-wrap">
          {["All", ...QUESTION_CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                activeCategory === cat
                  ? "bg-indigo-600 border-indigo-500 text-white"
                  : "border-slate-700 text-slate-400 hover:border-slate-500"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {["All", ...QUESTION_DIFFICULTIES].map((d) => (
            <button
              key={d}
              onClick={() => setActiveDiff(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize ${
                activeDiff === d
                  ? "bg-indigo-600 border-indigo-500 text-white"
                  : "border-slate-700 text-slate-400 hover:border-slate-500"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {filtered.map((q) => (
          <QuestionCard key={q.id} question={q} />
        ))}
      </div>
    </div>
  );
}
