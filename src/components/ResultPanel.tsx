"use client";

interface Analysis {
  startTime: string;
  endTime: string;
  confidence: number;
  description: string;
  trackingSubject?: string;
}

interface JobResult {
  jobId: string;
  status: string;
  analysis?: Analysis;
  downloadUrl?: string;
  originalUrl?: string;
  error?: string;
}

interface Props {
  result: JobResult;
  onCleanup: (jobId: string) => void;
}

export default function ResultPanel({ result, onCleanup }: Props) {
  if (result.error) {
    return (
      <div className="bg-red-900/20 border border-red-800/50 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-red-900/30 flex items-center justify-center">
            <span className="text-lg">❌</span>
          </div>
          <h3 className="text-sm font-semibold text-red-300">Processing Failed</h3>
        </div>
        <p className="text-sm text-red-400/80">{result.error}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-2xl border border-emerald-800/50 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-900/30 flex items-center justify-center">
          <span className="text-xl">✅</span>
        </div>
        <div>
          <h3 className="text-base font-bold text-emerald-300">Clip Ready!</h3>
          <p className="text-xs text-gray-500">
            {result.analysis?.description}
          </p>
        </div>
      </div>

      {/* Analysis Details */}
      {result.analysis && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-800/50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Start</p>
            <p className="text-sm font-mono text-white">
              {result.analysis.startTime}
            </p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">End</p>
            <p className="text-sm font-mono text-white">
              {result.analysis.endTime}
            </p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Confidence</p>
            <p
              className={`text-sm font-bold ${
                result.analysis.confidence > 0.7
                  ? "text-emerald-400"
                  : result.analysis.confidence > 0.4
                  ? "text-amber-400"
                  : "text-red-400"
              }`}
            >
              {Math.round(result.analysis.confidence * 100)}%
            </p>
          </div>
        </div>
      )}

      {/* Tracking info */}
      {result.analysis?.trackingSubject && (
        <div className="bg-indigo-900/20 border border-indigo-800/30 rounded-xl p-3">
          <p className="text-xs text-indigo-300">
            🎯 Tracking: {result.analysis.trackingSubject}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {result.downloadUrl && (
          <a
            href={result.downloadUrl}
            download
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Download Clip
          </a>
        )}
        {result.originalUrl && (
          <a
            href={result.originalUrl}
            download
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-medium text-sm"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
              />
            </svg>
            Save Original
          </a>
        )}
        <button
          onClick={() => onCleanup(result.jobId)}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-800 hover:bg-red-900/50 text-gray-400 hover:text-red-300 font-medium text-sm border border-gray-700 hover:border-red-800/50"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Clean Up
        </button>
      </div>
    </div>
  );
}
