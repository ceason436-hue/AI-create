// MiniMax music-2.6-free is synchronous in this application. The legacy route
// accepted arbitrary provider task ids and could expose another user's job.
export async function GET() {
  return Response.json(
    { error: "该旧查询接口已停用，请使用 /api/ai/requests/{requestId} 查询本人请求状态。", code: "LEGACY_ENDPOINT_RETIRED" },
    { status: 410, headers: { "Cache-Control": "private, no-store" } },
  );
}
