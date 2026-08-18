export function getWeekSessions(sessions){

  const now = new Date();

  const start = new Date(now);

  start.setDate(now.getDate() - now.getDay());

  start.setHours(0,0,0,0);

  return sessions.filter(session => session.start >= start.getTime());

}

export function hoursByCategory(sessions, category){

  const total = sessions
    .filter(s => s.category === category)
    .reduce((sum,s)=> sum + s.duration,0);

  return +(total / 3600000).toFixed(1);

}

export function totalHours(sessions){

  const total = sessions.reduce((sum,s)=> sum+s.duration,0);

  return +(total/3600000).toFixed(1);

}