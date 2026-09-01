import { readdir, readFile } from "node:fs/promises";
import { extname, join } from "node:path";

const ignoredDirectories = new Set([".git", ".next", "node_modules", "coverage"]);
const supportedExtensions = new Set([".js", ".mjs", ".ts", ".tsx", ".json", ".yml", ".yaml"]);
const checks = [
  { name: "MiniMax API key", pattern: /sk-api-[A-Za-z0-9_-]{12,}/ },
  { name: "quoted MiniMax API key assignment", pattern: /MINIMAX_API_KEY\s*=\s*["'][^"'\r\n]{8,}/ },
  { name: "quoted OSS secret assignment", pattern: /OSS_ACCESS_KEY_SECRET\s*=\s*["'][^"'\r\n]{8,}/ },
];

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    if (entry.isDirectory()) return ignoredDirectories.has(entry.name) ? [] : collectFiles(join(directory, entry.name));
    if (!entry.isFile() || entry.name.startsWith(".env") || !supportedExtensions.has(extname(entry.name))) return [];
    return [join(directory, entry.name)];
  }));
  return nested.flat();
}

const root = process.cwd();
const files = await collectFiles(root);
const findings = [];

for (const file of files) {
  const content = await readFile(file, "utf8");
  for (const check of checks) {
    if (check.pattern.test(content)) findings.push({ file, rule: check.name });
  }
}

if (findings.length) {
  console.error("Potential plaintext credential(s) found:");
  for (const finding of findings) console.error(`- ${finding.file}: ${finding.rule}`);
  process.exitCode = 1;
} else {
  console.log(`Credential scan passed for ${files.length} source/configuration file(s).`);
}
