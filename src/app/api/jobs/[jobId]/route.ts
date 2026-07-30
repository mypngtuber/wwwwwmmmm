import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const rows = await db.select().from(jobs).where(eq(jobs.id, jobId));
    if (rows.length === 0) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    const job = rows[0];
    return NextResponse.json({
      id: job.id,
      status: job.status,
      clipStart: job.clipStart,
      clipEnd: job.clipEnd,
      error: job.error,
      analysisResult: job.analysisResult,
      aspectRatio: job.aspectRatio,
      model: job.model,
      createdAt: job.createdAt,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
