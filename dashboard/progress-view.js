window.renderPhotoMemoryProgress = function(history, error = '') {
  const get = id => document.getElementById(id);
  const safe = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const range = Number(get('progress-range').value);
  const a = PhotoMemoryInsights.summarize(history, { days: range });
  get('history-load-status').hidden = !error;
  get('history-load-status').textContent = error;
  const number = value => value == null ? '—' : Math.round(value).toLocaleString();
  get('progress-latest').textContent = error ? '—' : number(a.latest?.totalScore);
  get('progress-change').innerHTML = a.delta == null || error ? '—' : `${a.delta>0?'+':''}${number(a.delta)} <small>pts</small>`;
  get('progress-change-note').textContent = a.delta == null ? 'Complete 4 tests to see a trend' : `Last ${a.windowSize} tests vs. previous ${a.windowSize}`;
  get('progress-days').innerHTML = error ? '—' : `${a.activeDays} <small>/ 28</small>`;
  get('metric-tests').textContent = error ? '—' : a.count;
  get('progress-best').textContent = a.best == null ? 'Your personal best will appear here' : `Best in this view: ${number(a.best)} points`;
  get('progress-chart-note').textContent = 'Test number on the horizontal axis · score out of 1,240. Showing up to 30 recent tests.';
  const points = a.tests.slice(-30);
  if(!points.length || error) {
    get('progress-chart').innerHTML = `<div class="progress-empty">${error ? 'Progress is temporarily unavailable.' : range ? 'No dated tests in this period. Try All tests.' : 'Your first completed test starts the story.<br>Take an assessment in the Photo Memory app.'}</div>`;
  } else {
    const coords = points.map((p,i)=>[48+(points.length===1?.5:i/(points.length-1))*560,218-p.totalScore/1240*185]);
    const ticks = [0,310,620,930,1240].map(n=>`<line class="gridline" x1="48" y1="${218-n/1240*185}" x2="608" y2="${218-n/1240*185}"/><text x="38" y="${222-n/1240*185}" text-anchor="end">${n}</text>`).join('');
    const dots = coords.map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="4"><title>Test ${points[i].ordinal}: ${points[i].totalScore} points</title></circle>`).join('');
    const path = coords.map(([x,y],i)=>`${i?'L':'M'}${x},${y}`).join(' ');
    get('progress-chart').innerHTML = `<svg class="progress-chart" viewBox="0 0 630 250" role="img" aria-label="${safe(points.map(p=>`Test ${p.ordinal}: ${p.totalScore} points`).join('; '))}"><defs><linearGradient id="progress-fill" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#89b7a1" stop-opacity=".25"/><stop offset="1" stop-color="#89b7a1" stop-opacity="0"/></linearGradient></defs>${ticks}<path d="${path} L${coords.at(-1)[0]},218 L${coords[0][0]},218 Z" fill="url(#progress-fill)"/><path class="trace" d="${path}"/>${dots}<text x="48" y="244">Test ${points[0].ordinal}</text><text x="608" y="244" text-anchor="end">Test ${points.at(-1).ordinal}</text></svg>`;
  }
  get('progress-skills').innerHTML = a.skills.map(s=>`<div class="skill-row ${s.name===a.focus?.name?'is-focus':''}"><div class="skill-topline"><span>${safe(s.name)}</span><span>${s.percent==null?'—':Math.round(s.percent)+'%'}</span></div><div class="skill-meter" role="img" aria-label="${safe(s.name)}: ${s.percent==null?'no results':Math.round(s.percent)+' percent'}"><span style="width:${s.percent||0}%"></span></div></div>`).join('');
  get('progress-calendar').innerHTML = a.calendar.map(d=>`<div class="calendar-day" data-count="${d.count>1?'many':d.count}" title="${d.key}: ${d.count} tests" role="img" aria-label="${d.key}: ${d.count} tests"></div>`).join('');
  get('progress-date-note').textContent = a.undated ? `${a.undated} older tests have no recorded date. They appear in All tests, but cannot be placed on this calendar.` : 'Each filled day has at least one completed test. New results appear after syncing from the app.';
  const suggestions = {
    'Visual Memory':'Try Active Objects, then take another full test to see how your visual recall changes.',
    'Spatial Memory':'Practice Ordered Squares or Line It Up. Focus on position before speed.',
    'Short-Term Memory':'Try Words List. Use short groups of words and build up gradually.',
    'Associative Memory':'Practice People mode. Create one memorable association for each name.',
    'Working Memory':'Try Number Chain. Start at a comfortable length and add one step at a time.'
  };
  get('progress-focus-title').textContent = a.focus ? `Make room for ${a.focus.name.toLowerCase()}` : 'Build your starting point';
  get('progress-focus-copy').textContent = a.focus ? suggestions[a.focus.name] : 'Complete 3 full tests to reveal a practice focus based on your own results.';
  get('progress-focus-note').textContent = a.focus ? `Your lowest average relative to the skill maximum, across ${a.focus.samples} recent tests. Retest under similar conditions.` : 'Your results are compared with your own earlier sessions.';
};
