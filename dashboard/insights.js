/* Shared, deterministic analytics. Missing dates remain unknown; login streak is not training. */
(function (root) {
  const SKILLS = { 'Visual Memory': 340, 'Spatial Memory': 240, 'Short-Term Memory': 280, 'Associative Memory': 280, 'Working Memory': 100 };
  const TOTAL = Object.values(SKILLS).reduce((a, b) => a + b, 0);
  const valid = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;
  function dateOf(test) {
    if (!test?.completedAtUtc) return null;
    const date = new Date(test.completedAtUtc);
    return Number.isNaN(+date) ? null : date;
  }
  function dayKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  }
  function summarize(history = [], { days = 0, now = new Date() } = {}) {
    const cutoff = new Date(now); cutoff.setHours(0,0,0,0); cutoff.setDate(cutoff.getDate() - Math.max(0, days - 1));
    const all = history.map((test, index) => ({ ...test, ordinal: index + 1, date: dateOf(test) }))
      .filter(test => valid(test.totalScore) && test.totalScore <= TOTAL);
    const tests = all.filter(test => !days || (test.date && test.date >= cutoff && test.date <= now));
    const mean = values => values.length ? values.reduce((a,b) => a+b,0) / values.length : null;
    const size = Math.min(5, Math.floor(tests.length / 2));
    const latest = tests.at(-1) || null;
    const recentMean = size >= 2 ? mean(tests.slice(-size).map(t => t.totalScore)) : null;
    const priorMean = size >= 2 ? mean(tests.slice(-2*size, -size).map(t => t.totalScore)) : null;
    const skillRows = Object.entries(SKILLS).map(([name,max]) => {
      const scores = tests.slice(-5).map(t => t.scores?.find(s => s.category === name)?.score).filter(v => valid(v) && v <= max);
      return { name, max, samples: scores.length, percent: scores.length ? mean(scores) / max * 100 : null };
    });
    const focus = skillRows.every(s => s.samples >= 3) ? [...skillRows].sort((a,b) => a.percent-b.percent)[0] : null;
    const calendar = [];
    for(let i=27;i>=0;i--) {
      const date = new Date(now); date.setHours(0,0,0,0); date.setDate(date.getDate()-i);
      const key = dayKey(date);
      calendar.push({ key, count: all.filter(t => t.date && t.date <= now && dayKey(t.date) === key).length });
    }
    const matches = tests.length;
    return { tests, latest, count: matches, total: TOTAL, average: mean(tests.map(t => t.totalScore)),
      best: matches ? Math.max(...tests.map(t => t.totalScore)) : null,
      delta: size >= 2 ? recentMean-priorMean : null, windowSize: size,
      skills: skillRows, focus, calendar, activeDays: calendar.filter(d => d.count).length,
      undated: all.filter(t => !t.date).length };
  }
  root.PhotoMemoryInsights = { summarize, dateOf, dayKey, SKILLS, TOTAL };
})(typeof window === 'undefined' ? globalThis : window);
