from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from tensorflow import keras


DATASET_PATH = Path("ml_training/data/processed/image_enhancement_dataset.csv")
MODEL_DIR = Path("ml_training/models/enhancer_model")


def load_dataset() -> tuple[np.ndarray, np.ndarray]:
    df = pd.read_csv(DATASET_PATH)

    X = df[
        [
            "avg_brightness",
            "contrast_metric",
            "avg_saturation",
        ]
    ].values

    y = df[
        [
            "target_brightness",
            "target_contrast",
            "target_saturation",
        ]
    ].values

    return X, y


def build_model(input_dim: int) -> keras.Sequential:
    model = keras.Sequential(
        [
            keras.Input(shape=(input_dim,)),
            keras.layers.Dense(16, activation="relu"),
            keras.layers.Dense(16, activation="relu"),
            keras.layers.Dense(3, activation="linear"),
        ]
    )

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss="mse",
        metrics=["mae"],
    )

    return model


def export_weights_to_json(model: keras.Sequential, output_path: Path) -> None:
    weights = model.get_weights()

    payload = {
        "dense1_kernel": weights[0].tolist(),
        "dense1_bias": weights[1].tolist(),
        "dense2_kernel": weights[2].tolist(),
        "dense2_bias": weights[3].tolist(),
        "output_kernel": weights[4].tolist(),
        "output_bias": weights[5].tolist(),
    }

    with output_path.open("w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)


def main() -> None:
    print("[INFO] Loading dataset...")
    X, y = load_dataset()

    print(f"[INFO] Dataset size: {len(X)}")

    X_train, X_val, y_train, y_val = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
    )

    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train)
    X_val = scaler.transform(X_val)

    print("[INFO] Building model...")
    model = build_model(input_dim=X.shape[1])

    print("[INFO] Training...")
    model.fit(
        X_train,
        y_train,
        validation_data=(X_val, y_val),
        epochs=40,
        batch_size=32,
        verbose=1,
    )

    print("[INFO] Saving model artifacts...")
    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    keras_model_path = MODEL_DIR / "enhancer_model.keras"
    model.save(keras_model_path)

    scaler_json_path = MODEL_DIR / "scaler.json"
    with scaler_json_path.open("w", encoding="utf-8") as f:
        json.dump(
            {
                "mean": scaler.mean_.tolist(),
                "scale": scaler.scale_.tolist(),
            },
            f,
            ensure_ascii=False,
            indent=2,
        )

    weights_json_path = MODEL_DIR / "weights.json"
    export_weights_to_json(model, weights_json_path)

    print("[DONE] Keras model saved to:", keras_model_path)
    print("[DONE] Scaler JSON saved to:", scaler_json_path)
    print("[DONE] Weights JSON saved to:", weights_json_path)


if __name__ == "__main__":
    main()