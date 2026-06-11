const WELCOME_PAGE = `
  <div class="welcome-page">
    <div class="welcome-content">
      <h1 class="welcome-title">Mosaico</h1>
      <p class="welcome-subtitle">Hide your secrets inside your images</p>
      <div class="welcome-steps">
        <div class="step">
          <div class="step-icon">📸</div>
          <p>Upload an image</p>
        </div>
        <div class="step">
          <div class="step-icon">🔐</div>
          <p>Embed your secret</p>
        </div>
        <div class="step">
          <div class="step-icon">🦺</div>
          <p>Keep it safe</p>
        </div>
      </div>
      <button class="btn btn-primary" onclick="completeWelcome()">Get Started</button>
    </div>
  </div>
`;
const LOGIN_PAGE = `
  <div class="auth-page">
    <div class="auth-panel" style="background-color: #000;">
      <div style="font-size: 4rem;">CHANGE LATER</div>
    </div>
    <div class="auth-panel">
      <div class="auth-card">
        <h1>Login</h1>
        <form class="auth-form" id="login-form">
          <div class="form-group">
            <label for="username-input">Username</label>
            <input id="username-input" class="input" required placeholder="Enter your username" />
          </div>
          <div class="form-group">
            <label for="password-input">Password</label>
            <input id="password-input" class="input" type="password" required placeholder="Enter your password" />
          </div>
          <button type="submit" class="btn btn-block" id="login-btn">Login</button>
        </form>
        <p class="auth-error" id="login-error" hidden></p>
      </div>
      <div class="auth-actions">
        <button class="btn btn-ghost" onclick="redoWelcome()">Redo Welcome</button>
        <p class="auth-link">Don't have an account? Sign up</p>
      </div>
    </div>
  </div>
`;
const ENCRYPT_PAGE = `
  <div class="encrypt-page">
    <div class="encrypt-content">
      <h1 class="encrypt-title">Encrypt</h1>
      <div class="encrypt-section">
        <label for="image-password-input" class="encrypt-label">Upload image</label>
        <input id="image-password-input" class="input" type="file" accept="image/png, image/jpeg" />
      </div>
      <div class="encrypt-preview">
        <img hidden class="object-contain encrypt-image" id="image-previewer" />
        <img hidden class="object-contain encrypt-image" id="image-password-previewer" />
      </div>
      <div class="encrypt-section">
        <label for="decrypt-password-input" class="encrypt-label">Decrypt password</label>
        <input id="decrypt-password-input" class="input" placeholder="Enter password to decrypt" />
      </div>
      <button class="btn btn-primary" onclick="tryDecryptImage()">Decrypt</button>
      <p id="decrypt-result" class="encrypt-result">Awaiting decrypt...</p>
      <button class="btn btn-ghost" onclick="startTest()">Start Test</button>
    </div>
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
  /** @type {HTMLFormElement | null} */
  const loginForm = document.getElementById("login-form");

  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      /** @type {HTMLInputElement | null} */
      const usernameInput = document.getElementById("username-input");
      /** @type {HTMLInputElement | null} */
      const passwordInput = document.getElementById("password-input");
      if (!usernameInput || !passwordInput) return;
      login(usernameInput.value, passwordInput.value);
    });
  }

  /** @type {HTMLInputElement | null} */
  const imagePasswordInput = document.getElementById("image-password-input");

  if (imagePasswordInput) {
    imagePasswordInput.addEventListener("change", async () => {
      /** @type {HTMLImageElement | null} */
      const imagePreviewer = document.getElementById("image-previewer");
      /** @type {HTMLImageElement | null} */
      const imagePasswordPreviewer = document.getElementById(
        "image-password-previewer",
      );

      if (!imagePreviewer || !imagePasswordPreviewer) return;

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

/**
 * @param {string} username
 * @param {string} password
 */
async function login(username, password) {
  /** @type {HTMLButtonElement | null} */
  const loginBtn = document.getElementById("login-btn");
  /** @type {HTMLParagraphElement | null} */
  const loginError = document.getElementById("login-error");

  if (!loginBtn || !loginError) return;

  loginBtn.disabled = true;
  loginBtn.textContent = "Logging in...";
  loginError.hidden = true;

  try {
    const res = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      changeHtmlTo(ENCRYPT_PAGE);
    } else {
      const data = await res.json();
      loginError.textContent = data.error || "Login failed";
      loginError.hidden = false;
    }
  } catch (err) {
    loginError.textContent = "Could not connect to server";
    loginError.hidden = false;
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "Login";
  }
}

async function tryDecryptImage() {
  /** @type {HTMLParagraphElement | null} */
  const decryptResultP = document.getElementById("decrypt-result");
  /** @type {HTMLInputElement | null} */
  const decryptPasswordInput = document.getElementById(
    "decrypt-password-input",
  );
  /** @type {HTMLImageElement | null} */
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
  /** @type {HTMLImageElement | null} */
  const imagePreviewer = document.getElementById("image-previewer");
  if (!imagePreviewer) return;
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
