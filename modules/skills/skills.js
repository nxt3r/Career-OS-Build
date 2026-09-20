import { state } from "../../core/state.js";
import { saveData } from "../../core/storage.js";

let openedSkill = null;
let reviewingPromotion = null;

const LEVELS = [
  "Beginner",
  "Elementary",
  "Intermediate",
  "Advanced",
  "Expert"
];

const STATUS_MAP = {
  1: "Learning",
  2: "Active",
  3: "Paused",
  4: "Mastered"
};

const EVIDENCE_TYPES = {
  1: "Project",
  2: "Link",
  3: "Document",
  4: "Achievement",
  5: "Note",
  6: "Artifact"
};


/* =========================================================
   MAIN SKILLS VIEW
   ========================================================= */

export function renderSkills(app) {

  if (!app) return;

  app.innerHTML = `
    <section>

      <h2>Skills</h2>

      <div class="skill-controls">

        <button id="addSkillBtn">
          + Add Skill
        </button>

      </div>

      <div class="skill-filters">

        <button
          class="skill-filter active"
          data-filter="All"
        >
          All
        </button>

        ${
          state.skillCategories
            .map(category => `
              <button
                class="skill-filter"
                data-filter="${escapeHTML(category)}"
              >
                ${escapeHTML(category)}
              </button>
            `)
            .join("")
        }

      </div>

      <div id="skillList"></div>

    </section>
  `;

  renderSkillList();

  attachSkillEvents();
}


/* =========================================================
   SKILL LIST
   ========================================================= */

function renderSkillList(filter = "All") {

  const container =
    document.getElementById("skillList");

  if (!container) return;

  const visibleSkills =
    filter === "All"
      ? state.skills
      : state.skills.filter(
          skill =>
            skill.category === filter
        );

  if (visibleSkills.length === 0) {

    container.innerHTML = `
      <div class="card">

        <p>
          No skills added yet.
        </p>

      </div>
    `;

    return;
  }

  container.innerHTML =
    visibleSkills
      .map(skill => renderSkillCard(skill))
      .join("");
}


/* =========================================================
   SKILL CARD
   ========================================================= */

function renderSkillCard(skill) {

  ensureSkillData(skill);

  const levelName =
    getLevelName(skill.level);

  const targetLevelName =
    getLevelName(skill.targetLevel);

  const expanded =
    openedSkill === skill.id;

  return `
    <div
      class="
        card
        skill-card
        ${expanded ? "expanded-skill" : ""}
      "
    >

      <div
        class="skill-header"
        data-id="${skill.id}"
      >

                <div>

          <h3>
            ${escapeHTML(skill.name)}
            ${renderStaleIndicator(skill)}
          </h3>

          <p>
            ${escapeHTML(skill.category)}
          </p>

          <p>
            Level:
            <strong>
              ${levelName}
            </strong>

            →

            <strong>
              ${targetLevelName}
            </strong>
          </p>

          <p>
            Status:
            <strong>
              ${escapeHTML(skill.status)}
            </strong>
          </p>

        </div>

        <div class="skill-right">

          <span class="expand-icon">
            ${expanded ? "−" : "+"}
          </span>

        </div>

      </div>

      ${
        expanded
          ? renderExpandedSkill(skill)
          : ""
      }

    </div>
  `;
}


/* =========================================================
   EXPANDED SKILL
   ========================================================= */

function renderExpandedSkill(skill) {

  const levelName =
    getLevelName(skill.level);

  const targetLevelName =
    getLevelName(skill.targetLevel);

  return `
    <div class="skill-body">

      <!-- ABOUT -->

      <div class="skill-section">

        <h4>
          About This Skill
        </h4>

        <p>
          ${
            skill.description
              ? escapeHTML(skill.description)
              : "No description."
          }
        </p>

      </div>


      <!-- SKILL LEVEL -->

      <div class="skill-section">

        <h4>
          Skill Level
        </h4>

        <p>
          Current:
          <strong>
            ${levelName}
          </strong>
        </p>

        <p>
          Target:
          <strong>
            ${targetLevelName}
          </strong>
        </p>

        ${renderCurrentLevelProgress(skill)}

        ${renderLevelProgression(skill)}

      </div>


      <!-- LEVEL HISTORY -->

      <div class="skill-section">

        <h4>
          Level History
        </h4>

        ${renderLevelHistory(skill)}

      </div>


      <!-- STATUS -->

      <div class="skill-section">

        <h4>
          Status
        </h4>

        <p>
          <strong>
            ${escapeHTML(skill.status)}
          </strong>
        </p>

      </div>


      <!-- CAPABILITY FRAMEWORK -->

      <div class="skill-section capability-section">

        <h4>
          Capability Framework
        </h4>

        <p>
          Define what being good at this skill
          actually means.
        </p>

        ${renderCapabilities(skill)}

      </div>


            <!-- PRACTICE -->

      <div class="skill-section">

        <h4>
          Practice
          ${renderStaleIndicator(skill)}
        </h4>

        <p>
          Total practice:
          <strong>
            ${formatSkillPracticeTime(
              getSkillPracticeTime(skill.id)
            )}
          </strong>
        </p>

        <p>
          Practice sessions:
          <strong>
            ${getSkillSessionCount(skill.id)}
          </strong>
        </p>

        <p>
          ${
            getSkillLastPracticed(skill.id)
              ? `
                Last practiced:
                <strong>
                  ${new Date(
                    getSkillLastPracticed(skill.id)
                  ).toLocaleString()}
                </strong>
              `
              : "No practice recorded yet."
          }
        </p>

        ${renderPracticeTrend(skill)}

        ${renderStaleMessage(skill)}

      </div>


      <!-- RELATED PROJECTS -->

      <div class="skill-section">

        <h4>
          Related Projects
        </h4>

        ${renderRelatedProjects(skill)}

      </div>


      <!-- EVIDENCE -->

      <div class="skill-section">

        <h4>
          Evidence
        </h4>

        ${renderSkillEvidence(skill)}

      </div>


      <!-- SKILL MANAGEMENT -->

      <div class="skill-actions">

        <button
          class="edit-skill"
          data-skill="${skill.id}"
        >
          Edit Skill
        </button>

        <button
          class="delete-skill"
          data-skill="${skill.id}"
        >
          Delete Skill
        </button>

      </div>

    </div>
  `;
}


/* =========================================================
   CURRENT LEVEL PROGRESS
   ========================================================= */

function renderCurrentLevelProgress(skill) {

  const progress =
    getCapabilityProgress(
      skill,
      skill.level
    );

  if (progress.total === 0) {

    return `
      <div class="skill-progression">

        <p>
          <strong>
            Current Level Progress
          </strong>
        </p>

        <p>
          No capabilities defined for
          ${getLevelName(skill.level)} yet.
        </p>

      </div>
    `;
  }

  return `
    <div class="skill-progression">

      <p>
        <strong>
          Current Level Progress
        </strong>
      </p>

      <p>
        ${progress.demonstrated}
        /
        ${progress.total}
        demonstrated
      </p>

    </div>
  `;
}


/* =========================================================
   LEVEL PROGRESSION
   ========================================================= */

function renderLevelProgression(skill) {

  const readiness =
    getNextLevelReadiness(skill);


  /* EXPERT */

  if (readiness.reason === "max-level") {

    return `
      <div class="skill-progression">

        <p>
          🏆
          <strong>
            Expert level reached.
          </strong>
        </p>

        <p>
          This skill is at the maximum level.
        </p>

      </div>
    `;
  }


  /* TARGET REACHED */

  if (readiness.reason === "target-reached") {

    return `
      <div class="skill-progression">

        <p>
          <strong>
            Target level reached.
          </strong>
        </p>

        <p>
          No promotion needed right now.
        </p>

      </div>
    `;
  }


  /* NO CAPABILITIES */

  if (readiness.reason === "no-capabilities") {

    return `
      <div class="skill-progression">

        <p>
          <strong>
            Next Level Readiness
          </strong>
        </p>

        <p>
          Next level:
          <strong>
            ${getLevelName(readiness.nextLevel)}
          </strong>
        </p>

        <p>
          No capabilities have been defined
          for the next level yet.
        </p>

        <p>
          Define the required capabilities
          before promotion can be assessed.
        </p>

      </div>
    `;
  }


  /* NEXT LEVEL READINESS */

  return `
    <div class="skill-progression">

      <p>
        <strong>
          Next Level Readiness
        </strong>
      </p>

      <p>
        Next level:
        <strong>
          ${getLevelName(readiness.nextLevel)}
        </strong>
      </p>

      <p>
        ${readiness.demonstrated}
        /
        ${readiness.total}
        demonstrated
      </p>

            ${
        readiness.ready
          ? (
              reviewingPromotion === skill.id
                ? renderPromotionReview(skill, readiness)
                : `
                  <p>
                    <strong>
                      Ready for promotion.
                    </strong>
                  </p>

                  <button
                    class="review-promotion"
                    data-skill="${skill.id}"
                  >
                    Review & Promote to
                    ${getLevelName(readiness.nextLevel)}
                  </button>
                `
            )
          : `
            <p>
              Demonstrate all next-level
              capabilities to become ready
              for promotion.
            </p>
          `
      }

    </div>
  `;
}


/* =========================================================
   PROMOTION REVIEW
   ========================================================= */

function renderPromotionReview(skill, readiness) {

  const nextLevelCapabilities =
    skill.capabilities
      .filter(
        capability =>
          capability.level === readiness.nextLevel
      )
      .sort(
        (a, b) =>
          (a.order || 0) - (b.order || 0)
      );

  return `
    <div class="promotion-review">

      <p>
        <strong>
          Review before promoting to
          ${getLevelName(readiness.nextLevel)}
        </strong>
      </p>

      <p>
        These capabilities will be credited
        for this promotion:
      </p>

      <div class="promotion-review-list">

        ${
          nextLevelCapabilities
            .map(capability => {

              const evidence =
                skill.evidence.find(
                  item =>
                    item.capabilityId === capability.id
                );

              return `
                <div class="promotion-review-item">

                  <p>
                    <strong>
                      ${escapeHTML(capability.title)}
                    </strong>
                  </p>

                  ${
                    evidence
                      ? `
                        <p>
                          Evidence:
                          <strong>
                            ${escapeHTML(evidence.type)}
                          </strong>
                          —
                          ${escapeHTML(evidence.title)}
                        </p>
                      `
                      : `
                        <p>
                          No evidence attached.
                        </p>
                      `
                  }

                </div>
              `;

            })
            .join("")
        }

      </div>

      <div class="promotion-review-actions">

        <button
          class="confirm-promotion"
          data-skill="${skill.id}"
        >
          Confirm Promotion
        </button>

        <button
          class="cancel-review-promotion"
          data-skill="${skill.id}"
        >
          Cancel
        </button>

      </div>

    </div>
  `;
}


/* =========================================================
   LEVEL HISTORY
   ========================================================= */

function renderLevelHistory(skill) {

  if (
    !Array.isArray(skill.levelHistory) ||
    skill.levelHistory.length === 0
  ) {

    return `
      <p>
        No level changes recorded yet.
      </p>
    `;
  }

  const history =
    [...skill.levelHistory]
      .sort(
        (a, b) =>
          b.changedAt - a.changedAt
      );

  return `
    <div class="skill-level-history">

      ${
        history
          .map(entry => `
            <div class="level-history-item">

              <p>

                <strong>
                  ${getLevelName(entry.fromLevel)}
                </strong>

                →

                <strong>
                  ${getLevelName(entry.toLevel)}
                </strong>

              </p>

              <p>
                ${new Date(
                  entry.changedAt
                ).toLocaleString()}
              </p>

            </div>
          `)
          .join("")
      }

    </div>
  `;
}


/* =========================================================
   RELATED PROJECTS
   ========================================================= */

function renderRelatedProjects(skill) {

  if (
    !Array.isArray(skill.relatedProjects) ||
    skill.relatedProjects.length === 0
  ) {

    return `
      <p>
        No related projects.
      </p>
    `;
  }

  const projects =
    skill.relatedProjects
      .map(projectId =>
        state.projects.find(
          project =>
            project.id === projectId
        )
      )
      .filter(Boolean);

  if (projects.length === 0) {

    return `
      <p>
        No related projects.
      </p>
    `;
  }

  return `
    <ul class="skill-related-projects">

      ${
        projects
          .map(project => `
            <li>
              ${escapeHTML(project.name)}
            </li>
          `)
          .join("")
      }

    </ul>
  `;
}


/* =========================================================
   SKILL EVENTS
   ========================================================= */

function attachSkillEvents() {

  const app =
    document.getElementById("app");

  if (!app) return;


  /*
   * ADD SKILL
   */

  const addButton =
    document.getElementById("addSkillBtn");

  if (addButton) {

    addButton.addEventListener(
      "click",
      openAddSkillForm
    );
  }


  /*
   * CATEGORY FILTERS
   */

  document
    .querySelectorAll(".skill-filter")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          document
            .querySelectorAll(".skill-filter")
            .forEach(btn =>
              btn.classList.remove("active")
            );

          button.classList.add("active");

          openedSkill = null;

          renderSkillList(
            button.dataset.filter
          );
        }
      );
    });


  /*
   * SKILL LIST EVENT DELEGATION
   *
   * One listener handles every dynamically
   * generated skill/capability/evidence action.
   */

  const skillList =
    document.getElementById("skillList");

  if (!skillList) return;

  skillList.onclick =
    handleSkillListClick;
}


/* =========================================================
   SKILL LIST CLICK HANDLER
   ========================================================= */

function handleSkillListClick(event) {

  const target =
    event.target instanceof Element
      ? event.target
      : event.target.parentElement;

  if (!target) return;


  /*
   * SKILL HEADER
   */

  const header =
    target.closest(".skill-header");

  if (
    header &&
    !target.closest("button")
  ) {

    const id =
      header.dataset.id;

    openedSkill =
      openedSkill === id
        ? null
        : id;

    const activeFilter =
      document.querySelector(
        ".skill-filter.active"
      );

    renderSkillList(
      activeFilter
        ? activeFilter.dataset.filter
        : "All"
    );

    return;
  }


  /*
   * FIND ACTION BUTTON
   */

  const button =
    target.closest("button");

  if (!button) return;

  event.stopPropagation();


  /*
   * ADD CAPABILITY
   */

  if (
    button.classList.contains(
      "add-capability"
    )
  ) {

    const skill =
      findSkill(
        button.dataset.skill
      );

    if (skill) {
      addCapability(skill);
    }

    return;
  }


  /*
   * EDIT CAPABILITY
   */

  if (
    button.classList.contains(
      "edit-capability"
    )
  ) {

    const skill =
      findSkill(
        button.dataset.skill
      );

    if (!skill) return;

    const capability =
      findCapability(
        skill,
        button.dataset.capability
      );

    if (capability) {
      editCapability(
        skill,
        capability
      );
    }

    return;
  }


  /*
   * DELETE CAPABILITY
   */

  if (
    button.classList.contains(
      "delete-capability"
    )
  ) {

    const skill =
      findSkill(
        button.dataset.skill
      );

    if (!skill) return;

    const capability =
      findCapability(
        skill,
        button.dataset.capability
      );

    if (capability) {
      deleteCapability(
        skill,
        capability
      );
    }

    return;
  }


  /*
   * MOVE CAPABILITY UP
   */

  if (
    button.classList.contains(
      "move-capability-up"
    )
  ) {

    const skill =
      findSkill(
        button.dataset.skill
      );

    if (!skill) return;

    const capability =
      findCapability(
        skill,
        button.dataset.capability
      );

    if (capability) {
      moveCapability(
        skill,
        capability,
        -1
      );
    }

    return;
  }


  /*
   * MOVE CAPABILITY DOWN
   */

  if (
    button.classList.contains(
      "move-capability-down"
    )
  ) {

    const skill =
      findSkill(
        button.dataset.skill
      );

    if (!skill) return;

    const capability =
      findCapability(
        skill,
        button.dataset.capability
      );

    if (capability) {
      moveCapability(
        skill,
        capability,
        1
      );
    }

    return;
  }


  /*
   * TOGGLE DEMONSTRATED
   */

  if (
    button.classList.contains(
      "capability-demonstrated"
    )
  ) {

    const skill =
      findSkill(
        button.dataset.skill
      );

    if (!skill) return;

    const capability =
      findCapability(
        skill,
        button.dataset.capability
      );

    if (capability) {
      toggleCapabilityDemonstrated(
        skill,
        capability
      );
    }

    return;
  }


  /*
   * ADD EVIDENCE
   */

  if (
    button.classList.contains(
      "add-evidence"
    )
  ) {

    const skill =
      findSkill(
        button.dataset.skill
      );

    if (!skill) return;

    const capability =
      findCapability(
        skill,
        button.dataset.capability
      );

    if (capability) {
      addEvidence(
        skill,
        capability
      );
    }

    return;
  }


  /*
   * EDIT EVIDENCE
   */

  if (
    button.classList.contains(
      "edit-evidence"
    )
  ) {

    const skill =
      findSkill(
        button.dataset.skill
      );

    if (!skill) return;

    const evidence =
      findEvidence(
        skill,
        button.dataset.evidence
      );

    if (evidence) {
      editEvidence(
        skill,
        evidence
      );
    }

    return;
  }


  /*
   * DELETE EVIDENCE
   */

  if (
    button.classList.contains(
      "delete-evidence"
    )
  ) {

    const skill =
      findSkill(
        button.dataset.skill
      );

    if (!skill) return;

    const evidence =
      findEvidence(
        skill,
        button.dataset.evidence
      );

    if (evidence) {
      deleteEvidence(
        skill,
        evidence
      );
    }

    return;
  }


    /*
   * REVIEW & PROMOTE (open review)
   */

  if (
    button.classList.contains(
      "review-promotion"
    )
  ) {

    reviewingPromotion =
      button.dataset.skill;

    openedSkill =
      button.dataset.skill;

    renderSkills(
      document.getElementById("app")
    );

    return;
  }


  /*
   * CANCEL REVIEW
   */

  if (
    button.classList.contains(
      "cancel-review-promotion"
    )
  ) {

    reviewingPromotion = null;

    renderSkills(
      document.getElementById("app")
    );

    return;
  }


  /*
   * CONFIRM PROMOTION (after review)
   */

  if (
    button.classList.contains(
      "confirm-promotion"
    )
  ) {

    const skill =
      findSkill(
        button.dataset.skill
      );

    if (skill) {
      promoteSkill(skill);
    }

    reviewingPromotion = null;

    return;
  }


  /*
   * EDIT SKILL
   */

  if (
    button.classList.contains(
      "edit-skill"
    )
  ) {

    const skill =
      findSkill(
        button.dataset.skill
      );

    if (skill) {
      editSkill(skill);
    }

    return;
  }


  /*
   * DELETE SKILL
   */

  if (
    button.classList.contains(
      "delete-skill"
    )
  ) {

    const skill =
      findSkill(
        button.dataset.skill
      );

    if (skill) {
      deleteSkill(skill);
    }
  }
}


/* =========================================================
   ADD SKILL
   ========================================================= */

function openAddSkillForm() {

  const name =
    prompt(
      "Skill name:"
    );

  if (
    name === null ||
    !name.trim()
  ) {
    return;
  }


  /*
   * CATEGORY
   */

  const categoryOptions =
    state.skillCategories
      .map(
        (category, index) =>
          `${index + 1}. ${category}`
      )
      .join("\n");

  const categoryChoice =
    prompt(
      "Choose category:\n\n" +
      categoryOptions
    );

  if (
    categoryChoice === null ||
    !categoryChoice.trim()
  ) {
    return;
  }

  const categoryIndex =
    Number(
      categoryChoice.trim()
    ) - 1;

  if (
    !Number.isInteger(categoryIndex) ||
    !state.skillCategories[categoryIndex]
  ) {

    alert(
      "Invalid category."
    );

    return;
  }

  const category =
    state.skillCategories[
      categoryIndex
    ];


  /*
   * CURRENT LEVEL
   */

  const level =
    askLevel(
      "Current level:"
    );

  if (!level) return;


  /*
   * TARGET LEVEL
   */

  const targetLevel =
    askTargetLevel(
      level
    );

  if (!targetLevel) return;


  /*
   * STATUS
   */

  const statusChoice =
    prompt(
      "Status:\n\n" +
      "1. Learning\n" +
      "2. Active\n" +
      "3. Paused\n" +
      "4. Mastered"
    );

  if (
    statusChoice === null ||
    !statusChoice.trim()
  ) {
    return;
  }

  const status =
    STATUS_MAP[
      Number(
        statusChoice.trim()
      )
    ];

  if (!status) {

    alert(
      "Invalid status."
    );

    return;
  }


  /*
   * DESCRIPTION
   */

  const description =
    prompt(
      "Skill description:"
    ) || "";


  /*
   * RELATED PROJECTS
   */

  const relatedProjects = [];

  const activeProjects =
    state.projects.filter(
      project =>
        !project.archived
    );

  if (activeProjects.length > 0) {

    const projectOptions =
      activeProjects
        .map(
          (project, index) =>
            `${index + 1}. ${project.name}`
        )
        .join("\n");

    const projectChoice =
      prompt(
        "Related projects (optional).\n\n" +
        projectOptions +
        "\n\n" +
        "Enter project numbers separated by commas, " +
        "or leave blank."
      );

    if (
      projectChoice &&
      projectChoice.trim()
    ) {

      projectChoice
        .split(",")
        .map(
          value =>
            Number(
              value.trim()
            ) - 1
        )
        .forEach(index => {

          const project =
            activeProjects[index];

          if (
            project &&
            !relatedProjects.includes(
              project.id
            )
          ) {

            relatedProjects.push(
              project.id
            );
          }
        });
    }
  }


  /*
   * CREATE
   */

  state.skills.push({

    id:
      crypto.randomUUID(),

    name:
      name.trim(),

    category:
      category,

    level:
      level,

    targetLevel:
      targetLevel,

    status:
      status,

    description:
      description.trim(),

    capabilities:
      [],

    lastPracticed:
      null,

    relatedProjects:
      relatedProjects,

    evidence:
      [],

    levelHistory:
      []

  });


  saveData(state);

  openedSkill =
    state.skills[
      state.skills.length - 1
    ].id;

  renderSkills(
    document.getElementById("app")
  );
}


/* =========================================================
   EDIT SKILL
   ========================================================= */

function editSkill(skill) {

  /*
   * IMPORTANT:
   * Current level is intentionally NOT editable.
   *
   * Level changes must happen through promotion
   * so level history remains trustworthy.
   */


  /*
   * NAME
   */

  const name =
    prompt(
      "Skill name:",
      skill.name
    );

  if (name === null) return;

  if (!name.trim()) {

    alert(
      "Skill name cannot be empty."
    );

    return;
  }


  /*
   * CATEGORY
   */

  const categoryOptions =
    state.skillCategories
      .map(
        (category, index) =>
          `${index + 1}. ${category}`
      )
      .join("\n");

  const currentCategoryIndex =
    state.skillCategories.indexOf(
      skill.category
    );

  const categoryChoice =
    prompt(
      "Choose category:\n\n" +
      categoryOptions,
      currentCategoryIndex >= 0
        ? String(
            currentCategoryIndex + 1
          )
        : ""
    );

  if (categoryChoice === null) {
    return;
  }

  const categoryIndex =
    Number(
      categoryChoice.trim()
    ) - 1;

  if (
    !Number.isInteger(categoryIndex) ||
    !state.skillCategories[categoryIndex]
  ) {

    alert(
      "Invalid category."
    );

    return;
  }

  const category =
    state.skillCategories[
      categoryIndex
    ];


  /*
   * TARGET LEVEL
   */

  const targetLevel =
    askTargetLevelWithDefault(
      skill.level,
      skill.targetLevel
    );

  if (!targetLevel) return;


  /*
   * STATUS
   */

  const statusChoice =
    prompt(
      "Status:\n\n" +
      "1. Learning\n" +
      "2. Active\n" +
      "3. Paused\n" +
      "4. Mastered",
      getStatusNumber(
        skill.status
      )
    );

  if (statusChoice === null) {
    return;
  }

  const status =
    STATUS_MAP[
      Number(
        statusChoice.trim()
      )
    ];

  if (!status) {

    alert(
      "Invalid status."
    );

    return;
  }


  /*
   * DESCRIPTION
   */

  const description =
    prompt(
      "Skill description:",
      skill.description || ""
    );

  if (description === null) {
    return;
  }


  /*
   * APPLY
   */

  skill.name =
    name.trim();

  skill.category =
    category;

  skill.targetLevel =
    targetLevel;

  skill.status =
    status;

  skill.description =
    description.trim();


  saveData(state);

  openedSkill =
    skill.id;

  renderSkills(
    document.getElementById("app")
  );
}


/* =========================================================
   PROMOTION
   ========================================================= */

function promoteSkill(skill) {

  const readiness =
    getNextLevelReadiness(skill);

  /*
   * HARD SAFETY CHECK
   *
   * The review screen is the confirmation
   * step now, so this is a last-line guard,
   * not the primary check.
   */

  if (!readiness.ready) {

    alert(
      "This skill is not ready for promotion."
    );

    return;
  }

  const fromLevel =
    skill.level;

  const toLevel =
    readiness.nextLevel;


  /*
   * ENSURE HISTORY
   */

  if (
    !Array.isArray(
      skill.levelHistory
    )
  ) {

    skill.levelHistory =
      [];
  }


  /*
   * CHANGE LEVEL
   */

  skill.level =
    toLevel;


  /*
   * RECORD HISTORY
   */

  skill.levelHistory.push({

    id:
      crypto.randomUUID(),

    fromLevel:
      fromLevel,

    toLevel:
      toLevel,

    changedAt:
      Date.now()

  });


  saveData(state);

  openedSkill =
    skill.id;

  renderSkills(
    document.getElementById("app")
  );
}


/* =========================================================
   DELETE SKILL
   ========================================================= */

function deleteSkill(skill) {

  const confirmation =
    prompt(
      `Delete "${skill.name}"?\n\n` +
      "This will permanently remove this skill " +
      "and its skill-specific data.\n\n" +
      "Type the exact skill name to confirm:"
    );

  if (confirmation === null) {
    return;
  }

  if (
    confirmation !== skill.name
  ) {

    alert(
      "Skill name does not match.\n\n" +
      "The skill was NOT deleted."
    );

    return;
  }

  const confirmed =
    confirm(
      `Permanently delete "${skill.name}"?`
    );

  if (!confirmed) {
    return;
  }

  state.skills =
    state.skills.filter(
      existingSkill =>
        existingSkill.id !== skill.id
    );

  saveData(state);

  openedSkill = null;

  renderSkills(
    document.getElementById("app")
  );
}


/* =========================================================
   LEVEL HELPERS
   ========================================================= */

function askLevel(message) {

  const choice =
    prompt(
      message +
      "\n\n" +
      "1. Beginner" +
      "\n2. Elementary" +
      "\n3. Intermediate" +
      "\n4. Advanced" +
      "\n5. Expert" +
      "\n\nEnter a number from 1 to 5:"
    );

  if (choice === null) {
    return null;
  }

  const level =
    Number(
      choice.trim()
    );

  if (
    !Number.isInteger(level) ||
    level < 1 ||
    level > 5
  ) {

    alert(
      "Invalid level.\n\n" +
      "Enter a number from 1 to 5."
    );

    return null;
  }

  return level;
}


function askLevelWithDefault(
  message,
  currentLevel
) {

  const choice =
    prompt(
      message +
      "\n\n" +
      "1. Beginner" +
      "\n2. Elementary" +
      "\n3. Intermediate" +
      "\n4. Advanced" +
      "\n5. Expert" +
      "\n\nEnter a number from 1 to 5:",
      String(currentLevel)
    );

  if (choice === null) {
    return null;
  }

  const level =
    Number(
      choice.trim()
    );

  if (
    !Number.isInteger(level) ||
    level < 1 ||
    level > 5
  ) {

    alert(
      "Invalid level.\n\n" +
      "Enter a number from 1 to 5."
    );

    return null;
  }

  return level;
}


function askTargetLevel(
  currentLevel
) {

  const availableLevels =
    LEVELS
      .slice(currentLevel - 1)
      .map(
        (level, index) =>
          `${currentLevel + index}. ${level}`
      )
      .join("\n");

  const choice =
    prompt(
      "Target level:\n\n" +
      availableLevels +
      "\n\nEnter a number:"
    );

  if (choice === null) {
    return null;
  }

  const targetLevel =
    Number(
      choice.trim()
    );

  if (
    !Number.isInteger(targetLevel) ||
    targetLevel < currentLevel ||
    targetLevel > 5
  ) {

    alert(
      "Invalid target level.\n\n" +
      "Target level cannot be below " +
      "your current level."
    );

    return null;
  }

  return targetLevel;
}


function askTargetLevelWithDefault(
  currentLevel,
  currentTarget
) {

  let defaultValue =
    currentTarget;

  if (
    !Number.isInteger(defaultValue) ||
    defaultValue < currentLevel
  ) {

    defaultValue =
      currentLevel;
  }

  const availableLevels =
    LEVELS
      .slice(currentLevel - 1)
      .map(
        (level, index) =>
          `${currentLevel + index}. ${level}`
      )
      .join("\n");

  const choice =
    prompt(
      "Target level:\n\n" +
      availableLevels +
      "\n\nEnter a number:",
      String(defaultValue)
    );

  if (choice === null) {
    return null;
  }

  const targetLevel =
    Number(
      choice.trim()
    );

  if (
    !Number.isInteger(targetLevel) ||
    targetLevel < currentLevel ||
    targetLevel > 5
  ) {

    alert(
      "Invalid target level.\n\n" +
      "Target level cannot be below " +
      "your current level."
    );

    return null;
  }

  return targetLevel;
}


function getStatusNumber(status) {

  const statusMap = {

    Learning: "1",
    Active: "2",
    Paused: "3",
    Mastered: "4"

  };

  return (
    statusMap[status] ||
    "1"
  );
}


export function getLevelName(level) {

  return (
    LEVELS[level - 1] ||
    "Unknown"
  );
}


/* =========================================================
   CAPABILITY FRAMEWORK
   ========================================================= */

function renderCapabilities(skill) {

  const levels = [
    1,
    2,
    3,
    4,
    5
  ];

  return `
    <div class="capability-framework">

      ${
        levels
          .map(level =>
            renderCapabilityLevel(
              skill,
              level
            )
          )
          .join("")
      }

      <button
        class="add-capability"
        data-skill="${skill.id}"
      >
        + Add Capability
      </button>

    </div>
  `;
}


function renderCapabilityLevel(
  skill,
  level
) {

  const capabilities =
    skill.capabilities
      .filter(
        capability =>
          capability.level === level
      )
      .sort(
        (a, b) =>
          (a.order || 0) -
          (b.order || 0)
      );

  const progress =
    getCapabilityProgress(
      skill,
      level
    );

  return `
    <div class="capability-level">

      <div class="capability-level-header">

        <h5>
          ${getLevelName(level)}
        </h5>

        ${
          progress.total > 0
            ? `
              <span class="capability-progress">
                ${progress.demonstrated}
                /
                ${progress.total}
                demonstrated
              </span>
            `
            : ""
        }

      </div>

      ${
        capabilities.length === 0
          ? `
            <p class="capability-empty">
              No capabilities defined yet.
            </p>
          `
          : `
            <div class="capability-list">

              ${
                capabilities
                  .map(
                    (capability, index) =>
                      renderCapability(
                        skill,
                        capability,
                        index,
                        capabilities.length
                      )
                  )
                  .join("")
              }

            </div>
          `
      }

    </div>
  `;
}


function renderCapability(
  skill,
  capability,
  index,
  total
) {

  return `
    <div
      class="capability-item"
      data-capability="${capability.id}"
    >

      <div class="capability-content">

        <button
          class="capability-demonstrated"
          data-skill="${skill.id}"
          data-capability="${capability.id}"
          title="${
            capability.demonstrated
              ? "Mark as not demonstrated"
              : "Mark as demonstrated"
          }"
        >

          <span class="capability-check">
            ${
              capability.demonstrated
                ? "☑"
                : "☐"
            }
          </span>

          <strong
            class="${
              capability.demonstrated
                ? "capability-demonstrated-text"
                : ""
            }"
          >
            ${escapeHTML(
              capability.title
            )}
          </strong>

        </button>

      </div>

      <div class="capability-actions">

        <button
          class="move-capability-up"
          data-skill="${skill.id}"
          data-capability="${capability.id}"
          ${index === 0 ? "disabled" : ""}
          title="Move up"
        >
          ↑
        </button>

        <button
          class="move-capability-down"
          data-skill="${skill.id}"
          data-capability="${capability.id}"
          ${index === total - 1 ? "disabled" : ""}
          title="Move down"
        >
          ↓
        </button>

        <button
          class="edit-capability"
          data-skill="${skill.id}"
          data-capability="${capability.id}"
        >
          Edit
        </button>

        <button
          class="delete-capability"
          data-skill="${skill.id}"
          data-capability="${capability.id}"
        >
          Delete
        </button>

      </div>

    </div>
  `;
}


/* =========================================================
   CAPABILITY ACTIONS
   ========================================================= */

function addCapability(skill) {

  const title =
    prompt(
      "Capability:\n\n" +
      "Describe something you should be able " +
      "to do at a specific level."
    );

  if (title === null) {
    return;
  }

  if (!title.trim()) {

    alert(
      "Capability cannot be empty."
    );

    return;
  }

  const level =
    askCapabilityLevel(
      skill
    );

  if (!level) return;

  const levelCapabilities =
    skill.capabilities.filter(
      capability =>
        capability.level === level
    );

  skill.capabilities.push({

    id:
      crypto.randomUUID(),

    title:
      title.trim(),

    level:
      level,

    order:
      levelCapabilities.length + 1,

    demonstrated:
      false

  });

  normalizeCapabilityOrder(skill);

  saveData(state);

  openedSkill =
    skill.id;

  renderSkills(
    document.getElementById("app")
  );
}


function askCapabilityLevel(skill) {

  const choice =
    prompt(
      "Which skill level does this capability belong to?\n\n" +
      "1. Beginner\n" +
      "2. Elementary\n" +
      "3. Intermediate\n" +
      "4. Advanced\n" +
      "5. Expert\n\n" +
      "Enter a number from 1 to 5:",
      String(skill.level)
    );

  if (choice === null) {
    return null;
  }

  const level =
    Number(
      choice.trim()
    );

  if (
    !Number.isInteger(level) ||
    level < 1 ||
    level > 5
  ) {

    alert(
      "Invalid capability level."
    );

    return null;
  }

  return level;
}


function editCapability(
  skill,
  capability
) {

  const title =
    prompt(
      "Capability:",
      capability.title
    );

  if (title === null) {
    return;
  }

  if (!title.trim()) {

    alert(
      "Capability cannot be empty."
    );

    return;
  }

  const oldLevel =
    capability.level;

  const level =
    askCapabilityLevelForEdit(
      capability.level
    );

  if (!level) return;

  capability.title =
    title.trim();

  capability.level =
    level;

  if (
    oldLevel !== level
  ) {

    normalizeCapabilityOrder(
      skill
    );
  }

  saveData(state);

  openedSkill =
    skill.id;

  renderSkills(
    document.getElementById("app")
  );
}


function askCapabilityLevelForEdit(
  currentLevel
) {

  const choice =
    prompt(
      "Capability level:\n\n" +
      "1. Beginner\n" +
      "2. Elementary\n" +
      "3. Intermediate\n" +
      "4. Advanced\n" +
      "5. Expert\n\n" +
      "Enter a number from 1 to 5:",
      String(currentLevel)
    );

  if (choice === null) {
    return null;
  }

  const level =
    Number(
      choice.trim()
    );

  if (
    !Number.isInteger(level) ||
    level < 1 ||
    level > 5
  ) {

    alert(
      "Invalid capability level."
    );

    return null;
  }

  return level;
}


function deleteCapability(
  skill,
  capability
) {

  const confirmed =
    confirm(
      `Delete capability "${capability.title}"?`
    );

  if (!confirmed) {
    return;
  }

  skill.capabilities =
    skill.capabilities.filter(
      existingCapability =>
        existingCapability.id !==
        capability.id
    );

  /*
   * Remove evidence attached to the
   * deleted capability.
   */

  skill.evidence =
    skill.evidence.filter(
      evidence =>
        evidence.capabilityId !==
        capability.id
    );

  normalizeCapabilityOrder(skill);

  saveData(state);

  openedSkill =
    skill.id;

  renderSkills(
    document.getElementById("app")
  );
}


function moveCapability(
  skill,
  capability,
  direction
) {

  const sameLevel =
    skill.capabilities
      .filter(
        item =>
          item.level === capability.level
      )
      .sort(
        (a, b) =>
          (a.order || 0) -
          (b.order || 0)
      );

  const currentIndex =
    sameLevel.findIndex(
      item =>
        item.id === capability.id
    );

  if (currentIndex === -1) {
    return;
  }

  const newIndex =
    currentIndex + direction;

  if (
    newIndex < 0 ||
    newIndex >= sameLevel.length
  ) {
    return;
  }

  [
    sameLevel[currentIndex],
    sameLevel[newIndex]
  ] = [
    sameLevel[newIndex],
    sameLevel[currentIndex]
  ];

  sameLevel.forEach(
    (item, index) => {
      item.order =
        index + 1;
    }
  );

  saveData(state);

  openedSkill =
    skill.id;

  renderSkills(
    document.getElementById("app")
  );
}


function normalizeCapabilityOrder(skill) {

  if (
    !Array.isArray(
      skill.capabilities
    )
  ) {
    return;
  }

  for (
    let level = 1;
    level <= 5;
    level++
  ) {

    const capabilities =
      skill.capabilities
        .filter(
          capability =>
            capability.level === level
        )
        .sort(
          (a, b) =>
            (a.order || 0) -
            (b.order || 0)
        );

    capabilities.forEach(
      (capability, index) => {

        capability.order =
          index + 1;

      }
    );
  }
}


function toggleCapabilityDemonstrated(
  skill,
  capability
) {

  capability.demonstrated =
    !capability.demonstrated;

  capability.demonstratedAt =
    capability.demonstrated
      ? Date.now()
      : null;

  saveData(state);

  openedSkill =
    skill.id;

  renderSkills(
    document.getElementById("app")
  );
}


/* =========================================================
   EVIDENCE
   ========================================================= */

function renderSkillEvidence(skill) {

  if (
    !Array.isArray(skill.evidence)
  ) {
    skill.evidence = [];
  }

  if (
    !Array.isArray(skill.capabilities) ||
    skill.capabilities.length === 0
  ) {

    return `
      <p>
        Add capabilities first to attach evidence.
      </p>
    `;
  }

  return `
    <div class="evidence-list">

      ${
        skill.capabilities
          .map(capability => {

            const evidence =
              skill.evidence.find(
                item =>
                  item.capabilityId ===
                  capability.id
              );

            return renderCapabilityEvidence(
              skill,
              capability,
              evidence
            );

          })
          .join("")
      }

    </div>
  `;
}


function renderCapabilityEvidence(
  skill,
  capability,
  evidence
) {

  if (!evidence) {

    return `
      <div class="evidence-item">

        <p>
          <strong>
            ${escapeHTML(
              capability.title
            )}
          </strong>
        </p>

        <p>
          No evidence recorded.
        </p>

        <button
          class="add-evidence"
          data-skill="${skill.id}"
          data-capability="${capability.id}"
        >
          + Add Evidence
        </button>

      </div>
    `;
  }

  return `
    <div class="evidence-item">

      <p>
        <strong>
          ${escapeHTML(
            capability.title
          )}
        </strong>
      </p>

      <p>
        Type:
        <strong>
          ${escapeHTML(
            evidence.type
          )}
        </strong>
      </p>

      <p>
        <strong>
          ${escapeHTML(
            evidence.title
          )}
        </strong>
      </p>

      <p>
        ${escapeHTML(
          evidence.description
        )}
      </p>

      ${
        evidence.projectId
          ? renderEvidenceProject(
              evidence.projectId
            )
          : ""
      }

      ${
        evidence.url
          ? `
            <p>
              Link:
              <a
                href="${escapeHTML(
                  evidence.url
                )}"
                target="_blank"
                rel="noopener noreferrer"
              >
                ${escapeHTML(
                  evidence.url
                )}
              </a>
            </p>
          `
          : ""
      }

      <div class="evidence-actions">

        <button
          class="edit-evidence"
          data-skill="${skill.id}"
          data-capability="${capability.id}"
          data-evidence="${evidence.id}"
        >
          Edit
        </button>

        <button
          class="delete-evidence"
          data-skill="${skill.id}"
          data-capability="${capability.id}"
          data-evidence="${evidence.id}"
        >
          Delete
        </button>

      </div>

    </div>
  `;
}


function renderEvidenceProject(
  projectId
) {

  const project =
    state.projects.find(
      project =>
        project.id === projectId
    );

  if (!project) {

    return `
      <p>
        Project: Unknown project
      </p>
    `;
  }

  return `
    <p>
      Project:
      <strong>
        ${escapeHTML(
          project.name
        )}
      </strong>
    </p>
  `;
}


function addEvidence(
  skill,
  capability
) {

  if (
    !Array.isArray(
      skill.evidence
    )
  ) {
    skill.evidence = [];
  }


  /*
   * One evidence item per capability.
   */

  const existingEvidence =
    skill.evidence.find(
      evidence =>
        evidence.capabilityId ===
        capability.id
    );

  if (existingEvidence) {

    alert(
      "This capability already has evidence.\n\n" +
      "Edit or delete the existing evidence first."
    );

    return;
  }


  /*
   * TYPE
   */

  const typeChoice =
    prompt(
      "Evidence type:\n\n" +
      "1. Project\n" +
      "2. Link\n" +
      "3. Document\n" +
      "4. Achievement\n" +
      "5. Note\n" +
      "6. Artifact\n\n" +
      "Enter a number from 1 to 6:"
    );

  if (typeChoice === null) {
    return;
  }

  const type =
    EVIDENCE_TYPES[
      Number(
        typeChoice.trim()
      )
    ];

  if (!type) {

    alert(
      "Invalid evidence type."
    );

    return;
  }


  /*
   * TITLE
   */

  const title =
    prompt(
      "Evidence title:"
    );

  if (title === null) {
    return;
  }

  if (!title.trim()) {

    alert(
      "Evidence title cannot be empty."
    );

    return;
  }


  /*
   * DESCRIPTION
   */

  const description =
    prompt(
      "Evidence description:"
    );

  if (description === null) {
    return;
  }

  if (!description.trim()) {

    alert(
      "Evidence description cannot be empty."
    );

    return;
  }


  /*
   * OPTIONAL PROJECT
   */

  let projectId = null;

  if (type === "Project") {

    const availableProjects =
      state.projects.filter(
        project =>
          !project.archived
      );

    if (
      availableProjects.length === 0
    ) {

      alert(
        "No projects are available."
      );

      return;
    }

    const projectOptions =
      availableProjects
        .map(
          (project, index) =>
            `${index + 1}. ${project.name}`
        )
        .join("\n");

    const projectChoice =
      prompt(
        "Select project:\n\n" +
        projectOptions
      );

    if (projectChoice === null) {
      return;
    }

    const projectIndex =
      Number(
        projectChoice.trim()
      ) - 1;

    const selectedProject =
      availableProjects[
        projectIndex
      ];

    if (!selectedProject) {

      alert(
        "Invalid project."
      );

      return;
    }

    projectId =
      selectedProject.id;
  }


  /*
   * OPTIONAL URL
   */

  let url = null;

  if (
    type === "Link" ||
    type === "Document" ||
    type === "Artifact"
  ) {

    const urlInput =
      prompt(
        "URL (optional):"
      );

    if (urlInput !== null) {

      url =
        urlInput.trim() ||
        null;
    }
  }


  /*
   * CREATE
   */

  skill.evidence.push({

    id:
      crypto.randomUUID(),

    capabilityId:
      capability.id,

    type:
      type,

    title:
      title.trim(),

    description:
      description.trim(),

    projectId:
      projectId,

    url:
      url,

    createdAt:
      Date.now()

  });

  saveData(state);

  openedSkill =
    skill.id;

  renderSkills(
    document.getElementById("app")
  );
}


function editEvidence(
  skill,
  evidence
) {

  const title =
    prompt(
      "Evidence title:",
      evidence.title
    );

  if (title === null) {
    return;
  }

  if (!title.trim()) {

    alert(
      "Evidence title cannot be empty."
    );

    return;
  }


  const description =
    prompt(
      "Evidence description:",
      evidence.description
    );

  if (description === null) {
    return;
  }

  if (!description.trim()) {

    alert(
      "Evidence description cannot be empty."
    );

    return;
  }


  evidence.title =
    title.trim();

  evidence.description =
    description.trim();


  /*
   * URL remains editable for URL-based
   * evidence types.
   */

  if (
    evidence.type === "Link" ||
    evidence.type === "Document" ||
    evidence.type === "Artifact"
  ) {

    const url =
      prompt(
        "URL (optional):",
        evidence.url || ""
      );

    if (url !== null) {

      evidence.url =
        url.trim() ||
        null;
    }
  }

  saveData(state);

  openedSkill =
    skill.id;

  renderSkills(
    document.getElementById("app")
  );
}


function deleteEvidence(
  skill,
  evidence
) {

  const confirmed =
    confirm(
      `Delete evidence "${evidence.title}"?`
    );

  if (!confirmed) {
    return;
  }

  skill.evidence =
    skill.evidence.filter(
      existingEvidence =>
        existingEvidence.id !==
        evidence.id
    );

  saveData(state);

  openedSkill =
    skill.id;

  renderSkills(
    document.getElementById("app")
  );
}


/* =========================================================
   PRACTICE
   ========================================================= */

function getSkillSessions(
  skillId
) {

  return (
    Array.isArray(state.sessions)
      ? state.sessions
      : []
  ).filter(
    session =>
      session.skillId === skillId
  );
}


function getSkillPracticeTime(
  skillId
) {

  return getSkillSessions(
    skillId
  ).reduce(
    (total, session) =>
      total +
      (
        Number(
          session.duration
        ) || 0
      ),
    0
  );
}


function getSkillSessionCount(
  skillId
) {

  return getSkillSessions(
    skillId
  ).length;
}


function getSkillLastPracticed(
  skillId
) {

  const sessions =
    getSkillSessions(
      skillId
    );

  if (
    sessions.length === 0
  ) {
    return null;
  }

  const latest =
    sessions.reduce(
      (latest, session) => {

        if (
          !latest ||
          (
            Number(session.end) >
            Number(latest.end)
          )
        ) {
          return session;
        }

        return latest;
      },
      null
    );

  return latest
    ? latest.end
    : null;
}

function getWeekRangeHours(
  skillId,
  weeksAgo
) {

  const sessions =
    getSkillSessions(skillId);

  const now = new Date();

  const day = now.getDay();

  const mondayOffset =
    day === 0 ? -6 : 1 - day;

  const currentMonday =
    new Date(now);

  currentMonday.setDate(
    now.getDate() + mondayOffset
  );

  currentMonday.setHours(0, 0, 0, 0);

  const rangeStart =
    new Date(currentMonday);

  rangeStart.setDate(
    currentMonday.getDate() - (7 * weeksAgo)
  );

  const rangeEnd =
    new Date(rangeStart);

  rangeEnd.setDate(
    rangeStart.getDate() + 7
  );

  const total =
    sessions
      .filter(session => {

        const end =
          new Date(session.end);

        return (
          end >= rangeStart &&
          end < rangeEnd
        );

      })
      .reduce(
        (sum, session) =>
          sum + (Number(session.duration) || 0),
        0
      );

  return total / 3600000;

}


function getConsistencyDays(
  skillId
) {

  const sessions =
    getSkillSessions(skillId);

  const now = new Date();

  const cutoff =
    new Date(now);

  cutoff.setDate(
    now.getDate() - 6
  );

  cutoff.setHours(0, 0, 0, 0);

  const days = new Set();

  sessions.forEach(session => {

    const end =
      new Date(session.end);

    if (end >= cutoff) {

      days.add(
        end.toDateString()
      );

    }

  });

  return days.size;

}


function getStaleLevel(skill) {

  if (skill.status !== "Active") {
    return "none";
  }

  const lastPracticed =
    getSkillLastPracticed(skill.id);

  if (!lastPracticed) {
    return "none";
  }

  const daysSince =
    Math.floor(
      (Date.now() - lastPracticed) /
      (1000 * 60 * 60 * 24)
    );

  if (daysSince >= 60) {
    return "red";
  }

  if (daysSince >= 14) {
    return "yellow";
  }

  return "none";

}


function renderStaleIndicator(skill) {

  const level =
    getStaleLevel(skill);

  if (level === "none") {
    return "";
  }

  const label =
    level === "red"
      ? "Not practiced in 60+ days"
      : "Not practiced in 14+ days";

  return `
    <span
      class="stale-dot stale-${level}"
      title="${label}"
    ></span>
  `;

}


function renderPracticeTrend(skill) {

  const thisWeek =
    getWeekRangeHours(skill.id, 0);

  const lastWeek =
    getWeekRangeHours(skill.id, 1);

  const consistency =
    getConsistencyDays(skill.id);

  let direction = "flat";

  if (thisWeek > lastWeek) {
    direction = "up";
  } else if (thisWeek < lastWeek) {
    direction = "down";
  }

  const arrow =
    direction === "up"
      ? "↑"
      : direction === "down"
        ? "↓"
        : "→";

  return `
    <p>
      This week vs last week:
      <strong>
        ${thisWeek.toFixed(1)}h
        ${arrow}
        ${lastWeek.toFixed(1)}h
      </strong>
    </p>

    <p>
      Consistency:
      <strong>
        ${consistency} of last 7 days
      </strong>
    </p>
  `;

}


function renderStaleMessage(skill) {

  const level =
    getStaleLevel(skill);

  if (level === "none") {
    return "";
  }

  const lastPracticed =
    getSkillLastPracticed(skill.id);

  const daysSince =
    Math.floor(
      (Date.now() - lastPracticed) /
      (1000 * 60 * 60 * 24)
    );

  return `
    <p class="stale-message stale-${level}">
      Not practiced in ${daysSince} days.
    </p>
  `;

}

function formatSkillPracticeTime(
  ms
) {

  const totalSeconds =
    Math.floor(
      ms / 1000
    );

  const hours =
    Math.floor(
      totalSeconds / 3600
    );

  const minutes =
    Math.floor(
      (totalSeconds % 3600) / 60
    );

  if (hours > 0) {

    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {

    return `${minutes}m`;
  }

  return "0m";
}


/* =========================================================
   CAPABILITY PROGRESS / READINESS
   ========================================================= */

export function getCapabilityProgress(
  skill,
  level
) {

  const capabilities =
    (
      Array.isArray(
        skill.capabilities
      )
        ? skill.capabilities
        : []
    ).filter(
      capability =>
        capability.level === level
    );

  const demonstrated =
    capabilities.filter(
      capability =>
        capability.demonstrated === true
    );

  return {

    total:
      capabilities.length,

    demonstrated:
      demonstrated.length

  };
}


function getNextLevelReadiness(
  skill
) {

  const currentLevel =
    Number(skill.level);

  const targetLevel =
    Number(skill.targetLevel);

  const nextLevel =
    currentLevel + 1;


  /*
   * MAX LEVEL
   */

  if (
    nextLevel > 5
  ) {

    return {

      nextLevel:
        null,

      total:
        0,

      demonstrated:
        0,

      ready:
        false,

      reason:
        "max-level"

    };
  }


  /*
   * TARGET REACHED
   */

  if (
    targetLevel <= currentLevel
  ) {

    return {

      nextLevel:
        nextLevel,

      total:
        0,

      demonstrated:
        0,

      ready:
        false,

      reason:
        "target-reached"

    };
  }


  /*
   * NEXT LEVEL CAPABILITIES
   */

  const progress =
    getCapabilityProgress(
      skill,
      nextLevel
    );


  /*
   * NO CAPABILITIES
   */

  if (
    progress.total === 0
  ) {

    return {

      nextLevel:
        nextLevel,

      total:
        0,

      demonstrated:
        0,

      ready:
        false,

      reason:
        "no-capabilities"

    };
  }


  /*
   * FULL READINESS
   */

  const ready =
    progress.demonstrated ===
    progress.total;

  return {

    nextLevel:
      nextLevel,

    total:
      progress.total,

    demonstrated:
      progress.demonstrated,

    ready:
      ready,

    reason:
      ready
        ? "ready"
        : "capabilities-incomplete"

  };
}


/* =========================================================
   DATA SAFETY
   ========================================================= */

function ensureSkillData(
  skill
) {

  if (
    !Array.isArray(
      skill.capabilities
    )
  ) {

    skill.capabilities = [];
  }

  if (
    !Array.isArray(
      skill.evidence
    )
  ) {

    skill.evidence = [];
  }

  if (
    !Array.isArray(
      skill.levelHistory
    )
  ) {

    skill.levelHistory = [];
  }

  if (
    !Array.isArray(
      skill.relatedProjects
    )
  ) {

    skill.relatedProjects = [];
  }
}


/* =========================================================
   LOOKUP HELPERS
   ========================================================= */

function findSkill(
  skillId
) {

  return state.skills.find(
    skill =>
      skill.id === skillId
  );
}


function findCapability(
  skill,
  capabilityId
) {

  return (
    skill.capabilities || []
  ).find(
    capability =>
      capability.id ===
      capabilityId
  );
}


function findEvidence(
  skill,
  evidenceId
) {

  return (
    skill.evidence || []
  ).find(
    evidence =>
      evidence.id ===
      evidenceId
  );
}


/* =========================================================
   HTML SAFETY
   ========================================================= */

function escapeHTML(
  value
) {

  return String(value)
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}