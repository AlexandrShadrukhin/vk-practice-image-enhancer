import * as tf from "@tensorflow/tfjs";
import type { ImageMetrics } from "../image/imageMetrics";
import type { EnhancementParams } from "../api/taskTypes";
import { buildRawModelFeatures } from "./preprocess";

type ScalerData = {
    mean: number[];
    scale: number[];
};

type WeightsData = {
    dense1_kernel: number[][];
    dense1_bias: number[];
    dense2_kernel: number[][];
    dense2_bias: number[];
    output_kernel: number[][];
    output_bias: number[];
};

let cachedModel: tf.Sequential | null = null;
let cachedScaler: ScalerData | null = null;

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

async function loadScaler(): Promise<ScalerData> {
    if (cachedScaler) {
        return cachedScaler;
    }

    const response = await fetch("/models/enhancer/scaler.json");
    if (!response.ok) {
        throw new Error("Не удалось загрузить scaler.json");
    }

    const scaler = (await response.json()) as ScalerData;
    cachedScaler = scaler;
    return scaler;
}

async function loadWeights(): Promise<WeightsData> {
    const response = await fetch("/models/enhancer/weights.json");
    if (!response.ok) {
        throw new Error("Не удалось загрузить weights.json");
    }

    return (await response.json()) as WeightsData;
}

function createModel(): tf.Sequential {
    const model = tf.sequential();

    model.add(
        tf.layers.dense({
            units: 16,
            activation: "relu",
            inputShape: [3]
        })
    );

    model.add(
        tf.layers.dense({
            units: 16,
            activation: "relu"
        })
    );

    model.add(
        tf.layers.dense({
            units: 3,
            activation: "linear"
        })
    );

    return model;
}

async function getOrCreateModel(): Promise<tf.Sequential> {
    if (cachedModel) {
        return cachedModel;
    }

    const model = createModel();

    // Инициализируем веса, чтобы слои создались полностью
    tf.tidy(() => {
        const dummyInput = tf.zeros([1, 3]);
        model.predict(dummyInput) as tf.Tensor;
    });

    const weights = await loadWeights();

    model.setWeights([
        tf.tensor2d(weights.dense1_kernel, [3, 16]),
        tf.tensor1d(weights.dense1_bias),
        tf.tensor2d(weights.dense2_kernel, [16, 16]),
        tf.tensor1d(weights.dense2_bias),
        tf.tensor2d(weights.output_kernel, [16, 3]),
        tf.tensor1d(weights.output_bias)
    ]);

    cachedModel = model;
    return model;
}

function standardizeFeatures(
    rawFeatures: number[],
    scaler: ScalerData
): [number, number, number] {
    return rawFeatures.map((value, index) => {
        const mean = scaler.mean[index];
        const scale = scaler.scale[index];

        if (!scale) {
            return 0;
        }

        return (value - mean) / scale;
    }) as [number, number, number];
}

export async function predictEnhancementParamsTf(
    metrics: ImageMetrics
): Promise<EnhancementParams> {
    const scaler = await loadScaler();
    const model = await getOrCreateModel();

    const rawFeatures = buildRawModelFeatures(metrics);
    const standardizedFeatures = standardizeFeatures(rawFeatures, scaler);

    const outputTensor = tf.tidy(() => {
        const inputTensor = tf.tensor2d([standardizedFeatures], [1, 3]);
        return model.predict(inputTensor) as tf.Tensor;
    });

    const values = await outputTensor.data();
    outputTensor.dispose();

    const brightness = clamp(Math.round(values[0]), -40, 40);
    const contrast = clamp(Number(values[1].toFixed(2)), 0.7, 1.5);
    const saturation = clamp(Number(values[2].toFixed(2)), 0.7, 1.6);

    return {
        brightness,
        contrast,
        saturation
    };
}