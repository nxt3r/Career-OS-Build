import { cancelAccountDeletion } from "../../core/username.js";
import { logOutUser } from "../../core/auth.js";

export function renderPendingDeletionScreen(container, user, profile) {

  if (!container) return;

  const deleteDate =
    new Date(
      profile.pendingDeletion.deleteAfter
    ).toLocaleDateString(
      undefined,
      { year: "numeric", month: "long", day: "numeric" }
    );

  container.innerHTML = `

    <div class="auth-wrapper">

      <div class="card auth-card">

        <h1>Career OS</h1>

        <h3>Account Scheduled for Deletion</h3>

        <p>
          This account is scheduled to be permanently
          deleted on <strong>${deleteDate}</strong>.
        </p>

        <p>
          You can restore it now, or log out and it
          will remain scheduled for deletion.
        </p>

        <div id="pendingDeletionError" class="auth-error"></div>

        <button id="restoreAccount">
          Restore My Account
        </button>

        <button id="pendingDeletionLogout">
          Log Out
        </button>

      </div>

    </div>

  `;

  document
    .getElementById("restoreAccount")
    .addEventListener("click", async () => {

      const errorBox =
        document.getElementById("pendingDeletionError");

      try {

        await cancelAccountDeletion(user.uid);

        location.reload();

      } catch (error) {

        console.error("Restore account error:", error);

        errorBox.textContent =
          "Something went wrong. Try again.";

      }

    });

  document
    .getElementById("pendingDeletionLogout")
    .addEventListener("click", () => logOutUser());

}