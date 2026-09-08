import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { Prisma, RequestStatus, WorkStatus, WorkType } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { badRequest, forbidden, internalError, serviceUnavailable, unauthorized } from "@/lib/http";
import { deleteObject, putObject } from "@/lib/storage";
import { getPersonalWorkAccess } from "@/lib/works";

const MAX_AUDIO_BYTES = 20 * 1024 * 1024;
const schema = z.object({ sourceUrl: z.string().url().max(2_000), title: z.string().trim().min(1).max(200), requestId: z.string().min(8).max(128), parentWorkId: z.string().min(1).max(128).optional() }).strict();

function publicIp(address: string) {
  if (address === "::1" || address.startsWith("fc") || address.startsWith("fd") || address.startsWith("fe80:")) return false;
  if (!address.includes(".")) return true;
  const [a, b] = address.split(".").map(Number);
  return !(a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168));
}

async function assertPublicHttps(rawUrl: string) {
  const url = new URL(rawUrl);
  if (url.protocol !== "https:" || url.username || url.password || url.port) throw new Error("SOURCE_URL_REJECTED");
  const addresses = await lookup(url.hostname, { all: true });
  if (!addresses.length || addresses.some(({ address }) => !isIP(address) || !publicIp(address))) throw new Error("SOURCE_URL_REJECTED");
  return url;
}

async function readLimited(response: Response) {
  const declared = Number(response.headers.get("content-length") ?? 0);
  if (declared > MAX_AUDIO_BYTES) throw new Error("AUDIO_TOO_LARGE");
  const reader = response.body?.getReader();
  if (!reader) throw new Error("EMPTY_AUDIO");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_AUDIO_BYTES) { await reader.cancel(); throw new Error("AUDIO_TOO_LARGE"); }
    chunks.push(value);
  }
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)), size);
}

function accessError(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHENTICATED") return unauthorized();
  if (error instanceof Error && error.message === "FORBIDDEN") return forbidden("学校课堂账号不能使用云端作品库。");
  if (error instanceof Error && error.message === "NO_STORAGE_ENTITLEMENT") return forbidden("当前账户没有可用的云端作品存储权益。");
  return null;
}

export async function POST(request: Request) {
  let objectKey: string | undefined;
  try {
    const access = await getPersonalWorkAccess();
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return badRequest("音乐导入参数无效。");
    const existing = await db.work.findFirst({ where: { ownerId: access.accountId, sourceRequestId: parsed.data.requestId }, include: { assets: true } });
    if (existing) return Response.json({ workId: existing.id, downloadUrl: `/api/works/${existing.id}/download`, replay: true });
    const source = await db.aiRequest.findFirst({ where: { requestId: parsed.data.requestId, accountId: access.accountId, status: RequestStatus.SUCCEEDED }, select: { requestId: true } });
    if (!source) return forbidden("只能导入本人已成功完成的 AI 音乐结果。");
    const parent = parsed.data.parentWorkId ? await db.work.findFirst({ where: { id: parsed.data.parentWorkId, ownerId: access.accountId, type: WorkType.MUSIC, status: { not: WorkStatus.DELETED } }, select: { id: true, version: true } }) : null;
    if (parsed.data.parentWorkId && !parent) return forbidden("只能从本人有效的音乐作品继续编辑。");
    const url = await assertPublicHttps(parsed.data.sourceUrl);
    const upstream = await fetch(url, { redirect: "error", cache: "no-store", signal: AbortSignal.timeout(60_000), headers: { Accept: "audio/*" } });
    if (!upstream.ok) throw new Error("AUDIO_FETCH_FAILED");
    const mimeType = upstream.headers.get("content-type")?.split(";", 1)[0].toLowerCase();
    if (mimeType !== "audio/mpeg" && mimeType !== "audio/wav") throw new Error("AUDIO_TYPE_REJECTED");
    const content = await readLimited(upstream);
    if (!content.length) throw new Error("EMPTY_AUDIO");
    const stored = await putObject(access.accountId, content, mimeType === "audio/wav" ? "wav" : "mp3");
    objectKey = stored.objectKey;
    const work = await db.$transaction(async (tx) => {
      const aggregate = await tx.work.aggregate({ where: { ownerId: access.accountId, status: { not: WorkStatus.DELETED } }, _sum: { sizeBytes: true } });
      if ((aggregate._sum.sizeBytes ?? BigInt(0)) + BigInt(stored.sizeBytes) > access.storageLimitBytes) throw new Error("STORAGE_QUOTA_EXCEEDED");
      const created = await tx.work.create({ data: { ownerId: access.accountId, sourceRequestId: parsed.data.requestId, type: WorkType.MUSIC, title: parsed.data.title, parentWorkId: parent?.id, version: parent ? parent.version + 1 : 1, sizeBytes: BigInt(stored.sizeBytes), expiresAt: access.isFreePlan ? new Date(Date.now() + 30 * 86_400_000) : null, assets: { create: { objectKey: stored.objectKey, mimeType, sizeBytes: BigInt(stored.sizeBytes), checksum: stored.checksum } } }, include: { assets: true } });
      await tx.aiRequest.update({ where: { requestId: parsed.data.requestId }, data: { resultRef: { workId: created.id, assetIds: created.assets.map((asset) => asset.id) } } });
      return created;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return Response.json({ workId: work.id, downloadUrl: `/api/works/${work.id}/download` }, { status: 201 });
  } catch (error) {
    if (objectKey) await deleteObject(objectKey).catch(() => undefined);
    const response = accessError(error); if (response) return response;
    if (error instanceof Error && error.message === "STORAGE_QUOTA_EXCEEDED") return forbidden("云端存储空间不足。");
    if (error instanceof Error && ["SOURCE_URL_REJECTED", "AUDIO_TOO_LARGE", "EMPTY_AUDIO", "AUDIO_TYPE_REJECTED"].includes(error.message)) return badRequest("远端音频地址、类型或大小不符合安全要求。");
    if (error instanceof Error && (error.message === "AUDIO_FETCH_FAILED" || error.name === "TimeoutError")) return serviceUnavailable("音乐已生成，但复制到作品库失败；请重试保存，不会重复扣点。");
    return internalError();
  }
}
