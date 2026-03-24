import { useEffect, useMemo, useState } from "react";
import ImageUploader from "../components/ImageUploader";
import TaskControls from "../components/TaskControls";
import ProgressBar from "../components/ProgressBar";
import ResultPreview from "../components/ResultPreview";
import { cancelTask, createTask, startTask } from "../core/api/taskManager";
import {
    formatDurationMs,
    getStatusLabel,
    initialTaskState,
    type ImageTask
} from "../core/api/taskTypes";

export default function App() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [task, setTask] = useState<ImageTask>(initialTaskState);

    const imageUrl = useMemo(() => {
        if (!selectedFile) return null;
        return URL.createObjectURL(selectedFile);
    }, [selectedFile]);

    useEffect(() => {
        return () => {
            if (imageUrl) {
                URL.revokeObjectURL(imageUrl);
            }
        };
    }, [imageUrl]);

    useEffect(() => {
        return () => {
            if (task.resultUrl) {
                URL.revokeObjectURL(task.resultUrl);
            }
        };
    }, [task.resultUrl]);

    const handleFileSelect = (file: File | null) => {
        setSelectedFile(file);

        if (!file) {
            setTask(initialTaskState);
            return;
        }

        setTask({
            id: null,
            status: "ready",
            progress: 0,
            resultUrl: null,
            error: null,
            params: null,
            startedAt: null,
            finishedAt: null
        });
    };

    const handleCreateTask = () => {
        if (!selectedFile) return;
        setTask(createTask());
    };

    const handleStartProcessing = async () => {
        if (!selectedFile || !task.id) return;

        const finalTask = await startTask({
            file: selectedFile,
            taskId: task.id,
            onUpdate: (updatedTask) => setTask(updatedTask)
        });

        setTask(finalTask);
    };

    const handleCancel = () => {
        const cancelledTask = cancelTask(task.id);
        if (cancelledTask) {
            setTask(cancelledTask);
        }
    };

    return (
        <main className="page">
            <section className="hero">
                <h1>VK Practice — Улучшение изображений</h1>
                <p>
                    Браузерная система улучшения изображений с API задач, отслеживанием
                    прогресса и будущей ML-коррекцией яркости, контрастности и цветности.
                </p>
            </section>

            <section className="grid">
                <div className="card">
                    <h2>1. Загрузка изображения</h2>
                    <ImageUploader file={selectedFile} onFileSelect={handleFileSelect} />
                </div>

                <div className="card">
                    <h2>2. Управление задачей</h2>
                    <TaskControls
                        hasFile={Boolean(selectedFile)}
                        hasTask={Boolean(task.id)}
                        status={task.status}
                        taskId={task.id}
                        onCreateTask={handleCreateTask}
                        onStartProcessing={handleStartProcessing}
                        onCancel={handleCancel}
                    />

                    <div className="statusBlock">
                        <p>
                            <strong>Статус:</strong> {getStatusLabel(task.status)}
                        </p>
                        <p>
                            <strong>ID задачи:</strong> {task.id ?? "—"}
                        </p>
                        <p>
                            <strong>Ошибка:</strong> {task.error ?? "—"}
                        </p>
                        <p>
                            <strong>Время обработки:</strong>{" "}
                            {formatDurationMs(task.startedAt, task.finishedAt)}
                        </p>
                    </div>

                    <ProgressBar progress={task.progress} />
                </div>
            </section>

            <section className="grid">
                <div className="card">
                    <h2>3. Предпросмотр исходного изображения</h2>
                    <div className="previewToolbarSpacer"/>
                    {imageUrl ? (
                        <img
                            className="previewImage"
                            src={imageUrl}
                            alt="Исходное изображение"
                        />
                    ) : (
                        <div className="placeholder">Изображение не выбрано</div>
                    )}
                </div>

                <div className="card">
                    <h2>4. Предпросмотр результата</h2>
                    <ResultPreview
                        sourceUrl={imageUrl}
                        resultUrl={task.resultUrl}
                        status={task.status}
                        params={task.params}
                    />
                </div>
            </section>
        </main>
    );
}