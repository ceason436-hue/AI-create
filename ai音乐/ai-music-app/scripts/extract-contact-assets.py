"""Extract the exact contact QR and reconstruct the verified public-account QR.

Source: AI 科瑞特手册 page 67.  The personal WeChat QR is cropped losslessly
from the rendered source page; the public-account QR is re-encoded from the
decoded target printed in the handbook and checked again after writing.
"""

from pathlib import Path

import cv2
import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parents[1] / "长期记忆" / "AI科瑞特手册素材库" / "页面图像" / "page-67.jpg"
OUTPUT = ROOT / "public" / "media" / "krt"
PUBLIC_ACCOUNT_TARGET = "http://weixin.qq.com/r/6RJNVR3EQkA9rVk290f7"


def write_unicode(path: Path, image: np.ndarray) -> None:
    extension = path.suffix or ".png"
    success, encoded = cv2.imencode(extension, image)
    if not success:
        raise RuntimeError(f"Unable to encode {path.name}")
    encoded.tofile(path)


def decode_qr(image: np.ndarray) -> str:
    value, _, _ = cv2.QRCodeDetector().detectAndDecode(image)
    return value


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    source = Image.open(SOURCE).convert("RGB")

    # Pixel-aligned crop including the source QR quiet zone, but excluding the
    # surrounding purple layout. Coordinates were verified against the
    # 1241×1755 rendered handbook page.
    personal = source.crop((428, 1270, 599, 1443))
    personal = personal.resize((684, 692), Image.Resampling.NEAREST)
    framed = Image.new("RGB", (724, 732), "white")
    framed.paste(personal, (20, 20))
    personal = framed
    personal.save(OUTPUT / "contact-wechat.png", format="PNG", optimize=False)

    params = cv2.QRCodeEncoder_Params()
    params.version = 0
    params.correction_level = cv2.QRCodeEncoder_CORRECT_LEVEL_Q
    params.mode = cv2.QRCodeEncoder_MODE_AUTO
    params.structure_number = 1
    encoder = cv2.QRCodeEncoder_create(params)
    qr = encoder.encode(PUBLIC_ACCOUNT_TARGET)
    qr = cv2.copyMakeBorder(qr, 4, 4, 4, 4, cv2.BORDER_CONSTANT, value=255)
    qr = cv2.resize(qr, (712, 712), interpolation=cv2.INTER_NEAREST)
    write_unicode(OUTPUT / "contact-official-account.png", qr)

    regenerated = cv2.imdecode(
        np.fromfile(OUTPUT / "contact-official-account.png", dtype=np.uint8),
        cv2.IMREAD_GRAYSCALE,
    )
    decoded = decode_qr(regenerated)
    if decoded != PUBLIC_ACCOUNT_TARGET:
        raise RuntimeError(f"QR validation failed: {decoded!r}")

    personal_mat = cv2.imdecode(
        np.fromfile(OUTPUT / "contact-wechat.png", dtype=np.uint8),
        cv2.IMREAD_GRAYSCALE,
    )
    print(f"personal_qr_extracted={personal_mat.shape[1]}x{personal_mat.shape[0]}")
    print(f"personal_qr_decode={decode_qr(personal_mat) or 'wechat-app-required'}")
    print(f"official_account_qr_decode={decoded}")


if __name__ == "__main__":
    main()
