import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { getRedis } from "@/lib/redis";

export const ANONYMOUS_ID_COOKIE = "krt_anonymous_id";
export const TRIAL_CONSENT_COOKIE = "krt_trial_consent";
export const ANONYMOUS_TRIAL_LIMIT = 5;

function trialDay() {
  const timeZone = process.env.AI_TRIAL_TIMEZONE || "Asia/Shanghai";
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export async function hasTrialConsent() {
  return (await cookies()).get(TRIAL_CONSENT_COOKIE)?.value === "1";
}

export async function acceptAnonymousTrial() {
  const store = await cookies();
  store.set(TRIAL_CONSENT_COOKIE, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  if (!store.get(ANONYMOUS_ID_COOKIE)?.value) {
    store.set(ANONYMOUS_ID_COOKIE, randomBytes(18).toString("base64url"), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
}

export async function getAnonymousId(create = false) {
  const store = await cookies();
  const existing = store.get(ANONYMOUS_ID_COOKIE)?.value;
  if (existing) return existing;
  if (!create) return null;
  const id = randomBytes(18).toString("base64url");
  store.set(ANONYMOUS_ID_COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return id;
}

export async function getAnonymousTrialStatus(tool: string, limit = ANONYMOUS_TRIAL_LIMIT) {
  const id = await getAnonymousId(false);
  if (!id) return { remaining: limit, used: 0 };
  try {
    const redis = await getRedis();
    const key = `krt:ai:trial:${id}:${tool}:${trialDay()}`;
    const used = Number(await redis.get(key) ?? 0);
    return { remaining: Math.max(0, limit - used), used };
  } catch {
    return { remaining: null, used: null };
  }
}

export async function consumeAnonymousTrial(id: string, tool: string, limit = ANONYMOUS_TRIAL_LIMIT) {
  const redis = await getRedis();
  const key = `krt:ai:trial:${id}:${tool}:${trialDay()}`;
  const used = await redis.incr(key);
  if (used === 1) await redis.expire(key, 60 * 60 * 48);
  return { ok: used <= limit, used, key };
}
