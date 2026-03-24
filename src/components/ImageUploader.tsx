type ImageUploaderProps = {
    file: File | null;
    onFileSelect: (file: File | null) => void;
};

export default function ImageUploader({
                                          file,
                                          onFileSelect
                                      }: ImageUploaderProps) {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selected = event.target.files?.[0] ?? null;
        onFileSelect(selected);
    };

    return (
        <div className="uploader">
            <label className="uploadBox">
                <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.bmp,.heic,image/jpeg,image/png,image/bmp,image/heic"
                    onChange={handleChange}
                />
                <span>Выбрать изображение</span>
            </label>

            <p className="helperText">
                Поддерживаемые форматы: JPG, PNG, BMP, HEIC
            </p>

            <p>
                <strong>Выбранный файл:</strong> {file ? file.name : "—"}
            </p>
        </div>
    );
}