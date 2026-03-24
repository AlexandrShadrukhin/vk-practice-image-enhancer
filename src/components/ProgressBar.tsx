type ProgressBarProps = {
    progress: number;
};

export default function ProgressBar({ progress }: ProgressBarProps) {
    return (
        <div className="progressWrapper">
            <div className="progressMeta">
                <span>Прогресс</span>
                <span>{progress}%</span>
            </div>

            <div className="progressTrack">
                <div className="progressFill" style={{ width: `${progress}%` }} />
            </div>
        </div>
    );
}