import { createHash } from "crypto";

export function hashInvitationCode(code: string) {
  return createHash("sha256").update(code.trim().toUpperCase()).digest("hex");
}

export function normalizeInvitationCode(code: string) {
  return code.trim().toUpperCase();
}
