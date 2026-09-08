import { execFile } from "child_process";
import { mkdtemp, readFile, rm, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { promisify } from "util";
import { db } from "@/lib/db";
import { getObject, putObjectAtKey } from "@/lib/storage";

const execFileAsync = promisify(execFile);

async function findPendingJob() {
  return db.mediaProcessingJob.findFirst({ where: { status: "PENDING" }, orderBy: { createdAt: "asc" }, include: { asset: true } });
}

function ffmpegExecutable() {
  return process.env.FFMPEG_PATH?.trim() || (process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg");
}

function processingTimeout() {
  const configured = Number(process.env.MEDIA_PROCESSING_TIMEOUT_MS);
  return Number.isSafeInteger(configured) && configured >= 30_000 && configured <= 30 * 60_000 ? configured : 10 * 60_000;
}

async function createPlayback(asset: { id: string; objectKey: string | null; mimeType: string | null }, attempt: number) {
  if (!asset.objectKey || !asset.mimeType?.startsWith("video/")) throw new Error("MEDIA_VIDEO_SOURCE_MISSING");
  const directory = await mkdtemp(path.join(os.tmpdir(), "krt-media-"));
  try {
    const source = path.join(directory, "source.bin");
    const playback = path.join(directory, "playback.mp4");
    const poster = path.join(directory, "poster.jpg");
    await writeFile(source, await getObject(asset.objectKey), { flag: "wx" });
    const executable = ffmpegExecutable();
    const execution = { windowsHide: true, timeout: processingTimeout(), maxBuffer: 1024 * 1024 };
    await execFileAsync(executable, ["-y", "-i", source, "-map", "0:v:0", "-map", "0:a?", "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-vf", "scale='min(1280,iw)':-2", "-movflags", "+faststart", "-c:a", "aac", "-b:a", "128k", playback], execution);
    await execFileAsync(executable, ["-y", "-ss", "00:00:01", "-i", source, "-frames:v", "1", "-q:v", "2", poster], execution);
    const prefix = `media/processed/${asset.id}/v${attempt}`;
    const [playbackStored, posterStored] = await Promise.all([
      putObjectAtKey(`${prefix}/playback.mp4`, await readFile(playback), { contentType: "video/mp4" }),
      putObjectAtKey(`${prefix}/poster.jpg`, await readFile(poster), { contentType: "image/jpeg" }),
    ]);
    return { playbackObjectKey: playbackStored.objectKey, thumbnailObjectKey: posterStored.objectKey };
  } finally {
    await rm(directory, { recursive: true, force: true }).catch(() => undefined);
  }
}

function errorCode(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  return message === "MEDIA_VIDEO_SOURCE_MISSING" ? message : "MEDIA_TRANSCODE_FAILED";
}

export async function processNextMediaJob() {
  const job = await findPendingJob();
  if (!job) return { processed: false as const };
  const claimed = await db.mediaProcessingJob.updateMany({ where: { id: job.id, status: "PENDING" }, data: { status: "PROCESSING", attempts: { increment: 1 }, startedAt: new Date(), errorCode: null, errorDetail: null } });
  if (claimed.count !== 1) return { processed: false as const };
  await db.mediaAsset.update({ where: { id: job.assetId }, data: { processingStatus: "PROCESSING", processingError: null } });
  try {
    const result = await createPlayback(job.asset, job.attempts + 1);
    await db.$transaction([
      db.mediaAsset.update({ where: { id: job.assetId }, data: { ...result, mimeType: "video/mp4", processingStatus: "READY", processingError: null, processedAt: new Date() } }),
      db.mediaProcessingJob.update({ where: { id: job.id }, data: { status: "SUCCEEDED", finishedAt: new Date(), errorCode: null, errorDetail: null } }),
    ]);
    return { processed: true as const, assetId: job.assetId, status: "SUCCEEDED" as const };
  } catch (error) {
    const code = errorCode(error);
    await db.$transaction([
      db.mediaAsset.update({ where: { id: job.assetId }, data: { processingStatus: "FAILED", processingError: "视频转码失败，请检查 FFmpeg 和源文件。" } }),
      db.mediaProcessingJob.update({ where: { id: job.id }, data: { status: "FAILED", finishedAt: new Date(), errorCode: code, errorDetail: "视频转码失败，请检查 FFmpeg、存储服务和源文件。" } }),
    ]).catch(() => undefined);
    return { processed: true as const, assetId: job.assetId, status: "FAILED" as const, errorCode: code };
  }
}
