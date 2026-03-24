import type { ImageTask } from "./taskTypes";
import type {
    WorkerRequest,
    WorkerResponse
} from "../worker/workerMessages";

type ProgressCallback = (task: ImageTask) => void;

type StartTaskParams = {
    file: File;
    taskId: string;
    onUpdate: ProgressCallback;
};

let workerInstance: Worker | null = null;

function getWorker(): Worker {
    if (!workerInstance) {
        workerInstance = new Worker(
            new URL("../worker/enhancement.worker.ts", import.meta.url),
            { type: "module" }
        );
    }

    return workerInstance;
}

export function createTask(): ImageTask {
    return {
        id: `task-${Date.now()}`,
        status: "queued",
        progress: 0,
        resultUrl: null,
        error: null,
        params: null,
        startedAt: null,
        finishedAt: null
    };
}

export async function startTask({
                                    file,
                                    taskId,
                                    onUpdate
                                }: StartTaskParams): Promise<ImageTask> {
    return new Promise((resolve) => {
        const worker = getWorker();
        const startedAt = Date.now();

        const handleMessage = (event: MessageEvent<WorkerResponse>) => {
            const message = event.data;

            if (message.taskId !== taskId) {
                return;
            }

            if (message.type === "PROGRESS") {
                onUpdate({
                    id: taskId,
                    status: "processing",
                    progress: message.progress,
                    resultUrl: null,
                    error: null,
                    params: null,
                    startedAt,
                    finishedAt: null
                });
                return;
            }

            if (message.type === "DONE") {
                cleanup();

                const completedTask: ImageTask = {
                    id: taskId,
                    status: "completed",
                    progress: 100,
                    resultUrl: message.resultUrl,
                    error: null,
                    params: message.params,
                    startedAt,
                    finishedAt: message.finishedAt
                };

                onUpdate(completedTask);
                resolve(completedTask);
                return;
            }

            if (message.type === "ERROR") {
                cleanup();

                const failedTask: ImageTask = {
                    id: taskId,
                    status: "failed",
                    progress: 0,
                    resultUrl: null,
                    error: message.error,
                    params: null,
                    startedAt,
                    finishedAt: message.finishedAt
                };

                onUpdate(failedTask);
                resolve(failedTask);
                return;
            }

            if (message.type === "CANCELLED") {
                cleanup();

                const cancelledTask: ImageTask = {
                    id: taskId,
                    status: "cancelled",
                    progress: 0,
                    resultUrl: null,
                    error: null,
                    params: null,
                    startedAt,
                    finishedAt: message.finishedAt
                };

                onUpdate(cancelledTask);
                resolve(cancelledTask);
            }
        };

        const handleError = () => {
            cleanup();

            const failedTask: ImageTask = {
                id: taskId,
                status: "failed",
                progress: 0,
                resultUrl: null,
                error: "Ошибка Web Worker",
                params: null,
                startedAt,
                finishedAt: Date.now()
            };

            onUpdate(failedTask);
            resolve(failedTask);
        };

        function cleanup() {
            worker.removeEventListener("message", handleMessage);
            worker.removeEventListener("error", handleError);
        }

        worker.addEventListener("message", handleMessage);
        worker.addEventListener("error", handleError);

        const request: WorkerRequest = {
            type: "START",
            taskId,
            file
        };

        worker.postMessage(request);
    });
}

export function cancelTask(taskId: string | null): ImageTask | null {
    if (!taskId) {
        return null;
    }

    const worker = getWorker();

    const request: WorkerRequest = {
        type: "CANCEL",
        taskId
    };

    worker.postMessage(request);

    return {
        id: taskId,
        status: "cancelled",
        progress: 0,
        resultUrl: null,
        error: null,
        params: null,
        startedAt: null,
        finishedAt: Date.now()
    };
}