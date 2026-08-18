import { renderDashboard } from "../modules/dashboard/dashboard.js";
import { renderTimer } from "../modules/timer/timer.js";

export function navigate(page) {
    const app = document.getElementById("app");

    app.innerHTML = "";

    switch (page) {

  case "dashboard":
    renderDashboard(app);
    break;

  case "timer":
    renderTimer(app);
    break;

  default:
    renderDashboard(app);

            }
}