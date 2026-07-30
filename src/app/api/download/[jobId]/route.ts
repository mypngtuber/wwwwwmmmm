import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get("type") || "clip";

    const rows = await db.select().from(jobs).where(eq(jobs.id, jobId));
    if (rows.length === 0) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const job = rows[0];
    const filePath = type === "original" ? job.originalPath : job.outputPath;

    if (!filePath || !fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    const stat = fs.statSync(filePath);
    const fileStream = fs.readFileSync(filePath);
    const filename =
      type === "original"
        ? `original_${jobId}${path.extname(filePath)}`
        : `clip_${jobId}.mp4`;

    return new NextResponse(fileStream, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": stat.size.toString(),
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
