#!/usr/bin/env node

import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HTTP_METHODS = ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
const ROUTE_FILE_NAMES = new Set(["page.tsx", "route.ts"]);
const REQUIRED_COURSE_ROUTES = [
  "/courses",
  "/courses/directions/[slug]",
  "/courses/[courseSlug]",
];

function slash(value) {
  return value.split(path.sep).join("/");
}

function segmentShape(segment) {
  if (/^\[\[\.\.\.[^\]]+\]\]$/.test(segment)) return "[[...]]";
  if (/^\[\.\.\.[^\]]+\]$/.test(segment)) return "[...]";
  if (/^\[[^\]]+\]$/.test(segment)) return "[]";
  return segment;
}

function dynamicParameter(segment) {
  const optionalCatchAll = segment.match(/^\[\[\.\.\.([^\]]+)\]\]$/);
  if (optionalCatchAll) return { name: optionalCatchAll[1], kind: "optional-catch-all" };
  const catchAll = segment.match(/^\[\.\.\.([^\]]+)\]$/);
  if (catchAll) return { name: catchAll[1], kind: "catch-all" };
  const dynamic = segment.match(/^\[([^\]]+)\]$/);
  return dynamic ? { name: dynamic[1], kind: "dynamic" } : null;
}

export function deriveRoute(sourceFile, sourceRoot = "src/app") {
  const normalizedFile = slash(sourceFile);
  const normalizedRoot = slash(sourceRoot).replace(/\/$/, "");
  const prefix = `${normalizedRoot}/`;
  if (!normalizedFile.startsWith(prefix)) {
    throw new Error(`Route file is outside ${normalizedRoot}: ${normalizedFile}`);
  }

  const relative = normalizedFile.slice(prefix.length);
  const parts = relative.split("/");
  const fileName = parts.pop();
  if (!ROUTE_FILE_NAMES.has(fileName)) {
    throw new Error(`Unsupported route file: ${normalizedFile}`);
  }

  const routeGroups = parts.filter((segment) => /^\([^)]*\)$/.test(segment));
  const parallelSlots = parts.filter((segment) => segment.startsWith("@"));
  const privateSegments = parts.filter((segment) => segment.startsWith("_"));
  const urlSegments = parts.filter(
    (segment) => !/^\([^)]*\)$/.test(segment) && !segment.startsWith("@"),
  );
  const dynamicParams = urlSegments.map(dynamicParameter).filter(Boolean);
  const url = `/${urlSegments.join("/")}`;

  return {
    kind: fileName === "page.tsx" ? "page" : "route",
    url,
    dynamicShape: `/${urlSegments.map(segmentShape).join("/")}`,
    sourceFile: normalizedFile,
    routeGroups,
    parallelSlots,
    privateSegments,
    dynamicParams,
  };
}

export function extractMethods(source) {
  const methods = new Set();
  const localExport = /export\s+(?:async\s+)?(?:function|const)\s+(GET|HEAD|POST|PUT|PATCH|DELETE|OPTIONS)\b/g;
  const reexport = /export\s*\{([^}]+)\}\s*from\s*["'][^"']+["']/g;

  for (const match of source.matchAll(localExport)) methods.add(match[1]);
  for (const match of source.matchAll(reexport)) {
    for (const specifier of match[1].split(",")) {
      const [imported, exported] = specifier.trim().split(/\s+as\s+/i);
      const candidate = exported || imported;
      if (HTTP_METHODS.includes(candidate)) methods.add(candidate);
    }
  }

  return HTTP_METHODS.filter((method) => methods.has(method));
}

export function extractReexports(source) {
  const results = [];
  const reexport = /export\s*\{([^}]+)\}\s*from\s*["']([^"']+)["']/g;
  for (const match of source.matchAll(reexport)) {
    results.push({
      exports: match[1].split(",").map((value) => value.trim()).filter(Boolean).sort(),
      target: match[2],
    });
  }
  return results;
}

export function extractRedirects(source) {
  const results = [];
  const redirect = /\b(redirect|permanentRedirect)\s*\(\s*["']([^"']+)["']/g;
  for (const match of source.matchAll(redirect)) {
    results.push({ type: match[1], destination: match[2] });
  }
  return results;
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else if (entry.isFile() && ROUTE_FILE_NAMES.has(entry.name)) files.push(absolute);
  }
  return files;
}

function groupedCollisions(routes, keyFor, acceptGroup) {
  const groups = new Map();
  for (const route of routes) {
    const key = keyFor(route);
    const group = groups.get(key) || [];
    group.push(route);
    groups.set(key, group);
  }
  return [...groups.entries()]
    .filter(([, group]) => group.length > 1 && acceptGroup(group))
    .map(([key, group]) => ({ key, files: group.map((route) => route.sourceFile).sort() }))
    .sort((left, right) => left.key.localeCompare(right.key));
}

export function detectCollisions(routes) {
  const routable = routes.filter((route) => route.privateSegments.length === 0);
  const duplicatePaths = groupedCollisions(
    routable,
    (route) => `${route.kind}:${route.url}`,
    () => true,
  );
  const dynamicShapes = groupedCollisions(
    routable,
    (route) => `${route.kind}:${route.dynamicShape}`,
    (group) => new Set(group.map((route) => route.url)).size > 1,
  );
  const pageRoute = groupedCollisions(
    routable,
    (route) => route.dynamicShape,
    (group) => new Set(group.map((route) => route.kind)).size > 1,
  );
  return { duplicatePaths, dynamicShapes, pageRoute };
}

export function validateCourseRoutes(routes) {
  const pageUrls = new Set(
    routes
      .filter((route) => route.kind === "page" && route.privateSegments.length === 0)
      .map((route) => route.url),
  );
  return REQUIRED_COURSE_ROUTES
    .filter((required) => !pageUrls.has(required))
    .map((required) => `course-route: missing required page route ${required}`);
}

export function validateContract(contract) {
  const issues = [];
  for (const [type, collisions] of Object.entries(contract.collisions)) {
    for (const collision of collisions) {
      issues.push(`${type}: ${collision.key} => ${collision.files.join(", ")}`);
    }
  }
  issues.push(...validateCourseRoutes(contract.routes));
  return issues;
}

export async function buildRouteContract(projectRoot = process.cwd()) {
  const sourceRoot = "src/app";
  const appDirectory = path.join(projectRoot, ...sourceRoot.split("/"));
  const routeFiles = await walk(appDirectory);
  const routes = [];

  for (const absoluteFile of routeFiles) {
    const sourceFile = slash(path.relative(projectRoot, absoluteFile));
    const source = await readFile(absoluteFile, "utf8");
    const route = deriveRoute(sourceFile, sourceRoot);
    routes.push({
      ...route,
      methods: route.kind === "route" ? extractMethods(source) : [],
      reexports: extractReexports(source),
      redirects: extractRedirects(source),
    });
  }

  routes.sort((left, right) =>
    left.url.localeCompare(right.url) || left.kind.localeCompare(right.kind) || left.sourceFile.localeCompare(right.sourceFile),
  );
  const missingCourseRoutes = validateCourseRoutes(routes).map((issue) => issue.replace(/^.* route /, ""));

  return {
    schemaVersion: 1,
    sourceRoot,
    summary: {
      pages: routes.filter((route) => route.kind === "page").length,
      routeHandlers: routes.filter((route) => route.kind === "route").length,
    },
    requirements: {
      courseRoutes: {
        required: REQUIRED_COURSE_ROUTES,
        missing: missingCourseRoutes,
      },
    },
    collisions: detectCollisions(routes),
    routes,
  };
}

function serialize(contract) {
  return `${JSON.stringify(contract, null, 2)}\n`;
}

export async function runCli(argv = process.argv.slice(2)) {
  const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
  const projectRoot = path.resolve(scriptDirectory, "..");
  const outputPath = path.join(projectRoot, "route-contract.json");
  const check = argv.includes("--check");
  const stdout = argv.includes("--stdout");
  const unknown = argv.filter((argument) => !["--check", "--stdout"].includes(argument));
  if (unknown.length) throw new Error(`Unknown argument(s): ${unknown.join(", ")}`);

  const contract = await buildRouteContract(projectRoot);
  const expected = serialize(contract);
  if (stdout) process.stdout.write(expected);

  if (!check) {
    if (!stdout) {
      await writeFile(outputPath, expected, "utf8");
      process.stdout.write(`Wrote ${path.relative(projectRoot, outputPath)} (${contract.summary.pages} pages, ${contract.summary.routeHandlers} route handlers).\n`);
    }
    return 0;
  }

  const issues = validateContract(contract);
  let actual = null;
  try {
    actual = await readFile(outputPath, "utf8");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    issues.unshift(`contract-file: missing ${path.relative(projectRoot, outputPath)}`);
  }
  if (actual !== null && actual !== expected) {
    issues.unshift("contract-drift: route-contract.json is stale; run node scripts/check-route-contract.mjs");
  }

  if (issues.length) {
    process.stderr.write(`Route contract check failed (${issues.length}):\n${issues.map((issue) => `- ${issue}`).join("\n")}\n`);
    return 1;
  }
  process.stdout.write("Route contract check passed.\n");
  return 0;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  runCli().then(
    (code) => { process.exitCode = code; },
    (error) => {
      process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
      process.exitCode = 1;
    },
  );
}
