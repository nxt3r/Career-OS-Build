import {
  getUserProfile,
  changeUsername,
  updateDisplayName,
  updateAvatar,
  isValidUsernameFormat
} from "../../core/username.js";
import {
  isPasswordAccount
} from "../../core/auth.js";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { AVATAR_EMOJIS, AVATAR_COLORS, getAvatarDisplay } from "./avatars.js";


export async function renderAccountPanel(app, user, profile) {

  if (!app) return;

  const avatar =
    getAvatarDisplay(profile);

  const passwordAccount =
    isPasswordAccount(user);

  app.innerHTML = `

    <section>

      <h2>Account Settings</h2>

      <div class="card">

        <h3>Avatar</h3>

        <div class="avatar-preview" id="avatarPreview">
          ${
            avatar.type === "image"
              ? `<img src="${escapeHTML(avatar.url)}" class="profile-avatar-img large">`
              : `<span class="profile-avatar-emoji large" style="background:${avatar.color}">${avatar.emoji}</span>`
          }
        </div>

        <div class="avatar-picker" id="avatarPicker">

          ${
            AVATAR_EMOJIS
              .map(emoji => `
                <button
                  class="avatar-option ${emoji === (profile?.avatarEmoji || AVATAR_EMOJIS[0]) ? "selected" : ""}"
                  data-emoji="${emoji}"
                >
                  ${emoji}
                </button>
              `)
              .join("")
          }

        </div>

        <label>Background color</label>
        <div class="avatar-color-picker" id="avatarColorPicker">

          ${
            AVATAR_COLORS
              .map(color => `
                <button
                  class="avatar-color-option ${color === (profile?.avatarColor || AVATAR_COLORS[0]) ? "selected" : ""}"
                  data-color="${color}"
                  style="background:${color}"
                ></button>
              `)
              .join("")
          }

        </div>

        <label>Or paste an image URL (optional)</label>
        <input
          type="text"
          id="avatarUrlInput"
          placeholder="https://..."
          value="${escapeHTML(profile?.avatarUrl || "")}"
        >

        <button id="saveAvatar">
          Save Avatar
        </button>

      </div>


      <div class="card">

        <h3>Profile</h3>

        <label>Username</label>
        <input
          type="text"
          id="accountUsername"
          value="${escapeHTML(profile?.username || "")}"
        >
        <button id="saveUsername">
          Save Username
        </button>

        <label>Display Name</label>
        <input
          type="text"
          id="accountDisplayName"
          value="${escapeHTML(profile?.displayName || "")}"
        >
        <button id="saveDisplayName">
          Save Display Name
        </button>

      </div>


      ${
        passwordAccount
          ? `
            <div class="card">

              <h3>Password</h3>

              <div id="passwordError" class="auth-error"></div>

              <label>Current Password</label>
              <div class="password-field">
                <input type="password" id="currentPassword">
                <button type="button" class="toggle-password" data-target="currentPassword">👁</button>
              </div>

              <label>New Password</label>
              <div class="password-field">
                <input type="password" id="newPassword">
                <button type="button" class="toggle-password" data-target="newPassword">👁</button>
              </div>

              <label>Confirm New Password</label>
              <div class="password-field">
                <input type="password" id="confirmNewPassword">
                <button type="button" class="toggle-password" data-target="confirmNewPassword">👁</button>
              </div>

              <button id="savePassword">
                Change Password
              </button>

            </div>
          `
          : ""
      }


      <button id="backToApp">
        ← Back
      </button>

    </section>

  `;

  let selectedEmoji =
    profile?.avatarEmoji || AVATAR_EMOJIS[0];

  let selectedColor =
    profile?.avatarColor || AVATAR_COLORS[0];

  function updateAvatarPreview() {

    const preview =
      document.getElementById("avatarPreview");

    const urlInput =
      document.getElementById("avatarUrlInput");

    const url =
      urlInput.value.trim();

    if (url) {

      preview.innerHTML = `
        <img src="${escapeHTML(url)}" class="profile-avatar-img large">
      `;

    } else {

      preview.innerHTML = `
        <span
          class="profile-avatar-emoji large"
          style="background:${selectedColor}"
        >${selectedEmoji}</span>
      `;

    }

  }

  document
    .getElementById("avatarUrlInput")
    .addEventListener("input", updateAvatarPreview);


  document
    .getElementById("backToApp")
    .addEventListener("click", () => {

      location.reload();

    });


  document
    .querySelectorAll(".avatar-option")
    .forEach(button => {

      button.addEventListener("click", () => {

        selectedEmoji =
          button.dataset.emoji;

        document.getElementById("avatarUrlInput").value = "";

        document
          .querySelectorAll(".avatar-option")
          .forEach(btn => btn.classList.remove("selected"));

        button.classList.add("selected");

        updateAvatarPreview();

      });

    });

  document
    .querySelectorAll(".avatar-color-option")
    .forEach(button => {

      button.addEventListener("click", () => {

        selectedColor =
          button.dataset.color;

        document.getElementById("avatarUrlInput").value = "";

        document
          .querySelectorAll(".avatar-color-option")
          .forEach(btn => btn.classList.remove("selected"));

        button.classList.add("selected");

        updateAvatarPreview();

      });

    });

  document
    .getElementById("saveAvatar")
    .addEventListener("click", async () => {

      const urlInput =
        document.getElementById("avatarUrlInput");

      await updateAvatar(user.uid, {
        avatarEmoji: selectedEmoji,
        avatarColor: selectedColor,
        avatarUrl: urlInput.value.trim() || null
      });

      location.reload();

    });


  document
    .getElementById("saveUsername")
    .addEventListener("click", async () => {

      const input =
        document.getElementById("accountUsername");

      const trimmed =
        input.value.trim();

      if (!isValidUsernameFormat(trimmed)) {

        alert(
          "Username must be 3-20 characters: letters, " +
          "numbers, and underscores only."
        );

        return;

      }

      if (trimmed === profile?.username) return;

      try {

        await changeUsername(
          user.uid,
          profile?.username,
          trimmed
        );

        location.reload();

      } catch (error) {

        if (error.message === "username-taken") {

          alert("That username is already taken.");

        } else {

          console.error("Username change error:", error);

          alert("Something went wrong. Try again.");

        }

      }

    });


  document
    .getElementById("saveDisplayName")
    .addEventListener("click", async () => {

      const input =
        document.getElementById("accountDisplayName");

      const trimmed =
        input.value.trim();

      if (!trimmed) {

        alert("Display name cannot be empty.");

        return;

      }

      await updateDisplayName(user.uid, trimmed);

      location.reload();

    });


  if (passwordAccount) {

    document
      .getElementById("savePassword")
      .addEventListener("click", async () => {

        const errorBox =
          document.getElementById("passwordError");

        const currentPassword =
          document.getElementById("currentPassword").value;

        const newPassword =
          document.getElementById("newPassword").value;

        const confirmPassword =
          document.getElementById("confirmNewPassword").value;

        errorBox.textContent = "";

        if (!currentPassword || !newPassword) {

          errorBox.textContent =
            "Fill in all password fields.";

          return;

        }

        if (newPassword !== confirmPassword) {

          errorBox.textContent =
            "New passwords do not match.";

          return;

        }

        if (newPassword.length < 6) {

          errorBox.textContent =
            "New password must be at least 6 characters.";

          return;

        }

        try {

          const credential =
            EmailAuthProvider.credential(
              user.email,
              currentPassword
            );

          await reauthenticateWithCredential(
            user,
            credential
          );

          await updatePassword(user, newPassword);

          errorBox.classList.add("auth-success");

          errorBox.textContent =
            "Password changed successfully.";

        } catch (error) {

          console.error("Password change error:", error);

          errorBox.textContent =
            "Current password is incorrect.";

        }

      });

  }

}


function escapeHTML(value) {

  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}