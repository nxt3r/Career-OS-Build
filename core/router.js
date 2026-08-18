import { renderDashboard } from "../modules/dashboard/dashboard.js";

export function navigate(page) {
    const app = document.getElementById("app");

    app.innerHTML = "";

    switch (page) {
        case "dashboard":
            renderDashboard(app);
            break;

        default:
            renderDashboard(app);
    }
}