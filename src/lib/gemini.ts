import { GoogleGenAI } from "@google/genai";
import fs from "fs";

function getClient(apiKey: string) {
  return new GoogleGenAI({ apiKey });
}

export interface AnalysisResult {
  startTime: string;
  endTime: string;
  confidence: number;
  description: string;
  trackingSubject?: string;
  trackingPositions?: { x: number; y: number; timestamp: number }[];
}

export async function analyzeVideoForClip(
  apiKey: string,
  model: string,
  framePaths: string[],
  audioPath: string | null,
  userPrompt: string,
  videoDuration: number,
  videoWidth: number,
  videoHeight: number,
  aspectRatio: string
): Promise<AnalysisResult> {
  const client = getClient(apiKey);

  // Build parts: frames as inline images
  const parts: Array<{ inlineData: { mimeType: string; data: string } } | { text: string }> = [];

  // Add frames
  for (const framePath of framePaths) {
    const data = fs.readFileSync(framePath);
    const base64 = data.toString("base64");
    // Extract timestamp from filename
    const match = framePath.match(/frame_\d+_([\d.]+)s\.jpg/);
    const ts = match ? match[1] : "unknown";
    parts.push({ text: `Frame at ${ts} seconds:` });
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: base64,
      },
    });
  }

  // Add audio if available
  if (audioPath && fs.existsSync(audioPath)) {
    const audioData = fs.readFileSync(audioPath);
    const audioBase64 = audioData.toString("base64");
    parts.push({ text: "Audio segment from the video:" });
    parts.push({
      inlineData: {
        mimeType: "audio/mpeg",
        data: audioBase64,
      },
    });
  }

  const trackingInstruction =
    aspectRatio === "9:16"
      ? `
Since the output will be in 9:16 portrait format, also identify the main moving subject in the selected clip segment (e.g., a player, ball, person, car).
Provide tracking information:
- "trackingSubject": description of the main subject to track
- "trackingPositions": array of {x, y, timestamp} where x,y are pixel positions (based on original ${videoWidth}x${videoHeight} resolution) of the subject at key moments
`
      : "";

  const systemPrompt = `You are a professional video editor AI. Analyze the provided video frames and audio to find the exact segment the user wants to clip.

Video details:
- Total duration: ${videoDuration} seconds
- Resolution: ${videoWidth}x${videoHeight}
- Target aspect ratio: ${aspectRatio}

The frames are sampled at regular intervals throughout the video. Each frame is labeled with its timestamp.

User request: "${userPrompt}"

Based on the frames and audio analysis, determine:
1. The exact start time and end time of the segment the user wants
2. Your confidence level (0-1)
3. A brief description of what's in that segment
${trackingInstruction}

Respond ONLY with a valid JSON object (no markdown, no code blocks):
{
  "startTime": "HH:MM:SS.mmm or SS.mmm format",
  "endTime": "HH:MM:SS.mmm or SS.mmm format",
  "confidence": 0.0-1.0,
  "description": "brief description"${aspectRatio === "9:16" ? ',\n  "trackingSubject": "description of subject",\n  "trackingPositions": [{"x": 0, "y": 0, "timestamp": 0}]' : ""}
}`;

  parts.unshift({ text: systemPrompt });

  const response = await client.models.generateContent({
    model: model,
    contents: [{ role: "user", parts }],
  });

  const text = response.text || "";

  // Parse JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse AI response: " + text.substring(0, 500));
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    startTime: parsed.startTime || "0",
    endTime: parsed.endTime || String(videoDuration),
    confidence: parsed.confidence || 0.5,
    description: parsed.description || "Clip extracted",
    trackingSubject: parsed.trackingSubject,
    trackingPositions: parsed.trackingPositions,
  };
}
