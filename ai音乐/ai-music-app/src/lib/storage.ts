import { createHash, randomUUID } from "crypto";
import { mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";

export type StoredObject = {
  objectKey: string;
  checksum: string;
  sizeBytes: number;
};

function localRoot() {
  const configured = process.env.LOCAL_STORAGE_PATH || ".data/works";
  return path.resolve(/* turbopackIgnore: true */ process.cwd(), configured);
}

function localPathFor(objectKey: string) {
  const root = localRoot();
  const target = path.resolve(root, objectKey);
  if (!target.startsWith(`${root}${path.sep}`)) throw new Error("INVALID_OBJECT_KEY");
  return target;
}

function driver() {
  return process.env.STORAGE_DRIVER || "LOCAL";
}

export async function putObject(accountId: string, content: Buffer, extension: string): Promise<StoredObject> {
  if (driver() !== "LOCAL") throw new Error("STORAGE_DRIVER_NOT_IMPLEMENTED");
  const objectKey = `${accountId}/${randomUUID()}.${extension}`;
  const target = localPathFor(objectKey);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, content, { flag: "wx" });
  return { objectKey, checksum: createHash("sha256").update(content).digest("hex"), sizeBytes: content.byteLength };
}

export async function getObject(objectKey: string) {
  if (driver() !== "LOCAL") throw new Error("STORAGE_DRIVER_NOT_IMPLEMENTED");
  return readFile(localPathFor(objectKey));
}

export async function deleteObject(objectKey: string) {
  if (driver() !== "LOCAL") throw new Error("STORAGE_DRIVER_NOT_IMPLEMENTED");
  await rm(localPathFor(objectKey), { force: true });
}
