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
      `<div class="icon-picker-option ${icon.name === selectedIcon ? "selected" : ""}" data-icon="${icon.name}" onclick="selectIcon('${icon.name}', this)">${icon.emoji}</div>`,
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
        <button class="btn btn-ghost" onclick="showDecryptVaultItemModal(${item.vaultId}, ${item.id})">🔓</button>
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
        <p class="auth-error" id="create-vault-error" hidden></p>
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
        <button class="btn btn-ghost" onclick="showDecryptImageModal()">🔓 Decrypt</button>
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
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const vaults = await res.json();

    grid.innerHTML = vaults
      .map((vault) =>
        buildVaultCard(
          { ...vault, itemCount: 0 },
          "openVaultDetail",
          "editVaultName",
          "deleteVault",
        ),
      )
      .join("");

    for (const vault of vaults) {
      const countRes = await fetch(
        `http://localhost:5000/api/vault/${vault.id}/items`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (countRes.ok) {
        const items = await countRes.json();
        const nameEl = document.getElementById(`vault-name-${vault.id}`);
        if (nameEl) {
          const card = nameEl.closest(".vault-card");
          if (card) {
            const countEl = card.querySelector(".vault-card-count");
            if (countEl)
              countEl.textContent = `${items.length} item${items.length !== 1 ? "s" : ""}`;
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

  /** @type {HTMLInputElement | null} */
  const nameInput = document.getElementById("vault-name-input");
  nameInput?.addEventListener("input", validateVaultName);
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

function validateVaultName() {
  /** @type {HTMLInputElement | null} */
  const nameInput = document.getElementById("vault-name-input");
  const val = nameInput?.value ?? "";
  /** @type {HTMLParagraphElement | null} */
  const errorP = document.getElementById("create-vault-error");
  if (!errorP) return;

  if (!val || !val.trim()) {
    errorP.textContent = "Vault name is required.";
    errorP.hidden = false;
  } else if (val.length < 3) {
    errorP.textContent = "Name must be at least 3 characters.";
    errorP.hidden = false;
  } else if (val.length > 100) {
    errorP.textContent = "Name must be 100 characters or fewer.";
    errorP.hidden = false;
  } else {
    errorP.hidden = true;
    errorP.textContent = "";
  }
}

async function createVault() {
  const token = getToken();
  if (!token) return;

  /** @type {HTMLInputElement | null} */
  const nameInput = document.getElementById("vault-name-input");
  if (!nameInput) return;

  validateVaultName();

  /** @type {HTMLParagraphElement | null} */
  const errorP = document.getElementById("create-vault-error");
  if (errorP && !errorP.hidden) return;

  const name = nameInput.value.trim();
  if (!name) return;

  try {
    const res = await fetch("http://localhost:5000/api/vault/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, icon: selectedIcon }),
    });

    if (res.ok) {
      hideCreateVaultModal();
      showVaultGallery();
    } else {
      const data = await res.json().catch(() => null);
      if (errorP) {
        errorP.textContent = data?.error || "Failed to create vault";
        errorP.hidden = false;
      }
    }
  } catch (err) {
    if (errorP) {
      errorP.textContent = "Could not connect to server";
      errorP.hidden = false;
    }
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
    const vaultRes = await fetch(
      `http://localhost:5000/api/vault/${currentVaultId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    if (!vaultRes.ok) return;
    const vault = await vaultRes.json();
    titleEl.textContent = vault.name;

    const itemsRes = await fetch(
      `http://localhost:5000/api/vault/${currentVaultId}/items`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
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
      contentEl
        .querySelectorAll(".item-card-image")
        .forEach((img) => loadImageWithAuth(img));
    }
  } catch (err) {
    console.error("Failed to load vault detail:", err);
  }
}

async function downloadItem(vaultId, itemId) {
  const token = getToken();
  if (!token) return;

  try {
    const res = await fetch(
      `http://localhost:5000/api/vault/${vaultId}/items/${itemId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
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
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const blob = await res.blob();

    const blobUrl = URL.createObjectURL(blob);
    img.src = blobUrl;
  } catch (err) {
    console.error("Failed to load image:", err);
  }
}

async function decryptItemImage(vaultId, itemId) {
  const token = getToken();
  if (!token) return;

  try {
    const res = await fetch(
      `http://localhost:5000/api/vault/${vaultId}/items/${itemId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    if (!res.ok) return;
    const blob = await res.blob();

    /** @type {HTMLInputElement | null} */
    const passwordInput = document.getElementById("decrypt-image-password");
    if (!passwordInput || !passwordInput.value.trim()) {
      alert("Please enter the encryption key.");
      return;
    }

    const extractedString = await getPasswordFromFile(
      blob,
      passwordInput.value.trim(),
    );
    /** @type {HTMLParagraphElement | null} */
    const resultP = document.getElementById("decrypt-image-result");
    if (resultP) {
      resultP.textContent = extractedString || "No embedded data found.";
    }
  } catch (err) {
    console.error("Failed to decrypt image:", err);
  }
}

function showDecryptVaultItemModal(vaultId, itemId) {
  const overlay = document.createElement("div");
  overlay.className = "vault-modal-overlay";
  overlay.id = "decrypt-vault-item-overlay";
  overlay.onclick = (e) => {
    if (e.target.id === "decrypt-vault-item-overlay") overlay.remove();
  };
  overlay.innerHTML = `
    <div class="vault-modal" onclick="event.stopPropagation()">
      <h2>Decrypt Vault Item</h2>
      <div class="form-group">
        <label for="decrypt-vault-password">Encryption key</label>
        <input id="decrypt-vault-password" class="input" type="password" placeholder="Enter encryption key" />
      </div>
      <button class="btn btn-primary" onclick="decryptVaultItem(${vaultId}, ${itemId})">Decrypt</button>
      <p id="decrypt-vault-result" class="encrypt-result">Awaiting decrypt...</p>
      <div class="vault-modal-actions">
        <button class="btn" onclick="document.getElementById('decrypt-vault-item-overlay').remove()">Close</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  /** @type {HTMLInputElement | null} */
  const pwInput = document.getElementById("decrypt-vault-password");
  pwInput?.focus();
}

async function decryptVaultItem(vaultId, itemId) {
  const token = getToken();
  if (!token) return;

  try {
    const res = await fetch(
      `http://localhost:5000/api/vault/${vaultId}/items/${itemId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    if (!res.ok) return;
    const blob = await res.blob();

    /** @type {HTMLInputElement | null} */
    const passwordInput = document.getElementById("decrypt-vault-password");
    if (!passwordInput || !passwordInput.value.trim()) {
      alert("Please enter the encryption key.");
      return;
    }

    const extractedString = await getPasswordFromFile(
      blob,
      passwordInput.value.trim(),
    );
    /** @type {HTMLParagraphElement | null} */
    const resultP = document.getElementById("decrypt-vault-result");
    if (resultP) {
      resultP.textContent = extractedString || "No embedded data found.";
    }
  } catch (err) {
    console.error("Failed to decrypt image:", err);
  }
}

function showDecryptImageModal() {
  const overlay = document.createElement("div");
  overlay.className = "vault-modal-overlay";
  overlay.id = "decrypt-image-overlay";
  overlay.onclick = (e) => {
    if (e.target.id === "decrypt-image-overlay") overlay.remove();
  };
  overlay.innerHTML = `
    <div class="vault-modal" onclick="event.stopPropagation()">
      <h2>Decrypt Image</h2>
      <div class="form-group">
        <label for="decrypt-image-file-input">Select image file</label>
        <input id="decrypt-image-file-input" class="input" type="file" accept="image/*" />
      </div>
      <div class="form-group">
        <label for="decrypt-image-password">Encryption key</label>
        <input id="decrypt-image-password" class="input" type="password" placeholder="Enter encryption key" />
      </div>
      <button class="btn btn-primary" onclick="decryptFromLocalFile()">Decrypt</button>
      <p id="decrypt-image-result" class="encrypt-result">Awaiting decrypt...</p>
      <div class="vault-modal-actions">
        <button class="btn" onclick="document.getElementById('decrypt-image-overlay').remove()">Close</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

async function decryptFromLocalFile() {
  /** @type {HTMLInputElement | null} */
  const fileInput = document.getElementById("decrypt-image-file-input");
  if (!fileInput || !fileInput.files[0]) return;

  /** @type {HTMLInputElement | null} */
  const passwordInput = document.getElementById("decrypt-image-password");
  if (!passwordInput || !passwordInput.value.trim()) {
    alert("Please enter the encryption key.");
    return;
  }

  const extractedString = await getPasswordFromFile(
    fileInput.files[0],
    passwordInput.value.trim(),
  );
  /** @type {HTMLParagraphElement | null} */
  const resultP = document.getElementById("decrypt-image-result");
  if (resultP) {
    resultP.textContent = extractedString || "No embedded data found.";
  }
}

async function deleteItem(vaultId, itemId) {
  if (!confirm("Delete this item?")) return;

  const token = getToken();
  if (!token) return;

  try {
    const res = await fetch(
      `http://localhost:5000/api/vault/${vaultId}/items/${itemId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      },
    );
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
    const res = await fetch(
      `http://localhost:5000/api/vault/${vaultId}/items/${itemId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newName }),
      },
    );
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
        <p class="auth-error" id="upload-name-error" hidden></p>
      </div>
      <div class="form-group">
        <label for="upload-secret-input">Secret to embed</label>
        <input id="upload-secret-input" class="input" type="password" placeholder="e.g., my-s3cret" />
        <p class="auth-error" id="upload-secret-error" hidden></p>
      </div>
      <div class="form-group">
        <label for="upload-password-input">Encryption key</label>
        <input id="upload-password-input" class="input" type="password" placeholder="Enter encryption key" />
        <p class="auth-error" id="upload-password-error" hidden></p>
      </div>
      <div class="form-group">
        <label for="upload-file-input">Image file</label>
        <input id="upload-file-input" class="input" type="file" accept="image/*" />
        <p class="auth-error" id="upload-file-error" hidden></p>
      </div>
      <p class="auth-error" id="upload-error" hidden></p>
      <div class="vault-modal-actions">
        <button class="btn" onclick="document.getElementById('upload-name-overlay').remove()">Cancel</button>
        <button class="btn btn-primary" id="upload-confirm-btn" disabled>Upload</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  function clearUploadErrors() {
    const ids = [
      "upload-error",
      "upload-name-error",
      "upload-secret-error",
      "upload-password-error",
      "upload-file-error",
    ];
    for (const id of ids) {
      /** @type {HTMLParagraphElement | null} */
      const el = document.getElementById(id);
      if (el) {
        el.hidden = true;
        el.textContent = "";
      }
    }
  }

  function showFieldError(errorId, message) {
    /** @type {HTMLParagraphElement | null} */
    const errorEl = document.getElementById(errorId);
    if (errorEl && message) {
      errorEl.textContent = message;
      errorEl.hidden = false;
    }
  }

  function validateName() {
    /** @type {HTMLInputElement | null} */
    const nameInput = document.getElementById("upload-name-input");
    const val = nameInput?.value ?? "";
    if (!val || !val.trim()) {
      /** @type {HTMLParagraphElement | null} */
      const el = document.getElementById("upload-name-error");
      if (el) {
        el.hidden = true;
        el.textContent = "";
      }
    } else if (val.length < 3) {
      showFieldError(
        "upload-name-error",
        "Name must be at least 3 characters.",
      );
    } else if (val.length > 100) {
      showFieldError(
        "upload-name-error",
        "Name must be 100 characters or fewer.",
      );
    } else {
      /** @type {HTMLParagraphElement | null} */
      const el = document.getElementById("upload-name-error");
      if (el) {
        el.hidden = true;
        el.textContent = "";
      }
    }
  }

  function validateSecret() {
    /** @type {HTMLInputElement | null} */
    const secretInput = document.getElementById("upload-secret-input");
    const val = secretInput?.value ?? "";
    if (!val || !val.trim()) {
      showFieldError("upload-secret-error", "Secret to embed is required.");
    } else if (val.length < 3) {
      showFieldError(
        "upload-secret-error",
        "Secret must be at least 3 characters.",
      );
    } else if (val.length > 500) {
      showFieldError(
        "upload-secret-error",
        "Secret must be 500 characters or fewer.",
      );
    } else {
      /** @type {HTMLParagraphElement | null} */
      const el = document.getElementById("upload-secret-error");
      if (el) {
        el.hidden = true;
        el.textContent = "";
      }
    }
  }

  function validatePassword() {
    /** @type {HTMLInputElement | null} */
    const passwordInput = document.getElementById("upload-password-input");
    const val = passwordInput?.value ?? "";
    if (!val || !val.trim()) {
      showFieldError("upload-password-error", "Encryption key is required.");
    } else if (val.length < 3) {
      showFieldError(
        "upload-password-error",
        "Key must be at least 3 characters.",
      );
    } else if (val.length > 100) {
      showFieldError(
        "upload-password-error",
        "Key must be 100 characters or fewer.",
      );
    } else {
      /** @type {HTMLParagraphElement | null} */
      const el = document.getElementById("upload-password-error");
      if (el) {
        el.hidden = true;
        el.textContent = "";
      }
    }
  }

  function validateFile() {
    /** @type {HTMLInputElement | null} */
    const fileInput = document.getElementById("upload-file-input");
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      showFieldError("upload-file-error", "Please select an image file.");
    } else {
      /** @type {HTMLParagraphElement | null} */
      const el = document.getElementById("upload-file-error");
      if (el) {
        el.hidden = true;
        el.textContent = "";
      }
    }
  }

  clearUploadErrors();

  /** @type {HTMLInputElement | null} */
  const fileInput = document.getElementById("upload-file-input");
  let hasFile = false;

  function updateUploadButton() {
    /** @type {HTMLInputElement | null} */
    const secretInput = document.getElementById("upload-secret-input");
    /** @type {HTMLInputElement | null} */
    const passwordInput = document.getElementById("upload-password-input");
    const btn = document.getElementById("upload-confirm-btn");
    if (btn) {
      btn.disabled = !(
        hasFile &&
        secretInput?.value.trim() &&
        passwordInput?.value.trim()
      );
    }
  }

  function handleFileChange() {
    hasFile = !!fileInput?.files && fileInput.files.length > 0;
    updateUploadButton();
    validateFile();
  }

  fileInput?.addEventListener("change", handleFileChange);
  fileInput?.addEventListener("input", handleFileChange);

  /** @type {HTMLInputElement | null} */
  const nameInput = document.getElementById("upload-name-input");
  nameInput?.addEventListener("input", () => {
    validateName();
    updateUploadButton();
  });

  /** @type {HTMLInputElement | null} */
  const secretInput = document.getElementById("upload-secret-input");
  secretInput?.addEventListener("input", () => {
    validateSecret();
    updateUploadButton();
  });

  /** @type {HTMLInputElement | null} */
  const passwordInput = document.getElementById("upload-password-input");
  passwordInput?.addEventListener("input", () => {
    validatePassword();
    updateUploadButton();
  });

  /** @type {HTMLButtonElement | null} */
  const confirmBtn = document.getElementById("upload-confirm-btn");
  confirmBtn?.addEventListener("click", () => {
    if (!fileInput || !fileInput.files || !fileInput.files[0]) return;

    /** @type {HTMLInputElement | null} */
    const nameInput = document.getElementById("upload-name-input");
    const secret = secretInput ? secretInput.value.trim() : "";
    const customName = nameInput ? nameInput.value.trim() : "";
    const encryptionKey = passwordInput ? passwordInput.value : "";

    /** @type {HTMLParagraphElement | null} */
    const errorP = document.getElementById("upload-error");
    /** @type {HTMLParagraphElement | null} */
    const secretError = document.getElementById("upload-secret-error");
    /** @type {HTMLParagraphElement | null} */
    const passwordError = document.getElementById("upload-password-error");

    if (errorP) {
      errorP.hidden = true;
      errorP.textContent = "";
    }
    if (secretError) {
      secretError.hidden = true;
      secretError.textContent = "";
    }
    if (passwordError) {
      passwordError.hidden = true;
      passwordError.textContent = "";
    }

    if (!secret) {
      if (secretError) {
        secretError.textContent = "Secret to embed is required.";
        secretError.hidden = false;
      }
      return;
    }

    if (!encryptionKey) {
      if (passwordError) {
        passwordError.textContent = "Encryption key is required.";
        passwordError.hidden = false;
      }
      return;
    }

    uploadItem(fileInput.files[0], customName, secret, encryptionKey, overlay);
  });
}

async function uploadItem(file, customName, secret, encryptionKey, overlay) {
  if (!currentVaultId) return;

  const token = getToken();
  if (!token) return;

  let fileBlob = file;

  if (file.type.startsWith("image/")) {
    if (encryptionKey && encryptionKey.trim()) {
      const embedSecret = secret || customName || encryptionKey.trim();
      const { width, height } = await getImageSize(file);
      const imageRatio = width !== 0 ? height / width : 1;
      const resizedImage = await resizeImage(file, 2048, 2048 * imageRatio);

      fileBlob = await addPasswordToFile(
        resizedImage,
        embedSecret,
        encryptionKey.trim(),
      );
    }
  }

  const formData = new FormData();

  let uploadFilename;
  if (fileBlob instanceof Blob && !(fileBlob instanceof File)) {
    const extMap = {
      "image/png": ".png",
      "image/jpeg": ".jpg",
      "image/webp": ".webp",
    };
    const ext = extMap[fileBlob.type] || "";
    uploadFilename = customName ? `${customName}${ext}` : `upload${ext}`;
  } else {
    uploadFilename = file.name;
  }

  formData.append("file", fileBlob, uploadFilename);
  if (customName) formData.append("name", customName);

  /** @type {HTMLParagraphElement | null} */
  const errorP = document.getElementById("upload-error");
  /** @type {HTMLParagraphElement | null} */
  const nameError = document.getElementById("upload-name-error");
  /** @type {HTMLParagraphElement | null} */
  const secretError = document.getElementById("upload-secret-error");
  /** @type {HTMLParagraphElement | null} */
  const passwordError = document.getElementById("upload-password-error");
  /** @type {HTMLParagraphElement | null} */
  const fileError = document.getElementById("upload-file-error");

  if (errorP) {
    errorP.hidden = true;
    errorP.textContent = "";
  }
  if (nameError) {
    nameError.hidden = true;
    nameError.textContent = "";
  }
  if (secretError) {
    secretError.hidden = true;
    secretError.textContent = "";
  }
  if (passwordError) {
    passwordError.hidden = true;
    passwordError.textContent = "";
  }
  if (fileError) {
    fileError.hidden = true;
    fileError.textContent = "";
  }

  try {
    const res = await fetch(
      `http://localhost:5000/api/vault/${currentVaultId}/items`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      },
    );

    if (res.ok) {
      renderVaultDetail();
      overlay?.remove();
    } else {
      const data = await res.json().catch(() => null);
      const serverErrorMap = {
        "No file uploaded": fileError,
        "File name too short": nameError,
        "File name too long": nameError,
        "Invalid mime type": fileError,
        "File too large": fileError,
      };
      if (data.error && data.error in serverErrorMap) {
        const el = serverErrorMap[data.error];
        if (el) {
          el.textContent = data.error;
          el.hidden = false;
        }
      } else if (errorP) {
        errorP.textContent = data?.error || "Failed to upload item";
        errorP.hidden = false;
      }
    }
  } catch (err) {
    if (errorP) {
      errorP.textContent = "Could not connect to server";
      errorP.hidden = false;
    }
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
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
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
      headers: { Authorization: `Bearer ${token}` },
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
      <div style="font-size: 4rem;">MOSAICO</div>
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
      <div style="font-size: 4rem;">MOSAICO</div>
    </div>
    <div class="auth-panel">
      <div class="auth-card">
        <h1>Sign Up</h1>
        <form class="auth-form" id="signup-form">
          <div class="form-group">
            <label for="signup-username-input">Username</label>
            <input id="signup-username-input" class="input" placeholder="Enter your username" />
            <p class="auth-error" id="signup-username-error" hidden></p>
          </div>
          <div class="form-group">
            <label for="signup-email-input">Email</label>
            <input id="signup-email-input" class="input" type="email" placeholder="Enter your email" />
            <p class="auth-error" id="signup-email-error" hidden></p>
          </div>
          <div class="form-group">
            <label for="signup-password-input">Password</label>
            <input id="signup-password-input" class="input" type="password" placeholder="Enter your password" />
            <p class="auth-error" id="signup-password-error" hidden></p>
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
 * @param {string} email
 * @param {string} password
 */
async function signup(username, email, password) {
  /** @type {HTMLButtonElement | null} */
  const signupBtn = document.getElementById("signup-btn");

  if (!signupBtn) return;

  /** @type {HTMLParagraphElement | null} */
  const usernameError = document.getElementById("signup-username-error");
  /** @type {HTMLParagraphElement | null} */
  const emailError = document.getElementById("signup-email-error");
  /** @type {HTMLParagraphElement | null} */
  const passwordError = document.getElementById("signup-password-error");

  signupBtn.disabled = true;
  signupBtn.textContent = "Signing up...";

  if (usernameError) {
    usernameError.hidden = true;
    usernameError.textContent = "";
  }
  if (emailError) {
    emailError.hidden = true;
    emailError.textContent = "";
  }
  if (passwordError) {
    passwordError.hidden = true;
    passwordError.textContent = "";
  }

  const errors = {};

  if (!username || username.length < 4) {
    errors.username = "Username must be at least 4 characters";
  }

  const emailRegex =
    /^[A-Za-z0-9_%+-]+(\.[A-Za-z0-9_%+-]+)*@([A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;
  if (!email || !emailRegex.test(email)) {
    errors.email = "Invalid email format";
  }

  if (!password) {
    errors.password = "Password is required";
  } else {
    const passwordErrors = [];
    if (password.length < 8) {
      passwordErrors.push("at least 8 characters");
    }
    if (!/[A-Z]/.test(password)) {
      passwordErrors.push("one uppercase letter");
    }
    if (!/[a-z]/.test(password)) {
      passwordErrors.push("one lowercase letter");
    }
    if (!/[0-9]/.test(password)) {
      passwordErrors.push("one number");
    }
    if (!/[!@#$%^&*_+,.?":{}|<>-]/.test(password)) {
      passwordErrors.push("one special character");
    }
    if (passwordErrors.length > 0) {
      errors.password = "Must contain " + passwordErrors.join(", ");
    }
  }

  for (const [field, error] of Object.entries(errors)) {
    const elMap = {
      username: document.getElementById("signup-username-error"),
      email: document.getElementById("signup-email-error"),
      password: document.getElementById("signup-password-error"),
    };
    const el = elMap[field];
    if (el) {
      el.textContent = error;
      el.hidden = false;
    }
  }

  if (Object.keys(errors).length > 0) {
    signupBtn.disabled = false;
    signupBtn.textContent = "Sign Up";
    return;
  }

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
      const fieldMap = {
        "Invalid username": "username",
        "Username is taken": "username",
        "Invalid email format": "email",
        "Email is taken": "email",
      };
      if (data.error && data.error in fieldMap) {
        const targetEl = document.getElementById(
          `signup-${fieldMap[data.error]}-error`,
        );
        if (targetEl) {
          targetEl.textContent = data.error;
          targetEl.hidden = false;
        }
      } else {
        if (passwordError) {
          passwordError.textContent = data.error || "Sign up failed";
          passwordError.hidden = false;
        }
      }
    }
  } catch (err) {
    if (usernameError) {
      usernameError.textContent = "Could not connect to server";
      usernameError.hidden = false;
    }
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
