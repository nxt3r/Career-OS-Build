import { state } from "../../core/state.js";
import { saveData, resetAllData } from "../../core/storage.js";
import { auth } from "../../core/firebase.js";
import {
  getUserProfile,
  changeUsername,
  updateDisplayName,
  isValidUsernameFormat,
  requestAccountDeletion
} from "../../core/username.js";
import {
  isPasswordAccount,
  reauthenticateWithPassword,
  reauthenticateWithGoogle,
  reauthenticateWithGithub,
  logOutUser,
  resetPassword
} from "../../core/auth.js";

const GROUPS = ["Focus", "Distraction", "Neutral"];


/* =========================================================
   MAIN SETTINGS VIEW
   ========================================================= */

export async function renderSettings(app) {

  if (!app) return;

  const user =
    auth.currentUser;

  const profile =
    user
      ? await getUserProfile(user.uid)
      : null;

  app.innerHTML = `
    <section>

      <h2>Settings</h2>

      <div class="card">

        <h3>Goals</h3>

        <p>
          Weekly target:
          <strong id="weeklyTargetValue">
            ${state.settings.weeklyTarget}h
          </strong>
        </p>

        <button id="editWeeklyTarget">
          Edit Weekly Target
        </button>

        <p>
          Weekly distraction limit:
          <strong id="distractionLimitValue">
            ${state.settings.distractionLimit}h
          </strong>
        </p>

        <button id="editDistractionLimit">
          Edit Distraction Limit
        </button>

      </div>


      <div class="card">

        <h3>Categories</h3>

        <p>
          Focus and Distraction totals across the app
          are based on which group each category belongs
          to. Neutral categories are tracked but not
          counted as either.
        </p>

        <div class="project-actions">
          <button id="addCategoryBtn">
            + Add Category
          </button>
        </div>

        <div id="categoryList"></div>

      </div>


      <div class="card">

        <h3>Skill Categories</h3>

        <div class="project-actions">
          <button id="addSkillCategoryBtn">
            + Add Skill Category
          </button>
        </div>

        <div id="skillCategoryList"></div>

      </div>


      <div class="card">

        <h3>Data</h3>

        <p>
          All data is stored locally in this browser.
        </p>

        <div class="project-actions">

          <button id="exportDataBtn">
            Export Data
          </button>

          <button id="importDataBtn">
            Import Data
          </button>

          <button id="resetDataBtn">
            Reset All Data
          </button>

        </div>

        <input
          type="file"
          id="importFileInput"
          accept="application/json"
          style="display:none"
        >

      </div>


      <div class="card danger-zone">

        <h3>Danger Zone</h3>

        <p>
          Deleting your account logs you out immediately.
          You'll have 30 days to restore it by logging back
          in before it's permanently deleted.
        </p>

        <button id="deleteAccountBtn">
          Delete Account
        </button>

      </div>

    </section>
  `;

  renderCategoryList();

  renderSkillCategoryList();

  attachSettingsEvents();

}


/* =========================================================
   CATEGORY LIST
   ========================================================= */

function renderCategoryList() {

  const container =
    document.getElementById("categoryList");

  if (!container) return;

  container.innerHTML = `
    <ul class="milestone-list">

      ${
        state.categories
          .map(category => `
            <li class="milestone">

              <span>
                <strong>${escapeHTML(category.name)}</strong>
                —
                ${category.group}
                ${category.builtIn ? " (built-in)" : ""}
              </span>

              <div class="project-actions inline-actions">

                <button
                  class="rename-category"
                  data-category="${category.id}"
                >
                  Rename
                </button>

                <button
                  class="change-category-group"
                  data-category="${category.id}"
                >
                  Change Group
                </button>

                ${
                  !category.builtIn
                    ? `
                      <button
                        class="delete-category"
                        data-category="${category.id}"
                      >
                        Delete
                      </button>
                    `
                    : ""
                }

              </div>

            </li>
          `)
          .join("")
      }

    </ul>
  `;

}


/* =========================================================
   SKILL CATEGORY LIST
   ========================================================= */

function renderSkillCategoryList() {

  const container =
    document.getElementById("skillCategoryList");

  if (!container) return;

  container.innerHTML = `
    <ul class="milestone-list">

      ${
        state.skillCategories
          .map(category => `
            <li class="milestone">

              <span>
                <strong>${escapeHTML(category)}</strong>
              </span>

              <div class="project-actions inline-actions">

                <button
                  class="rename-skill-category"
                  data-category="${escapeHTML(category)}"
                >
                  Rename
                </button>

                <button
                  class="delete-skill-category"
                  data-category="${escapeHTML(category)}"
                >
                  Delete
                </button>

              </div>

            </li>
          `)
          .join("")
      }

    </ul>
  `;

}


function handleSkillCategoryListClick(event) {

  const button =
    event.target.closest("button");

  if (!button) return;

  const categoryName =
    button.dataset.category;

  if (button.classList.contains("rename-skill-category")) {
    renameSkillCategory(categoryName);
    return;
  }

  if (button.classList.contains("delete-skill-category")) {
    deleteSkillCategory(categoryName);
    return;
  }

}


function addSkillCategory() {

  const name =
    prompt("Skill category name:");

  if (name === null) return;

  if (!name.trim()) {

    alert("Category name cannot be empty.");

    return;

  }

  const trimmedName =
    name.trim();

  const exists =
    state.skillCategories.some(
      category =>
        category.toLowerCase() ===
        trimmedName.toLowerCase()
    );

  if (exists) {

    alert(
      "A skill category with this name already exists."
    );

    return;

  }

  state.skillCategories.push(trimmedName);

  saveData(state);

  renderSkillCategoryList();

}


function renameSkillCategory(oldName) {

  const newName =
    prompt(
      "Skill category name:",
      oldName
    );

  if (newName === null) return;

  if (!newName.trim()) {

    alert("Category name cannot be empty.");

    return;

  }

  const trimmedNewName =
    newName.trim();

  if (trimmedNewName === oldName) {
    return;
  }

  const exists =
    state.skillCategories.some(
      category =>
        category.toLowerCase() ===
        trimmedNewName.toLowerCase()
    );

  if (exists) {

    alert(
      "A skill category with this name already exists."
    );

    return;

  }

  const index =
    state.skillCategories.indexOf(oldName);

  if (index === -1) return;

  state.skillCategories[index] =
    trimmedNewName;

  /*
   * CASCADE
   */

  state.skills.forEach(skill => {

    if (skill.category === oldName) {

      skill.category =
        trimmedNewName;

    }

  });

  saveData(state);

  renderSkillCategoryList();

}


function deleteSkillCategory(name) {

  if (state.skillCategories.length <= 1) {

    alert(
      "At least one skill category must remain."
    );

    return;

  }

  const skillsUsingIt =
    state.skills.filter(
      skill => skill.category === name
    ).length;

  const warning =
    skillsUsingIt > 0
      ? `\n\n${skillsUsingIt} existing skill(s) use this ` +
        `category and will need to be re-categorized ` +
        `manually afterward.`
      : "";

  const confirmation =
    prompt(
      `Delete skill category "${name}"?${warning}\n\n` +
      "Type the exact category name to confirm:"
    );

  if (confirmation === null) return;

  if (confirmation !== name) {

    alert(
      "Category name does not match.\n\n" +
      "The category was NOT deleted."
    );

    return;

  }

  state.skillCategories =
    state.skillCategories.filter(
      category => category !== name
    );

  saveData(state);

  renderSkillCategoryList();

}


/* =========================================================
   DATA
   ========================================================= */

function exportData() {

  const json =
    JSON.stringify(state, null, 2);

  const blob =
    new Blob(
      [json],
      { type: "application/json" }
    );

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;

  link.download =
    `career-os-backup-${
      new Date().toISOString().split("T")[0]
    }.json`;

  link.click();

  URL.revokeObjectURL(url);

}


function importData() {

  const confirmed =
    confirm(
      "Importing will completely replace your " +
      "current data with the contents of the file " +
      "you select.\n\n" +
      "This cannot be undone. Continue?"
    );

  if (!confirmed) return;

  document
    .getElementById("importFileInput")
    .click();

}


function handleImportFile(event) {

  const file =
    event.target.files[0];

  if (!file) return;

  const reader =
    new FileReader();

  reader.onload = async () => {

    let parsed;

    try {

      parsed =
        JSON.parse(reader.result);

    } catch (error) {

      alert(
        "This file is not valid Career OS data."
      );

      return;

    }

    await saveData(parsed);

    location.reload();

  };

  reader.readAsText(file);

  event.target.value = "";

}


async function resetData() {

  const confirmation =
    prompt(
      "This will permanently delete ALL Career OS " +
      "data — projects, skills, career goals, sessions, " +
      "everything.\n\n" +
      "This cannot be undone.\n\n" +
      'Type "DELETE" to confirm:'
    );

  if (confirmation === null) return;

  if (confirmation !== "DELETE") {

    alert(
      "Confirmation text did not match.\n\n" +
      "Data was NOT deleted."
    );

    return;

  }

  await resetAllData();

  location.reload();

}


/* =========================================================
   EVENTS
   ========================================================= */

function attachSettingsEvents() {

  document
    .getElementById("deleteAccountBtn")
    .addEventListener("click", showDeleteAccountConfirm);

  document
    .getElementById("editWeeklyTarget")
    .addEventListener("click", editWeeklyTarget);

  document
    .getElementById("editDistractionLimit")
    .addEventListener("click", editDistractionLimit);

  document
    .getElementById("addCategoryBtn")
    .addEventListener("click", addCategory);

  const list =
    document.getElementById("categoryList");

  if (list) {

    list.onclick = handleCategoryListClick;

  }


  document
    .getElementById("addSkillCategoryBtn")
    .addEventListener("click", addSkillCategory);

  const skillCategoryList =
    document.getElementById("skillCategoryList");

  if (skillCategoryList) {

    skillCategoryList.onclick =
      handleSkillCategoryListClick;

  }


  document
    .getElementById("exportDataBtn")
    .addEventListener("click", exportData);

  document
    .getElementById("importDataBtn")
    .addEventListener("click", importData);

  document
    .getElementById("importFileInput")
    .addEventListener("change", handleImportFile);

  document
    .getElementById("resetDataBtn")
    .addEventListener("click", resetData);

}


function handleCategoryListClick(event) {

  const button =
    event.target.closest("button");

  if (!button) return;

  const category =
    state.categories.find(
      existing =>
        existing.id === button.dataset.category
    );

  if (!category) return;

  if (button.classList.contains("rename-category")) {
    renameCategory(category);
    return;
  }

  if (button.classList.contains("change-category-group")) {
    changeCategoryGroup(category);
    return;
  }

  if (button.classList.contains("delete-category")) {
    deleteCategory(category);
    return;
  }

}


/* =========================================================
   ACCOUNT DELETION
   ========================================================= */

function showDeleteAccountConfirm() {

  const app =
    document.getElementById("app");

  const user =
    auth.currentUser;

  if (!user) return;

  const passwordAccount =
    isPasswordAccount(user);

  app.innerHTML = `

    <section>

      <h2>Delete Account</h2>

      <div class="card">

        <p>
          This will schedule your account for permanent
          deletion in 30 days. You can restore it any time
          before then by logging back in.
        </p>

        <div id="deleteAccountError" class="auth-error"></div>

        ${
          passwordAccount
            ? `
              <label>Confirm your password</label>
              <div class="password-field">
                <input
                  type="password"
                  id="deleteConfirmPassword"
                  placeholder="••••••••"
                >
                <button type="button" class="toggle-password" data-target="deleteConfirmPassword">👁</button>
              </div>

              <p class="auth-switch">
                <a href="#" id="deleteForgotPassword">
                  Forgot password?
                </a>
              </p>
            `
            : `
              <p>
                Click below to confirm your identity via
                the account you signed up with.
              </p>

              <button id="deleteReauthProvider">
                Re-authenticate to Continue
              </button>
            `
        }

        <label>Type your username to confirm</label>
        <input
          type="text"
          id="deleteConfirmUsername"
          placeholder="Your username"
        >

        <br><br>

        <button id="deleteAccountConfirm">
          Permanently Schedule Deletion
        </button>

        <button id="deleteAccountCancel">
          Cancel
        </button>

      </div>

    </section>

  `;

  let reauthed =
    !passwordAccount
      ? false
      : true; // password users reauth at submit time via password field


  document
    .getElementById("deleteAccountCancel")
    .addEventListener("click", () => {

      renderSettings(app);

    });

  const deleteForgotLink =
    document.getElementById("deleteForgotPassword");

  if (deleteForgotLink) {

    deleteForgotLink.addEventListener("click", async event => {

      event.preventDefault();

      const errorBox =
        document.getElementById("deleteAccountError");

      try {

        await resetPassword(user.email);

        errorBox.textContent =
          "Password reset email sent — check your inbox, " +
          "then come back here to continue.";

      } catch (error) {

        console.error("Password reset error:", error);

        errorBox.textContent =
          "Something went wrong. Try again.";

      }

    });

  }


  if (!passwordAccount) {

    document
      .getElementById("deleteReauthProvider")
      .addEventListener("click", async () => {

        const errorBox =
          document.getElementById("deleteAccountError");

        try {

          const providerId =
            user.providerData[0]?.providerId;

          if (providerId === "google.com") {

            await reauthenticateWithGoogle(user);

          } else if (providerId === "github.com") {

            await reauthenticateWithGithub(user);

          } else {

            throw new Error("unsupported-provider");

          }

          reauthed = true;

          errorBox.textContent =
            "Identity confirmed. You can continue below.";

        } catch (error) {

          console.error("Reauth error:", error);

          errorBox.textContent =
            "Re-authentication failed. Try again.";

        }

      });

  }


  document
    .getElementById("deleteAccountConfirm")
    .addEventListener("click", async () => {

      const errorBox =
        document.getElementById("deleteAccountError");

      const usernameInput =
        document.getElementById("deleteConfirmUsername");

      errorBox.textContent = "";

      const profile =
        await getUserProfile(user.uid);

      if (
        usernameInput.value.trim() !==
        (profile?.username || "")
      ) {

        errorBox.textContent =
          "Username does not match.";

        return;

      }

      try {

        if (passwordAccount) {

          const passwordInput =
            document.getElementById("deleteConfirmPassword");

          await reauthenticateWithPassword(
            user,
            passwordInput.value
          );

        } else if (!reauthed) {

          errorBox.textContent =
            "Please re-authenticate first.";

          return;

        }

        await requestAccountDeletion(user.uid);

        await logOutUser();

      } catch (error) {

        console.error("Delete account error:", error);

        errorBox.textContent =
          "Could not verify your identity. " +
          "Check your password and try again.";

      }

    });

}


/* =========================================================
   ACCOUNT
   ========================================================= */

async function editUsername() {

  const user =
    auth.currentUser;

  if (!user) return;

  const currentProfile =
    await getUserProfile(user.uid);

  const newUsername =
    prompt(
      "Username:",
      currentProfile?.username || ""
    );

  if (newUsername === null) return;

  const trimmed =
    newUsername.trim();

  if (!isValidUsernameFormat(trimmed)) {

    alert(
      "Username must be 3-20 characters: letters, " +
      "numbers, and underscores only."
    );

    return;

  }

  if (trimmed === currentProfile?.username) {
    return;
  }

  try {

    await changeUsername(
      user.uid,
      currentProfile?.username,
      trimmed
    );

    renderSettings(
      document.getElementById("app")
    );

  } catch (error) {

    if (error.message === "username-taken") {

      alert("That username is already taken.");

    } else {

      console.error("Username change error:", error);

      alert("Something went wrong. Try again.");

    }

  }

}


async function editDisplayName() {

  const user =
    auth.currentUser;

  if (!user) return;

  const currentProfile =
    await getUserProfile(user.uid);

  const newName =
    prompt(
      "Display name:",
      currentProfile?.displayName || ""
    );

  if (newName === null) return;

  const trimmed =
    newName.trim();

  if (!trimmed) {

    alert("Display name cannot be empty.");

    return;

  }

  await updateDisplayName(user.uid, trimmed);

  renderSettings(
    document.getElementById("app")
  );

}


/* =========================================================
   GOALS
   ========================================================= */

function editWeeklyTarget() {

  const value =
    prompt(
      "Weekly focus target (hours):",
      state.settings.weeklyTarget
    );

  if (value === null) return;

  const parsed =
    Number(value.trim());

  if (
    !Number.isFinite(parsed) ||
    parsed <= 0
  ) {

    alert(
      "Enter a positive number of hours."
    );

    return;

  }

  state.settings.weeklyTarget = parsed;

  saveData(state);

  renderSettings(
    document.getElementById("app")
  );

}


function editDistractionLimit() {

  const value =
    prompt(
      "Weekly distraction limit (hours):",
      state.settings.distractionLimit
    );

  if (value === null) return;

  const parsed =
    Number(value.trim());

  if (
    !Number.isFinite(parsed) ||
    parsed < 0
  ) {

    alert(
      "Enter a non-negative number of hours."
    );

    return;

  }

  state.settings.distractionLimit = parsed;

  saveData(state);

  renderSettings(
    document.getElementById("app")
  );

}


/* =========================================================
   CATEGORY MANAGEMENT
   ========================================================= */

function addCategory() {

  const name =
    prompt("Category name:");

  if (name === null) return;

  if (!name.trim()) {

    alert("Category name cannot be empty.");

    return;

  }

  const trimmedName =
    name.trim();

  const exists =
    state.categories.some(
      category =>
        category.name.toLowerCase() ===
        trimmedName.toLowerCase()
    );

  if (exists) {

    alert(
      "A category with this name already exists."
    );

    return;

  }

  const group =
    askGroup();

  if (!group) return;

  state.categories.push({

    id: crypto.randomUUID(),
    name: trimmedName,
    group: group,
    builtIn: false

  });

  saveData(state);

  renderCategoryList();

}


function renameCategory(category) {

  const name =
    prompt(
      "Category name:",
      category.name
    );

  if (name === null) return;

  if (!name.trim()) {

    alert("Category name cannot be empty.");

    return;

  }

  const trimmedName =
    name.trim();

  if (trimmedName === category.name) {
    return;
  }

  const exists =
    state.categories.some(
      existing =>
        existing.id !== category.id &&
        existing.name.toLowerCase() ===
        trimmedName.toLowerCase()
    );

  if (exists) {

    alert(
      "A category with this name already exists."
    );

    return;

  }

  const oldName =
    category.name;

  category.name =
    trimmedName;

  /*
   * CASCADE
   *
   * Sessions store category as a plain name
   * string, so renaming must update existing
   * sessions or they'd silently fall out of
   * every stat.
   */

  state.sessions.forEach(session => {

    if (session.category === oldName) {

      session.category =
        trimmedName;

    }

  });

  saveData(state);

  renderCategoryList();

}


function changeCategoryGroup(category) {

  const group =
    askGroup(category.group);

  if (!group) return;

  category.group =
    group;

  saveData(state);

  renderCategoryList();

}


function deleteCategory(category) {

  if (category.builtIn) {
    return;
  }

  const sessionsUsingIt =
    state.sessions.filter(
      session => session.category === category.name
    ).length;

  const warning =
    sessionsUsingIt > 0
      ? `\n\n${sessionsUsingIt} existing session(s) use this ` +
        `category — they'll remain in your data but will no ` +
        `longer be counted in Focus/Distraction/Neutral stats.`
      : "";

  const confirmation =
    prompt(
      `Delete category "${category.name}"?${warning}\n\n` +
      "Type the exact category name to confirm:"
    );

  if (confirmation === null) {
    return;
  }

  if (confirmation !== category.name) {

    alert(
      "Category name does not match.\n\n" +
      "The category was NOT deleted."
    );

    return;

  }

  state.categories =
    state.categories.filter(
      existing => existing.id !== category.id
    );

  saveData(state);

  renderCategoryList();

}


/* =========================================================
   HELPERS
   ========================================================= */

function askGroup(current) {

  const options =
    GROUPS
      .map(
        (group, index) =>
          `${index + 1}. ${group}`
      )
      .join("\n");

  const defaultValue =
    current
      ? String(GROUPS.indexOf(current) + 1)
      : "";

  const choice =
    prompt(
      "Group:\n\n" +
      options +
      "\n\nFocus = counted toward your weekly goal\n" +
      "Distraction = counted toward your distraction limit\n" +
      "Neutral = tracked, counted as neither",
      defaultValue
    );

  if (choice === null) return null;

  const index =
    Number(choice.trim()) - 1;

  if (!GROUPS[index]) {

    alert("Invalid group.");

    return null;

  }

  return GROUPS[index];

}


function escapeHTML(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}