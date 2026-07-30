import { execSync, exec } from "child_process";
import path from "path";
import fs from "fs";

const TEMP_DIR = "/tmp/videoclipper";

export function ensureTempDir() {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
  return TEMP_DIR;
}

export function downloadVideo(url: string, jobId: string): string {
  const tmpDir = ensureTempDir();
  const outputTemplate = path.join(tmpDir, `${jobId}.%(ext)s`);

  execSync(
    `yt-dlp --no-playlist -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" --merge-output-format mp4 -o "${outputTemplate}" "${url}"`,
    { timeout: 300000, stdio: "pipe" }
  );

  // Find the downloaded file
  const files = fs.readdirSync(tmpDir).filter((f) => f.startsWith(jobId));
  if (files.length === 0) throw new Error("Download failed - no file found");
  return path.join(tmpDir, files[0]);
}

export function extractFrames(
  videoPath: string,
  jobId: string,
  count: number = 8
): string[] {
  const tmpDir = ensureTempDir();
  const framesDir = path.join(tmpDir, `${jobId}_frames`);
  if (!fs.existsSync(framesDir)) {
    fs.mkdirSync(framesDir, { recursive: true });
  }

  // Get video duration
  const durationStr = execSync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`,
    { encoding: "utf-8" }
  ).trim();
  const duration = parseFloat(durationStr);

  const interval = duration / (count + 1);
  const framePaths: string[] = [];

  for (let i = 1; i <= count; i++) {
    const timestamp = (interval * i).toFixed(2);
    const framePath = path.join(framesDir, `frame_${i}_${timestamp}s.jpg`);
    execSync(
      `ffmpeg -y -ss ${timestamp} -i "${videoPath}" -vframes 1 -q:v 3 "${framePath}"`,
      { stdio: "pipe" }
    );
    framePaths.push(framePath);
  }

  return framePaths;
}

export function extractAudioSegment(
  videoPath: string,
  jobId: string,
  startSec: number = 0,
  durationSec: number = 30
): string {
  const tmpDir = ensureTempDir();
  const audioPath = path.join(tmpDir, `${jobId}_audio.mp3`);
  execSync(
    `ffmpeg -y -ss ${startSec} -i "${videoPath}" -t ${durationSec} -vn -acodec libmp3lame -q:a 4 "${audioPath}"`,
    { stdio: "pipe" }
  );
  return audioPath;
}

export function getVideoDuration(videoPath: string): number {
  const durationStr = execSync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`,
    { encoding: "utf-8" }
  ).trim();
  return parseFloat(durationStr);
}

export function getVideoResolution(videoPath: string): { width: number; height: number } {
  const info = execSync(
    `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "${videoPath}"`,
    { encoding: "utf-8" }
  ).trim();
  const [w, h] = info.split(",").map(Number);
  return { width: w, height: h };
}

export function clipVideo(
  videoPath: string,
  jobId: string,
  startTime: string,
  endTime: string,
  aspectRatio: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const tmpDir = ensureTempDir();
    const outputPath = path.join(tmpDir, `${jobId}_clip.mp4`);

    const { width, height } = getVideoResolution(videoPath);

    let filterComplex = "";

    if (aspectRatio === "9:16") {
      // Portrait mode - crop to 9:16 with center tracking
      const targetW = Math.min(width, Math.floor((height * 9) / 16));
      const targetH = height;
      const x = Math.floor((width - targetW) / 2);
      filterComplex = `-vf "crop=${targetW}:${targetH}:${x}:0,scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2"`;
    } else {
      // 16:9 landscape
      filterComplex = `-vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2"`;
    }

    const cmd = `ffmpeg -y -ss ${startTime} -to ${endTime} -i "${videoPath}" ${filterComplex} -c:v libx264 -profile:v high -level:v 4.1 -pix_fmt yuv420p -preset medium -crf 18 -c:a aac -b:a 192k -movflags +faststart "${outputPath}"`;

    exec(cmd, { timeout: 600000 }, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve(outputPath);
      }
    });
  });
}

export function clipVideoWithTracking(
  videoPath: string,
  jobId: string,
  startTime: string,
  endTime: string,
  trackingData?: { x: number; y: number }[]
): Promise<string> {
  return new Promise((resolve, reject) => {
    const tmpDir = ensureTempDir();
    const outputPath = path.join(tmpDir, `${jobId}_clip.mp4`);
    const { width, height } = getVideoResolution(videoPath);

    // For 9:16, calculate crop dimensions
    const cropW = Math.floor((height * 9) / 16);
    const cropH = height;

    let filterStr: string;
    if (trackingData && trackingData.length > 0) {
      // Build dynamic crop filter with tracking points
      // Use sendcmd to shift crop center over time
      const centerX = Math.floor(width / 2);
      const halfCropW = Math.floor(cropW / 2);

      // Compute average tracking position for a simple approach
      const avgX = Math.floor(
        trackingData.reduce((sum, p) => sum + p.x, 0) / trackingData.length
      );
      const clampedX = Math.max(halfCropW, Math.min(width - halfCropW, avgX));

      filterStr = `crop=${cropW}:${cropH}:${clampedX - halfCropW}:0,scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2`;
    } else {
      // Center crop
      const x = Math.floor((width - cropW) / 2);
      filterStr = `crop=${cropW}:${cropH}:${x}:0,scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2`;
    }

    const cmd = `ffmpeg -y -ss ${startTime} -to ${endTime} -i "${videoPath}" -vf "${filterStr}" -c:v libx264 -profile:v high -level:v 4.1 -pix_fmt yuv420p -preset medium -crf 18 -c:a aac -b:a 192k -movflags +faststart "${outputPath}"`;

    exec(cmd, { timeout: 600000 }, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve(outputPath);
      }
    });
  });
}

export function cleanupJob(jobId: string) {
  const tmpDir = ensureTempDir();
  const files = fs.readdirSync(tmpDir).filter((f) => f.startsWith(jobId));
  for (const file of files) {
    try {
      const fullPath = path.join(tmpDir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        fs.rmSync(fullPath, { recursive: true });
      } else {
        fs.unlinkSync(fullPath);
      }
    } catch { /* ignore */ }
  }
}
