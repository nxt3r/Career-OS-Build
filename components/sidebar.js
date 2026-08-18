import { navigate } from "../core/router.js";

export function createSidebar() {
  const sidebar = document.getElementById("sidebar");

  sidebar.innerHTML = `
    <h1>Career OS</h1>

    <button id="navDashboard">Dashboard</button>
    <button>Time OS</button>
    <button>Projects</button>
    <button>Skills</button>
    <button>Career</button>
    <button>Reviews</button>
  `;

  document
    .getElementById("navDashboard")
    .addEventListener("click", () => navigate("dashboard"));
}