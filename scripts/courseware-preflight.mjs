import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const required = ["OSS_BUCKET", "OSS_ENDPOINT", "OSS_ACCESS_KEY_ID", "OSS_ACCESS_KEY_SECRET", "COURSEWARE_WORKER_TOKEN"];
const missing = required.filter((key) => !process.env[key]?.trim());
const driver = process.env.STORAGE_DRIVER?.trim();
const executable = process.env.SOFFICE_PATH?.trim() || (process.platform === "win32" ? "soffice.exe" : "soffice");
const result = { storageDriver: driver || null, ossConfigured: missing.length === 0, libreOffice: false, errors: [] };

if (driver !== "OSS") result.errors.push("STORAGE_DRIVER must be OSS for production courseware.");
if (missing.length) result.errors.push(`Missing required environment keys: ${missing.join(", ")}.`);
try { await execFileAsync(executable, ["--version"], { windowsHide: true, timeout: 10_000 }); result.libreOffice = true; } catch { result.errors.push("LibreOffice/soffice is unavailable. Configure SOFFICE_PATH or install LibreOffice."); }

console.log(JSON.stringify(result, null, 2));
if (result.errors.length) process.exitCode = 1;
