import { loadData, saveData } from "./storage.js";

/*
 * ============================================================
 * CAREER OS — GLOBAL STATE
 * ============================================================
 *
 * Single source of truth for the application.
 *
 * Responsibilities:
 * - Load persisted data
 * - Initialize missing collections
 * - Run data migrations
 * - Save migrated state
 *
 * Core principle:
 * UI modules should read/write through state.
 * Do not duplicate persistent data elsewhere.
 * ============================================================
 */

export const state = loadData() || {};


/* ============================================================
   BASE STATE INITIALIZATION
   ============================================================ */

/*
 * Skills
 */
if (!Array.isArray(state.skills)) {
  state.skills = [];
}

/*
 * Skill categories
 */
if (!Array.isArray(state.skillCategories)) {
  state.skillCategories = [
    "Technical",
    "Creative",
    "Business",
    "Other"
  ];
}

/*
 * Tasks
 */
if (!Array.isArray(state.tasks)) {
  state.tasks = [];
}

/*
 * Projects
 */
if (!Array.isArray(state.projects)) {
  state.projects = [];
}

/*
 * Career Goals
 */
if (!Array.isArray(state.careerGoals)) {
  state.careerGoals = [];
}

/*
 * Sessions
 */
if (!Array.isArray(state.sessions)) {
  state.sessions = [];
}

/*
 * Captures
 */
if (!Array.isArray(state.captures)) {
  state.captures = [];
}

/*
 * Active timer
 */
if (!("activeTimer" in state)) {
  state.activeTimer = null;
}


/* ============================================================
   SKILLS OS — CAPABILITY + EVIDENCE MIGRATION
   ============================================================ */

/*
 * Every skill must have:
 *
 * capabilities
 * evidence
 * levelHistory
 *
 * Older skills may not have these properties,
 * so we safely migrate them.
 */

state.skills.forEach(skill => {

  /*
   * Capability Framework
   */
  if (!Array.isArray(skill.capabilities)) {
    skill.capabilities = [];
  }

  /*
   * Evidence System
   */
  if (!Array.isArray(skill.evidence)) {
    skill.evidence = [];
  }

  /*
   * Level History
   *
   * Added for Skills OS 3.4.4
   *
   * IMPORTANT:
   * Existing skills receive an empty history.
   * We do NOT create fake historical promotions.
   */
  if (!Array.isArray(skill.levelHistory)) {
    skill.levelHistory = [];
  }

  /*
   * Capability demonstration state
   *
   * Older capabilities may not contain
   * demonstrated yet.
   */
    skill.capabilities.forEach(capability => {

    if (typeof capability.demonstrated !== "boolean") {
      capability.demonstrated = false;
    }

    if (!("demonstratedAt" in capability)) {

      /*
       * Same honest caveat as milestones/roadmap
       * stages: we do NOT backfill a fake date for
       * already-demonstrated capabilities.
       */

      capability.demonstratedAt = null;

    }

  });

});


/* ============================================================
   CAREER GOALS MIGRATION
   ============================================================ */

/*
 * Every career goal must have:
 *
 * requiredSkillIds
 * roadmap
 *
 * Safely migrate older/incomplete entries.
 */

state.careerGoals.forEach(goal => {

  if (!Array.isArray(goal.requiredSkillIds)) {
    goal.requiredSkillIds = [];
  }

  if (!Array.isArray(goal.roadmap)) {
    goal.roadmap = [];
  }

  if (!Array.isArray(goal.relatedProjects)) {
    goal.relatedProjects = [];
  }

  goal.roadmap.forEach(stage => {

    if (!("completedAt" in stage)) {

      stage.completedAt = null;

    }

  });

});


/* ============================================================
   PROJECT ID MIGRATION
   ============================================================ */

/*
 * Older versions of Career OS used numeric project IDs.
 *
 * Convert them to UUIDs so IDs are consistent.
 */

state.projects.forEach(project => {

  if (typeof project.id === "number") {
    project.id = crypto.randomUUID();
  }

});


/* ============================================================
   DEVELOPMENT DATA — PROJECT MILESTONES
   ============================================================ */

/*
 * Existing projects may not have milestone data.
 *
 * Add the structure without deleting:
 * - existing projects
 * - sessions
 * - captures
 * - other project data
 */

state.projects.forEach(project => {

  if (!Array.isArray(project.milestones)) {

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


  /*
   * COMPLETED-AT MIGRATION
   *
   * Older milestones may not have a
   * completedAt timestamp. We do NOT
   * backfill a fake date for already-done
   * milestones — their completion time
   * is genuinely unknown.
   */

  project.milestones.forEach(milestone => {

    if (!("completedAt" in milestone)) {

      milestone.completedAt =
        milestone.done
          ? null
          : null;

    }

  });

});


/* ============================================================
   SAVE MIGRATED STATE
   ============================================================ */

/*
 * This makes all migrations persistent.
 *
 * Example:
 * An old skill gets levelHistory = []
 * → saveData()
 * → next page load keeps the new structure.
 */

saveData(state);