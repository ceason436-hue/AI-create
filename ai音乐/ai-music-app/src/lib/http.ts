import { NextResponse } from "next/server";

export function badRequest(message = "请求参数无效") {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function unauthorized() {
  return NextResponse.json({ error: "请先登录后再使用 AI 功能。" }, { status: 401 });
}

export function forbidden(message = "没有权限执行此操作") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function conflict(message = "请求正在处理中，请勿重复提交。") {
  return NextResponse.json({ error: message }, { status: 409 });
}

export function tooManyRequests(message = "操作过于频繁，请稍后重试。") {
  return NextResponse.json({ error: message }, { status: 429 });
}

export function serviceUnavailable(message = "服务暂时不可用，请稍后重试。") {
  return NextResponse.json({ error: message }, { status: 503 });
}

export function internalError() {
  return NextResponse.json({ error: "服务器暂时无法处理请求，请稍后重试。" }, { status: 500 });
}
