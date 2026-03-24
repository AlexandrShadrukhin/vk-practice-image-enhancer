import { useState } from "react";
import type { EnhancementParams } from "../core/api/taskTypes";
import BeforeAfterPreview from "./BeforeAfterPreview";

type ResultPreviewProps = {
    sourceUrl: string | null;
    resultUrl: string | null;
    status: string;
    params: EnhancementParams | null;
};

type ViewMode = "single" | "compare";

function formatSignedNumber(value: number): string {
    if (value > 0) {
        return `+${value}`;
    }
    return `${value}`;
}

export default function ResultPreview({
                                          sourceUrl,
                                          resultUrl,
                                          status,
                                          params
                                      }: ResultPreviewProps) {
    const [viewMode, setViewMode] = useState<ViewMode>("single");

    if (status === "processing") {
        return <div className="placeholder">Изображение обрабатывается...</div>;
    }

    if (status === "cancelled") {
        return <div className="placeholder">Задача была отменена</div>;
    }

    if (!resultUrl) {
        return <div className="placeholder">Обработанный результат пока отсутствует</div>;
    }

    return (
        <div className="resultBlock">
            {sourceUrl && (
                <div className="viewModeSwitch">
                    <button
                        className={viewMode === "single" ? "modeButton active" : "modeButton"}
                        onClick={() => setViewMode("single")}
                        type="button"
                    >
                        Обычный
                    </button>

                    <button
                        className={viewMode === "compare" ? "modeButton active" : "modeButton"}
                        onClick={() => setViewMode("compare")}
                        type="button"
                    >
                        До / после
                    </button>
                </div>
            )}

            {viewMode === "compare" && sourceUrl ? (
                <BeforeAfterPreview beforeUrl={sourceUrl} afterUrl={resultUrl} />
            ) : (
                <img className="previewImage" src={resultUrl} alt="Результат обработки" />
            )}

            {params && (
                <div className="paramsCard">
                    <h3>Параметры улучшения</h3>

                    <div className="paramsGrid">
                        <div className="paramItem">
                            <span className="paramLabel">Яркость</span>
                            <span className="paramValue">
                {formatSignedNumber(params.brightness)}
              </span>
                        </div>

                        <div className="paramItem">
                            <span className="paramLabel">Контрастность</span>
                            <span className="paramValue">{params.contrast.toFixed(2)}</span>
                        </div>

                        <div className="paramItem">
                            <span className="paramLabel">Цветность</span>
                            <span className="paramValue">{params.saturation.toFixed(2)}</span>
                        </div>
                    </div>

                    <a className="downloadButton" href={resultUrl} download="enhanced-image.png">
                        Скачать результат
                    </a>
                </div>
            )}
        </div>
    );
}