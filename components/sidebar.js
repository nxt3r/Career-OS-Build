import { goTo } from "../core/router.js";

export function createSidebar() {

  const sidebar =
    document.getElementById("sidebar");

  sidebar.innerHTML = `
    <h1>Career OS</h1>

    <button id="navDashboard">
      Dashboard
    </button>

    <button id="navTimer">
      Time OS
    </button>

    <button id="navProjects">
      Projects
    </button>

    <button id="navSkills">
      Skills
    </button>

    <button>
      Career
    </button>

    <button>
      Reviews
    </button>
  `;


  document
    .getElementById("navDashboard")
    .addEventListener(
      "click",
      () => goTo("dashboard")
    );


  document
    .getElementById("navTimer")
    .addEventListener(
      "click",
      () => goTo("timer")
    );


  document
    .getElementById("navProjects")
    .addEventListener(
      "click",
      () => goTo("projects")
    );


  document
    .getElementById("navSkills")
    .addEventListener(
      "click",
      () => goTo("skills")
    );

}