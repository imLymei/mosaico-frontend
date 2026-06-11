/**
 *
 * @param {Blob} blob
 * @returns {Promise<string | null>}
 */
async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    /** @type {FileReader} */
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(null);
  });
}

/**
 *
 * @param {string} base64
 * @returns {Promise<Blob | null>}
 */
async function base64ToBlob(base64) {
  const dataUrl = base64.startsWith("data:")
    ? base64
    : `data:image/png;base64,${base64}`;

  const response = await fetch(dataUrl);
  return await response.blob();
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

  /** @type {HTMLCanvasElement} */
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  /** @type {CanvasRenderingContext2D | null} */
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

const NOISE_AMOUNT = 10;
const END_PIXEL = 125;

/**
 *
 * @param {Blob} blob
 * @param {string} password
 * @param {string} encryptPassword
 * @returns {Promise<Blob | null>}
 */
async function addPasswordToFile(blob, password, encryptPassword) {
  const bitmap = await createImageBitmap(blob);

  /** @type {HTMLCanvasElement} */
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  /** @type {CanvasRenderingContext2D | null} */
  const context = canvas.getContext("2d");
  context.drawImage(bitmap, 0, 0);

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixelsBytes = imageData.data;

  let decoyEndPixelProbability = 0.5;
  for (let byteIndex = 0; byteIndex < pixelsBytes.length; byteIndex += 4) {
    const isDecoyEndPixel = Math.random() >= decoyEndPixelProbability;

    if (isDecoyEndPixel) {
      decoyEndPixelProbability = Math.min(decoyEndPixelProbability * 1.1, 0.9);

      if (Math.random() >= 0.5) pixelsBytes[byteIndex] = END_PIXEL;
      if (Math.random() >= 0.5) pixelsBytes[byteIndex + 1] = END_PIXEL;
      if (Math.random() >= 0.5) pixelsBytes[byteIndex + 2] = END_PIXEL;
    } else {
      pixelsBytes[byteIndex] += (Math.random() - 0.5) * NOISE_AMOUNT;
      pixelsBytes[byteIndex + 1] += (Math.random() - 0.5) * NOISE_AMOUNT;
      pixelsBytes[byteIndex + 2] += (Math.random() - 0.5) * NOISE_AMOUNT;
    }
  }

  let passwordByteOffset = calculateByteOffset(
    encryptPassword,
    pixelsBytes.length,
  );

  for (
    let passwordIndex = 0;
    passwordIndex < password.length;
    passwordIndex++
  ) {
    const char = password[passwordIndex];

    if (passwordByteOffset % 4 === 3) passwordByteOffset++;
    if (passwordByteOffset >= pixelsBytes.length)
      passwordByteOffset = passwordByteOffset - pixelsBytes.length;

    pixelsBytes[passwordByteOffset] = char.charCodeAt(0);

    passwordByteOffset++;
  }

  if (passwordByteOffset % 4 === 3) passwordByteOffset++;
  pixelsBytes[passwordByteOffset] = END_PIXEL;

  context.putImageData(imageData, 0, 0);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png", 0.92);
  });
}

/**
 *
 * @param {Blob} blob
 * @param {string} decryptPassword
 * @returns {Promise<string>}
 */
async function getPasswordFromFile(blob, decryptPassword) {
  const bitmap = await createImageBitmap(blob);

  /** @type {HTMLCanvasElement} */
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  const context = canvas.getContext("2d");
  context.drawImage(bitmap, 0, 0);

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixelsBytes = imageData.data;
  const probablyPassword = [];

  let byteIndex = calculateByteOffset(decryptPassword, pixelsBytes.length);

  while (pixelsBytes[byteIndex] !== END_PIXEL) {
    if (byteIndex % 4 === 3) byteIndex++;
    if (byteIndex >= pixelsBytes.length)
      byteIndex = byteIndex - pixelsBytes.length;

    probablyPassword.push(String.fromCharCode(pixelsBytes[byteIndex]));
    byteIndex++;
  }

  return probablyPassword.join("");
}
