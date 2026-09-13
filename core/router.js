import { renderDashboard } from "../modules/dashboard/dashboard.js";
import { renderTimer } from "../modules/timer/timer.js";
import { renderProjects } from "../modules/projects/projects.js";
import { renderSkills } from "../modules/skills/skills.js";


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

        case "projects":
            renderProjects(app);
            break;

        case "skills":
            renderSkills(app);
            break;    
            
        default:
            renderDashboard(app);

    }

}


/*
 * Navigate using the URL hash
 */

export function goTo(page) {

    window.location.hash = page;

}


/*
 * Load the page represented by the URL
 */

export function loadRoute() {

    const hash =
        window.location.hash.replace("#", "");

    const page =
        hash || "dashboard";

    navigate(page);

}