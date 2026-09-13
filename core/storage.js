const KEY = "careerOS";

const defaultData = {

  sessions: [],

  captures: [],

  projects: [

    {
      id: crypto.randomUUID(),

      name: "Career OS",

      description: "Build a personal operating system.",

      status: "Active",

      milestones: [

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

      ]

    },

    {
      id: crypto.randomUUID(),

      name: "Fixtional",

      description: "Remote computer solutions business.",

      status: "Planning",

      milestones: [

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

      ]

    }

  ],

  skills: [],

skillCategories: [
  "Technical",
  "Creative",
  "Business",
  "Other"
 ],

  tasks: [],

  weeklyGoals: {

    deepWork: 20,

    reelsLimit: 3

  }

};

export function loadData() {

  const raw = localStorage.getItem(KEY);

  if (raw) {
    return JSON.parse(raw);
  }

  localStorage.setItem(
    KEY,
    JSON.stringify(defaultData)
  );

  return defaultData;

}

export function saveData(data) {

  localStorage.setItem(
    KEY,
    JSON.stringify(data)
  );

}