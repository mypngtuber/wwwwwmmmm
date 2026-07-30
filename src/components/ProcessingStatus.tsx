"use client";

interface Props {
  status: string;
}

const steps = [
  { key: "download", label: "Downloading Video", icon: "⬇️" },
  { key: "analyze", label: "Analyzing with AI", icon: "🧠" },
  { key: "clip", label: "Clipping Video", icon: "✂️" },
  { key: "encode", label: "Encoding Output", icon: "🎬" },
];

function getActiveStep(status: string): number {
  if (status.toLowerCase().includes("download")) return 0;
  if (status.toLowerCase().includes("analy")) return 1;
  if (status.toLowerCase().includes("clip")) return 2;
  if (status.toLowerCase().includes("encod")) return 3;
  if (status.toLowerCase().includes("complete")) return 4;
  return 0;
}

export default function ProcessingStatus({ status }: Props) {
  const activeStep = getActiveStep(status);

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center">
          <svg
            className="w-4 h-4 text-indigo-400 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Processing...</h3>
          <p className="text-xs text-gray-500">{status}</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="space-y-3">
        {steps.map((step, idx) => {
          const isActive = idx === activeStep;
          const isDone = idx < activeStep;
          return (
            <div
              key={step.key}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                isActive
                  ? "bg-indigo-600/10 border border-indigo-500/30"
                  : isDone
                  ? "bg-emerald-900/10 border border-emerald-800/20"
                  : "bg-gray-800/30 border border-gray-800/30"
              }`}
            >
              <span className="text-lg">{step.icon}</span>
              <span
                className={`text-sm flex-1 ${
                  isActive
                    ? "text-indigo-300 font-medium"
                    : isDone
                    ? "text-emerald-400"
                    : "text-gray-600"
                }`}
              >
                {step.label}
              </span>
              {isDone && (
                <svg
                  className="w-4 h-4 text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
              {isActive && (
                <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          );
        })}
      </div>

      {/* Shimmer bar */}
      <div className="mt-4 h-1 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 shimmer rounded-full" style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }} />
      </div>
    </div>
  );
}
