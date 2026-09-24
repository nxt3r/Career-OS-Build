import { claimUsername, isValidUsernameFormat } from "../../core/username.js";

export function renderUsernameScreen(container, user, onComplete) {

  if (!container) return;

  container.innerHTML = `

    <div class="auth-wrapper">

      <div class="card auth-card">

        <h1>Career OS</h1>

        <h3>Choose a Username</h3>

        <p>
          This is your unique handle — you can change it
          later in Settings.
        </p>

        <div id="usernameError" class="auth-error"></div>

        <label>Username</label>
        <input
          type="text"
          id="usernameInput"
          placeholder="e.g. nxt3r"
        >

        <label>Display Name</label>
        <input
          type="text"
          id="displayNameInput"
          placeholder="e.g. NxT3R"
          value="${escapeHTML(user.displayName || "")}"
        >

        <br><br>

        <button id="usernameSubmit">
          Continue
        </button>

      </div>

    </div>

  `;

  document
    .getElementById("usernameSubmit")
    .addEventListener("click", () => handleSubmit(user, onComplete));

  document
    .getElementById("usernameInput")
    .addEventListener("keydown", event => {

      if (event.key === "Enter") {
        handleSubmit(user, onComplete);
      }

    });

}


function escapeHTML(value) {

  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


async function handleSubmit(user, onComplete) {

  const usernameInput =
    document.getElementById("usernameInput");

  const displayNameInput =
    document.getElementById("displayNameInput");

  const errorBox =
    document.getElementById("usernameError");

  const username =
    usernameInput.value.trim();

  const displayName =
    displayNameInput.value.trim();

  errorBox.textContent = "";

  if (!isValidUsernameFormat(username)) {

    errorBox.textContent =
      "Username must be 3-20 characters: letters, " +
      "numbers, and underscores only.";

    return;

  }

  if (!displayName) {

    errorBox.textContent =
      "Display name cannot be empty.";

    return;

  }

  try {

    await claimUsername(
      user.uid,
      username,
      displayName,
      user.photoURL,
      user.email
    );

    onComplete();

  } catch (error) {

    if (error.message === "username-taken") {

      errorBox.textContent =
        "That username is already taken.";

    } else {

      console.error("Username claim error:", error);

      errorBox.textContent =
        "Something went wrong. Try again.";

    }

  }

}