import { state } from "../../core/state.js";
import { saveData } from "../../core/storage.js";

let openedProject = null;

export function renderProjects(app) {

  app.innerHTML = `
    <section>

      <h2>Project Lab</h2>

      <div id="projectList"></div>

    </section>
  `;

  renderList();

}

function renderList() {

  const container =
    document.getElementById("projectList");

  container.innerHTML = state.projects
    .map(project => {

      const hours =
        getProjectHours(project.id);

      const progress =
        getProgress(project);

      const expanded =
        openedProject === project.id;

      return `
        <div class="project-card">

          <!-- PROJECT HEADER -->
          <div
            class="project-header"
            data-id="${project.id}"
          >

            <div>

  <h3>${project.name}</h3>

  <small>
    ${hours.toFixed(1)}h logged
  </small>

  <div class="project-mini-progress">

    <div class="project-mini-progress-bar">

      <div
        class="project-mini-progress-fill"
        style="width:${progress}%"
      ></div>

    </div>

    <small>
      ${progress}% complete
    </small>

  </div>

</div>

            <div class="project-right">

              <span class="status ${project.status.toLowerCase()}">
                ${project.status}
              </span>

              <span class="expand-icon">
                ${expanded ? "−" : "+"}
              </span>

            </div>

          </div>


          <!-- EXPANDED PROJECT BODY -->
          ${
            expanded
              ? `
                <div class="project-body">

                  <p>
                    ${project.description}
                  </p>


                  <!-- MILESTONE PROGRESS -->
                  <strong>
                    Milestone Progress
                  </strong>

                  <div class="progress">

                    <div
                      class="fill green"
                      style="width:${progress}%"
                    ></div>

                  </div>

                  <small>
                    ${progress}% complete
                  </small>


                  <hr>


                  <!-- PROJECT TABS -->
                  <div class="project-tabs">

                    <button>
                      Overview
                    </button>

                    <button>
                      Tasks
                    </button>

                    <button>
                      Inbox
                    </button>

                  </div>


                  <!-- MILESTONES -->
                  <h4>
                    Milestones
                  </h4>

                  <div class="milestone-list">

                    ${
                      project.milestones
                        .map(milestone => `
                          <label class="milestone">

                            <input
                              type="checkbox"
                              data-project="${project.id}"
                              data-id="${milestone.id}"
                              ${milestone.done ? "checked" : ""}
                            >

                            <span>
                              ${milestone.title}
                            </span>

                          </label>
                        `)
                        .join("")
                    }

                  </div>

                </div>
              `
              : ""
          }

        </div>
      `;

    })
    .join("");


  /*
   * PROJECT EXPAND / COLLAPSE
   */

  document
    .querySelectorAll(".project-header")
    .forEach(header => {

      header.addEventListener("click", () => {

        const id =
          Number(header.dataset.id);

        openedProject =
          openedProject === id
            ? null
            : id;

        renderList();

      });

    });


  /*
   * MILESTONE CHECKBOXES
   */

  attachMilestoneEvents();

}


/*
 * MILESTONE EVENTS
 */

function attachMilestoneEvents() {

  document
    .querySelectorAll(".milestone input")
    .forEach(box => {

      box.addEventListener("change", () => {

        const project =
          state.projects.find(
            project =>
              project.id ===
              Number(box.dataset.project)
          );

        if (!project) return;


        const milestone =
          project.milestones.find(
            milestone =>
              milestone.id ===
              Number(box.dataset.id)
          );

        if (!milestone) return;


        milestone.done =
          box.checked;


        saveData(state);

        renderList();

      });

    });

}


/*
 * CALCULATE PROJECT HOURS
 */

function getProjectHours(projectId) {

  const project =
    state.projects.find(
      project =>
        project.id === projectId
    );

  if (!project) return 0;


  const total =
    state.sessions

      .filter(
        session =>
          session.project ===
          project.name
      )

      .reduce(
        (sum, session) =>
          sum + session.duration,
        0
      );


  return total / 3600000;

}


/*
 * CALCULATE MILESTONE PROGRESS
 */

function getProgress(project) {

  const total =
    project.milestones.length;


  const completed =
    project.milestones.filter(
      milestone =>
        milestone.done
    ).length;


  if (total === 0) {
    return 0;
  }


  return Math.round(
    (completed / total) * 100
  );

}