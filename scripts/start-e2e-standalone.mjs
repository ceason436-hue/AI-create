#!/usr/bin/env node

import { cp, readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const standaloneRoot = path.join(projectRoot, ".next", "standalone");
const localEnv = Object.fromEntries((await readFile(path.join(projectRoot, ".env"), "utf8").catch(() => "")).split(/\r?\n/).flatMap((line) => {
  const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
  if (!match) return [];
  return [[match[1], match[2].replace(/^['"]|['"]$/g, "")]];
}));

await cp(path.join(projectRoot, "public"), path.join(standaloneRoot, "public"), { recursive: true, force: true });
await cp(path.join(projectRoot, ".next", "static"), path.join(standaloneRoot, ".next", "static"), { recursive: true, force: true });

const child = spawn(process.execPath, [path.join(standaloneRoot, "server.js")], {
  cwd: standaloneRoot,
  stdio: "inherit",
  env: {
    ...localEnv,
    ...process.env,
    NODE_ENV: "production",
    HOSTNAME: "127.0.0.1",
    PORT: "3001",
    AI_GENERATION_ENABLED: "false",
  },
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
