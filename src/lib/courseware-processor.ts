import { execFile } from "child_process";
import { mkdtemp, readFile, rm, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { promisify } from "util";
import { db } from "@/lib/db";
import { coursewareMimeType, extensionFromFileName, isConvertibleCourseware, previewMimeType } from "@/lib/courseware-files";
import { getObject, putObjectAtKey } from "@/lib/storage";

const execFileAsync = promisify(execFile);

type ProcessingAsset = Awaited<ReturnType<typeof findPendingJob>> extends infer Job ? Job extends { asset: infer Asset } ? Asset : never : never;

async function findPendingJob() {
  return db.coursewareJob.findFirst({ where: { status: "PENDING" }, orderBy: { createdAt: "asc" }, include: { asset: true } });
}

function conversionTimeout() {
  const configured = Number(process.env.COURSEWARE_CONVERSION_TIMEOUT_MS);
  return Number.isSafeInteger(configured) && configured >= 15_000 && configured <= 10 * 60_000 ? configured : 120_000;
}

function previewMetrics(pdf: Buffer) {
  const text = pdf.toString("latin1");
  const pageCount = Math.max(1, text.match(/\/Type\s*\/Page\b/g)?.length ?? 0);
  const mediaBox = /\/MediaBox\s*\[\s*[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)\s*\]/.exec(text);
  if (!mediaBox) return { pageCount, aspectRatio: undefined };
  const width = Number(mediaBox[1]);
  const height = Number(mediaBox[2]);
  if (!Number.isFinite(width) || !Number.isFinite(height) || !height) return { pageCount, aspectRatio: undefined };
  return { pageCount, aspectRatio: `${Math.round(width)}:${Math.round(height)}` };
}

async function convertOfficeDocument(content: Buffer, extension: string) {
  const workingDirectory = await mkdtemp(path.join(os.tmpdir(), "krt-courseware-"));
  try {
    const source = path.join(workingDirectory, `source.${extension}`);
    const result = path.join(workingDirectory, "source.pdf");
    await writeFile(source, content, { flag: "wx" });
    const executable = process.env.SOFFICE_PATH?.trim() || (process.platform === "win32" ? "soffice.exe" : "soffice");
    try {
      await execFileAsync(executable, ["--headless", "--convert-to", "pdf", "--outdir", workingDirectory, source], { windowsHide: true, timeout: conversionTimeout(), maxBuffer: 1024 * 1024 });
    } catch {
      throw new Error("LIBREOFFICE_CONVERSION_FAILED");
    }
    return await readFile(result);
  } finally {
    await rm(workingDirectory, { recursive: true, force: true }).catch(() => undefined);
  }
}

async function processAsset(asset: ProcessingAsset) {
  if (!asset.originalObjectKey) throw new Error("COURSEWARE_ORIGINAL_MISSING");
  const original = await getObject(asset.originalObjectKey);
  const originalExtension = extensionFromFileName(asset.originalObjectKey);
  const assetType = asset.assetType as "PDF" | "PPT" | "WORD" | "IMAGE" | "VIDEO";
  const originalMimeType = asset.originalMimeType || coursewareMimeType(originalExtension);
  const convertible = isConvertibleCourseware(assetType);
  const preview = convertible ? await convertOfficeDocument(original, originalExtension) : original;
  const outputExtension = convertible ? "pdf" : originalExtension;
  const mimeType = previewMimeType(assetType, originalMimeType);
  const previewObjectKey = `courseware/preview/${asset.courseId}/${asset.id}/v${asset.version}.${outputExtension}`;
  const stored = await putObjectAtKey(previewObjectKey, preview, { contentType: mimeType });
  const metrics = mimeType === "application/pdf" ? previewMetrics(preview) : { pageCount: 1, aspectRatio: undefined };
  return { ...stored, previewObjectKey, previewMimeType: mimeType, ...metrics };
}

function errorCode(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  return ["COURSEWARE_ORIGINAL_MISSING", "LIBREOFFICE_CONVERSION_FAILED", "OSS_CONFIGURATION_MISSING"].includes(message) ? message : "COURSEWARE_PROCESSING_FAILED";
}

export async function processNextCoursewareJob() {
  const job = await findPendingJob();
  if (!job) return { processed: false as const };
  const claimed = await db.coursewareJob.updateMany({ where: { id: job.id, status: "PENDING" }, data: { status: "PROCESSING", attempts: { increment: 1 }, startedAt: new Date(), errorCode: null, errorDetail: null } });
  if (claimed.count !== 1) return { processed: false as const };

  await db.coursewareAsset.update({ where: { id: job.assetId }, data: { conversionStatus: "PROCESSING" } });
  try {
    const result = await processAsset(job.asset);
    await db.$transaction([
      db.coursewareAsset.update({ where: { id: job.assetId }, data: { previewObjectKey: result.previewObjectKey, previewMimeType: result.previewMimeType, pageCount: result.pageCount, aspectRatio: result.aspectRatio, conversionStatus: "READY" } }),
      db.coursewareJob.update({ where: { id: job.id }, data: { status: "SUCCEEDED", finishedAt: new Date(), errorCode: null, errorDetail: null } }),
    ]);
    return { processed: true as const, assetId: job.assetId, status: "SUCCEEDED" as const };
  } catch (error) {
    const code = errorCode(error);
    await db.$transaction([
      db.coursewareAsset.update({ where: { id: job.assetId }, data: { conversionStatus: "FAILED" } }),
      db.coursewareJob.update({ where: { id: job.id }, data: { status: "FAILED", finishedAt: new Date(), errorCode: code, errorDetail: "课件预览生成失败，请检查转换服务和文件格式。" } }),
    ]).catch(() => undefined);
    return { processed: true as const, assetId: job.assetId, status: "FAILED" as const, errorCode: code };
  }
}
