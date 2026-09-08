import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const MARKER = "AUTOMATED_SYNTHETIC_TEST_DATA";
const outputDir = path.resolve(process.argv[2] ?? "");
const runtimeModules = process.env.CODEX_RUNTIME_NODE_MODULES;
const skillDir = process.env.CODEX_PRESENTATION_SKILL_DIR;
const runtimePython = process.env.CODEX_RUNTIME_PYTHON;

if (!process.argv[2] || !path.isAbsolute(outputDir)) {
  throw new Error("Pass an absolute output directory as the first argument.");
}
if (!runtimeModules || !skillDir || !runtimePython) {
  throw new Error(
    "Set CODEX_RUNTIME_NODE_MODULES, CODEX_PRESENTATION_SKILL_DIR and CODEX_RUNTIME_PYTHON.",
  );
}

process.env.RUNTIME_NODE_MODULES = runtimeModules;

const require = createRequire(import.meta.url);
const artifactEntry = require.resolve("@oai/artifact-tool", { paths: [runtimeModules] });
const { Presentation, PresentationFile } = await import(pathToFileURL(artifactEntry).href);
const { resolvePresentationFont, finalizePresentation } = await import(
  pathToFileURL(path.join(skillDir, "container_tools/artifact_tool_utils.mjs")).href
);

await fs.mkdir(outputDir, { recursive: true });
const workspaceDir = path.dirname(outputDir);
const stagingDir = path.join(workspaceDir, ".fixture-presentation-build");
await fs.mkdir(stagingDir, { recursive: true });
const family = resolvePresentationFont();
const presentation = Presentation.create({ slideSize: { width: 1280, height: 720 } });
const slide = presentation.slides.add();
slide.background.fill = "#F7FBFF";

const title = slide.shapes.add({
  geometry: "textbox",
  position: { left: 90, top: 92, width: 1100, height: 100 },
  fill: "none",
  line: { fill: "none", width: 0 },
});
title.text = "科瑞特 AI 自动化验收课件";
title.text.style = {
  typeface: family,
  fontSize: 44,
  bold: true,
  color: "#17324D",
  autoFit: "none",
};

const marker = slide.shapes.add({
  geometry: "textbox",
  position: { left: 94, top: 230, width: 1080, height: 54 },
  fill: "none",
  line: { fill: "none", width: 0 },
});
marker.text = MARKER;
marker.text.style = {
  typeface: family,
  fontSize: 24,
  bold: true,
  color: "#A01E1E",
  autoFit: "none",
};

const body = slide.shapes.add({
  geometry: "textbox",
  position: { left: 94, top: 330, width: 1060, height: 200 },
  fill: "none",
  line: { fill: "none", width: 0 },
});
body.text = "虚构学校：星河实验学校\n虚构学生：林小航\n用途：课件上传、预览、水印和权限验收";
body.text.style = {
  typeface: family,
  fontSize: 26,
  color: "#274C6A",
  autoFit: "none",
};
slide.speakerNotes.textFrame.setText("所有人物、学校与记录均为自动化合成测试数据。");

const candidatePath = path.join(stagingDir, "synthetic-course-candidate.pptx");
await (await PresentationFile.exportPptx(presentation)).save(candidatePath);
const finalPath = path.join(outputDir, "synthetic-course.pptx");
await finalizePresentation({
  workspaceDir,
  candidatePath,
  finalPath,
  pythonExecutable: runtimePython,
  integrityValidatorPath: path.join(skillDir, "container_tools/inspect_presentation_package_integrity.py"),
  layoutValidatorPath: path.join(skillDir, "container_tools/inspect_presentation_layout_geometry.py"),
  layoutArgs: [
    "--expected-slide-size-emu", "12192000,6858000",
    "--validate-bullet-geometry",
    "--validate-heading-fit",
  ],
  requiredNativeTableOwnerSlides: [],
  explicitTotalSlideCount: 1,
  fontPolicy: { basis: "design", families: [family] },
  verifyArtifactToolImport: true,
  receiptPath: path.join(stagingDir, "synthetic-course.validation.json"),
});

const preview = await presentation.export({ slide, format: "png", scale: 1 });
await fs.writeFile(
  path.join(stagingDir, "synthetic-course-slide-1.png"),
  new Uint8Array(await preview.arrayBuffer()),
);
