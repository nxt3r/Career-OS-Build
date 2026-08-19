import { loadData, saveData } from "./storage.js";

export const state = loadData();

if (!state.activeTimer) {
  state.activeTimer = null;
}

/*
 * DEVELOPMENT DATA MIGRATION
 *
 * Adds milestone data to existing projects
 * without deleting existing sessions or captures.
 */

state.projects.forEach(project => {

  if (!project.milestones) {

    if (project.name === "Career OS") {

      project.milestones = [
        {
          id: 1,
          title: "Foundation",
          done: true
        },
        {
          id: 2,
          title: "Time OS",
          done: true
        },
        {
          id: 3,
          title: "Dashboard",
          done: true
        },
        {
          id: 4,
          title: "Project Lab",
          done: false
        }
      ];

    } else if (project.name === "Fixtional") {

      project.milestones = [
        {
          id: 1,
          title: "Website",
          done: false
        },
        {
          id: 2,
          title: "Stripe",
          done: false
        }
      ];

    } else {

      project.milestones = [];

    }

  }

});

saveData(state);