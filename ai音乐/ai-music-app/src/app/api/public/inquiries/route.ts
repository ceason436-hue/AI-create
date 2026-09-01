import { z } from "zod";
import { db } from "@/lib/db";

const inquirySchema = z.object({
  inquiryType: z.enum(["COURSE", "SCHOOL"]),
  name: z.string().trim().min(1).max(80),
  contact: z.string().trim().min(3).max(160),
  grade: z.string().trim().max(80).optional(),
  courseInterest: z.string().trim().max(180).optional(),
  region: z.string().trim().max(120).optional(),
  note: z.string().trim().max(2_000).optional(),
});

export async function POST(request: Request) {
  const parsed = inquirySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "请完整填写咨询信息。" }, { status: 400 });
  try {
    const inquiry = await db.inquiry.create({ data: parsed.data });
    return Response.json({ inquiryId: inquiry.id }, { status: 201 });
  } catch {
    return Response.json({ error: "咨询暂时无法提交，请稍后重试。" }, { status: 503 });
  }
}
