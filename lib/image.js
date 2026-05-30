/**
 *
 * @param {Blob} blob
 * @returns {Promise<string | null>}
 */
function convertToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(null);
  });
}

/**
 *
 * @param {File} file
 * @param {number} width
 * @param {number} height
 * @returns {Promise<Blob | null>}
 */
async function resizeImage(file, width, height) {
  const bitmap = await createImageBitmap(file);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, width, height);

  return new Promise((resolve) => {
    const mime = file.type || "image/jpeg";
    canvas.toBlob(
      (blob) => {
        resolve(blob);
        bitmap.close();
      },
      mime,
      0.92,
    );
  });
}

/**
 *
 * @param {Blob} blob
 * @returns {Promise<{width: number, height: number}>}
 */
async function getImageSize(blob) {
  const bitmap = await createImageBitmap(blob);
  const { width, height } = bitmap;

  bitmap.close();

  return { width, height };
}
