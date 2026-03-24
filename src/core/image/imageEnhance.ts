import { loadImageBitmap } from "./imageLoader";
import { calculateImageMetrics } from "./imageMetrics";
import { predictEnhancementParams } from "../ml/heuristicModel";
import { predictEnhancementParamsTf } from "../ml/tfModel";
import type { EnhancementParams } from "../api/taskTypes";

export type EnhancementEngine = "heuristic" | "tfjs";

function clampChannel(value: number): number {
    return Math.max(0, Math.min(255, value));
}

function applySaturation(
    r: number,
    g: number,
    b: number,
    factor: number
): [number, number, number] {
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;

    const newR = gray + (r - gray) * factor;
    const newG = gray + (g - gray) * factor;
    const newB = gray + (b - gray) * factor;

    return [newR, newG, newB];
}

function applyBrightnessAndContrast(
    value: number,
    brightness: number,
    contrast: number
): number {
    return (value - 128) * contrast + 128 + brightness;
}

function createCanvas(width: number, height: number): OffscreenCanvas {
    return new OffscreenCanvas(width, height);
}

function getContext(canvas: OffscreenCanvas): OffscreenCanvasRenderingContext2D {
    const context = canvas.getContext("2d");
    if (!context) {
        throw new Error("Не удалось получить 2D-контекст canvas");
    }
    return context;
}

function buildEnhancedImageData(
    source: ImageData,
    params: EnhancementParams
): ImageData {
    const output = new ImageData(source.width, source.height);
    const src = source.data;
    const dst = output.data;

    for (let i = 0; i < src.length; i += 4) {
        let r = src[i];
        let g = src[i + 1];
        let b = src[i + 2];
        const a = src[i + 3];

        [r, g, b] = applySaturation(r, g, b, params.saturation);

        r = applyBrightnessAndContrast(r, params.brightness, params.contrast);
        g = applyBrightnessAndContrast(g, params.brightness, params.contrast);
        b = applyBrightnessAndContrast(b, params.brightness, params.contrast);

        dst[i] = clampChannel(r);
        dst[i + 1] = clampChannel(g);
        dst[i + 2] = clampChannel(b);
        dst[i + 3] = a;
    }

    return output;
}

async function resolveEnhancementParams(
    metrics: ReturnType<typeof calculateImageMetrics>,
    engine: EnhancementEngine
): Promise<EnhancementParams> {
    if (engine === "tfjs") {
        return await predictEnhancementParamsTf(metrics);
    }

    return predictEnhancementParams(metrics);
}

export async function enhanceImage(
    file: File,
    engine: EnhancementEngine = "tfjs"
): Promise<{ resultUrl: string; params: EnhancementParams }> {
    const bitmap = await loadImageBitmap(file);

    const canvas = createCanvas(bitmap.width, bitmap.height);
    const context = getContext(canvas);

    context.drawImage(bitmap, 0, 0);

    const sourceImageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const metrics = calculateImageMetrics(sourceImageData);
    const params = await resolveEnhancementParams(metrics, engine);
    const enhancedImageData = buildEnhancedImageData(sourceImageData, params);

    context.putImageData(enhancedImageData, 0, 0);

    const blob = await canvas.convertToBlob({ type: "image/png" });
    const resultUrl = URL.createObjectURL(blob);

    bitmap.close();

    return {
        resultUrl,
        params
    };
}