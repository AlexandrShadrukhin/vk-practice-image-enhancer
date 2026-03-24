from __future__ import annotations

import csv
from pathlib import Path
from typing import Iterable

import numpy as np
from PIL import Image


SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


def iter_image_paths(folder: Path) -> Iterable[Path]:
    for path in sorted(folder.rglob("*")):
        if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS:
            yield path


def load_image_rgb(image_path: Path) -> np.ndarray:
    with Image.open(image_path) as img:
        rgb = img.convert("RGB")
        return np.asarray(rgb, dtype=np.float32)


def calculate_image_metrics(image: np.ndarray) -> dict[str, float]:
    """
    image shape: (H, W, 3), float32, range 0..255
    """
    r = image[:, :, 0]
    g = image[:, :, 1]
    b = image[:, :, 2]

    brightness = 0.299 * r + 0.587 * g + 0.114 * b
    avg_brightness = float(np.mean(brightness))
    contrast_metric = float(np.std(brightness))

    max_rgb = np.max(image, axis=2)
    min_rgb = np.min(image, axis=2)

    # avoid division by zero
    saturation = np.where(max_rgb == 0, 0, (max_rgb - min_rgb) / np.maximum(max_rgb, 1))
    avg_saturation = float(np.mean(saturation))

    return {
        "avg_brightness": avg_brightness,
        "contrast_metric": contrast_metric,
        "avg_saturation": avg_saturation,
    }


def clamp(value: float, min_value: float, max_value: float) -> float:
    return max(min_value, min(max_value, value))


def predict_targets_from_heuristic(metrics: dict[str, float]) -> dict[str, float]:
    brightness = 0.0
    contrast = 1.0
    saturation = 1.0

    if metrics["avg_brightness"] < 90:
        brightness += 20
    elif metrics["avg_brightness"] < 120:
        brightness += 10
    elif metrics["avg_brightness"] > 190:
        brightness -= 10

    if metrics["contrast_metric"] < 40:
        contrast += 0.2
    elif metrics["contrast_metric"] < 55:
        contrast += 0.1

    if metrics["avg_saturation"] < 0.25:
        saturation += 0.25
    elif metrics["avg_saturation"] < 0.4:
        saturation += 0.1

    return {
        "target_brightness": float(clamp(brightness, -40, 40)),
        "target_contrast": float(clamp(contrast, 0.7, 1.5)),
        "target_saturation": float(clamp(saturation, 0.7, 1.6)),
    }


def build_row(image_path: Path) -> dict[str, float | int | str]:
    image = load_image_rgb(image_path)
    height, width, _ = image.shape

    metrics = calculate_image_metrics(image)
    targets = predict_targets_from_heuristic(metrics)

    row: dict[str, float | int | str] = {
        "filename": image_path.name,
        "relative_path": str(image_path),
        "width": int(width),
        "height": int(height),
        **metrics,
        **targets,
    }
    return row


def main() -> None:
    project_root = Path(__file__).resolve().parent.parent
    raw_dir = project_root / "data" / "raw"
    processed_dir = project_root / "data" / "processed"
    output_csv = processed_dir / "image_enhancement_dataset.csv"

    processed_dir.mkdir(parents=True, exist_ok=True)

    image_paths = list(iter_image_paths(raw_dir))
    if not image_paths:
        print(f"[ERROR] No images found in: {raw_dir}")
        return

    rows: list[dict[str, float | int | str]] = []

    for idx, image_path in enumerate(image_paths, start=1):
        try:
            row = build_row(image_path)
            rows.append(row)
            print(f"[{idx}/{len(image_paths)}] OK: {image_path.name}")
        except Exception as exc:
            print(f"[{idx}/{len(image_paths)}] FAIL: {image_path.name} -> {exc}")

    if not rows:
        print("[ERROR] No rows generated.")
        return

    fieldnames = [
        "filename",
        "relative_path",
        "width",
        "height",
        "avg_brightness",
        "contrast_metric",
        "avg_saturation",
        "target_brightness",
        "target_contrast",
        "target_saturation",
    ]

    with output_csv.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"\n[DONE] Dataset saved to: {output_csv}")
    print(f"[DONE] Rows: {len(rows)}")


if __name__ == "__main__":
    main()