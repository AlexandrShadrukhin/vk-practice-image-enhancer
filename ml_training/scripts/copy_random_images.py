from __future__ import annotations

import random
import shutil
from pathlib import Path

SOURCE_DIR = Path("/Users/AlexandrShadrukhin/Downloads/archive/seg_train/seg_train")
TARGET_DIR = Path("/Users/AlexandrShadrukhin/Documents/untitledFolder/vk-practice-image-enhancer/ml_training/data/raw")

SAMPLE_SIZE = 2000
SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

RANDOM_SEED = 42


def collect_images(source_dir: Path) -> list[Path]:
    images: list[Path] = []

    for path in source_dir.rglob("*"):
        if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS:
            images.append(path)

    return images


def main() -> None:
    if not SOURCE_DIR.exists():
        print(f"[ERROR] Source directory not found: {SOURCE_DIR}")
        return

    TARGET_DIR.mkdir(parents=True, exist_ok=True)

    all_images = collect_images(SOURCE_DIR)
    total_count = len(all_images)

    if total_count == 0:
        print("[ERROR] No images found in source directory.")
        return

    print(f"[INFO] Found {total_count} images.")

    sample_size = min(SAMPLE_SIZE, total_count)

    random.seed(RANDOM_SEED)
    selected_images = random.sample(all_images, sample_size)

    for index, image_path in enumerate(selected_images, start=1):
        class_name = image_path.parent.name
        new_name = f"{class_name}_{index:04d}{image_path.suffix.lower()}"
        destination_path = TARGET_DIR / new_name

        shutil.copy2(image_path, destination_path)

        if index % 100 == 0 or index == sample_size:
            print(f"[INFO] Copied {index}/{sample_size}")

    print("\n[DONE] Copy completed.")
    print(f"[DONE] Images copied: {sample_size}")
    print(f"[DONE] Target folder: {TARGET_DIR}")


if __name__ == "__main__":
    main()