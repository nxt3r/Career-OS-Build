import { state } from "../../core/state.js";
import { saveData } from "../../core/storage.js";

let openedProject = null;
let projectFilter = "All";
let activeProjectTab = {};


/*
 * PROJECT LAB
 */

export function renderProjects(app) {

  /*
   * DEVELOPMENT MIGRATION
   *
   * Projects created before the archived lifecycle
   * existed may have status === "Archived".
   *
   * Convert those safely.
   */

  state.projects.forEach(project => {

    if (typeof project.archived !== "boolean") {

      project.archived =
        project.status === "Archived";

    }

    /*
     * Archived is no longer a normal status.
     * Give old archived projects a sensible
     * workflow status while keeping them archived.
     */

    if (
      project.archived &&
      project.status === "Archived"
    ) {

      project.status = "Planning";

    }

  });

  saveData(state);


  app.innerHTML = `
    <section>

      <h2>Project Lab</h2>


      <!-- PROJECT FILTERS -->

      <div class="project-filters">

        <button
          id="addProjectBtn"
        >
          + New Project
        </button>


        <button
          class="project-filter ${
            projectFilter === "All"
              ? "active"
              : ""
          }"
          data-filter="All"
        >
          All
        </button>


        <button
          class="project-filter ${
            projectFilter === "Active"
              ? "active"
              : ""
          }"
          data-filter="Active"
        >
          Active
        </button>


        <button
          class="project-filter ${
            projectFilter === "Planning"
              ? "active"
              : ""
          }"
          data-filter="Planning"
        >
          Planning
        </button>


        <button
          class="project-filter ${
            projectFilter === "Paused"
              ? "active"
              : ""
          }"
          data-filter="Paused"
        >
          Paused
        </button>


        <button
          class="project-filter ${
            projectFilter === "Completed"
              ? "active"
              : ""
          }"
          data-filter="Completed"
        >
          Completed
        </button>


        <button
          class="project-filter ${
            projectFilter === "Archived"
              ? "active"
              : ""
          }"
          data-filter="Archived"
        >
          Archived
        </button>

      </div>


      <div id="projectList"></div>

    </section>
  `;


  renderList();

  attachProjectFilters();

  attachProjectManagementEvents();

}


/*
 * RENDER PROJECT LIST
 */

function renderList() {

  const container =
    document.getElementById("projectList");

  if (!container) return;


  /*
   * FILTER PROJECTS
   */

  const visibleProjects =
    projectFilter === "Archived"

      ? state.projects.filter(
          project =>
            project.archived === true
        )

      : projectFilter === "All"

        ? state.projects.filter(
            project =>
              project.archived !== true
          )

        : state.projects.filter(
            project =>
              project.archived !== true &&
              project.status === projectFilter
          );


  /*
   * EMPTY STATE
   */

  if (visibleProjects.length === 0) {

    container.innerHTML = `
      <div class="project-empty">

        <p>
          No projects in this section.
        </p>

      </div>
    `;

    return;

  }


  /*
   * PROJECT CARDS
   */

  container.innerHTML =
    visibleProjects
      .map(project => {

        const hours =
          getProjectHours(project.id);

        const progress =
          getProgress(project);

        const expanded =
          openedProject === project.id;


        return `
          <div
            class="
              project-card
              ${
                project.archived
                  ? "archived-project"
                  : ""
              }
            "
          >


            <!-- PROJECT HEADER -->

            <div
              class="project-header"
              data-id="${project.id}"
            >

              <div>

                <h3>
                  ${project.name}
                </h3>


                <small>
                  ${hours.toFixed(1)}h logged
                </small>


                <!-- MINI PROGRESS -->

                <div
                  class="project-mini-progress"
                >

                  <div
                    class="project-mini-progress-bar"
                  >

                    <div
                      class="project-mini-progress-fill"
                      style="
                        width:${progress}%
                      "
                    ></div>

                  </div>


                  <small>
                    ${progress}% complete
                  </small>

                </div>

              </div>


              <div class="project-right">

                <span
                  class="
                    status
                    ${project.status.toLowerCase()}
                  "
                >
                  ${project.status}
                </span>


                ${
                  project.archived
                    ? `
                      <span
                        class="archived-label"
                      >
                        Archived
                      </span>
                    `
                    : ""
                }


                <span
                  class="expand-icon"
                >
                  ${
                    expanded
                      ? "−"
                      : "+"
                  }
                </span>

              </div>

            </div>


            <!-- EXPANDED BODY -->

            ${
              expanded
                ? `
                  <div
                    class="project-body"
                  >


                    <!-- DESCRIPTION -->

                    <p>
                      ${
                        project.description ||
                        "No description."
                      }
                    </p>


                    <!-- PROJECT MANAGEMENT -->

                    ${
                      project.archived

                        ? `

                          <div
                            class="
                              project-status-control
                              archived-status
                            "
                          >

                            <strong>
                              Status:
                            </strong>

                            <span
                              class="
                                status
                                ${project.status.toLowerCase()}
                              "
                            >
                              ${project.status}
                            </span>

                          </div>


                          <div
                            class="project-actions"
                          >

                            <button
                              class="restore-project"
                              data-project="${project.id}"
                            >
                              Restore Project
                            </button>

                          </div>

                        `

                        : `

                          <div
                            class="project-status-control"
                          >

                            <label
                              for="status-${project.id}"
                            >
                              Project Status
                            </label>


                            <select
                              id="status-${project.id}"
                              class="project-status"
                              data-project="${project.id}"
                            >

                              <option
                                value="Planning"
                                ${
                                  project.status ===
                                  "Planning"
                                    ? "selected"
                                    : ""
                                }
                              >
                                Planning
                              </option>


                              <option
                                value="Active"
                                ${
                                  project.status ===
                                  "Active"
                                    ? "selected"
                                    : ""
                                }
                              >
                                Active
                              </option>


                              <option
                                value="Paused"
                                ${
                                  project.status ===
                                  "Paused"
                                    ? "selected"
                                    : ""
                                }
                              >
                                Paused
                              </option>


                              <option
                                value="Completed"
                                ${
                                  project.status ===
                                  "Completed"
                                    ? "selected"
                                    : ""
                                }
                              >
                                Completed
                              </option>

                            </select>

                          </div>


                          <div
                            class="project-actions"
                          >

                            <button
                              class="edit-project"
                              data-project="${project.id}"
                            >
                              Rename Project
                            </button>


                            <button
                              class="archive-project"
                              data-project="${project.id}"
                            >
                              Archive Project
                            </button>

                          </div>

                        `
                    }


                    <!-- PROGRESS -->

                    <strong>
                      Milestone Progress
                    </strong>


                    <div
                      class="progress"
                    >

                      <div
                        class="fill green"
                        style="
                          width:${progress}%
                        "
                      ></div>

                    </div>


                    <small>
                      ${progress}% complete
                    </small>


                    <hr>


                    <!-- PROJECT TABS -->

                    <div class="project-tabs">

                      <button
                        class="tab-btn ${(!activeProjectTab[project.id] || activeProjectTab[project.id] === "overview") ? "active" : ""}"
                        data-project="${project.id}"
                        data-tab="overview"
                      >
                        Overview
                      </button>

                      <button
                        class="tab-btn ${activeProjectTab[project.id] === "tasks" ? "active" : ""}"
                        data-project="${project.id}"
                        data-tab="tasks"
                      >
                        Tasks
                      </button>

                      <button
                        class="tab-btn ${activeProjectTab[project.id] === "inbox" ? "active" : ""}"
                        data-project="${project.id}"
                        data-tab="inbox"
                      >
                        Inbox
                      </button>

                      <button
                        class="tab-btn ${activeProjectTab[project.id] === "milestones" ? "active" : ""}"
                        data-project="${project.id}"
                        data-tab="milestones"
                      >
                        Milestones
                      </button>

                    </div>


                    <!-- TAB CONTENT -->

                    ${renderProjectTab(project, progress)}

                  </div>
                `
                : ""
            }

          </div>
        `;

      })
      .join("");


  document
    .querySelectorAll(".project-header")
    .forEach(header => {

      header.addEventListener(
        "click",
        () => {

          const id =
            header.dataset.id;

          openedProject =
            openedProject === id
              ? null
              : id;

          renderList();

        }
      );

    });


  /*
   * EVENT HANDLERS
   */

  attachMilestoneEvents();

  attachStatusEvents();

  attachMilestoneManagementEvents();

  attachProjectManagementEvents();

  attachProjectTabEvents();

}


function renderProjectTab(project, progress) {

  const tab =
    activeProjectTab[project.id] || "overview";


  if (tab === "tasks") {

    return `
      <div class="project-tab-panel">
        <p>
          ${project.milestones.length > 0
            ? "Task tracking is available in the milestones view."
            : "No tasks yet."}
        </p>
      </div>
    `;

  }


  if (tab === "inbox") {

  const projectCaptures =
    (state.captures || [])
      .filter(
        capture =>
          capture.projectId === project.id
      );

  return `
    <div class="project-tab-panel">

      ${
        projectCaptures.length === 0

          ? `
            <p>
              Inbox is empty.
            </p>
          `

          : `
            <div class="project-inbox">

              ${projectCaptures
                .map(capture => `
                  <div class="capture">

                    <strong>
                      ${escapeHTML(capture.text)}
                    </strong>

                    <small>
                      ${new Date(
                        capture.createdAt
                      ).toLocaleString()}
                    </small>

                  </div>
                `)
                .join("")}

            </div>
          `
      }

    </div>
  `;

}


  if (tab === "milestones") {

    return `
      <div class="project-tab-panel">
        <div class="project-actions">
          <button
            class="add-milestone"
            data-project="${project.id}"
          >
            + Add Milestone
          </button>
        </div>

        ${project.milestones.length === 0
          ? `
            <p>
              No milestones yet.
            </p>
          `
          : `
            <ul class="milestone-list">
              ${project.milestones
                .map(milestone => `
                  <li class="milestone">
                    <label>
                      <input
                        type="checkbox"
                        data-project="${project.id}"
                        data-id="${milestone.id}"
                        ${milestone.done ? "checked" : ""}
                      >
                      <span>${milestone.title}</span>
                    </label>

                    <div class="project-actions inline-actions">
                      <button
                        class="edit-milestone"
                        data-project="${project.id}"
                        data-id="${milestone.id}"
                      >
                        Edit
                      </button>

                      <button
                        class="delete-milestone"
                        data-project="${project.id}"
                        data-id="${milestone.id}"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                `)
                .join("")}
            </ul>
          `}
      </div>
    `;

  }


  return `
    <div class="project-tab-panel">
      <p>
        ${project.description || "No description."}
      </p>

      <div class="project-overview-stats">
        <strong>
          ${project.milestones.length} milestones
        </strong>
        <br>
        <small>
          ${progress}% complete
        </small>
      </div>
    </div>
  `;

}


function attachProjectTabEvents() {

  document
    .querySelectorAll(".tab-btn")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const projectId =
            button.dataset.project;

          const tab =
            button.dataset.tab;

          activeProjectTab[projectId] =
            tab;

          renderList();

        }
      );

    });

}


/*
 * PROJECT FILTERS
 */

function attachProjectFilters() {

  document
    .querySelectorAll(".project-filter")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          projectFilter =
            button.dataset.filter;

          openedProject = null;

          renderProjects(
            document.getElementById("app")
          );

        }
      );

    });

}


/*
 * PROJECT MANAGEMENT
 */

function attachProjectManagementEvents() {


  /*
   * NEW PROJECT
   */

  const addButton =
    document.getElementById(
      "addProjectBtn"
    );


  if (addButton) {

    addButton.addEventListener(
      "click",
      () => {

        const name =
          prompt(
            "Project name:"
          );


        if (
          !name ||
          !name.trim()
        ) {

          return;

        }


        const description =
          prompt(
            "Project description:"
          ) || "";


        state.projects.push({

          id:
            crypto.randomUUID(),

          name:
            name.trim(),

          description:
            description.trim(),

          status:
            "Planning",

          archived:
            false,

          milestones:
            []

        });


        saveData(state);


        openedProject = null;


        renderProjects(
          document.getElementById("app")
        );

      }
    );

  }


  /*
   * RENAME PROJECT
   */

  document
    .querySelectorAll(".edit-project")
    .forEach(button => {

      button.addEventListener(
        "click",
        event => {

          /*
           * Prevent the click from
           * affecting the project card.
           */

          event.stopPropagation();


          const project =
            state.projects.find(
              project =>
                project.id ===
                button.dataset.project
            );


          if (!project) return;


          /*
           * Archived projects are
           * always read-only.
           */

          if (project.archived) {

            return;

          }


          const newName =
            prompt(
              "Rename project:",
              project.name
            );


          if (
            !newName ||
            !newName.trim()
          ) {

            return;

          }


          project.name =
            newName.trim();


          saveData(state);


          renderProjects(
            document.getElementById("app")
          );

        }
      );

    });


  /*
   * ARCHIVE PROJECT
   */

  document
    .querySelectorAll(".archive-project")
    .forEach(button => {

      button.addEventListener(
        "click",
        event => {

          event.stopPropagation();


          const project =
            state.projects.find(
              project =>
                project.id ===
                button.dataset.project
            );


          if (!project) return;


          if (project.archived) {

            return;

          }


          const confirmed =
            confirm(
              `Archive "${project.name}"?\n\n` +
              `The project will become read-only ` +
              `and its history will be preserved.`
            );


          if (!confirmed) return;


          project.archived =
            true;


          saveData(state);


          openedProject = null;


          /*
           * Move to Archived view
           * so the user can immediately
           * see where the project went.
           */

          projectFilter =
            "Archived";


          renderProjects(
            document.getElementById("app")
          );

        }
      );

    });


  /*
   * RESTORE PROJECT
   */

  document
    .querySelectorAll(".restore-project")
    .forEach(button => {

      button.addEventListener(
        "click",
        event => {

          event.stopPropagation();


          const project =
            state.projects.find(
              project =>
                project.id ===
                button.dataset.project
            );


          if (!project) return;


          if (!project.archived) {

            return;

          }


          /*
           * Choose destination status.
           */

          const selectedStatus =
            prompt(
              "Restore project as:\n\n" +
              "Planning\n" +
              "Active\n" +
              "Paused\n" +
              "Completed"
            );


          if (
            !selectedStatus ||
            !selectedStatus.trim()
          ) {

            return;

          }


          const normalized =
            selectedStatus
              .trim()
              .toLowerCase();


          const validStatuses = [
            "planning",
            "active",
            "paused",
            "completed"
          ];


          if (
            !validStatuses.includes(
              normalized
            )
          ) {

            alert(
              "Invalid status.\n\n" +
              "Choose Planning, Active, " +
              "Paused, or Completed."
            );

            return;

          }


          const formattedStatus =
            normalized
              .charAt(0)
              .toUpperCase() +
            normalized.slice(1);


          /*
           * Final confirmation.
           */

          const confirmed =
            confirm(
              `Restore "${project.name}" ` +
              `as ${formattedStatus}?\n\n` +
              `The project will become editable again.`
            );


          if (!confirmed) {

            return;

          }


          project.archived =
            false;


          project.status =
            formattedStatus;


          saveData(state);


          openedProject = null;


          projectFilter =
            formattedStatus;


          renderProjects(
            document.getElementById("app")
          );

        }
      );

    });

}


/*
 * MILESTONE CHECKBOX EVENTS
 */

function attachMilestoneEvents() {

  document
    .querySelectorAll(
      ".milestone input"
    )
    .forEach(box => {

      box.addEventListener(
        "change",
        () => {

          const project =
            state.projects.find(
              project =>
                project.id ===
                box.dataset.project
            );


          if (!project) return;


          /*
           * Archived projects are
           * read-only.
           */

          if (project.archived) {

            box.checked =
              box.defaultChecked;

            return;

          }


          const milestone =
            project.milestones.find(
              milestone =>
                milestone.id ===
                Number(
                  box.dataset.id
                )
            );


          if (!milestone) return;


          milestone.done =
            box.checked;


          saveData(state);


          renderList();

        }
      );

    });

}


/*
 * PROJECT STATUS EVENTS
 */

function attachStatusEvents() {

  document
    .querySelectorAll(
      ".project-status"
    )
    .forEach(select => {

      select.addEventListener(
        "change",
        () => {

          const project =
            state.projects.find(
              project =>
                project.id ===
                select.dataset.project
            );


          if (!project) return;


          /*
           * Archived projects cannot
           * change status.
           */

          if (project.archived) {

            return;

          }


          project.status =
            select.value;


          saveData(state);


          renderList();

        }
      );

    });

}


/*
 * MILESTONE MANAGEMENT
 */

function attachMilestoneManagementEvents() {


  /*
   * ADD MILESTONE
   */

  document
    .querySelectorAll(
      ".add-milestone"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        event => {

          event.stopPropagation();


          const project =
            state.projects.find(
              project =>
                project.id ===
                button.dataset.project
            );


          if (!project) return;


          if (project.archived) {

            return;

          }


          const title =
            prompt(
              "Milestone name:"
            );


          if (
            !title ||
            !title.trim()
          ) {

            return;

          }


          const nextId =
            project.milestones.length > 0

              ? Math.max(
                  ...project.milestones.map(
                    milestone =>
                      milestone.id
                  )
                ) + 1

              : 1;


          project.milestones.push({

            id:
              nextId,

            title:
              title.trim(),

            done:
              false

          });


          saveData(state);


          renderList();

        }
      );

    });


  /*
   * EDIT MILESTONE
   */

  document
    .querySelectorAll(
      ".edit-milestone"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        event => {

          event.stopPropagation();


          const project =
            state.projects.find(
              project =>
                project.id ===
                button.dataset.project
            );


          if (!project) return;


          if (project.archived) {

            return;

          }


          const milestone =
            project.milestones.find(
              milestone =>
                milestone.id ===
                Number(
                  button.dataset.id
                )
            );


          if (!milestone) return;


          const newTitle =
            prompt(
              "Rename milestone:",
              milestone.title
            );


          if (
            !newTitle ||
            !newTitle.trim()
          ) {

            return;

          }


          milestone.title =
            newTitle.trim();


          saveData(state);


          renderList();

        }
      );

    });


  /*
   * DELETE MILESTONE
   */

  document
    .querySelectorAll(
      ".delete-milestone"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        event => {

          event.stopPropagation();


          const project =
            state.projects.find(
              project =>
                project.id ===
                button.dataset.project
            );


          if (!project) return;


          if (project.archived) {

            return;

          }


          const milestoneId =
            Number(
              button.dataset.id
            );


          const milestone =
            project.milestones.find(
              milestone =>
                milestone.id ===
                milestoneId
            );


          if (!milestone) return;


          const confirmed =
            confirm(
              `Delete "${milestone.title}"?`
            );


          if (!confirmed) return;


          project.milestones =
            project.milestones.filter(
              milestone =>
                milestone.id !==
                milestoneId
            );


          saveData(state);


          renderList();

        }
      );

    });

}


/*
 * PROJECT HOURS
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
          session.projectId ===
          project.id
      )

      .reduce(
        (sum, session) =>
          sum + session.duration,
        0
      );


  return total / 3600000;

}


/*
 * MILESTONE PROGRESS
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

function escapeHTML(text) {

  const div =
    document.createElement("div");

  div.textContent =
    text;

  return div.innerHTML;

}