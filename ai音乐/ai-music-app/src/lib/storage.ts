import { createHash, createHmac, randomUUID } from "crypto";
import { mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";

export type StoredObject = {
  objectKey: string;
  checksum: string;
  sizeBytes: number;
};

export type ObjectWriteOptions = {
  contentType?: string;
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
  return (process.env.STORAGE_DRIVER || "LOCAL").trim().toUpperCase();
}

export function assertSafeObjectKey(objectKey: string) {
  if (!objectKey || objectKey.length > 512 || objectKey.startsWith("/") || objectKey.includes("\\") || objectKey.split("/").some((part) => !part || part === "." || part === "..")) {
    throw new Error("INVALID_OBJECT_KEY");
  }
}

function checksum(content: Buffer) {
  return createHash("sha256").update(content).digest("hex");
}

function encodedObjectPath(objectKey: string) {
  assertSafeObjectKey(objectKey);
  return objectKey.split("/").map(encodeURIComponent).join("/");
}

type OssConfig = { bucket: string; endpoint: URL; accessKeyId: string; accessKeySecret: string; securityToken?: string };

function ossConfig(): OssConfig {
  const bucket = process.env.OSS_BUCKET?.trim();
  const endpointValue = process.env.OSS_ENDPOINT?.trim();
  const accessKeyId = process.env.OSS_ACCESS_KEY_ID?.trim();
  const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET?.trim();
  if (!bucket || !endpointValue || !accessKeyId || !accessKeySecret) throw new Error("OSS_CONFIGURATION_MISSING");
  const endpoint = new URL(/^https?:\/\//i.test(endpointValue) ? endpointValue : `https://${endpointValue}`);
  if (!endpoint.hostname.startsWith(`${bucket}.`)) endpoint.hostname = `${bucket}.${endpoint.hostname}`;
  endpoint.pathname = endpoint.pathname.replace(/\/$/, "");
  return { bucket, endpoint, accessKeyId, accessKeySecret, securityToken: process.env.OSS_SECURITY_TOKEN?.trim() || undefined };
}

function ossRequestUrl(config: OssConfig, objectKey: string) {
  const url = new URL(config.endpoint);
  url.pathname = `${url.pathname.replace(/\/$/, "")}/${encodedObjectPath(objectKey)}`;
  return url;
}

function ossAuthorization(config: OssConfig, method: string, objectKey: string, contentType?: string) {
  const date = new Date().toUTCString();
  const headers: Record<string, string> = { Date: date };
  if (config.securityToken) headers["x-oss-security-token"] = config.securityToken;
  const canonicalHeaders = Object.entries(headers)
    .filter(([key]) => key.toLowerCase().startsWith("x-oss-"))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key.toLowerCase()}:${value.trim()}\n`)
    .join("");
  const resource = `/${config.bucket}/${encodedObjectPath(objectKey)}`;
  const stringToSign = `${method}\n\n${contentType ?? ""}\n${date}\n${canonicalHeaders}${resource}`;
  // OSS Signature V1 uses HMAC-SHA1. Keep the signing code here so the server
  // remains the only holder of OSS credentials and no public URL is generated.
  const encoded = createHmac("sha1", config.accessKeySecret).update(stringToSign).digest("base64");
  return { ...headers, Authorization: `OSS ${config.accessKeyId}:${encoded}` } as Record<string, string>;
}

async function ossFetch(method: string, objectKey: string, content?: Buffer, options: ObjectWriteOptions = {}) {
  const config = ossConfig();
  const contentType = options.contentType;
  const headers = ossAuthorization(config, method, objectKey, contentType);
  if (contentType) headers["Content-Type"] = contentType;
  const response = await fetch(ossRequestUrl(config, objectKey), { method, headers, body: content as unknown as BodyInit | undefined, cache: "no-store" });
  if (!response.ok) throw new Error(`OSS_${method}_FAILED_${response.status}`);
  return response;
}

async function writeLocalObject(objectKey: string, content: Buffer) {
  const target = localPathFor(objectKey);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, content, { flag: "wx" });
}

export async function putObjectAtKey(objectKey: string, content: Buffer, options: ObjectWriteOptions = {}): Promise<StoredObject> {
  assertSafeObjectKey(objectKey);
  if (driver() === "LOCAL") await writeLocalObject(objectKey, content);
  else if (driver() === "OSS") await ossFetch("PUT", objectKey, content, options);
  else throw new Error("STORAGE_DRIVER_UNSUPPORTED");
  return { objectKey, checksum: checksum(content), sizeBytes: content.byteLength };
}

export async function putObject(accountId: string, content: Buffer, extension: string, options: ObjectWriteOptions = {}): Promise<StoredObject> {
  const safeExtension = extension.replace(/[^a-z0-9]/gi, "").slice(0, 16) || "bin";
  return putObjectAtKey(`${accountId}/${randomUUID()}.${safeExtension}`, content, options);
}

export async function getObject(objectKey: string) {
  assertSafeObjectKey(objectKey);
  if (driver() === "LOCAL") return readFile(localPathFor(objectKey));
  if (driver() === "OSS") return Buffer.from(await (await ossFetch("GET", objectKey)).arrayBuffer());
  throw new Error("STORAGE_DRIVER_UNSUPPORTED");
}

export async function deleteObject(objectKey: string) {
  assertSafeObjectKey(objectKey);
  if (driver() === "LOCAL") { await rm(localPathFor(objectKey), { force: true }); return; }
  if (driver() === "OSS") { await ossFetch("DELETE", objectKey); return; }
  throw new Error("STORAGE_DRIVER_UNSUPPORTED");
}
