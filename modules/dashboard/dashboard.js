import { state } from "../../core/state.js";
import {
  getWeekSessions,
  hoursByCategory,
  totalHours
} from "../../core/utils.js";
import { saveData } from "../../core/storage.js";

export function renderDashboard(app) {

  const week = getWeekSessions(state.sessions);

  const deep = hoursByCategory(week, "Deep Work");
  const reels = hoursByCategory(week, "Reels");
  const tracked = totalHours(week);

  const deepGoal = state.weeklyGoals.deepWork;
  const reelsLimit = state.weeklyGoals.reelsLimit;

  const deepPercent = Math.min((deep / deepGoal) * 100, 100);
  const reelsPercent = Math.min((reels / reelsLimit) * 100, 100);

  const projectMap = {};

  week.forEach(s => {
    projectMap[s.project] =
      (projectMap[s.project] || 0) + s.duration;
  });

  const projects = Object.entries(projectMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  app.innerHTML = `

    <section>

      <h2>Dashboard</h2>

      <div class="grid">

        <div class="card">
          <h3>Deep Work</h3>
          <h1>${deep}h / ${deepGoal}h</h1>

          <div class="progress">
            <div
              class="fill green"
              style="width:${deepPercent}%">
            </div>
          </div>
        </div>

        <div class="card">
          <h3>Reels Limit</h3>
          <h1>${reels}h / ${reelsLimit}h</h1>

          <div class="progress">
            <div
              class="fill red"
              style="width:${reelsPercent}%">
            </div>
          </div>
        </div>

        <div class="card">
          <h3>Total Tracked</h3>
          <h1>${tracked}h</h1>
          <p>This week</p>
        </div>

        <div class="card">
          <h3>Top Projects</h3>

          ${
            projects.length === 0
              ? "<p>No sessions yet.</p>"
              : projects.map(([name, time]) => `
                  <p>
                    <strong>${name}</strong><br>
                    ${(time / 3600000).toFixed(1)}h
                  </p>
                `).join("")
          }

        </div>

      </div>

      <div class="card">

        <h3>Inbox</h3>

<input
  id="quickCapture"
  placeholder="What's on your mind?"
>

<select id="captureProject">

  <option value="">
    No project
  </option>

${state.projects
  .map(project => `
    <option value="${project.id}">
      ${project.name}
    </option>
  `)
  .join("")}
</select>

<button id="saveIdea">
  Capture
</button>

<div id="captureList"></div>

      </div>

    </section>
  `;

  renderCaptures();

  document
    .getElementById("saveIdea")
    .addEventListener("click", saveCapture);

  document
    .getElementById("quickCapture")
    .addEventListener("keydown", event => {

      if (event.key === "Enter") {
        saveCapture();
      }

    });

}

function saveCapture() {

  const input = document.getElementById("quickCapture");

  const projectSelect =
    document.getElementById("captureProject");

  const text = input.value.trim();

  if (!text) return;

  const projectId =
    projectSelect.value
      ? Number(projectSelect.value)
      : null;

  state.captures.unshift({

    id: Date.now(),

    text,

    projectId,

    createdAt: Date.now()

  });

  saveData(state);

  input.value = "";

  projectSelect.value = "";

  renderCaptures();

}

function renderCaptures() {

  const list =
    document.getElementById("captureList");

  if (!list) return;

  if (state.captures.length === 0) {

    list.innerHTML =
      "<p>Inbox is empty.</p>";

    return;

  }

  list.innerHTML = state.captures
    .slice(0, 5)
    .map(capture => {

      const project =
        state.projects.find(
          p => p.id === capture.projectId
        );

      return `
        <div class="capture">

          <strong>
            ${escapeHTML(capture.text)}
          </strong>

          <small>
            ${
              project
                ? project.name
                : "No project"
            }
          </small>

        </div>
      `;

    })
    .join("");

}

function escapeHTML(text) {

  const div = document.createElement("div");

  div.textContent = text;

  return div.innerHTML;
}