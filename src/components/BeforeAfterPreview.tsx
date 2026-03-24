import { useEffect, useMemo, useRef, useState } from "react";

type BeforeAfterPreviewProps = {
    beforeUrl: string;
    afterUrl: string;
};

export default function BeforeAfterPreview({
                                               beforeUrl,
                                               afterUrl
                                           }: BeforeAfterPreviewProps) {
    const [sliderValue, setSliderValue] = useState(50);
    const stageRef = useRef<HTMLDivElement | null>(null);
    const isDraggingRef = useRef(false);

    const clipPath = useMemo(() => {
        return `inset(0 ${100 - sliderValue}% 0 0)`;
    }, [sliderValue]);

    const updateSliderFromClientX = (clientX: number) => {
        const stage = stageRef.current;
        if (!stage) return;

        const rect = stage.getBoundingClientRect();
        const offsetX = clientX - rect.left;
        const percent = (offsetX / rect.width) * 100;
        const clamped = Math.max(0, Math.min(100, percent));

        setSliderValue(clamped);
    };

    const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        isDraggingRef.current = true;
        updateSliderFromClientX(event.clientX);
    };

    useEffect(() => {
        const handlePointerMove = (event: PointerEvent) => {
            if (!isDraggingRef.current) return;
            updateSliderFromClientX(event.clientX);
        };

        const handlePointerUp = () => {
            isDraggingRef.current = false;
        };

        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp);

        return () => {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", handlePointerUp);
        };
    }, []);

    return (
        <div className="beforeAfterWrapper">
            <div
                ref={stageRef}
                className="beforeAfterStage"
                onPointerDown={handlePointerDown}
            >
                <img
                    className="beforeAfterImage"
                    src={beforeUrl}
                    alt="До обработки"
                    draggable={false}
                />

                <img
                    className="beforeAfterImage beforeAfterImageAfter"
                    src={afterUrl}
                    alt="После обработки"
                    style={{ clipPath }}
                    draggable={false}
                />

                <div
                    className="beforeAfterDivider"
                    style={{ left: `${sliderValue}%` }}
                >
                    <div className="beforeAfterHandle" />
                </div>

                <div className="beforeAfterLabels">
                    <span>До</span>
                    <span>После</span>
                </div>
            </div>
        </div>
    );
}