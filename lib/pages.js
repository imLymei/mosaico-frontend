const WELCOME_PAGE = `
  <div>
    <h1>WELCOME!</h1>
    <button onclick="completeWelcome()">Has been Welcomed</button>
  </div>
`;
const LOGIN_PAGE = `
  <div class="flex-col">
    <h1>Login Page</h1>
    <button onclick="redoWelcome()">Redo Welcome</button>
    <input id="image-password-input" type="file" accept="image/png, image/jpeg" />
    <div class="flex">
      <img hidden class="object-contain" style="width: 500px; height: 500px" id="image-previewer" />
      <img hidden class="object-contain" style="width: 500px; height: 500px" id="image-password-previewer" />
    </div>
    <input id="decrypt-password-input" />
    <button onclick="tryDecryptImage()">decrypt</button>
    <p id="decrypt-result">Awaiting decrypt...</p>
    <button onclick="startTest()">Start Test</button>
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
      const imagePasswordPreviewer = document.getElementById(
        "image-password-previewer",
      );

      const file = imagePasswordInput.files[0];
      const { width, height } = await getImageSize(file);
      const imageRatio = width !== 0 ? height / width : 1;
      const defaultImageSize = 2048;

      const resizedImage = await resizeImage(
        file,
        defaultImageSize,
        defaultImageSize * imageRatio,
      );

      const passwordImage = await addPasswordToFile(
        resizedImage,
        "Alguma67Senha69Dificil",
        TEST_PASSWORD,
      );

      const defaultImageBase64 = await blobToBase64(resizedImage);
      if (!defaultImageBase64) return;

      const passwordImageBase64 = await blobToBase64(passwordImage);
      if (!passwordImageBase64) return;

      imagePreviewer.src = defaultImageBase64;
      imagePreviewer.hidden = false;
      imagePasswordPreviewer.src = passwordImageBase64;
      imagePasswordPreviewer.hidden = false;
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

async function tryDecryptImage() {
  const decryptResultP = document.getElementById("decrypt-result");
  /** @type {HTMLInputElement | null} */
  const decryptPasswordInput = document.getElementById(
    "decrypt-password-input",
  );
  const imagePasswordPreviewer = document.getElementById(
    "image-password-previewer",
  );

  if (
    !decryptResultP ||
    !imagePasswordPreviewer ||
    !decryptPasswordInput ||
    imagePasswordPreviewer.hidden ||
    imagePasswordPreviewer.src === ""
  )
    return;

  const password = decryptPasswordInput.value;
  const imagePasswordBlob = await base64ToBlob(imagePasswordPreviewer.src);

  decryptResultP.innerText = await getPasswordFromFile(
    imagePasswordBlob,
    password,
  );
}

async function startTest() {
  const imagePreviewer = document.getElementById("image-previewer");
  const defaultBase64 = imagePreviewer.src;
  const defaultBlob = await base64ToBlob(defaultBase64);
  const decryptPassword = generateRandomPassword(24);

  for (let i = 0; i < 20; i++) {
    const randomPassword = generateRandomPassword(24);
    const encryptedBlob = await addPasswordToFile(
      defaultBlob,
      randomPassword,
      decryptPassword,
    );
    const encryptedBase64 = await blobToBase64(encryptedBlob);
    const decryptedPassword = await getPasswordFromFile(
      await base64ToBlob(encryptedBase64),
      decryptPassword,
    );

    console.log(
      `${randomPassword} => ⚙️ => ${decryptedPassword} = ${randomPassword === decryptedPassword ? "✅" : "❎"}`,
    );
  }
}
