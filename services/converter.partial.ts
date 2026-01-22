
/**
 * Crop an image to specified area
 */
export const cropImage = (
    file: File,
    x: number,
    y: number,
    width: number,
    height: number
): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            // Ensure crop bounds are valid
            const safeWidth = Math.min(width, img.width - x);
            const safeHeight = Math.min(height, img.height - y);

            if (safeWidth <= 0 || safeHeight <= 0) {
                URL.revokeObjectURL(objectUrl);
                reject(new Error('Invalid crop dimensions'));
                return;
            }

            const canvas = document.createElement('canvas');
            canvas.width = safeWidth;
            canvas.height = safeHeight;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                URL.revokeObjectURL(objectUrl);
                reject(new Error('Could not get canvas context'));
                return;
            }

            ctx.drawImage(img, x, y, safeWidth, safeHeight, 0, 0, safeWidth, safeHeight);

            const outputFormat = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
            canvas.toBlob((blob) => {
                URL.revokeObjectURL(objectUrl);
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Crop failed'));
                }
            }, outputFormat, 0.92);
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Failed to load image'));
        };

        img.src = objectUrl;
    });
};
