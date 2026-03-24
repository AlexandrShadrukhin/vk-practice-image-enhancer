import type { ImageMetrics } from "../image/imageMetrics";
import type { EnhancementParams } from "../api/taskTypes";

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

export function predictEnhancementParams(
    metrics: ImageMetrics
): EnhancementParams {
    let brightness = 0;
    let contrast = 1;
    let saturation = 1;

    if (metrics.averageBrightness < 90) {
        brightness += 20;
    } else if (metrics.averageBrightness < 120) {
        brightness += 10;
    } else if (metrics.averageBrightness > 190) {
        brightness -= 10;
    }

    if (metrics.contrast < 40) {
        contrast += 0.2;
    } else if (metrics.contrast < 55) {
        contrast += 0.1;
    }

    if (metrics.averageSaturation < 0.25) {
        saturation += 0.25;
    } else if (metrics.averageSaturation < 0.4) {
        saturation += 0.1;
    }

    return {
        brightness: clamp(brightness, -40, 40),
        contrast: clamp(contrast, 0.7, 1.5),
        saturation: clamp(saturation, 0.7, 1.6)
    };
}