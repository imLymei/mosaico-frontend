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

function completeWelcome() {
  localStorage.setItem("welcomed", "true");
  changeHtmlTo(LOGIN_PAGE);
}

function redoWelcome() {
  localStorage.removeItem("welcomed");
  changeHtmlTo(WELCOME_PAGE);
}
