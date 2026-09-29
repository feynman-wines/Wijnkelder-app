/**
 * Compresses and resizes an image file in-browser using HTML5 Canvas.
 * Reduces 10MB-20MB phone camera images to crisp ~200KB JPEGs.
 */
export async function compressImageFile(file: File, maxDimension = 1280, quality = 0.85): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Fout bij inlezen van bestand.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Fout bij laden van afbeelding.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve({ base64: reader.result as string, mimeType: file.type || 'image/jpeg' });
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to high-quality compressed JPEG
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve({
          base64: compressedBase64,
          mimeType: 'image/jpeg'
        });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
