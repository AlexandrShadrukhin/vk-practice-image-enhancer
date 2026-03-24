/// <reference lib="webworker" />

import { enhanceImage } from "../image/imageEnhance";
import type { WorkerRequest, WorkerResponse } from "./workerMessages";

const ctx: DedicatedWorkerGlobalScope = self as DedicatedWorkerGlobalScope;

const cancelMap = new Map<string, boolean>();

ctx.onmessage = async (event: MessageEvent<WorkerRequest>) => {
    const message = event.data;

    if (message.type === "START") {
        const { taskId, file } = message;

        cancelMap.set(taskId, false);

        try {
            ctx.postMessage({
                type: "PROGRESS",
                taskId,
                progress: 10
            } satisfies WorkerResponse);

            await delay(100);

            if (cancelMap.get(taskId)) {
                sendCancelled(taskId);
                return;
            }

            ctx.postMessage({
                type: "PROGRESS",
                taskId,
                progress: 40
            } satisfies WorkerResponse);

            const { resultUrl, params } = await enhanceImage(file, "tfjs");

            if (cancelMap.get(taskId)) {
                sendCancelled(taskId);
                return;
            }

            ctx.postMessage({
                type: "PROGRESS",
                taskId,
                progress: 80
            } satisfies WorkerResponse);

            await delay(100);

            ctx.postMessage({
                type: "DONE",
                taskId,
                resultUrl,
                params,
                finishedAt: Date.now()
            } satisfies WorkerResponse);
        } catch (e) {
            ctx.postMessage({
                type: "ERROR",
                taskId,
                error: e instanceof Error ? e.message : "Ошибка worker",
                finishedAt: Date.now()
            } satisfies WorkerResponse);
        } finally {
            cancelMap.delete(taskId);
        }
    }

    if (message.type === "CANCEL") {
        cancelMap.set(message.taskId, true);
    }
};

function sendCancelled(taskId: string) {
    ctx.postMessage({
        type: "CANCELLED",
        taskId,
        finishedAt: Date.now()
    } satisfies WorkerResponse);
}

function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}