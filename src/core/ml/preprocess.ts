import type { ImageMetrics } from "../image/imageMetrics";

export type RawModelFeatures = [number, number, number];

export function buildRawModelFeatures(metrics: ImageMetrics): RawModelFeatures {
    return [
        metrics.averageBrightness,
        metrics.contrast,
        metrics.averageSaturation
    ];
}