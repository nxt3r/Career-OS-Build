import { state } from "../../core/state.js";
import { saveData } from "../../core/storage.js";

let timer = null;


export function renderTimer(app) {

  const projectOptions = state.projects
    .map(
      p => `<option value="${p.name}">${p.name}</option>`
    )
    .join("");


  const active = state.activeTimer;


  app.innerHTML = `
    <section>

      <h2>Time OS</h2>


      <div class="card">

        <h3>Current Session</h3>

        <h1 id="timerDisplay">
          ${formatTime(getElapsed())}
        </h1>


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

        <input
          id="activity"
          placeholder="React Components"
        >


        <br><br>


        ${
          !active
            ? `
              <button id="startBtn">
                Start Session
              </button>
            `
            : `
              <button id="pauseBtn">
                ${
                  active.status === "paused"
                    ? "Resume"
                    : "Pause"
                }
              </button>

              <button id="stopBtn">
                Stop
              </button>
            `
        }

      </div>


      <div class="card">

        <h3>Today's Sessions</h3>

        <div id="sessionList"></div>

      </div>

    </section>
  `;


  /*
   * Restore saved session information
   */

  if (active) {

    document.getElementById("category").value =
      active.category;

    document.getElementById("project").value =
      active.project;

    document.getElementById("activity").value =
      active.activity;

  }


  renderSessions();


  /*
   * START
   */

  const startBtn =
    document.getElementById("startBtn");

  if (startBtn) {

    startBtn.addEventListener("click", () => {

  const now = Date.now();

state.activeTimer = {

  status: "running",

  startedAt: now,

  originalStart: now,

  elapsedBeforeStart: 0,

        category:
          document.getElementById("category").value,

        project:
          document.getElementById("project").value,

        activity:
          document.getElementById("activity").value ||
          "Untitled"

      };


      saveData(state);

      renderTimer(app);

    });

  }


  /*
   * PAUSE / RESUME
   */

  const pauseBtn =
    document.getElementById("pauseBtn");

  if (pauseBtn) {

    pauseBtn.addEventListener("click", () => {

      const activeTimer =
        state.activeTimer;


      if (!activeTimer) return;


      /*
       * RUNNING → PAUSED
       */

      if (activeTimer.status === "running") {

        activeTimer.elapsedBeforeStart =
          getElapsed();

        activeTimer.status = "paused";

        activeTimer.startedAt = null;

      }


      /*
       * PAUSED → RUNNING
       */

      else {

        activeTimer.status = "running";

        activeTimer.startedAt =
          Date.now();

      }


      saveData(state);

      renderTimer(app);

    });

  }


  /*
   * STOP
   */

  const stopBtn =
    document.getElementById("stopBtn");

  if (stopBtn) {

    stopBtn.addEventListener("click", () => {

      const activeTimer =
        state.activeTimer;


      if (!activeTimer) return;


      const endTime =
        Date.now();


      const duration =
        getElapsed();


      const session = {

        category:
          activeTimer.category,

        project:
          activeTimer.project,

        activity:
          activeTimer.activity,

        start:
          activeTimer.originalStart ||
          endTime - duration,

        end:
          endTime,

        duration:
          duration

      };


      state.sessions.unshift(session);


      state.activeTimer = null;


      saveData(state);

      renderTimer(app);

    });

  }


  /*
   * RUNNING TIMER LOOP
   */

  if (
    state.activeTimer &&
    state.activeTimer.status === "running"
  ) {

    timer =
      setInterval(() => {

        const display =
          document.getElementById(
            "timerDisplay"
          );


        if (!display) return;


        display.textContent =
          formatTime(getElapsed());

      }, 1000);

  }

}


/*
 * CALCULATE CURRENT ELAPSED TIME
 */

function getElapsed() {

  const active =
    state.activeTimer;


  if (!active) {
    return 0;
  }


  if (active.status === "paused") {

    return active.elapsedBeforeStart || 0;

  }


  return (
    active.elapsedBeforeStart +
    (
      Date.now() -
      active.startedAt
    )
  );

}


/*
 * FORMAT TIMER
 */

function formatTime(ms) {

  const total =
    Math.floor(ms / 1000);


  const h =
    String(
      Math.floor(total / 3600)
    ).padStart(2, "0");


  const m =
    String(
      Math.floor(
        (total % 3600) / 60
      )
    ).padStart(2, "0");


  const s =
    String(
      total % 60
    ).padStart(2, "0");


  return `${h}:${m}:${s}`;

}


/*
 * TODAY'S SESSIONS
 */

function renderSessions() {

  const list =
    document.getElementById(
      "sessionList"
    );


  const today =
    new Date();


  today.setHours(
    0,
    0,
    0,
    0
  );


  const todaySessions =
    state.sessions.filter(
      session => {

        const sessionDate =
          new Date(session.start);


        sessionDate.setHours(
          0,
          0,
          0,
          0
        );


        return (
          sessionDate.getTime() ===
          today.getTime()
        );

      }
    );


  if (
    todaySessions.length === 0
  ) {

    list.innerHTML =
      "No sessions today.";

    return;

  }


  list.innerHTML =
    todaySessions
      .map(
        s => `
          <div class="session">

            <strong>
              ${s.project}
            </strong>

            <br>

            ${s.activity}

            <br>

            ${formatDuration(
              s.duration
            )}

          </div>
        `
      )
      .join("");

}


/*
 * FORMAT SESSION DURATION
 */

function formatDuration(ms) {

  const total =
    Math.floor(ms / 1000);


  const h =
    Math.floor(
      total / 3600
    );


  const m =
    Math.floor(
      (total % 3600) / 60
    );


  const s =
    total % 60;


  if (h > 0)
    return `${h}h ${m}m ${s}s`;


  if (m > 0)
    return `${m}m ${s}s`;


  return `${s}s`;

}