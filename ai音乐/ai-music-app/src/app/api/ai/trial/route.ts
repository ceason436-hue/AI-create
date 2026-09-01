import { NextResponse } from "next/server";
import { acceptAnonymousTrial, getAnonymousTrialStatus, hasTrialConsent } from "@/lib/anonymous-trial";
import { getCurrentAccount } from "@/lib/auth";
import { serviceUnavailable } from "@/lib/http";

export async function GET() {
  const account = await getCurrentAccount();
  if (account) return NextResponse.json({ authenticated: true, consent: false, remaining: null });
  const consent = await hasTrialConsent();
  const status = await getAnonymousTrialStatus("all");
  return NextResponse.json({ authenticated: false, consent, ...status, limit: 5 });
}

export async function POST() {
  try {
    await acceptAnonymousTrial();
    return NextResponse.json({ accepted: true, limit: 5 });
  } catch {
    return serviceUnavailable("试用服务暂不可用，请稍后重试。");
  }
}
