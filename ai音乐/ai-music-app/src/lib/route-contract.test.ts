import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  buildRouteContract,
  deriveRoute,
  detectCollisions,
  extractMethods,
  validateCourseRoutes,
} from "../../scripts/check-route-contract.mjs";

const temporaryDirectories: string[] = [];

async function fixture(files: Record<string, string>) {
  const root = await mkdtemp(path.join(tmpdir(), "route-contract-"));
  temporaryDirectories.push(root);
  await Promise.all(Object.entries(files).map(async ([file, source]) => {
    const absolute = path.join(root, file);
    await mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(absolute, source, "utf8");
  }));
  return root;
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("route contract scanner", () => {
  it("removes route groups and normalizes dynamic parameter names", () => {
    expect(deriveRoute("src/app/(landing)/courses/[courseSlug]/page.tsx")).toMatchObject({
      kind: "page",
      url: "/courses/[courseSlug]",
      dynamicShape: "/courses/[]",
      routeGroups: ["(landing)"],
      dynamicParams: [{ name: "courseSlug", kind: "dynamic" }],
    });
  });

  it("extracts local and re-exported HTTP methods in stable order", () => {
    const source = `
      export async function PATCH() {}
      export const GET = () => new Response()
      export { POST, handler as DELETE } from "./handlers"
    `;
    expect(extractMethods(source)).toEqual(["GET", "POST", "PATCH", "DELETE"]);
  });

  it("detects route-group duplicates, dynamic-shape conflicts, and page-route conflicts", () => {
    const routes = [
      deriveRoute("src/app/(one)/about/page.tsx"),
      deriveRoute("src/app/(two)/about/page.tsx"),
      deriveRoute("src/app/posts/[id]/page.tsx"),
      deriveRoute("src/app/posts/[slug]/page.tsx"),
      deriveRoute("src/app/files/[id]/page.tsx"),
      deriveRoute("src/app/files/[slug]/route.ts"),
    ];
    const collisions = detectCollisions(routes);
    expect(collisions.duplicatePaths).toHaveLength(1);
    expect(collisions.dynamicShapes).toHaveLength(1);
    expect(collisions.pageRoute).toHaveLength(1);
  });

  it("builds a deterministic inventory and follows method re-exports", async () => {
    const root = await fixture({
      "src/app/(landing)/courses/page.tsx": "export default function Page() {}",
      "src/app/(landing)/courses/directions/[slug]/page.tsx": "export default function Page() {}",
      "src/app/(landing)/courses/[courseSlug]/page.tsx": "export default function Page() {}",
      "src/app/api/me/courses/route.ts": "export { GET } from '../learning-dashboard/route'",
    });
    const first = await buildRouteContract(root);
    const second = await buildRouteContract(root);
    expect(first).toEqual(second);
    expect(first.summary).toEqual({ pages: 3, routeHandlers: 1 });
    expect(first.requirements.courseRoutes.missing).toEqual([]);
    expect(first.routes.find((route) => route.url === "/api/me/courses")?.methods).toEqual(["GET"]);
  });

  it("reports the missing directions route without coupling the unit suite to the repository state", () => {
    const routes = [
      deriveRoute("src/app/(landing)/courses/page.tsx"),
      deriveRoute("src/app/(landing)/courses/[courseSlug]/page.tsx"),
    ];
    expect(validateCourseRoutes(routes)).toEqual([
      "course-route: missing required page route /courses/directions/[slug]",
    ]);
  });
});
