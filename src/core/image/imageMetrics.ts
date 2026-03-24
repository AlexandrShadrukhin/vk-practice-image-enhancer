export type ImageMetrics = {
    averageBrightness: number;
    contrast: number;
    averageSaturation: number;
};

export function calculateImageMetrics(
    imageData: ImageData,
): ImageMetrics {
    const { data } = imageData;

    let brightnessSum = 0;
    let saturationSum = 0;
    let pixelCount = 0;

    const brightnessValues: number[] = [];

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
        brightnessSum += brightness;
        brightnessValues.push(brightness);

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const saturation = max === 0 ? 0 : (max - min) / max;
        saturationSum += saturation;

        pixelCount += 1;
    }

    const averageBrightness = pixelCount > 0 ? brightnessSum / pixelCount : 0;
    const averageSaturation = pixelCount > 0 ? saturationSum / pixelCount : 0;

    let varianceSum = 0;
    for (const value of brightnessValues) {
        varianceSum += (value - averageBrightness) ** 2;
    }

    const contrast =
        pixelCount > 0 ? Math.sqrt(varianceSum / pixelCount) : 0;

    return {
        averageBrightness,
        contrast,
        averageSaturation,
    };
}