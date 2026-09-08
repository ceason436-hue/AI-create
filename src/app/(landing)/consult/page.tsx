import type { Metadata } from "next";
import { ReferenceConsult } from "@/components/reference-consult";
import { PublicShell } from "@/components/public-shell";
import { CourseConsultForm } from "./consult-form";

export const metadata: Metadata = { title: "课程咨询｜科瑞特 AI", description: "结合孩子的年龄、兴趣与目标，找到合适的科创学习起点。" };

export default function ConsultPage() { return <PublicShell><ReferenceConsult form={<CourseConsultForm />} /></PublicShell>; }
