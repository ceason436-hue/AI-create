import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { getRedis } from "@/lib/redis";

export const ANONYMOUS_ID_COOKIE = "krt_anonymous_id";
export const TRIAL_CONSENT_COOKIE = "krt_trial_consent";
export const ANONYMOUS_TRIAL_LIMIT = 5;

function nextMidnightSeconds() {
  const next = new Date();
  next.setHours(24, 0, 0, 0);
  return Math.max(60, Math.ceil((next.getTime() - Date.now()) / 1000));
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

export async function getAnonymousTrialStatus(tool: string) {
  const id = await getAnonymousId(false);
  if (!id) return { remaining: ANONYMOUS_TRIAL_LIMIT, used: 0 };
  try {
    const redis = await getRedis();
    const key = `krt:ai:trial:${id}:${tool}:${new Date().toISOString().slice(0, 10)}`;
    const used = Number(await redis.get(key) ?? 0);
    return { remaining: Math.max(0, ANONYMOUS_TRIAL_LIMIT - used), used };
  } catch {
    return { remaining: null, used: null };
  }
}

export async function consumeAnonymousTrial(id: string, tool: string) {
  const redis = await getRedis();
  const key = `krt:ai:trial:${id}:${tool}:${new Date().toISOString().slice(0, 10)}`;
  const used = await redis.incr(key);
  if (used === 1) await redis.expire(key, nextMidnightSeconds());
  return { ok: used <= ANONYMOUS_TRIAL_LIMIT, used, key };
}
