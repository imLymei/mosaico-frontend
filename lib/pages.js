const PRESET_ICONS = [
  { name: "default", emoji: "📦" },
  { name: "discord", emoji: "💬" },
  { name: "whatsapp", emoji: "📱" },
  { name: "gmail", emoji: "✉️" },
  { name: "instagram", emoji: "📷" },
  { name: "twitter", emoji: "🐦" },
  { name: "github", emoji: "🐙" },
  { name: "netflix", emoji: "🎬" },
  { name: "spotify", emoji: "🎵" },
  { name: "amazon", emoji: "📦" },
  { name: "facebook", emoji: "👤" },
  { name: "linkedin", emoji: "💼" },
  { name: "youtube", emoji: "▶️" },
  { name: "tiktok", emoji: "🎵" },
  { name: "telegram", emoji: "✈️" },
  { name: "dropbox", emoji: "☁️" },
  { name: "icloud", emoji: "☁️" },
  { name: "google", emoji: "🔍" },
  { name: "apple", emoji: "🍎" },
  { name: "bank", emoji: "🏦" },
];

const DEFAULT_ICON = PRESET_ICONS[0];

function getIconEmoji(iconName) {
  if (!iconName) return DEFAULT_ICON.emoji;
  const found = PRESET_ICONS.find((icon) => icon.name === iconName);
  return found ? found.emoji : DEFAULT_ICON.emoji;
}

function buildIconPicker(selectedIcon, onIconSelect) {
  return PRESET_ICONS.map(
    (icon) =>
      `<div class="icon-picker-option ${icon.name === selectedIcon ? "selected" : ""}" data-icon="${icon.name}" onclick="selectIcon('${icon.name}', this)">${icon.emoji}</div>`
  ).join("");
}

function buildVaultCard(vault, onOpen, onRename, onDelete) {
  const emoji = getIconEmoji(vault.icon);
  return `
    <div class="vault-card" onclick="${onOpen}(${vault.id})">
      <div class="vault-card-icon">${emoji}</div>
      <div class="vault-card-name" id="vault-name-${vault.id}">${vault.name}</div>
      <div class="vault-card-count">${vault.itemCount} item${vault.itemCount !== 1 ? "s" : ""}</div>
      <div class="vault-card-actions" onclick="event.stopPropagation()">
        <button class="btn btn-ghost" onclick="editVaultName(${vault.id})">✏️</button>
        <button class="btn btn-danger" onclick="deleteVault(${vault.id})">🗑️</button>
      </div>
    </div>
  `;
}

function buildItemCard(item, onDownload, onDelete, onNameChange) {
  const isImage = item.mimeType && item.mimeType.startsWith("image/");
  const fallbackIcon = isImage ? "🖼️" : "📄";
  return `
    <div class="item-card">
      ${
        isImage
          ? `<img class="item-card-image" data-item-url="http://localhost:5000/api/vault/${item.vaultId}/items/${item.id}" alt="${item.name}" />`
          : `<div class="vault-card-icon">${fallbackIcon}</div>`
      }
      <div class="item-card-name" id="item-name-${item.id}">${item.name}</div>
      <div class="item-card-actions">
        <button class="btn btn-ghost" onclick="downloadItem(${item.vaultId}, ${item.id})">⬇️</button>
        <button class="btn btn-danger" onclick="deleteItem(${item.vaultId}, ${item.id})">🗑️</button>
      </div>
    </div>
  `;
}

const VAULT_GALLERY_PAGE = `
  <div class="vault-gallery-page">
    <div class="vault-gallery-header">
      <h1>My Vaults</h1>
      <div style="display: flex; gap: 0.75rem;">
        <button class="btn btn-ghost" onclick="logout()">Logout</button>
        <button class="btn btn-primary" onclick="showCreateVaultModal()">+ New Vault</button>
      </div>
    </div>
    <div class="vault-grid" id="vault-grid"></div>
  </div>
`;

function buildCreateVaultModal() {
  return `
    <div class="vault-modal-overlay" id="create-vault-overlay" onclick="handleOverlayClick(event)">
      <div class="vault-modal" onclick="event.stopPropagation()">
        <h2>Create Vault</h2>
        <div class="form-group">
          <label for="vault-name-input">Name</label>
          <input id="vault-name-input" class="input" placeholder="e.g., My Discord passwords" />
        </div>
        <div class="form-group">
          <label>Icon</label>
          <div class="icon-picker" id="icon-picker"></div>
        </div>
        <div class="vault-modal-actions">
          <button class="btn" onclick="hideCreateVaultModal()">Cancel</button>
          <button class="btn btn-primary" onclick="createVault()">Create</button>
        </div>
      </div>
    </div>
  `;
}

const VAULT_DETAIL_PAGE = `
  <div class="vault-detail-page">
    <div class="vault-detail-header">
      <div style="display: flex; align-items: center; gap: 1rem;">
        <button class="btn btn-ghost" onclick="showVaultGallery()">← Back</button>
        <h1 id="vault-detail-title"></h1>
      </div>
      <div class="vault-detail-header-actions">
        <button class="btn btn-primary" onclick="uploadItemPrompt()">+ Upload</button>
      </div>
    </div>
    <div id="vault-detail-content"></div>
  </div>
`;

let currentVaultId = null;
let selectedIcon = "default";

function getToken() {
  return localStorage.getItem("currentUser");
}

function showVaultGallery() {
  currentVaultId = null;
  changeHtmlTo(VAULT_GALLERY_PAGE);
  renderVaultGrid();
}

async function renderVaultGrid() {
  const grid = document.getElementById("vault-grid");
  if (!grid) return;

  const token = getToken();
  if (!token) return;

  try {
    const res = await fetch("http://localhost:5000/api/vault/", {
      headers: { "Authorization": `Bearer ${token}` },
    });
    if (!res.ok) return;
    const vaults = await res.json();

    grid.innerHTML = vaults.map((vault) =>
      buildVaultCard(
        { ...vault, itemCount: 0 },
        "openVaultDetail",
        "editVaultName",
        "deleteVault"
      )
    ).join("");

    for (const vault of vaults) {
      const countRes = await fetch(`http://localhost:5000/api/vault/${vault.id}/items`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (countRes.ok) {
        const items = await countRes.json();
        const nameEl = document.getElementById(`vault-name-${vault.id}`);
        if (nameEl) {
          const card = nameEl.closest(".vault-card");
          if (card) {
            const countEl = card.querySelector(".vault-card-count");
            if (countEl) countEl.textContent = `${items.length} item${items.length !== 1 ? "s" : ""}`;
          }
        }
      }
    }
  } catch (err) {
    console.error("Failed to load vaults:", err);
  }
}

function showCreateVaultModal() {
  selectedIcon = "default";
  const overlayHtml = buildCreateVaultModal();
  APP_BODY.innerHTML += overlayHtml;

  const picker = document.getElementById("icon-picker");
  if (picker) {
    picker.innerHTML = buildIconPicker(selectedIcon);
  }
}

function hideCreateVaultModal() {
  const overlay = document.getElementById("create-vault-overlay");
  if (overlay) overlay.remove();
}

function handleOverlayClick(event) {
  if (event.target.id === "create-vault-overlay") {
    hideCreateVaultModal();
  }
}

function selectIcon(iconName, el) {
  selectedIcon = iconName;
  const picker = document.getElementById("icon-picker");
  if (picker) {
    picker.querySelectorAll(".icon-picker-option").forEach((opt) => {
      opt.classList.remove("selected");
    });
    el.classList.add("selected");
  }
}

async function createVault() {
  const token = getToken();
  if (!token) return;

  const nameInput = document.getElementById("vault-name-input");
  if (!nameInput) return;

  const name = nameInput.value.trim();
  if (!name) return;

  try {
    const res = await fetch("http://localhost:5000/api/vault/", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ name, icon: selectedIcon }),
    });

    if (res.ok) {
      hideCreateVaultModal();
      showVaultGallery();
    }
  } catch (err) {
    console.error("Failed to create vault:", err);
  }
}

async function openVaultDetail(vaultId) {
  currentVaultId = vaultId;
  changeHtmlTo(VAULT_DETAIL_PAGE);
  await renderVaultDetail();
}

async function renderVaultDetail() {
  if (!currentVaultId) return;

  const token = getToken();
  if (!token) return;

  const titleEl = document.getElementById("vault-detail-title");
  const contentEl = document.getElementById("vault-detail-content");
  if (!titleEl || !contentEl) return;

  try {
    const vaultRes = await fetch(`http://localhost:5000/api/vault/${currentVaultId}`, {
      headers: { "Authorization": `Bearer ${token}` },
    });
    if (!vaultRes.ok) return;
    const vault = await vaultRes.json();
    titleEl.textContent = vault.name;

    const itemsRes = await fetch(`http://localhost:5000/api/vault/${currentVaultId}/items`, {
      headers: { "Authorization": `Bearer ${token}` },
    });
    if (!itemsRes.ok) return;
    const items = await itemsRes.json();

    if (items.length === 0) {
      contentEl.innerHTML = `
        <div class="vault-empty">
          <p>No items yet</p>
          <button class="btn btn-primary" onclick="uploadItemPrompt()">Upload your first item</button>
        </div>
      `;
    } else {
      contentEl.innerHTML = `<div class="item-grid">${items.map((item) => buildItemCard(item, "downloadItem", "deleteItem", "editItemName")).join("")}</div>`;
      contentEl.querySelectorAll(".item-card-image").forEach((img) => loadImageWithAuth(img));
    }
  } catch (err) {
    console.error("Failed to load vault detail:", err);
  }
}

async function downloadItem(vaultId, itemId) {
  const token = getToken();
  if (!token) return;

  try {
    const res = await fetch(`http://localhost:5000/api/vault/${vaultId}/items/${itemId}`, {
      headers: { "Authorization": `Bearer ${token}` },
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  } catch (err) {
    console.error("Failed to download item:", err);
  }
}

/**
 *
 * @param {HTMLImageElement} img
 */
async function loadImageWithAuth(img) {
  const url = img.dataset.itemUrl;
  if (!url) return;

  const token = getToken();
  if (!token) return;

  try {
    const res = await fetch(`${url}?inline=true`, {
      headers: { "Authorization": `Bearer ${token}` },
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    img.src = blobUrl;
  } catch (err) {
    console.error("Failed to load image:", err);
  }
}

async function deleteItem(vaultId, itemId) {
  if (!confirm("Delete this item?")) return;

  const token = getToken();
  if (!token) return;

  try {
    const res = await fetch(`http://localhost:5000/api/vault/${vaultId}/items/${itemId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` },
    });
    if (res.ok) {
      renderVaultDetail();
    }
  } catch (err) {
    console.error("Failed to delete item:", err);
  }
}

async function editItemName(itemId, vaultId) {
  const nameEl = document.getElementById(`item-name-${itemId}`);
  if (!nameEl) return;

  const currentName = nameEl.textContent;
  nameEl.innerHTML = `<input class="item-card-name-input" id="item-name-input-${itemId}" value="${currentName}" />
    <div style="display: flex; gap: 0.25rem;">
      <button class="btn btn-ghost" style="padding: 0.125rem 0.375rem; font-size: 0.75rem;" onclick="saveItemName(${itemId}, ${vaultId})">💾</button>
      <button class="btn btn-ghost" style="padding: 0.125rem 0.375rem; font-size: 0.75rem;" onclick="renderVaultDetail()">✖️</button>
    </div>`;

  const input = document.getElementById(`item-name-input-${itemId}`);
  if (input) {
    input.focus();
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") saveItemName(itemId, vaultId);
      if (e.key === "Escape") renderVaultDetail();
    });
  }
}

async function saveItemName(itemId, vaultId) {
  const input = document.getElementById(`item-name-input-${itemId}`);
  if (!input) return;

  const newName = input.value.trim();
  if (!newName) return;

  const token = getToken();
  if (!token) return;

  try {
    const res = await fetch(`http://localhost:5000/api/vault/${vaultId}/items/${itemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ name: newName }),
    });
    if (res.ok) {
      renderVaultDetail();
    }
  } catch (err) {
    console.error("Failed to update item name:", err);
  }
}

function uploadItemPrompt() {
  const overlay = document.createElement("div");
  overlay.className = "vault-modal-overlay";
  overlay.id = "upload-name-overlay";
  overlay.onclick = (e) => {
    if (e.target.id === "upload-name-overlay") overlay.remove();
  };
  overlay.innerHTML = `
    <div class="vault-modal" onclick="event.stopPropagation()">
      <h2>Upload Item</h2>
      <div class="form-group">
        <label for="upload-name-input">Custom name (optional)</label>
        <input id="upload-name-input" class="input" placeholder="e.g., Door password" />
      </div>
      <div class="vault-modal-actions">
        <button class="btn" onclick="document.getElementById('upload-name-overlay').remove()">Cancel</button>
        <button class="btn btn-primary" id="upload-confirm-btn">Upload</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";

  /** @type {HTMLButtonElement | null} */
  const confirmBtn = document.getElementById("upload-confirm-btn");
  confirmBtn?.addEventListener("click", () => {
    if (fileInput.files && fileInput.files[0]) {
      /** @type {HTMLInputElement | null} */
      const nameInput = document.getElementById("upload-name-input");
      const customName = nameInput ? nameInput.value.trim() : "";
      uploadItem(fileInput.files[0], customName);
    }
    overlay.remove();
  });

  fileInput.click();
  fileInput.onchange = () => {
    overlay.remove();
    if (fileInput.files && fileInput.files[0]) {
      uploadItem(fileInput.files[0], "");
    }
  };
}

async function uploadItem(file, customName) {
  if (!currentVaultId) return;

  const token = getToken();
  if (!token) return;

  const formData = new FormData();
  formData.append("file", file);
  if (customName) formData.append("name", customName);

  try {
    const res = await fetch(`http://localhost:5000/api/vault/${currentVaultId}/items`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` },
      body: formData,
    });

    if (res.ok) {
      renderVaultDetail();
    }
  } catch (err) {
    console.error("Failed to upload item:", err);
  }
}

async function editVaultName(vaultId) {
  const nameEl = document.getElementById(`vault-name-${vaultId}`);
  if (!nameEl) return;

  const currentName = nameEl.textContent;
  nameEl.innerHTML = `<input class="vault-card-edit-name" id="vault-edit-input-${vaultId}" value="${currentName}" />
    <div style="display: flex; gap: 0.25rem; margin-top: 0.25rem;">
      <button class="btn btn-ghost" style="padding: 0.125rem 0.375rem; font-size: 0.75rem;" onclick="saveVaultName(${vaultId})">💾</button>
      <button class="btn btn-ghost" style="padding: 0.125rem 0.375rem; font-size: 0.75rem;" onclick="showVaultGallery()">✖️</button>
    </div>`;

  const input = document.getElementById(`vault-edit-input-${vaultId}`);
  if (input) {
    input.focus();
    input.select();
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") saveVaultName(vaultId);
      if (e.key === "Escape") showVaultGallery();
    });
  }
}

async function saveVaultName(vaultId) {
  const input = document.getElementById(`vault-edit-input-${vaultId}`);
  if (!input) return;

  const newName = input.value.trim();
  if (!newName) return;

  const token = getToken();
  if (!token) return;

  try {
    const res = await fetch(`http://localhost:5000/api/vault/${vaultId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ name: newName }),
    });
    if (res.ok) {
      showVaultGallery();
    }
  } catch (err) {
    console.error("Failed to update vault name:", err);
  }
}

async function deleteVault(vaultId) {
  if (!confirm("Delete this vault and all its items?")) return;

  const token = getToken();
  if (!token) return;

  try {
    const res = await fetch(`http://localhost:5000/api/vault/${vaultId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` },
    });
    if (res.ok) {
      showVaultGallery();
    }
  } catch (err) {
    console.error("Failed to delete vault:", err);
  }
}

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
        <button class="btn btn-ghost" onclick="changeHtmlTo(SIGNUP_PAGE)">Sign up</button>
      </div>
    </div>
  </div>
`;
const SIGNUP_PAGE = `
  <div class="auth-page">
    <div class="auth-panel" style="background-color: #000;">
      <div style="font-size: 4rem;">CHANGE LATER</div>
    </div>
    <div class="auth-panel">
      <div class="auth-card">
        <h1>Sign Up</h1>
        <form class="auth-form" id="signup-form">
          <div class="form-group">
            <label for="signup-username-input">Username</label>
            <input id="signup-username-input" class="input" required placeholder="Enter your username" minlength="4" />
          </div>
          <div class="form-group">
            <label for="signup-email-input">Email</label>
            <input id="signup-email-input" class="input" type="email" required placeholder="Enter your email" />
          </div>
          <div class="form-group">
            <label for="signup-password-input">Password</label>
            <input id="signup-password-input" class="input" type="password" required placeholder="Enter your password" minlength="8" />
          </div>
          <button type="submit" class="btn btn-block" id="signup-btn">Sign Up</button>
        </form>
        <p class="auth-error" id="signup-error" hidden></p>
      </div>
      <div class="auth-actions">
        <button class="btn btn-ghost" onclick="redoWelcome()">Redo Welcome</button>
        <button class="btn btn-ghost" onclick="changeHtmlTo(LOGIN_PAGE)">Login</button>
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

  const signupForm = document.getElementById("signup-form");

  if (signupForm) {
    signupForm.addEventListener("submit", (e) => {
      e.preventDefault();
      /** @type {HTMLInputElement | null} */
      const usernameInput = document.getElementById("signup-username-input");
      /** @type {HTMLInputElement | null} */
      const emailInput = document.getElementById("signup-email-input");
      /** @type {HTMLInputElement | null} */
      const passwordInput = document.getElementById("signup-password-input");
      if (!usernameInput || !emailInput || !passwordInput) return;
      signup(usernameInput.value, emailInput.value, passwordInput.value);
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

/**
 * @param {string} username
 * @param {string} email
 * @param {string} password
 */
async function signup(username, email, password) {
  /** @type {HTMLButtonElement | null} */
  const signupBtn = document.getElementById("signup-btn");
  /** @type {HTMLParagraphElement | null} */
  const signupError = document.getElementById("signup-error");

  if (!signupBtn || !signupError) return;

  signupBtn.disabled = true;
  signupBtn.textContent = "Signing up...";
  signupError.hidden = true;

  try {
    const res = await fetch("http://localhost:5000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    if (res.ok) {
      changeHtmlTo(LOGIN_PAGE);
    } else {
      const data = await res.json();
      signupError.textContent = data.error || "Sign up failed";
      signupError.hidden = false;
    }
  } catch (err) {
    signupError.textContent = "Could not connect to server";
    signupError.hidden = false;
  } finally {
    signupBtn.disabled = false;
    signupBtn.textContent = "Sign Up";
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
