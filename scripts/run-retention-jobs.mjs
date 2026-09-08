import { rm } from "fs/promises";
import path from "path";
import { PrismaClient, WorkStatus } from "@prisma/client";

if ((process.env.STORAGE_DRIVER || "LOCAL") !== "LOCAL") {
  throw new Error("Retention worker needs an OSS implementation before STORAGE_DRIVER is changed.");
}

const db = new PrismaClient();
const root = path.resolve(process.cwd(), process.env.LOCAL_STORAGE_PATH || ".data/works");

function fileFor(objectKey) {
  const target = path.resolve(root, objectKey);
  if (!target.startsWith(`${root}${path.sep}`)) throw new Error("Invalid object key");
  return target;
}

try {
  const works = await db.work.findMany({ where: { expiresAt: { lte: new Date() }, status: { in: [WorkStatus.ACTIVE, WorkStatus.READ_ONLY, WorkStatus.EXPIRING] } }, include: { assets: true }, take: 100 });
  for (const work of works) {
    await db.work.update({ where: { id: work.id }, data: { status: WorkStatus.DELETING } });
    try {
      await Promise.all(work.assets.map((asset) => rm(fileFor(asset.objectKey), { force: true })));
      await db.work.update({ where: { id: work.id }, data: { status: WorkStatus.DELETED } });
    } catch (error) {
      await db.work.update({ where: { id: work.id }, data: { status: WorkStatus.FAILED } });
      console.error(`Retention failed for ${work.id}`, error instanceof Error ? error.message : "unknown error");
    }
  }
  console.log(`Processed ${works.length} expired works.`);
} finally {
  await db.$disconnect();
}
