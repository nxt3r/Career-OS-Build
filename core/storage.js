const KEY = "careerOS";

const defaultData = {
  sessions: [],
  projects: [
    { id: 1, name: "Career OS" },
    { id: 2, name: "Fixtional" },
    { id: 3, name: "React Learning" }
  ],
  skills: [],
  tasks: [],
  weeklyGoals: {
    deepWork: 20,
    reelsLimit: 3
  }
};

export function loadData() {
  const raw = localStorage.getItem(KEY);

  if (raw) return JSON.parse(raw);

  localStorage.setItem(KEY, JSON.stringify(defaultData));
  return defaultData;
}

export function saveData(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}