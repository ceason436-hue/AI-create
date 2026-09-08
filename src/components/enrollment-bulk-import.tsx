"use client";

import { useState } from "react";

type ImportRow = { rowNumber: number; accountId: string; courseId: string; source?: string; startsAt: string; endsAt?: string | null };
type Preview = { totalRows: number; validRows: number; issues: Array<{ rowNumber: number; message: string }> };

function splitLine(line: string) {
  const delimiter = line.includes("\t") ? "\t" : ",";
  const values: string[] = []; let value = ""; let quoted = false;
  for (let index = 0; index < line.length; index += 1) { const character = line[index]; if (character === '"') { quoted = !quoted; continue; } if (character === delimiter && !quoted) { values.push(value.trim()); value = ""; continue; } value += character; }
  values.push(value.trim()); return values;
}

function parseRows(raw: string): ImportRow[] {
  const lines = raw.split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return [];
  const first = splitLine(lines[0]).map((value) => value.toLowerCase());
  const header = first.includes("accountid") && first.includes("courseid");
  const columns = header ? first : ["accountid", "courseid", "startsat", "endsat", "source"];
  return lines.slice(header ? 1 : 0).map((line, index) => { const values = splitLine(line); const value = (name: string) => values[columns.indexOf(name)]?.trim() || ""; return { rowNumber: index + (header ? 2 : 1), accountId: value("accountid"), courseId: value("courseid"), startsAt: value("startsat"), endsAt: value("endsat") || null, source: value("source") || undefined }; });
}

export function EnrollmentBulkImport({ onApplied }: { onApplied: () => Promise<void> }) {
  const [raw, setRaw] = useState("accountId,courseId,startsAt,endsAt,source\n"); const [rows, setRows] = useState<ImportRow[]>([]); const [preview, setPreview] = useState<Preview | null>(null); const [message, setMessage] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function check() { setBusy(true); setMessage(""); setError(""); const parsedRows = parseRows(raw); setRows(parsedRows); try { const response = await fetch("/api/admin/enrollments/bulk/preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rows: parsedRows }) }); const data = await response.json().catch(() => null); if (!response.ok) throw new Error(data?.error ?? "预览校验失败"); setPreview(data.preview); } catch (cause) { setPreview(null); setError(cause instanceof Error ? cause.message : "预览校验失败"); } finally { setBusy(false); } }
  async function apply() { if (!preview || preview.issues.length || !rows.length) return; setBusy(true); setMessage(""); setError(""); try { const response = await fetch("/api/admin/enrollments/bulk/apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rows }) }); const data = await response.json().catch(() => null); if (!response.ok) { setPreview(data?.preview ?? preview); throw new Error(data?.error ?? "导入失败"); } setMessage(`已原子写入 ${data.count} 条报名记录。`); setPreview(null); setRows([]); await onApplied(); } catch (cause) { setError(cause instanceof Error ? cause.message : "导入失败"); } finally { setBusy(false); } }
  return <section className="enrollment-bulk-import"><div><span className="eyebrow dark">BULK IMPORT</span><h2>批量导入报名</h2><p>粘贴 CSV 或制表符分隔数据。第一行可包含 `accountId,courseId,startsAt,endsAt,source`；开始和结束时间需为可识别日期，单次最多 500 行。先预览，校验通过后才会一次性写入。</p></div><textarea value={raw} onChange={(event) => { setRaw(event.target.value); setPreview(null); }} rows={8} spellCheck={false} aria-label="报名批量导入数据" />{error && <p className="admin-message admin-error">{error}</p>}{message && <p className="admin-message admin-success">{message}</p>}{preview && <div className="enrollment-import-preview"><strong>预览：{preview.validRows}/{preview.totalRows} 行可写入</strong>{preview.issues.length ? <ul>{preview.issues.slice(0, 20).map((issue, index) => <li key={`${issue.rowNumber}-${index}`}>第 {issue.rowNumber} 行：{issue.message}</li>)}{preview.issues.length > 20 && <li>其余 {preview.issues.length - 20} 项错误未展开。</li>}</ul> : <p>所有数据均通过格式、账户类型、账户状态和课程存在性校验。</p>}</div>}<div className="admin-list-actions"><button className="button button-outline-dark" type="button" disabled={busy} onClick={() => void check()}>{busy ? "校验中…" : "预览并校验"}</button><button className="button button-lime" type="button" disabled={busy || !preview || preview.issues.length > 0 || preview.validRows !== preview.totalRows} onClick={() => void apply()}>{busy ? "导入中…" : "确认原子导入"}</button></div></section>;
}
