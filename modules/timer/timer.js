import { state } from "../../core/state.js";
import { saveData } from "../../core/storage.js";
import { getCategoryGroup } from "../../core/categories.js";

let timer = null;
let timerApp = null;

const timerControls = {
  start: null,
  pauseResume: null,
  stop: null
};


/*
 * KEYBOARD / EXTERNAL CONTROLS
 */

export function startTimer() {
  timerControls.start?.();
}

export function togglePause() {
  timerControls.pauseResume?.();
}

export function stopTimer() {
  timerControls.stop?.();
}


/*
 * RENDER TIMER
 */

export function renderTimer(app) {

  timerApp = app;

  if (timer) {
    clearInterval(timer);
    timer = null;
  }

  const projectOptions = state.projects
  .filter(project => !project.archived)
  .map(
    project => `
      <option value="${project.id}">
        ${project.name}
      </option>
    `
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

          ${
            state.categories
              .map(category => `
                <option>${category.name}</option>
              `)
              .join("")
          }

        </select>


        <label>Project</label>

        <select id="project">

          <option value="">
            No Project
          </option>

          ${projectOptions}

        </select>

        <label>Skill</label>

        <select id="skill">

         <option value="">
           No Skill
         </option>

          ${
           state.skills
           .map(
           skill => `
           <option value="${skill.id}">
            ${skill.name}
           </option>
           `
           ) 
           .join("")
          }

        </select>

        <label>Activity</label>

        <input
          id="activity"
          placeholder="What are you building?"
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
   * ELEMENT REFERENCES
   */

  const categorySelect =
    document.getElementById("category");

  const projectSelect =
    document.getElementById("project");

  const skillSelect =
    document.getElementById("skill");

  const activityInput =
    document.getElementById("activity");


  /*
   * CATEGORY BEHAVIOR
   */

  function updateCategoryUI() {

    const category =
      categorySelect.value;


    const isDistraction =
      getCategoryGroup(category) === "Distraction";


    /*
     * PROJECT
     *
     * Distraction sessions cannot
     * belong to projects.
     */

    if (isDistraction) {

  projectSelect.value = "";
  projectSelect.disabled = true;

  skillSelect.value = "";
  skillSelect.disabled = true;

} else {

  projectSelect.disabled = false;
  skillSelect.disabled = false;

}


    /*
     * ACTIVITY PLACEHOLDER
     */

    const placeholders = {

      "Deep Work":
        "What are you building?",

      "Study":
        "What subject are you studying?",

      "Scrolling":
        "Which app were you on?",

      "Gaming":
        "What game are you playing?",

      "Exercise":
        "What workout are you doing?"

    };


    activityInput.placeholder =
      placeholders[category] ||
      "What are you doing?";

  }


  /*
   * CATEGORY CHANGE
   */

  categorySelect.addEventListener(
    "change",
    updateCategoryUI
  );

  activityInput.addEventListener("keydown", event => {

  if (event.key === "Enter" && !state.activeTimer) {

    event.preventDefault();
    timerControls.start();

  }

});


  /*
   * RESTORE ACTIVE SESSION
   */

  if (active) {

    categorySelect.value =
      active.category;

    if (
  active.projectId !== null &&
  active.projectId !== undefined
) {

  projectSelect.value =
    String(active.projectId);

} else {

  projectSelect.value = "";

}


if (
  active.skillId !== null &&
  active.skillId !== undefined
) {

  skillSelect.value =
    String(active.skillId);

} else {

  skillSelect.value = "";

}


activityInput.value =
  active.activity;

  }


  /*
   * INITIAL CATEGORY STATE
   */

  updateCategoryUI();


  renderSessions();


  /*
   * START
   */

  timerControls.start = () => {

  if (state.activeTimer) return;

  const category = categorySelect.value;

  const isDistraction =
    getCategoryGroup(category) === "Distraction";
  let selectedProject = null;

  // Optional project for non-distraction categories
  if (!isDistraction && projectSelect.value !== "") {

    const projectId = projectSelect.value;

selectedProject = state.projects.find(
  project => project.id === projectId
);

  }

   let selectedSkill = null;

  if (!isDistraction && skillSelect.value !== "") {

  const skillId = skillSelect.value;

  selectedSkill = state.skills.find(
    skill => skill.id === skillId
  );

  }

  const now = Date.now();

  state.activeTimer = {

    status: "running",

    startedAt: now,

    originalStart: now,

    elapsedBeforeStart: 0,

    category,

    projectId:
  selectedProject?.id ?? null,

project:
  selectedProject?.name ?? null,

skillId:
  selectedSkill?.id ?? null,

skill:
  selectedSkill?.name ?? null,

activity:
  activityInput.value.trim() || "Untitled"

  };

  saveData(state);

  renderTimer(timerApp);

};


  /*
   * PAUSE / RESUME
   */

  timerControls.pauseResume = () => {

    const activeTimer =
      state.activeTimer;

    if (!activeTimer) return;


    if (
      activeTimer.status === "running"
    ) {

      activeTimer.elapsedBeforeStart =
        getElapsed();

      activeTimer.status =
        "paused";

      activeTimer.startedAt =
        null;

    } else {

      activeTimer.status =
        "running";

      activeTimer.startedAt =
        Date.now();

    }


    saveData(state);

    renderTimer(timerApp);

  };


  /*
   * STOP
   */

  timerControls.stop = () => {

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

      projectId:
        activeTimer.projectId,

      project:
        activeTimer.project,

      skillId:
        activeTimer.skillId ?? null,

      skill:
        activeTimer.skill ?? null,

      activity:
        activeTimer.activity,

      start:
        activeTimer.originalStart,

      end:
        endTime,

      duration:
        duration

    };


    state.sessions.unshift(session);

    state.activeTimer = null;


    saveData(state);

    renderTimer(timerApp);

  };


  /*
   * BUTTON EVENTS
   */

  const startBtn =
    document.getElementById("startBtn");

  if (startBtn) {

    startBtn.addEventListener(
      "click",
      timerControls.start
    );

  }


  const pauseBtn =
    document.getElementById("pauseBtn");

  if (pauseBtn) {

    pauseBtn.addEventListener(
      "click",
      timerControls.pauseResume
    );

  }


  const stopBtn =
    document.getElementById("stopBtn");

  if (stopBtn) {

    stopBtn.addEventListener(
      "click",
      timerControls.stop
    );

  }


  /*
   * RUNNING TIMER LOOP
   */

  if (
    state.activeTimer &&
    state.activeTimer.status === "running"
  ) {

    timer = setInterval(() => {

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


  if (
    active.status === "paused"
  ) {

    return (
      active.elapsedBeforeStart ||
      0
    );

  }


  return (
    (active.elapsedBeforeStart || 0) +
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
              ${
                s.project ||
                "No Project"
              }
            </strong>

            <br>

            <small>${escapeHTML(s.category)}</small>

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
 * HTML SAFETY
 */

function escapeHTML(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


/*
 * FORMAT SESSION DURATION
 */

function formatDuration(ms) {

  const total =
    Math.floor(ms / 1000);


  const h =
    Math.floor(total / 3600);


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