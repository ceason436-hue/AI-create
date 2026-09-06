from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import zipfile
from pathlib import Path

from PIL import Image
from pypdf import PdfReader


MARKER = "AUTOMATED_SYNTHETIC_TEST_DATA"
EXPECTED = {
    "synthetic-course.md",
    "synthetic-course.ppt",
    "synthetic-course.pptx",
    "synthetic-cover.jpg",
    "synthetic-cover.png",
    "synthetic-cover.webp",
    "synthetic-handbook.doc",
    "synthetic-handbook.docx",
    "synthetic-lesson.mp4",
    "synthetic-lesson.webm",
    "synthetic-reading.txt",
    "synthetic-subtitles.webvtt",
    "synthetic-worksheet.pdf",
}


def contains_zip_marker(path: Path) -> bool:
    with zipfile.ZipFile(path) as archive:
        return any(
            MARKER.encode() in archive.read(name)
            for name in archive.namelist()
            if name.endswith(".xml")
        )


def main() -> None:
    parser = argparse.ArgumentParser(description="Verify synthetic acceptance fixtures.")
    parser.add_argument("--output-dir", required=True, type=Path)
    parser.add_argument("--ffmpeg", required=True, type=Path)
    args = parser.parse_args()
    out = args.output_dir.resolve()
    manifest = json.loads((out / "manifest.json").read_text(encoding="utf-8"))
    rows = {row["file"]: row for row in manifest["files"]}
    if set(rows) != EXPECTED or manifest["classification"] != MARKER:
        raise AssertionError("Manifest inventory or classification is invalid.")
    for name, row in rows.items():
        path = out / name
        payload = path.read_bytes()
        if not payload or hashlib.sha256(payload).hexdigest() != row["sha256"]:
            raise AssertionError(f"Hash mismatch: {name}")

    for name in ["synthetic-course.md", "synthetic-reading.txt", "synthetic-subtitles.webvtt"]:
        if MARKER not in (out / name).read_text(encoding="utf-8"):
            raise AssertionError(f"Missing marker: {name}")
    if not (out / "synthetic-handbook.doc").read_bytes().startswith(b"{\\rtf1"):
        raise AssertionError("DOC fixture is not an RTF/Word-compatible document.")
    if MARKER.encode() not in (out / "synthetic-handbook.doc").read_bytes():
        raise AssertionError("DOC marker missing.")
    if not contains_zip_marker(out / "synthetic-handbook.docx"):
        raise AssertionError("DOCX marker missing.")
    if not contains_zip_marker(out / "synthetic-course.pptx"):
        raise AssertionError("PPTX marker missing.")
    if not (out / "synthetic-course.ppt").read_bytes().startswith(bytes.fromhex("D0CF11E0A1B11AE1")):
        raise AssertionError("PPT fixture is not an OLE compound file.")
    pdf_text = "\n".join(page.extract_text() or "" for page in PdfReader(out / "synthetic-worksheet.pdf").pages)
    if MARKER not in pdf_text:
        raise AssertionError("PDF marker missing.")
    for name in ["synthetic-cover.jpg", "synthetic-cover.png", "synthetic-cover.webp"]:
        with Image.open(out / name) as image:
            image.verify()
    for name in ["synthetic-lesson.mp4", "synthetic-lesson.webm"]:
        subprocess.run(
            [str(args.ffmpeg), "-v", "error", "-i", str(out / name), "-f", "null", "-"],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
        )
    print(f"Verified {len(EXPECTED)} synthetic acceptance fixtures in {out}")


if __name__ == "__main__":
    main()
