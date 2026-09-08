export type CoursePublicationCandidate = { targetAudience?: string | null; coverAssetId?: string | null; publishedModuleCount: number };

export function coursePublicationIssues(candidate: CoursePublicationCandidate) {
  const issues: string[] = [];
  if (!candidate.targetAudience?.trim()) issues.push("请填写适合人群与先修要求。");
  if (!candidate.coverAssetId?.trim()) issues.push("请绑定课程封面媒体资源。");
  if (candidate.publishedModuleCount < 1) issues.push("至少发布一个课程模块后才能发布课程。");
  return issues;
}
