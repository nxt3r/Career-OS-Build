import { state } from "../../core/state.js";
import { saveData } from "../../core/storage.js";

let timer = null;
let startTime = null;

export function renderTimer(app) {

  const projectOptions = state.projects
    .map(p => `<option value="${p.name}">${p.name}</option>`)
    .join("");

  app.innerHTML = `
    <section>
      <h2>Time OS</h2>

      <div class="card">
        <h3>Current Session</h3>

        <h1 id="timerDisplay">00:00:00</h1>

        <label>Category</label>
        <select id="category">
          <option>Deep Work</option>
          <option>Study</option>
          <option>Reels</option>
          <option>Gaming</option>
          <option>Exercise</option>
        </select>

        <label>Project</label>
        <select id="project">
          ${projectOptions}
        </select>

        <label>Activity</label>
        <input id="activity" placeholder="React Components">

        <br><br>

        <button id="startBtn">Start Session</button>
        <button id="stopBtn" disabled>Stop</button>
      </div>

      <div class="card">
        <h3>Today's Sessions</h3>
        <div id="sessionList"></div>
      </div>
    </section>
  `;

  renderSessions();

  const display = document.getElementById("timerDisplay");
  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");

  startBtn.addEventListener("click", () => {

    startTime = Date.now();

    startBtn.disabled = true;
    stopBtn.disabled = false;

    timer = setInterval(() => {

      const diff = Date.now() - startTime;

      display.textContent = formatTime(diff);

    }, 1000);

  });

  stopBtn.addEventListener("click", () => {

    clearInterval(timer);

    const endTime = Date.now();

    const session = {

      category: document.getElementById("category").value,
      project: document.getElementById("project").value,
      activity: document.getElementById("activity").value || "Untitled",
      start: startTime,
      end: endTime,
      duration: endTime - startTime

    };

    state.sessions.unshift(session);

    saveData(state);

    renderTimer(app);

  });

}

function renderSessions() {

  const list = document.getElementById("sessionList");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaySessions = state.sessions.filter(session => {
    const sessionDate = new Date(session.start);
    sessionDate.setHours(0, 0, 0, 0);

    return sessionDate.getTime() === today.getTime();
  });

  if (todaySessions.length === 0) {
    list.innerHTML = "No sessions today.";
    return;
  }

  list.innerHTML = todaySessions
    .map(s => `
      <div class="session">
        <strong>${s.project}</strong><br>
        ${s.activity}<br>
        ${formatDuration(s.duration)}
      </div>
    `)
    .join("");

}

function formatTime(ms){

  const total = Math.floor(ms/1000);

  const h = String(Math.floor(total/3600)).padStart(2,"0");
  const m = String(Math.floor((total%3600)/60)).padStart(2,"0");
  const s = String(total%60).padStart(2,"0");

  return `${h}:${m}:${s}`;

}
 function formatDuration(ms) {
  const total = Math.floor(ms / 1000);

  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}