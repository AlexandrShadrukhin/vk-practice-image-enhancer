export type TaskStatus =
    | "idle"
    | "ready"
    | "queued"
    | "processing"
    | "completed"
    | "failed"
    | "cancelled";

export type EnhancementParams = {
    brightness: number;
    contrast: number;
    saturation: number;
};

export type ImageTask = {
    id: string | null;
    status: TaskStatus;
    progress: number;
    resultUrl: string | null;
    error: string | null;
    params: EnhancementParams | null;
    startedAt: number | null;
    finishedAt: number | null;
};

export const initialTaskState: ImageTask = {
    id: null,
    status: "idle",
    progress: 0,
    resultUrl: null,
    error: null,
    params: null,
    startedAt: null,
    finishedAt: null
};

export function getStatusLabel(status: TaskStatus): string {
    switch (status) {
        case "idle":
            return "ожидание";
        case "ready":
            return "готово к созданию задачи";
        case "queued":
            return "задача создана";
        case "processing":
            return "обработка";
        case "completed":
            return "завершено";
        case "failed":
            return "ошибка";
        case "cancelled":
            return "отменено";
        default:
            return status;
    }
}

export function formatDurationMs(startedAt: number | null, finishedAt: number | null): string {
    if (!startedAt || !finishedAt) {
        return "—";
    }

    const duration = finishedAt - startedAt;

    if (duration < 1000) {
        return `${duration} мс`;
    }

    return `${(duration / 1000).toFixed(2)} с`;
}