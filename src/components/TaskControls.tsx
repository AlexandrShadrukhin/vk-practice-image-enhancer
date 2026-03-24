type TaskControlsProps = {
    hasFile: boolean;
    hasTask: boolean;
    status: string;
    taskId: string | null;
    onCreateTask: () => void;
    onStartProcessing: () => void;
    onCancel: () => void;
};

export default function TaskControls({
                                         hasFile,
                                         hasTask,
                                         status,
                                         onCreateTask,
                                         onStartProcessing,
                                         onCancel
                                     }: TaskControlsProps) {
    const canCreateTask = hasFile && !hasTask;
    const canStart =
        hasFile && hasTask && (status === "queued" || status === "ready");
    const canCancel = status === "queued" || status === "processing";

    return (
        <div className="controls">
            <button onClick={onCreateTask} disabled={!canCreateTask}>
                Создать задачу
            </button>

            <button onClick={onStartProcessing} disabled={!canStart}>
                Запустить обработку
            </button>

            <button onClick={onCancel} disabled={!canCancel}>
                Отменить задачу
            </button>
        </div>
    );
}