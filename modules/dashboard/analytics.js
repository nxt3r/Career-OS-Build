import { state } from "../../core/state.js";


/*
 * TOTAL DEEP WORK
 *
 * Only actual Deep Work counts.
 */
export function getDeepWorkHours() {

  const total =
    state.sessions

      .filter(
        session =>
          session.category === "Deep Work"
      )

      .reduce(
        (sum, session) =>
          sum + session.duration,
        0
      );


  return total / 3600000;

}


/*
 * TOTAL FOCUS TIME
 *
 * Focus Time =
 * Deep Work + Study
 */
export function getTotalFocusHours() {

  const focusCategories = [
    "Deep Work",
    "Study"
  ];


  const total =
    state.sessions

      .filter(
        session =>
          focusCategories.includes(
            session.category
          )
      )

      .reduce(
        (sum, session) =>
          sum + session.duration,
        0
      );


  return total / 3600000;

}


/*
 * TODAY'S DISTRACTION TIME
 *
 * Scrolling + Gaming
 */
export function getTodayDistractionHours() {

  const today =
    new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );


  const distractionCategories = [
    "Scrolling",
    "Gaming"
  ];


  const total =
    state.sessions

      .filter(
        session => {

          const date =
            new Date(
              session.start
            );

          date.setHours(
            0,
            0,
            0,
            0
          );


          return (
            date.getTime() ===
              today.getTime() &&

            distractionCategories.includes(
              session.category
            )
          );

        }
      )

      .reduce(
        (sum, session) =>
          sum + session.duration,
        0
      );


  return total / 3600000;

}


/*
 * ACTIVE PROJECT COUNT
 */
export function getActiveProjects() {

  return state.projects.filter(
    project =>
      !project.archived &&
      project.status === "Active"
  ).length;

}


/*
 * FORMAT HOURS
 *
 * Example:
 * 14.53 → "14.5h"
 */
export function formatHours(hours) {

  return `${hours.toFixed(1)}h`;

}

/*
 * WEEKLY DEEP WORK
 */

export function getWeeklyDeepWork() {

  const today = new Date();

  const day = today.getDay();

  const mondayOffset =
    day === 0 ? -6 : 1 - day;

  const monday = new Date(today);

  monday.setDate(today.getDate() + mondayOffset);

  monday.setHours(0,0,0,0);

  const total =
    state.sessions

      .filter(session => {

        const date =
          new Date(session.start);

        return (
          date >= monday &&
          session.category === "Deep Work"
        );

      })

      .reduce(
        (sum,session)=>
          sum + session.duration,
        0
      );

  return total/3600000;

}