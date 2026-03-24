export async function loadImageBitmap(file: File): Promise<ImageBitmap> {
    return await createImageBitmap(file);
}