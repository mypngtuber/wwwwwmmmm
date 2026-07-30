import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { jobs, settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import {
  downloadVideo,
  extractFrames,
  extractAudioSegment,
  getVideoDuration,
  getVideoResolution,
  clipVideo,
  clipVideoWithTracking,
  cleanupJob,
} from "@/lib/ffmpeg";
import { analyzeVideoForClip } from "@/lib/gemini";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const jobId = uuidv4();
  let videoPath = "";

  try {
    const body = await req.json();
    const { videoUrl, prompt, aspectRatio, model, apiKey } = body as {
      videoUrl: string;
      prompt: string;
      aspectRatio: string;
      model: string;
      apiKey?: string;
    };

    if (!videoUrl || !prompt) {
      return NextResponse.json(
        { error: "videoUrl and prompt are required" },
        { status: 400 }
      );
    }

    // Get API key from request or from saved settings
    let finalApiKey = apiKey || "";
    if (!finalApiKey) {
      const rows = await db
        .select()
        .from(settings)
        .where(eq(settings.key, "gemini_api_key"));
      if (rows.length > 0) {
        finalApiKey = rows[0].value;
      }
    }
    if (!finalApiKey) {
      finalApiKey = process.env.GEMINI_API_KEY || "";
    }
    if (!finalApiKey) {
      return NextResponse.json(
        { error: "No Gemini API key configured. Please set it in Settings." },
        { status: 400 }
      );
    }

    const selectedModel = model || "gemini-2.5-flash";

    // Create job record
    await db.insert(jobs).values({
      id: jobId,
      status: "downloading",
      videoUrl,
      prompt,
      aspectRatio: aspectRatio || "16:9",
      model: selectedModel,
    });

    // Step 1: Download video
    videoPath = downloadVideo(videoUrl, jobId);
    await db
      .update(jobs)
      .set({ status: "analyzing", originalPath: videoPath, updatedAt: new Date() })
      .where(eq(jobs.id, jobId));

    // Step 2: Extract frames and audio for analysis
    const duration = getVideoDuration(videoPath);
    const { width, height } = getVideoResolution(videoPath);
    const framePaths = extractFrames(videoPath, jobId, 10);

    let audioPath: string | null = null;
    try {
      audioPath = extractAudioSegment(videoPath, jobId, 0, Math.min(duration, 60));
    } catch {
      // Some videos may not have audio
    }

    // Step 3: Analyze with Gemini
    const analysis = await analyzeVideoForClip(
      finalApiKey,
      selectedModel,
      framePaths,
      audioPath,
      prompt,
      duration,
      width,
      height,
      aspectRatio || "16:9"
    );

    await db
      .update(jobs)
      .set({
        status: "clipping",
        clipStart: analysis.startTime,
        clipEnd: analysis.endTime,
        analysisResult: JSON.parse(JSON.stringify(analysis)),
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, jobId));

    // Step 4: Clip the video
    let outputPath: string;

    if (
      aspectRatio === "9:16" &&
      analysis.trackingPositions &&
      analysis.trackingPositions.length > 0
    ) {
      const trackingData = analysis.trackingPositions.map((p) => ({
        x: p.x,
        y: p.y,
      }));
      outputPath = await clipVideoWithTracking(
        videoPath,
        jobId,
        analysis.startTime,
        analysis.endTime,
        trackingData
      );
    } else {
      outputPath = await clipVideo(
        videoPath,
        jobId,
        analysis.startTime,
        analysis.endTime,
        aspectRatio || "16:9"
      );
    }

    await db
      .update(jobs)
      .set({
        status: "completed",
        outputPath,
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, jobId));

    return NextResponse.json({
      jobId,
      status: "completed",
      analysis,
      downloadUrl: `/api/download/${jobId}`,
      originalUrl: `/api/download/${jobId}?type=original`,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    try {
      await db
        .update(jobs)
        .set({ status: "error", error: msg, updatedAt: new Date() })
        .where(eq(jobs.id, jobId));
    } catch { /* ignore */ }

    return NextResponse.json({ error: msg, jobId }, { status: 500 });
  }
}
