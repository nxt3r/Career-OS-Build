import { state } from "../../core/state.js";
import { saveData } from "../../core/storage.js";
import { roadmapTemplates } from "./roadmapTemplates.js";
import {
  getLevelName,
  getCapabilityProgress
} from "../skills/skills.js";
import { getProgress } from "../projects/projects.js";

let openedGoal = null;


/* =========================================================
   MAIN CAREER VIEW
   ========================================================= */

export function renderCareer(app) {

  if (!app) return;

  app.innerHTML = `
    <section>

      <h2>Career</h2>

      <div class="career-controls">

        <button id="addCareerGoalBtn">
          + Add Career Goal
        </button>

      </div>

      <div id="careerGoalList"></div>

    </section>
  `;

  renderGoalList();

  attachCareerEvents();

}


/* =========================================================
   GOAL LIST
   ========================================================= */

function renderGoalList() {

  const container =
    document.getElementById("careerGoalList");

  if (!container) return;

  if (state.careerGoals.length === 0) {

    container.innerHTML = `
      <div class="card">

        <p>
          No career goals yet.
        </p>

      </div>
    `;

    return;
  }

  container.innerHTML =
    state.careerGoals
      .map(goal => renderGoalCard(goal))
      .join("");

}


function renderGoalCard(goal) {

  const expanded =
    openedGoal === goal.id;

  const requiredSkills =
    getRequiredSkillObjects(goal);

  return `
    <div class="card career-goal-card">

      <div
        class="career-goal-header"
        data-id="${goal.id}"
      >

        <div>

          <h3>
            ${escapeHTML(goal.title)}
          </h3>

          <small>
            ${requiredSkills.length}
            required skill${requiredSkills.length === 1 ? "" : "s"}
          </small>

        </div>

        <span class="expand-icon">
          ${expanded ? "−" : "+"}
        </span>

      </div>

      ${
        expanded
          ? renderExpandedGoal(goal, requiredSkills)
          : ""
      }

    </div>
  `;

}


function renderExpandedGoal(goal, requiredSkills) {

  return `
    <div class="career-goal-body">

      <div class="skill-section">

        <h4>
          About
        </h4>

        <p>
          ${
            goal.description
              ? escapeHTML(goal.description)
              : "No description."
          }
        </p>

      </div>

            <div class="skill-section">

        <h4>
          Required Skills
        </h4>

        ${
          requiredSkills.length === 0
            ? `
              <p>
                No required skills selected.
              </p>
            `
            : `
              <ul class="skill-related-projects">

                ${
                  requiredSkills
                    .map(skill => `
                      <li>
                        <strong>
                          ${escapeHTML(skill.name)}
                        </strong>
                      </li>
                    `)
                    .join("")
                }

              </ul>
            `
        }

      </div>

                  <div class="skill-section">

        <h4>
          Related Projects
        </h4>

        ${renderRelatedProjects(goal)}

      </div>

      <div class="skill-section">

        <h4>
          Readiness
        </h4>

        ${renderReadiness(requiredSkills)}

      </div>

      <div class="skill-section">

        <h4>
          Roadmap
        </h4>

        <div class="project-actions">
          <button
            class="add-roadmap-stage"
            data-goal="${goal.id}"
          >
            + Add Stage
          </button>
        </div>

        ${renderRoadmap(goal)}

      </div>

      <div class="career-goal-actions">

        <button
          class="edit-career-goal"
          data-goal="${goal.id}"
        >
          Edit Goal
        </button>

        <button
          class="delete-career-goal"
          data-goal="${goal.id}"
        >
          Delete Goal
        </button>

      </div>

    </div>
  `;

}


function renderRelatedProjects(goal) {

  if (
    !Array.isArray(goal.relatedProjects) ||
    goal.relatedProjects.length === 0
  ) {

    return `
      <p>
        No related projects linked.
      </p>
    `;

  }

  const projects =
    goal.relatedProjects
      .map(id =>
        state.projects.find(
          project => project.id === id
        )
      )
      .filter(Boolean);

  if (projects.length === 0) {

    return `
      <p>
        No related projects linked.
      </p>
    `;

  }

  const usedAsEvidence =
    getEvidenceProjectIds(
      getRequiredSkillObjects(goal)
    );

  return `
    <ul class="skill-related-projects">

      ${
        projects
          .map(project => {

            const progress =
              getProgress(project);

            const isEvidence =
              usedAsEvidence.has(project.id);

            return `
              <li>

                <strong>
                  ${escapeHTML(project.name)}
                </strong>
                —
                ${progress}% complete

                ${
                  isEvidence
                    ? `
                      <br>
                      <small>
                        ✓ Also used as evidence
                      </small>
                    `
                    : ""
                }

              </li>
            `;

          })
          .join("")
      }

    </ul>
  `;

}


function getEvidenceProjectIds(requiredSkills) {

  const ids = new Set();

  requiredSkills.forEach(skill => {

    (skill.evidence || []).forEach(item => {

      if (item.projectId) {
        ids.add(item.projectId);
      }

    });

  });

  return ids;

}


function renderReadiness(requiredSkills) {

  if (requiredSkills.length === 0) {

    return `
      <p>
        No required skills selected.
      </p>
    `;

  }

  return `
    <div class="readiness-list">

      ${
        requiredSkills
          .map(skill => renderSkillReadiness(skill))
          .join("")
      }

    </div>

    <div class="skill-section">

      <h4>
        Evidence
      </h4>

      ${renderEvidenceRollup(requiredSkills)}

    </div>
  `;

}


function renderSkillReadiness(skill) {

  const currentLevelName =
    getLevelName(skill.level);

  const targetLevelName =
    getLevelName(skill.targetLevel);

  const progress =
    getCapabilityProgress(
      skill,
      skill.level
    );

  const evidenceCount =
    (skill.evidence || []).length;

  return `
    <div class="readiness-item">

      <p>
        <strong>
          ${escapeHTML(skill.name)}
        </strong>
      </p>

      <p>
        Level:
        ${currentLevelName}
        →
        ${targetLevelName}
      </p>

      <p>
        ${
          progress.total > 0
            ? `${progress.demonstrated} / ${progress.total} demonstrated at current level`
            : "No capabilities defined at current level."
        }
      </p>

      <p>
        Evidence recorded:
        <strong>
          ${evidenceCount}
        </strong>
      </p>

    </div>
  `;

}


function renderEvidenceRollup(requiredSkills) {

  const groups =
    requiredSkills
      .map(skill => ({
        skill,
        evidence: skill.evidence || []
      }))
      .filter(group => group.evidence.length > 0);

  if (groups.length === 0) {

    return `
      <p>
        No evidence recorded yet across
        required skills.
      </p>
    `;

  }

  return `
    <div class="evidence-rollup">

      ${
        groups
          .map(group => `
            <div class="evidence-rollup-group">

              <p>
                <strong>
                  ${escapeHTML(group.skill.name)}
                </strong>
              </p>

                            <ul class="skill-related-projects">

                ${
                  group.evidence
                    .map(item => `
                      <li>

                        <strong>
                          ${escapeHTML(item.type)}
                        </strong>
                        —
                        ${escapeHTML(item.title)}

                        ${
                          item.projectId
                            ? renderEvidenceProjectName(item.projectId)
                            : ""
                        }

                        ${
                          item.url
                            ? `
                              <br>
                              <a
                                href="${escapeHTML(item.url)}"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                ${escapeHTML(item.url)}
                              </a>
                            `
                            : ""
                        }

                      </li>
                    `)
                    .join("")
                }

              </ul>

            </div>
          `)
          .join("")
      }

    </div>
  `;

}


function renderEvidenceProjectName(projectId) {

  const project =
    state.projects.find(
      existingProject =>
        existingProject.id === projectId
    );

  return project
    ? ` (Project: ${escapeHTML(project.name)})`
    : "";

}


function renderRoadmap(goal) {

  if (goal.roadmap.length === 0) {

    return `
      <p>
        No roadmap stages yet.
      </p>
    `;

  }

  const sorted =
    [...goal.roadmap].sort(
      (a, b) =>
        (a.order || 0) - (b.order || 0)
    );

  return `
    <ul class="milestone-list">

      ${
        sorted
          .map(stage => `
            <li class="milestone">

              <label>
                <input
                  type="checkbox"
                  data-goal="${goal.id}"
                  data-stage="${stage.id}"
                  ${stage.done ? "checked" : ""}
                >
                <span>${escapeHTML(stage.title)}</span>
              </label>

              <div class="project-actions inline-actions">

                <button
                  class="edit-roadmap-stage"
                  data-goal="${goal.id}"
                  data-stage="${stage.id}"
                >
                  Edit
                </button>

                <button
                  class="delete-roadmap-stage"
                  data-goal="${goal.id}"
                  data-stage="${stage.id}"
                >
                  Delete
                </button>

              </div>

            </li>
          `)
          .join("")
      }

    </ul>
  `;

}


/* =========================================================
   EVENTS
   ========================================================= */

function attachCareerEvents() {

  const addButton =
    document.getElementById("addCareerGoalBtn");

  if (addButton) {

    addButton.addEventListener(
      "click",
      openAddGoalForm
    );

  }

  const list =
    document.getElementById("careerGoalList");

  if (!list) return;

  list.onclick =
    handleGoalListClick;

  list
    .querySelectorAll(".milestone input")
    .forEach(box => {

      box.addEventListener(
        "change",
        () => toggleRoadmapStage(box)
      );

    });

}


function toggleRoadmapStage(box) {

  const goal =
    findGoal(box.dataset.goal);

  if (!goal) return;

  const stage =
    goal.roadmap.find(
      existingStage =>
        existingStage.id === box.dataset.stage
    );

  if (!stage) return;

  stage.done =
    box.checked;

  saveData(state);

  renderGoalList();

}


function handleGoalListClick(event) {

  const target =
    event.target instanceof Element
      ? event.target
      : event.target.parentElement;

  if (!target) return;


  const header =
    target.closest(".career-goal-header");

  if (
    header &&
    !target.closest("button")
  ) {

    const id =
      header.dataset.id;

    openedGoal =
      openedGoal === id
        ? null
        : id;

    renderGoalList();

    return;
  }


  const button =
    target.closest("button");

  if (!button) return;

  event.stopPropagation();


  if (
    button.classList.contains(
      "edit-career-goal"
    )
  ) {

    const goal =
      findGoal(button.dataset.goal);

    if (goal) {
      editGoal(goal);
    }

    return;
  }


    if (
    button.classList.contains(
      "delete-career-goal"
    )
  ) {

    const goal =
      findGoal(button.dataset.goal);

    if (goal) {
      deleteGoal(goal);
    }

    return;
  }


  if (
    button.classList.contains(
      "add-roadmap-stage"
    )
  ) {

    const goal =
      findGoal(button.dataset.goal);

    if (goal) {
      addRoadmapStage(goal);
    }

    return;
  }


  if (
    button.classList.contains(
      "edit-roadmap-stage"
    )
  ) {

    const goal =
      findGoal(button.dataset.goal);

    if (!goal) return;

    const stage =
      goal.roadmap.find(
        existingStage =>
          existingStage.id === button.dataset.stage
      );

    if (stage) {
      editRoadmapStage(goal, stage);
    }

    return;
  }


  if (
    button.classList.contains(
      "delete-roadmap-stage"
    )
  ) {

    const goal =
      findGoal(button.dataset.goal);

    if (!goal) return;

    const stage =
      goal.roadmap.find(
        existingStage =>
          existingStage.id === button.dataset.stage
      );

    if (stage) {
      deleteRoadmapStage(goal, stage);
    }

  }

}


/* =========================================================
   ADD GOAL
   ========================================================= */

function openAddGoalForm() {

  const title =
    prompt(
      "Career goal title:\n\n" +
      "e.g. Frontend Developer"
    );

  if (
    title === null ||
    !title.trim()
  ) {
    return;
  }

  const trimmedTitle =
    title.trim();


  const description =
    prompt(
      "Description (optional):"
    ) || "";


  const requiredSkillIds =
    pickRequiredSkills([]);

  if (requiredSkillIds === null) {
    return;
  }


  const overlapWarning =
    getOverlapWarning(
      requiredSkillIds,
      null
    );

  if (overlapWarning) {

    const proceed =
      confirm(
        overlapWarning +
        "\n\nCreate this goal anyway?"
      );

    if (!proceed) {
      return;
    }

  }


      const roadmap =
    buildInitialRoadmap(
      trimmedTitle,
      requiredSkillIds
    );

  const relatedProjects =
    pickRelatedProjects(
      [],
      requiredSkillIds
    );

  if (relatedProjects === null) return;

  state.careerGoals.push({

    id:
      crypto.randomUUID(),

    title:
      trimmedTitle,

    description:
      description.trim(),

    requiredSkillIds:
      requiredSkillIds,

    roadmap:
      roadmap,

    relatedProjects:
      relatedProjects,

    createdAt:
      Date.now()

  });


  saveData(state);

  openedGoal =
    state.careerGoals[
      state.careerGoals.length - 1
    ].id;

  renderCareer(
    document.getElementById("app")
  );

}


/* =========================================================
   EDIT GOAL
   ========================================================= */

function editGoal(goal) {

  const title =
    prompt(
      "Career goal title:",
      goal.title
    );

  if (title === null) return;

  if (!title.trim()) {

    alert(
      "Title cannot be empty."
    );

    return;
  }


  const description =
    prompt(
      "Description (optional):",
      goal.description || ""
    );

  if (description === null) return;


    const requiredSkillIds =
    pickRequiredSkills(
      goal.requiredSkillIds
    );

  if (requiredSkillIds === null) return;


  const overlapWarning =
    getOverlapWarning(
      requiredSkillIds,
      goal.id
    );

  if (overlapWarning) {

    const proceed =
      confirm(
        overlapWarning +
        "\n\nSave anyway?"
      );

    if (!proceed) {
      return;
    }

  }


  const relatedProjects =
    pickRelatedProjects(
      goal.relatedProjects,
      requiredSkillIds
    );

  if (relatedProjects === null) return;


  goal.title =
    title.trim();

  goal.description =
    description.trim();

  goal.requiredSkillIds =
    requiredSkillIds;

  goal.relatedProjects =
    relatedProjects;


  saveData(state);

  openedGoal =
    goal.id;

  renderCareer(
    document.getElementById("app")
  );

}


/* =========================================================
   DELETE GOAL
   ========================================================= */

function deleteGoal(goal) {

  const confirmation =
    prompt(
      `Delete career goal "${goal.title}"?\n\n` +
      "This will permanently remove this goal " +
      "and its roadmap.\n\n" +
      "Type the exact goal title to confirm:"
    );

  if (confirmation === null) {
    return;
  }

  if (confirmation !== goal.title) {

    alert(
      "Goal title does not match.\n\n" +
      "The goal was NOT deleted."
    );

    return;
  }

  state.careerGoals =
    state.careerGoals.filter(
      existingGoal =>
        existingGoal.id !== goal.id
    );

  saveData(state);

  openedGoal = null;

  renderCareer(
    document.getElementById("app")
  );

}


/* =========================================================
   REQUIRED SKILLS PICKER
   ========================================================= */

function pickRequiredSkills(currentIds) {

  if (state.skills.length === 0) {

    alert(
      "No skills exist yet.\n\n" +
      "Add skills in the Skills tab first."
    );

    return null;

  }

  const options =
    state.skills
      .map(
        (skill, index) =>
          `${index + 1}. ${skill.name}`
      )
      .join("\n");

  const defaultValue =
    currentIds
      .map(id =>
        state.skills.findIndex(
          skill => skill.id === id
        ) + 1
      )
      .filter(index => index > 0)
      .join(", ");

  const choice =
    prompt(
      "Required skills:\n\n" +
      options +
      "\n\nEnter numbers separated by commas:",
      defaultValue
    );

  if (choice === null) return null;

  if (!choice.trim()) return [];

  const ids = [];

  choice
    .split(",")
    .map(value => Number(value.trim()) - 1)
    .forEach(index => {

      const skill =
        state.skills[index];

      if (
        skill &&
        !ids.includes(skill.id)
      ) {

        ids.push(skill.id);

      }

    });

  return ids;

}


/* =========================================================
   RELATED PROJECTS PICKER
   ========================================================= */

function pickRelatedProjects(currentIds, requiredSkillIds) {

  const availableProjects =
    state.projects.filter(
      project => !project.archived
    );

  if (availableProjects.length === 0) {

    return currentIds;

  }

  /*
   * AUTO-SUGGEST
   *
   * Pull projects already linked to the
   * required skills as candidates. This is
   * a suggestion only — fully editable,
   * never forced.
   */

  const suggestedIds = new Set(currentIds);

  requiredSkillIds.forEach(skillId => {

    const skill =
      state.skills.find(
        existingSkill =>
          existingSkill.id === skillId
      );

    if (
      skill &&
      Array.isArray(skill.relatedProjects)
    ) {

      skill.relatedProjects.forEach(
        projectId => suggestedIds.add(projectId)
      );

    }

  });

  const options =
    availableProjects
      .map(
        (project, index) =>
          `${index + 1}. ${project.name}`
      )
      .join("\n");

  const defaultValue =
    [...suggestedIds]
      .map(id =>
        availableProjects.findIndex(
          project => project.id === id
        ) + 1
      )
      .filter(index => index > 0)
      .join(", ");

  const choice =
    prompt(
      "Related projects (optional).\n\n" +
      "Pre-filled suggestions are based on your " +
      "required skills' related projects.\n\n" +
      options +
      "\n\nEnter numbers separated by commas, " +
      "or leave blank for none:",
      defaultValue
    );

  if (choice === null) return null;

  if (!choice.trim()) return [];

  const ids = [];

  choice
    .split(",")
    .map(value => Number(value.trim()) - 1)
    .forEach(index => {

      const project =
        availableProjects[index];

      if (
        project &&
        !ids.includes(project.id)
      ) {

        ids.push(project.id);

      }

    });

  return ids;

}


/* =========================================================
   OVERLAP WARNING
   ========================================================= */

function getOverlapWarning(
  requiredSkillIds,
  excludeGoalId
) {

  if (requiredSkillIds.length === 0) {
    return null;
  }

  const otherGoals =
    state.careerGoals.filter(
      goal =>
        goal.id !== excludeGoalId
    );

  for (const goal of otherGoals) {

    if (goal.requiredSkillIds.length === 0) {
      continue;
    }

    const shared =
      requiredSkillIds.filter(id =>
        goal.requiredSkillIds.includes(id)
      );

    const overlapPercent =
      shared.length /
      requiredSkillIds.length;

    if (overlapPercent >= 0.7) {

      return (
        `This overlaps heavily with your existing goal ` +
        `"${goal.title}" (${Math.round(overlapPercent * 100)}% ` +
        `shared required skills).\n\n` +
        `Are you sure this is a distinct direction?`
      );

    }

  }

  return null;

}


/* =========================================================
   ROADMAP STAGE MANAGEMENT
   ========================================================= */

function addRoadmapStage(goal) {

  const title =
    prompt(
      "Roadmap stage:"
    );

  if (title === null) return;

  if (!title.trim()) {

    alert(
      "Stage cannot be empty."
    );

    return;
  }

  goal.roadmap.push({

    id:
      crypto.randomUUID(),

    title:
      title.trim(),

    order:
      goal.roadmap.length + 1,

    done:
      false

  });

  saveData(state);

  openedGoal =
    goal.id;

  renderCareer(
    document.getElementById("app")
  );

}


function editRoadmapStage(goal, stage) {

  const title =
    prompt(
      "Roadmap stage:",
      stage.title
    );

  if (title === null) return;

  if (!title.trim()) {

    alert(
      "Stage cannot be empty."
    );

    return;
  }

  stage.title =
    title.trim();

  saveData(state);

  openedGoal =
    goal.id;

  renderCareer(
    document.getElementById("app")
  );

}


function deleteRoadmapStage(goal, stage) {

  const confirmed =
    confirm(
      `Delete stage "${stage.title}"?`
    );

  if (!confirmed) return;

  goal.roadmap =
    goal.roadmap.filter(
      existingStage =>
        existingStage.id !== stage.id
    );

  saveData(state);

  openedGoal =
    goal.id;

  renderCareer(
    document.getElementById("app")
  );

}


/* =========================================================
   ROADMAP SUGGESTION
   ========================================================= */

function buildInitialRoadmap(title, requiredSkillIds) {

  const template =
    roadmapTemplates[title];

  let suggestedTitles = [];

  let source = null;

  if (
    Array.isArray(template) &&
    template.length > 0
  ) {

    suggestedTitles = template;
    source = "template";

  } else if (requiredSkillIds.length > 0) {

    suggestedTitles =
      deriveStagesFromSkills(
        requiredSkillIds
      );

    source = "derived";

  }

  if (suggestedTitles.length === 0) {

    return [];

  }

  const preview =
    suggestedTitles
      .map(
        (stageTitle, index) =>
          `${index + 1}. ${stageTitle}`
      )
      .join("\n");

  const sourceLabel =
    source === "template"
      ? "a saved roadmap template"
      : "your required skills' levels";

  const useSuggestion =
    confirm(
      `Suggested roadmap (from ${sourceLabel}):\n\n` +
      preview +
      "\n\nUse this roadmap? " +
      "(You can edit it afterward.)\n\n" +
      "Cancel to start with an empty roadmap instead."
    );

  if (!useSuggestion) {

    return [];

  }

  return suggestedTitles.map(
    (stageTitle, index) => ({

      id:
        crypto.randomUUID(),

      title:
        stageTitle,

      order:
        index + 1,

      done:
        false

    })
  );

}


function deriveStagesFromSkills(requiredSkillIds) {

  const stages = [];

  requiredSkillIds.forEach(skillId => {

    const skill =
      state.skills.find(
        existingSkill =>
          existingSkill.id === skillId
      );

    if (!skill) return;

    const targetLevel =
      skill.targetLevel ||
      skill.level;

        const levelName =
      getLevelName(
        targetLevel
      );

    stages.push(
      `Reach ${levelName} in ${skill.name}`
    );

  });

  return stages;

}



/* =========================================================
   HELPERS
   ========================================================= */

function getRequiredSkillObjects(goal) {

  return goal.requiredSkillIds
    .map(id =>
      state.skills.find(
        skill => skill.id === id
      )
    )
    .filter(Boolean);

}


function findGoal(goalId) {

  return state.careerGoals.find(
    goal => goal.id === goalId
  );

}


function escapeHTML(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}