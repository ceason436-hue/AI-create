export type SessionAccountType = "ADMIN" | "SCHOOL_SHARED" | "PERSONAL";

const PERSONAL_SESSION_DAYS = 30;
const ADMIN_SESSION_HOURS = 8;
const SCHOOL_SESSION_HOURS = 12;

export function sessionDurationMs(type: SessionAccountType) {
  if (type === "ADMIN") return ADMIN_SESSION_HOURS * 60 * 60 * 1000;
  if (type === "SCHOOL_SHARED") return SCHOOL_SESSION_HOURS * 60 * 60 * 1000;
  return PERSONAL_SESSION_DAYS * 24 * 60 * 60 * 1000;
}

export function accountTypeCookieMaxAge(type: SessionAccountType) {
  return Math.floor(sessionDurationMs(type) / 1_000);
}
