/** @type {HTMLBodyElement | null} */
let APP_BODY;

function setup() {
  APP_BODY = document.getElementById("app-body");

  const hasBeenWelcomed = localStorage.getItem("welcomed") !== null;
  const token = localStorage.getItem("currentUser");
  const isLoggedIn = token !== null;

  if (isLoggedIn) {
    changeHtmlTo(VAULT_GALLERY_PAGE);
    renderVaultGrid();
  } else if (hasBeenWelcomed) {
    changeHtmlTo(LOGIN_PAGE);
  } else {
    changeHtmlTo(WELCOME_PAGE);
  }
}

window.addEventListener("DOMContentLoaded", (_) => setup());

function logout() {
  const token = localStorage.getItem("currentUser");
  if (token) {
    fetch("http://localhost:5000/api/auth/logout", {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` },
    }).catch(() => {});
  }
  localStorage.removeItem("currentUser");
  changeHtmlTo(LOGIN_PAGE);
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
      const data = await res.json();
      localStorage.setItem("currentUser", data.token);
      changeHtmlTo(VAULT_GALLERY_PAGE);
      renderVaultGrid();
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
