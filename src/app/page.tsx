"use client";

import { useState, useCallback } from "react";
import SettingsModal from "@/components/SettingsModal";
import ProcessingStatus from "@/components/ProcessingStatus";
import ResultPanel from "@/components/ResultPanel";

const MODELS = [
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { id: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite" },
  { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash" },
  { id: "gemini-3-flash-preview", label: "Gemini 3 Flash Preview" },
  { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash Lite" },
  { id: "gemini-3.1-flash-lite-preview", label: "Gemini 3.1 Flash Lite Preview" },
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
];

const ASPECT_RATIOS = [
  { id: "16:9", label: "16:9 Landscape", icon: "🖥️" },
  { id: "9:16", label: "9:16 Short/Reel", icon: "📱" },
];

interface JobResult {
  jobId: string;
  status: string;
  analysis?: {
    startTime: string;
    endTime: string;
    confidence: number;
    description: string;
    trackingSubject?: string;
  };
  downloadUrl?: string;
  originalUrl?: string;
  error?: string;
}

export default function Home() {
  const [videoUrl, setVideoUrl] = useState("");
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("gemini-2.5-flash");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");
  const [result, setResult] = useState<JobResult | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState("");

  const handleProcess = useCallback(async () => {
    if (!videoUrl.trim() || !prompt.trim()) {
      setError("Please provide both a video URL and a description of what you want to clip.");
      return;
    }

    setError("");
    setResult(null);
    setIsProcessing(true);
    setProcessingStatus("Sending request...");

    try {
      setProcessingStatus("Downloading video & analyzing with AI...");

      const response = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl: videoUrl.trim(),
          prompt: prompt.trim(),
          aspectRatio,
          model,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Processing failed");
      }

      setResult(data);
      setProcessingStatus("Complete!");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "An unknown error occurred";
      setError(msg);
      setProcessingStatus("");
    } finally {
      setIsProcessing(false);
    }
  }, [videoUrl, prompt, aspectRatio, model]);

  const handleCleanup = useCallback(async (jobId: string) => {
    try {
      await fetch(`/api/cleanup/${jobId}`, { method: "DELETE" });
      setResult(null);
    } catch { /* ignore */ }
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl">
              ✂️
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                AI Video Clipper
              </h1>
              <p className="text-xs text-gray-500">Powered by Google Gemini</p>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm text-gray-300 hover:text-white border border-gray-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Input */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video URL */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Video URL
                </span>
              </label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="Paste any video URL (YouTube, Twitter, etc.)..."
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                disabled={isProcessing}
              />
              <p className="mt-2 text-xs text-gray-500">
                Supports YouTube, Twitter/X, Instagram, TikTok, and more
              </p>
            </div>

            {/* Prompt */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  What do you want to clip?
                </span>
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe exactly what you want to extract from the video...&#10;&#10;Examples:&#10;• &quot;The goal scored at the end of the first half&quot;&#10;• &quot;The funny moment when the cat falls off the table&quot;&#10;• &quot;The part where the speaker talks about AI&quot;"
                rows={5}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none"
                disabled={isProcessing}
              />
            </div>

            {/* Action Button */}
            <button
              onClick={handleProcess}
              disabled={isProcessing || !videoUrl.trim() || !prompt.trim()}
              className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-3 text-base"
            >
              {isProcessing ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <span className="text-xl">✂️</span>
                  Analyze & Clip Video
                </>
              )}
            </button>

            {/* Error */}
            {error && (
              <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 flex items-start gap-3">
                <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            {/* Processing Status */}
            {isProcessing && <ProcessingStatus status={processingStatus} />}

            {/* Result */}
            {result && (
              <ResultPanel result={result} onCleanup={handleCleanup} />
            )}
          </div>

          {/* Right Panel - Options */}
          <div className="space-y-6">
            {/* Model Selection */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  AI Model
                </span>
              </label>
              <div className="space-y-2">
                {MODELS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setModel(m.id)}
                    disabled={isProcessing}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all ${
                      model === m.id
                        ? "bg-indigo-600/20 border border-indigo-500/50 text-indigo-300"
                        : "bg-gray-800/50 border border-gray-700/50 text-gray-400 hover:bg-gray-800 hover:text-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          model === m.id ? "bg-indigo-400" : "bg-gray-600"
                        }`}
                      />
                      {m.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
                  </svg>
                  Aspect Ratio
                </span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ASPECT_RATIOS.map((ar) => (
                  <button
                    key={ar.id}
                    onClick={() => setAspectRatio(ar.id)}
                    disabled={isProcessing}
                    className={`flex flex-col items-center gap-1 px-3 py-4 rounded-xl text-sm transition-all ${
                      aspectRatio === ar.id
                        ? "bg-indigo-600/20 border-2 border-indigo-500/50 text-indigo-300"
                        : "bg-gray-800/50 border-2 border-gray-700/30 text-gray-400 hover:bg-gray-800 hover:text-gray-300"
                    }`}
                  >
                    <span className="text-2xl">{ar.icon}</span>
                    <span className="font-medium">{ar.id}</span>
                    <span className="text-xs text-gray-500">
                      {ar.id === "16:9" ? "Landscape" : "Short/Reel"}
                    </span>
                  </button>
                ))}
              </div>
              {aspectRatio === "9:16" && (
                <div className="mt-3 p-3 bg-amber-900/20 border border-amber-800/30 rounded-lg">
                  <p className="text-xs text-amber-300/80">
                    📱 Smart tracking enabled: AI will track the main subject
                    and keep it centered in the frame.
                  </p>
                </div>
              )}
            </div>

            {/* Output Info */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Output Format
              </h3>
              <div className="space-y-2 text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>Codec</span>
                  <span className="text-gray-300">H.264 (High Profile)</span>
                </div>
                <div className="flex justify-between">
                  <span>Level</span>
                  <span className="text-gray-300">4.1</span>
                </div>
                <div className="flex justify-between">
                  <span>Pixel Format</span>
                  <span className="text-gray-300">YUV 4:2:0</span>
                </div>
                <div className="flex justify-between">
                  <span>Audio</span>
                  <span className="text-gray-300">AAC 192kbps</span>
                </div>
                <div className="flex justify-between">
                  <span>Container</span>
                  <span className="text-gray-300">MP4 (faststart)</span>
                </div>
                <div className="border-t border-gray-800 pt-2 mt-2">
                  <span className="text-emerald-400">✓ Premiere Pro compatible</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}
