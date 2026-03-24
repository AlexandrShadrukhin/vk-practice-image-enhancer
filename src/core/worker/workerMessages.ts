import type { EnhancementParams } from "../api/taskTypes";

export type WorkerRequest =
    | {
    type: "START";
    taskId: string;
    file: File;
}
    | {
    type: "CANCEL";
    taskId: string;
};

export type WorkerResponse =
    | {
    type: "PROGRESS";
    taskId: string;
    progress: number;
}
    | {
    type: "DONE";
    taskId: string;
    resultUrl: string;
    params: EnhancementParams;
    finishedAt: number;
}
    | {
    type: "ERROR";
    taskId: string;
    error: string;
    finishedAt: number;
}
    | {
    type: "CANCELLED";
    taskId: string;
    finishedAt: number;
};