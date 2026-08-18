{`const KEY = "careerOS";

export function loadData(){

    const raw = localStorage.getItem(KEY);

    if(raw) return JSON.parse(raw);

    const fresh = {

        sessions:[],
        projects:[],
        skills:[],
        tasks:[],
        weeklyGoals:{}

    };

    saveData(fresh);

    return fresh;

}

export function saveData(data){
    localStorage.setItem(KEY, JSON.stringify(data));
}`}