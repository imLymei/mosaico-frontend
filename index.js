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
</div>
`;

/**
 * @param {string} newHtml
 */
function changeHtmlTo(newHtml) {
  if (!APP_BODY) return;

  APP_BODY.innerHTML = newHtml;
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
