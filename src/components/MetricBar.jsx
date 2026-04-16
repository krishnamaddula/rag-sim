const METRIC_LABELS = {
  latency: "Latency",
  accuracy: "Accuracy",
  complexity: "Complexity",
  cost: "Cost",
  scalability: "Scalability",
};

const METRIC_DESC = {
  latency: "1=fastest, 5=slowest",
  accuracy: "1=basic, 5=SOTA",
  complexity: "1=simple, 5=complex",
  cost: "1=cheapest, 5=most expensive",
  scalability: "1=limited, 5=highly scalable",
};

const COLORS = {
  1: "#22c55e",
  2: "#84cc16",
  3: "#eab308",
  4: "#f97316",
  5: "#ef4444",
};

export default function MetricBar({ metrics }) {
  return (
    <div className="space-y-3">
      {Object.entries(metrics).map(([key, val]) => (
        <div key={key}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              {METRIC_LABELS[key]}
            </span>
            <span className="text-xs text-slate-500">{METRIC_DESC[key]}</span>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <div
                key={n}
                className="h-2 flex-1 rounded-full transition-all duration-300"
                style={{
                  background: n <= val ? COLORS[val] : "#1e293b",
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
