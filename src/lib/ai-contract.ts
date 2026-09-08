import { createHash } from "node:crypto";
import { z } from "zod";

export const AI_CONTRACT_VERSION = 1 as const;

export const AI_REQUEST_STATUSES = [
  "QUEUED",
  "RUNNING",
  "PROVIDER_PENDING",
  "RESULT_READY",
  "PERSISTING",
  "RETRY_WAIT",
  "RECONCILING",
  "CANCEL_REQUESTED",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
] as const;

export const aiRequestStatusSchema = z.enum(AI_REQUEST_STATUSES);
export type AiRequestStatus = z.infer<typeof aiRequestStatusSchema>;

export const AI_ERROR_CODES = [
  "INVALID_INPUT",
  "IDEMPOTENCY_KEY_REQUIRED",
  "IDEMPOTENCY_KEY_INVALID",
  "IDEMPOTENCY_MISMATCH",
  "AUTH_REQUIRED",
  "FORBIDDEN",
  "TOOL_DISABLED",
  "ENTITLEMENT_REQUIRED",
  "COURSE_CONTEXT_INVALID",
  "CREDIT_RULE_UNAVAILABLE",
  "CREDIT_INSUFFICIENT",
  "STORAGE_QUOTA_EXCEEDED",
  "RATE_LIMITED",
  "CONCURRENCY_LIMITED",
  "PROVIDER_RATE_LIMITED",
  "PROVIDER_TIMEOUT",
  "PROVIDER_REJECTED",
  "PROVIDER_UNAVAILABLE",
  "PROVIDER_INVALID_RESPONSE",
  "RESULT_EMPTY",
  "STORAGE_FAILED_RETRYABLE",
  "REQUEST_CANCELLED",
  "INTERNAL_ERROR",
] as const;

export const aiErrorCodeSchema = z.enum(AI_ERROR_CODES);
export type AiErrorCode = z.infer<typeof aiErrorCodeSchema>;

export const idempotencyKeySchema = z
  .string()
  .trim()
  .min(8)
  .max(128)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/);

export function normalizeIdempotencyKey(value: string | null | undefined) {
  return idempotencyKeySchema.parse(value);
}

const courseContextSchema = z.object({
  courseId: z.string().trim().min(1).max(128),
  lessonId: z.string().trim().min(1).max(128),
}).strict();

const commonRequestFields = {
  contractVersion: z.literal(AI_CONTRACT_VERSION).default(AI_CONTRACT_VERSION),
  courseContext: courseContextSchema.optional(),
};

const imageRequestSchema = z.object({
  ...commonRequestFields,
  toolKey: z.literal("image"),
  input: z.object({
    mode: z.enum(["text2img", "img2img"]),
    prompt: z.string().trim().min(1).max(2_000),
    ratio: z.enum(["1:1", "16:9", "9:16", "4:3", "3:4"]).default("1:1"),
    style: z.string().trim().max(300).optional(),
    referenceAssetId: z.string().trim().min(1).max(128).optional(),
  }).strict(),
}).strict();

const musicRequestSchema = z.object({
  ...commonRequestFields,
  toolKey: z.literal("music"),
  input: z.object({
    prompt: z.string().trim().max(1_000).optional(),
    lyrics: z.string().trim().max(8_000).optional(),
    title: z.string().trim().max(120).optional(),
  }).strict(),
}).strict();

const codeRequestSchema = z.object({
  ...commonRequestFields,
  toolKey: z.literal("code"),
  input: z.object({
    language: z.enum(["html", "python", "cpp", "scratch"]),
    prompt: z.string().trim().min(1).max(20_000),
    existingSource: z.string().max(200_000).optional(),
  }).strict(),
}).strict();

const readingRequestSchema = z.object({
  ...commonRequestFields,
  toolKey: z.literal("reading"),
  input: z.object({
    operation: z.enum(["analyze", "answer", "illustrate"]),
    grade: z.number().int().min(1).max(6),
    documentId: z.string().trim().min(1).max(128),
    segmentId: z.string().trim().min(1).max(128).optional(),
    question: z.string().trim().max(20_000).optional(),
    prompt: z.string().trim().max(2_000).optional(),
    style: z.string().trim().max(300).optional(),
  }).strict(),
}).strict();

export const aiRequestSchema = z.discriminatedUnion("toolKey", [
  imageRequestSchema,
  musicRequestSchema,
  codeRequestSchema,
  readingRequestSchema,
]).superRefine((request, context) => {
  if (request.toolKey === "image" && request.input.mode === "img2img" && !request.input.referenceAssetId) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["input", "referenceAssetId"], message: "img2img requires a reference asset" });
  }
  if (request.toolKey === "music" && !request.input.prompt && !request.input.lyrics) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["input"], message: "music requires a prompt or lyrics" });
  }
  if (request.toolKey === "reading" && request.input.operation === "answer" && !request.input.question) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["input", "question"], message: "answer requires a question" });
  }
  if (request.toolKey === "reading" && request.input.operation === "illustrate" && !request.input.prompt) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["input", "prompt"], message: "illustrate requires a prompt" });
  }
});

export type AiRequest = z.infer<typeof aiRequestSchema>;

type CanonicalJson = null | boolean | number | string | CanonicalJson[] | { [key: string]: CanonicalJson };

function normalizeJson(value: unknown): CanonicalJson {
  if (value === null || typeof value === "boolean") return value;
  if (typeof value === "string") return value.normalize("NFC");
  if (typeof value === "number" && Number.isFinite(value)) return Object.is(value, -0) ? 0 : value;
  if (Array.isArray(value)) return value.map(normalizeJson);
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, normalizeJson(entry)]),
    );
  }
  throw new TypeError("AI request contains a non-JSON value");
}

export function normalizeAiRequest(value: unknown): AiRequest {
  return aiRequestSchema.parse(value);
}

export function canonicalizeAiRequest(value: unknown) {
  return JSON.stringify(normalizeJson(normalizeAiRequest(value)));
}

export function fingerprintAiRequest(value: unknown) {
  return createHash("sha256").update(canonicalizeAiRequest(value), "utf8").digest("hex");
}

export type AiRequestDescriptor = {
  contractVersion: typeof AI_CONTRACT_VERSION;
  toolKey: AiRequest["toolKey"];
  operation: string;
  hasCourseContext: boolean;
  normalizedBytes: number;
  inputFingerprint: string;
};

/**
 * Safe for structured logs. It deliberately excludes prompts, lyrics, source
 * code, questions, document identifiers, titles and asset identifiers.
 */
export function describeAiRequest(value: unknown): AiRequestDescriptor {
  const request = normalizeAiRequest(value);
  const canonical = canonicalizeAiRequest(request);
  const operation = request.toolKey === "image"
    ? request.input.mode
    : request.toolKey === "reading"
      ? request.input.operation
      : "generate";
  return {
    contractVersion: request.contractVersion,
    toolKey: request.toolKey,
    operation,
    hasCourseContext: Boolean(request.courseContext),
    normalizedBytes: Buffer.byteLength(canonical, "utf8"),
    inputFingerprint: createHash("sha256").update(canonical, "utf8").digest("hex"),
  };
}

const providerUsageSchema = z.object({
  inputTokens: z.number().int().nonnegative().optional(),
  outputTokens: z.number().int().nonnegative().optional(),
  totalTokens: z.number().int().nonnegative().optional(),
  billedUnits: z.number().nonnegative().optional(),
}).strip();

/** A provider receipt safe to persist or log; raw request/response data is stripped. */
export const providerSanitizedResultSchema = z.object({
  provider: z.enum(["minimax", "gemini"]),
  modelId: z.string().trim().min(1).max(128),
  status: z.enum(["PENDING", "SUCCEEDED", "FAILED"]),
  traceId: z.string().trim().min(1).max(256).optional(),
  providerTaskId: z.string().trim().min(1).max(256).optional(),
  retryAfterSeconds: z.number().int().nonnegative().max(86_400).optional(),
  usage: providerUsageSchema.optional(),
  errorCode: aiErrorCodeSchema.optional(),
}).strip();

export type ProviderSanitizedResult = z.infer<typeof providerSanitizedResultSchema>;

export function sanitizeProviderResult(value: unknown): ProviderSanitizedResult {
  return providerSanitizedResultSchema.parse(value);
}

export const storedWorkReferenceSchema = z.object({
  workId: z.string().min(1).max(128),
  assetIds: z.array(z.string().min(1).max(128)).min(1).max(32),
}).strict();

export const aiSuccessResultSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("image"), work: storedWorkReferenceSchema }).strict(),
  z.object({ kind: z.literal("music"), work: storedWorkReferenceSchema }).strict(),
  z.object({ kind: z.literal("code"), work: storedWorkReferenceSchema, language: z.enum(["html", "python", "cpp", "scratch"]) }).strict(),
  z.object({ kind: z.literal("reading"), work: storedWorkReferenceSchema, documentId: z.string().min(1).max(128) }).strict(),
]);

export const aiRequestSnapshotSchema = z.object({
  requestId: z.string().min(1).max(128),
  status: aiRequestStatusSchema,
  result: aiSuccessResultSchema.optional(),
  error: z.object({
    code: aiErrorCodeSchema,
    message: z.string().min(1).max(500),
    retryable: z.boolean(),
    retryAfterSeconds: z.number().int().nonnegative().max(86_400).optional(),
  }).strict().optional(),
}).strict();
