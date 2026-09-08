import { describe, expect, it } from "vitest";
import {
  canonicalizeAiRequest,
  describeAiRequest,
  fingerprintAiRequest,
  normalizeAiRequest,
  normalizeIdempotencyKey,
  sanitizeProviderResult,
} from "./ai-contract";

describe("AI request contract", () => {
  it("parses the four stable request variants and applies normalized defaults", () => {
    expect(normalizeAiRequest({ toolKey: "image", input: { mode: "text2img", prompt: "  画一只猫  " } })).toMatchObject({
      contractVersion: 1,
      toolKey: "image",
      input: { mode: "text2img", prompt: "画一只猫", ratio: "1:1" },
    });
    expect(normalizeAiRequest({ toolKey: "music", input: { lyrics: "星空" } }).toolKey).toBe("music");
    expect(normalizeAiRequest({ toolKey: "code", input: { language: "html", prompt: "做一个计时器" } }).toolKey).toBe("code");
    expect(normalizeAiRequest({ toolKey: "reading", input: { operation: "analyze", grade: 3, documentId: "doc-1" } }).toolKey).toBe("reading");
  });

  it("rejects requests that are structurally valid but incomplete for their operation", () => {
    expect(() => normalizeAiRequest({ toolKey: "image", input: { mode: "img2img", prompt: "改成水彩" } })).toThrow();
    expect(() => normalizeAiRequest({ toolKey: "music", input: {} })).toThrow();
    expect(() => normalizeAiRequest({ toolKey: "reading", input: { operation: "answer", grade: 4, documentId: "doc-1" } })).toThrow();
  });

  it("produces the same normalized fingerprint for equivalent input", () => {
    const left = { toolKey: "code", input: { language: "html", prompt: "café" }, courseContext: { courseId: "course-1", lessonId: "lesson-1" } };
    const right = { courseContext: { lessonId: "lesson-1", courseId: "course-1" }, input: { prompt: "cafe\u0301", language: "html" }, toolKey: "code" };
    expect(canonicalizeAiRequest(left)).toBe(canonicalizeAiRequest(right));
    expect(fingerprintAiRequest(left)).toBe(fingerprintAiRequest(right));
  });

  it("produces a different fingerprint when sensitive input changes", () => {
    const base = { toolKey: "music", input: { prompt: "舒缓的钢琴", lyrics: "今天有风" } };
    expect(fingerprintAiRequest(base)).not.toBe(fingerprintAiRequest({ ...base, input: { ...base.input, lyrics: "今天有雨" } }));
  });

  it("never includes sensitive request values in the log descriptor", () => {
    const secrets = ["未公开的学生作文", "家庭电话13800000000", "private-document-42", "lesson-secret"];
    const descriptor = describeAiRequest({
      toolKey: "reading",
      courseContext: { courseId: "course-secret", lessonId: secrets[3] },
      input: { operation: "answer", grade: 5, documentId: secrets[2], question: `${secrets[0]} ${secrets[1]}` },
    });
    const serialized = JSON.stringify(descriptor);
    for (const secret of [...secrets, "course-secret"]) expect(serialized).not.toContain(secret);
    expect(Object.keys(descriptor).sort()).toEqual(["contractVersion", "hasCourseContext", "inputFingerprint", "normalizedBytes", "operation", "toolKey"].sort());
  });

  it("normalizes safe idempotency keys and rejects unsafe header values", () => {
    expect(normalizeIdempotencyKey(" 550e8400-e29b-41d4-a716-446655440000 ")).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(() => normalizeIdempotencyKey("short")).toThrow();
    expect(() => normalizeIdempotencyKey("unsafe key with spaces")).toThrow();
  });
});

describe("provider receipt sanitization", () => {
  it("keeps allow-listed operational metadata and strips raw or secret fields", () => {
    const sanitized = sanitizeProviderResult({
      provider: "minimax",
      modelId: "candidate-model",
      status: "SUCCEEDED",
      traceId: "trace-1",
      usage: { inputTokens: 12, outputTokens: 8, prompt: "sensitive prompt" },
      rawResponse: { generatedText: "sensitive output" },
      authorization: "Bearer secret-value",
    });
    expect(sanitized).toEqual({
      provider: "minimax",
      modelId: "candidate-model",
      status: "SUCCEEDED",
      traceId: "trace-1",
      usage: { inputTokens: 12, outputTokens: 8 },
    });
    expect(JSON.stringify(sanitized)).not.toContain("sensitive");
    expect(JSON.stringify(sanitized)).not.toContain("Bearer");
  });
});
