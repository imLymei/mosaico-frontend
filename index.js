/** @type {HTMLBodyElement | null} */
let APP_BODY;

/**
 *
 * @param {number} size
 * @param {boolean} useCapitalLetters
 * @param {boolean} useSpecialCharacters
 * @returns {string}
 */
function generateRandomPassword(
  size = 12,
  useCapitalLetters = true,
  useSpecialCharacters = true,
) {}

function setup() {
  APP_BODY = document.getElementById("app-body");

  const hasBeenWelcomed = localStorage.getItem("welcomed") !== null;

  changeHtmlTo(hasBeenWelcomed ? LOGIN_PAGE : WELCOME_PAGE);
}

window.addEventListener("DOMContentLoaded", (_) => setup());
