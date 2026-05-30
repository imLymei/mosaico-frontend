/** @type {HTMLBodyElement | null} */
let APP_BODY;

const WELCOME_PAGE = `
  <div>
   <h1>WELCOME!</h1>
   <button onclick="completeWelcome()">Has been Welcomed</button>
  </div>
`;
const LOGIN_PAGE = `
<div>
 <h1>Login Page</h1>
 <button onclick="redoWelcome()">Redo Welcome</button>
 <input id="image-password-input" type="file" accept="image/png, image/jpeg" />
 <img hidden id="image-previewer" />
</div>
`;

/**
 * @param {string} newHtml
 */
function changeHtmlTo(newHtml) {
  if (!APP_BODY) return;

  APP_BODY.innerHTML = newHtml;

  updateEvents();
}

function updateEvents() {
  /** @type {HTMLInputElement} */
  const imagePasswordInput = document.getElementById("image-password-input");

  if (imagePasswordInput) {
    imagePasswordInput.addEventListener("change", async () => {
      /** @type {HTMLImageElement} */
      const imagePreviewer = document.getElementById("image-previewer");
      const file = imagePasswordInput.files[0];
      const { width, height } = await getImageSize(file);
      const imageRatio = width !== 0 ? height / width : 1;
      const defaultImageSize = 512;

      const resizedImage = await resizeImage(
        file,
        defaultImageSize,
        defaultImageSize * imageRatio,
      );

      const result = await convertToBase64(resizedImage);
      if (!result) return;

      imagePreviewer.src = result;
      imagePreviewer.hidden = false;
    });
    imagePasswordInput.addEventListener("cancel", () => {
      console.log("canceled");
    });
  }
}

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

function completeWelcome() {
  localStorage.setItem("welcomed", "true");
  changeHtmlTo(LOGIN_PAGE);
}

function redoWelcome() {
  localStorage.removeItem("welcomed");
  changeHtmlTo(WELCOME_PAGE);
}

function setup() {
  APP_BODY = document.getElementById("app-body");

  const hasBeenWelcomed = localStorage.getItem("welcomed") !== null;

  changeHtmlTo(hasBeenWelcomed ? LOGIN_PAGE : WELCOME_PAGE);
}

window.addEventListener("DOMContentLoaded", (_) => setup());
