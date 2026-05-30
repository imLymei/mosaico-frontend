/** @type {HTMLBodyElement | null} */
let APP_BODY;

function setup() {
  APP_BODY = document.getElementById("app-body");

  const hasBeenWelcomed = localStorage.getItem("welcomed") !== null;

  changeHtmlTo(hasBeenWelcomed ? LOGIN_PAGE : WELCOME_PAGE);
}

window.addEventListener("DOMContentLoaded", (_) => setup());
