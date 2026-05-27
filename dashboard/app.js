const SUPABASE_URL = 'https://kzeeojfmvrvleahzdmnl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6ZWVvamZtdnJ2bGVhaHpkbW5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzODczNTIsImV4cCI6MjA2NDk2MzM1Mn0.CapusMv9ApAWBDNA0ZQALdQ0RPWSeLeOcw61k06OXbs';
const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const HIGHSCORE_FIELDS = {
  numbers_easy_hs: 'Numbers Easy',
  numbers_medium_hs: 'Numbers Medium',
  numbers_hard_hs: 'Numbers Hard',
  numbers_guessing_hs: 'Number Guess',
  colors_hs_0: 'Colors I',
  colors_hs_1: 'Colors II',
  colors_hs_2: 'Colors III',
  colors_hs_3: 'Colors IV',
  words_hs_0: 'Words I',
  words_hs_1: 'Words II',
  words_hs_2: 'Words III',
  people_hs_0: 'People I',
  people_hs_1: 'People II',
  people_hs_2: 'People III',
  highscore_0: 'Active Squares',
  highscore_1: 'Active Objects',
  highscore_2: 'Ordered Squares',
  highscore_3: 'Words List',
  highscore_4: 'Number Chain',
  highscore_5: 'Image Color',
  lbs_highscore: 'Lightbulb Sequence',
  party_mode_score: 'Party Mode'
};

const HIGHSCORE_ICONS = {
  highscore_3: '../assets/Group%20183.png',
  highscore_4: '../assets/Group%20184.png',
  highscore_0: '../assets/Group%20185.png',
  highscore_2: '../assets/Group%20186.png',
  highscore_5: '../assets/Group%20187.png',
  highscore_1: '../assets/Group%20188.png',
  lbs_highscore: '../assets/Group%20203.png'
};

const MEMORY_TYPE_SCORE_FIELDS = Object.keys(HIGHSCORE_ICONS);
const HIGHSCORE_GROUPS = [
  {
    id: 'memory-types',
    eyebrow: 'Memory type-based games',
    title: 'Visual memory modes',
    fields: MEMORY_TYPE_SCORE_FIELDS
  },
  {
    id: 'party',
    eyebrow: 'Classics',
    title: 'Party modes',
    fields: ['party_mode_score']
  },
  {
    id: 'numbers',
    eyebrow: 'Classics',
    title: 'Number memory',
    fields: ['numbers_easy_hs', 'numbers_medium_hs', 'numbers_hard_hs', 'numbers_guessing_hs']
  },
  {
    id: 'words',
    eyebrow: 'Classics',
    title: 'Word memory',
    fields: ['words_hs_0', 'words_hs_1', 'words_hs_2']
  },
  {
    id: 'colors',
    eyebrow: 'Classics',
    title: 'Color memory',
    fields: ['colors_hs_0', 'colors_hs_1', 'colors_hs_2', 'colors_hs_3']
  },
  {
    id: 'people',
    eyebrow: 'Classics',
    title: 'People memory',
    fields: ['people_hs_0', 'people_hs_1', 'people_hs_2']
  }
];
const LEADERBOARD_PAGE_SIZE = 15;

const ADMIN_TABS = new Set(['users', 'mail', 'notifications', 'daily', 'contextual']);

const state = {
  session: null,
  otpEmail: '',
  currentProfile: null,
  scoresHistory: [],
  leaderboardUsers: [],
  leaderboardError: '',
  leaderboardPage: 1,
  leaderboardSearch: '',
  leaderboardSortField: 'rank',
  leaderboardSortDirection: 'asc',
  comparisonUserId: '',
  comparisonUser: null,
  comparisonEmail: '',
  isAdmin: false,
  adminUsers: [],
  adminUsersPage: 1,
  adminUsersLimit: 25,
  dailyChallenges: [],
  contextualLevels: [],
  selectedUserIds: new Set(),
  mailRecipientOverrides: null,
  mailManualEmails: [],
  notificationRecipientOverrides: null,
  recipientDialogContext: '',
  recipientDraft: null,
  dialogUserId: null,
  activeTab: 'overview'
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function makeId(prefix) {
  const id = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${id}`;
}

function formatDate(value) {
  if (!value) return 'Not recorded';
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function localDateTimeToIso(value) {
  return value ? new Date(value).toISOString() : null;
}

function setBusy(button, busy, label) {
  if (!button) return;
  if (busy) {
    if (!button.dataset.originalLabel) {
      button.dataset.originalLabel = button.textContent;
    }
    button.textContent = label || 'Working...';
    button.disabled = true;
  } else {
    button.textContent = button.dataset.originalLabel || button.textContent;
    button.disabled = false;
    delete button.dataset.originalLabel;
  }
}

function toast(message, danger = false) {
  const toastEl = $('#toast');
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.style.background = danger ? '#d93d2f' : '#191816';
  toastEl.hidden = false;
  window.clearTimeout(toastEl._timer);
  toastEl._timer = window.setTimeout(() => {
    toastEl.hidden = true;
  }, 4200);
}

async function api(action, payload = {}) {
  const session = state.session || (await client.auth.getSession()).data.session;
  if (!session?.access_token) {
    throw new Error(`${action}: Login required.`);
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-api`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ action, ...payload })
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (_error) {
    data = null;
  }

  if (!response.ok || data?.error) {
    const details = data.details ? ` (${data.details})` : '';
    const message = data?.error || data?.message || text || `HTTP ${response.status}`;
    throw new Error(`${data?.action || action}: ${message}${details}`);
  }

  return data;
}

function calculateAverageScore(user) {
  const values = Object.keys(HIGHSCORE_FIELDS)
    .map((field) => Number(user?.[field] || 0))
    .filter((score) => score > 0);

  if (!values.length) return 0;
  return Math.round(values.reduce((sum, score) => sum + score, 0) / values.length);
}

function countScoredGames(user) {
  return Object.keys(HIGHSCORE_FIELDS)
    .map((field) => Number(user?.[field] || 0))
    .filter((score) => score > 0).length;
}

function uniqueLeaderboardUsers() {
  const usersById = new Map();

  [
    ...(state.leaderboardUsers || []),
    state.currentProfile,
    state.comparisonUser
  ].forEach((user) => {
    if (!user?.id) return;
    usersById.set(user.id, {
      ...(usersById.get(user.id) || {}),
      ...user
    });
  });

  return Array.from(usersById.values());
}

function getRankedLeaderboard() {
  return uniqueLeaderboardUsers()
    .map((user) => ({
      ...user,
      name: getUserName(user),
      score: calculateAverageScore(user),
      testCount: Number(user.total_tests || user.test_count || countScoredGames(user))
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.testCount !== a.testCount) return b.testCount - a.testCount;
      return a.name.localeCompare(b.name);
    })
    .map((user, index) => ({
      ...user,
      rank: index + 1
    }));
}

function getCurrentRank() {
  const ranked = getRankedLeaderboard();
  const index = ranked.findIndex((user) => user.id === state.currentProfile?.id);
  return index === -1 ? null : index + 1;
}

function getComparisonUser() {
  if (!state.comparisonUserId) return null;
  return state.leaderboardUsers.find((user) => user.id === state.comparisonUserId) || state.comparisonUser || null;
}

function getUserName(user) {
  return user?.username || user?.email?.split('@')[0] || 'Unnamed user';
}

function matchesLeaderboardSearch(user, query) {
  if (!query) return true;

  return [
    user.name,
    user.username,
    user.email,
    user.id
  ].some((value) => String(value || '').toLowerCase().includes(query));
}

function sortLeaderboardRows(rows) {
  const field = state.leaderboardSortField || 'rank';
  const direction = state.leaderboardSortDirection === 'desc' ? -1 : 1;

  return [...rows].sort((a, b) => {
    if (field === 'name') {
      const result = a.name.localeCompare(b.name);
      return result * direction || a.rank - b.rank;
    }

    const aValue = Number(a[field] || 0);
    const bValue = Number(b[field] || 0);
    if (aValue !== bValue) return (aValue - bValue) * direction;
    return a.rank - b.rank;
  });
}

function sortIndicator(field) {
  if (state.leaderboardSortField !== field) return '';
  return state.leaderboardSortDirection === 'asc' ? 'up' : 'down';
}

function isVerified(user) {
  return Boolean(user.email_confirmed_at);
}

function isBlocked(user) {
  return Boolean(user.is_blocked || user.banned_until);
}

function profileColumns() {
  return [
    'id',
    'username',
    'is_pro',
    'current_streak',
    'longest_streak',
    'created_at',
    'role',
    'is_blocked',
    ...Object.keys(HIGHSCORE_FIELDS)
  ].join(',');
}

function legacyProfileColumns() {
  return [
    'id',
    'username',
    'is_pro',
    'current_streak',
    'longest_streak',
    ...Object.keys(HIGHSCORE_FIELDS)
  ].join(',');
}

function leaderboardColumns() {
  return [
    'id',
    'username',
    'current_streak',
    'longest_streak',
    ...Object.keys(HIGHSCORE_FIELDS)
  ].join(',');
}

function isMissingDatabaseObjectError(error) {
  const message = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`;
  return error?.code === '42P01' || /not found|does not exist|schema cache/i.test(message);
}

async function fileToUploadPayload(file) {
  if (!file) return null;
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  return {
    name: file.name,
    type: file.type || 'application/octet-stream',
    dataUrl
  };
}

async function loadCurrentProfile() {
  const user = state.session?.user;
  if (!user) return null;

  let { data, error } = await client
    .from('user_profiles')
    .select(profileColumns())
    .eq('id', user.id)
    .maybeSingle();

  if (error && isMissingDatabaseObjectError(error)) {
    const legacyResult = await client
      .from('user_profiles')
      .select(legacyProfileColumns())
      .eq('id', user.id)
      .maybeSingle();

    data = legacyResult.data;
    error = legacyResult.error;
  }

  if (error) {
    toast(`Could not load your profile: ${error.message}`, true);
  }

  const profile = {
    ...(data || {}),
    id: user.id,
    email: user.email,
    email_confirmed_at: user.email_confirmed_at || user.confirmed_at,
    role: data?.role || 'user'
  };

  state.currentProfile = profile;
  state.isAdmin = profile.role === 'admin' && !profile.is_blocked;
  return profile;
}

async function loadScoresHistory() {
  state.scoresHistory = [];
  const userId = state.session?.user?.id;
  if (!userId) return;

  const { data: files, error: listError } = await client.storage
    .from('user-data')
    .list(userId, { limit: 1, search: 'test_history.json' });

  if (listError || !files?.some((file) => file.name === 'test_history.json')) return;

  const { data: blob, error } = await client.storage.from('user-data').download(`${userId}/test_history.json`);
  if (error) return;

  try {
    const parsed = JSON.parse(await blob.text());
    state.scoresHistory = Array.isArray(parsed?.scoresHistory) ? parsed.scoresHistory : [];
  } catch (_error) {
    state.scoresHistory = [];
  }
}

async function loadLeaderboardData() {
  const rows = [];
  const pageSize = 1000;
  let from = 0;
  state.leaderboardError = '';
  let source = 'leaderboard_profiles';

  while (true) {
    const { data, error } = await client
      .from(source)
      .select(leaderboardColumns())
      .range(from, from + pageSize - 1);

    if (error) {
      if (source === 'leaderboard_profiles' && isMissingDatabaseObjectError(error)) {
        source = 'user_profiles';
        rows.length = 0;
        from = 0;
        continue;
      }

      state.leaderboardError = `Could not load leaderboard: ${error.message}`;
      state.leaderboardUsers = state.currentProfile ? [state.currentProfile] : [];
      return;
    }

    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
    from += pageSize;
  }

  state.leaderboardUsers = rows;
}

async function loadLeaderboardProfileById(userId) {
  if (!userId) return null;

  const existing = state.leaderboardUsers.find((user) => user.id === userId);
  if (existing) return existing;

  const { data, error } = await client
    .from('user_profiles')
    .select(leaderboardColumns())
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function lookupComparisonProfile(email) {
  const { data, error } = await client
    .rpc('lookup_leaderboard_profile_by_email', { email_to_find: email })
    .maybeSingle();

  if (!error) return data;

  const missingNewLookup = isMissingDatabaseObjectError(error)
    || /lookup_leaderboard_profile_by_email|404/i.test(`${error.message || ''} ${error.details || ''}`);

  if (!missingNewLookup) throw error;

  const { data: legacyData, error: legacyError } = await client
    .rpc('lookup_user_by_email', { email_to_find: email })
    .maybeSingle();

  if (legacyError) {
    const missingLegacyLookup = isMissingDatabaseObjectError(legacyError)
      || /lookup_user_by_email|404/i.test(`${legacyError.message || ''} ${legacyError.details || ''}`);

    if (missingLegacyLookup) {
      throw new Error('Email comparison lookup is not deployed yet. Run the latest Supabase migration.');
    }

    throw legacyError;
  }

  if (!legacyData?.id) return null;

  const profile = await loadLeaderboardProfileById(legacyData.id);
  return { ...(profile || {}), ...legacyData };
}

async function loadUserDashboard() {
  await loadCurrentProfile();
  await Promise.all([loadScoresHistory(), loadLeaderboardData()]);
  renderShell();
  renderUserOverview();
  renderHistory();
  renderHighscores();
  renderLeaderboard();
  renderAdminGate();
}

async function loadAdminDashboard() {
  if (!state.isAdmin) return;

  const [userResult, dailyResult, contextualResult] = await Promise.all([
    api('listUsers'),
    api('listDailyChallenges'),
    api('listContextualLevels')
  ]);

  state.adminUsers = userResult.users || [];
  state.dailyChallenges = dailyResult.challenges || [];
  state.contextualLevels = contextualResult.levels || [];
  renderUsers();
  renderDailyList();
  renderContextualList();
}

async function refreshAll() {
  const refreshBtn = $('#refresh-btn');
  setBusy(refreshBtn, true, 'Refreshing...');

  try {
    await loadUserDashboard();
    if (state.isAdmin) await loadAdminDashboard();
    toast('Dashboard refreshed.');
  } catch (error) {
    toast(error.message, true);
  } finally {
    setBusy(refreshBtn, false);
  }
}

function renderShell() {
  const profile = state.currentProfile || {};
  $('#admin-email').textContent = profile.email || '';
  $('#admin-name').textContent = getUserName(profile);
  $('#admin-role').textContent = state.isAdmin ? 'Admin' : (profile.is_pro ? 'Pro player' : 'Player');
}

function renderAdminGate() {
  $$('[data-admin-only]').forEach((element) => {
    element.hidden = !state.isAdmin;
  });

  if (!state.isAdmin && ADMIN_TABS.has(state.activeTab)) {
    switchTab('overview');
  }
}

function topScores(limit = 6) {
  return Object.entries(HIGHSCORE_FIELDS)
    .map(([field, label]) => ({ field, label, score: Number(state.currentProfile?.[field] || 0) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function highscoreIconFallback(field) {
  return (HIGHSCORE_FIELDS[field] || '?')
    .split(/\s+/)
    .map((word) => word[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function renderHighscoreIcon(field, size = '') {
  const src = HIGHSCORE_ICONS[field];
  if (!src) return '';
  const sizeClass = size ? ` ${size}` : '';
  return `
    <span class="highscore-icon-frame${sizeClass}" data-icon-fallback="${escapeHtml(highscoreIconFallback(field))}" aria-hidden="true">
      <img class="highscore-icon${sizeClass}" src="${src}" alt="" onerror="this.closest('.highscore-icon-frame').classList.add('missing-icon'); this.remove();" />
    </span>
  `;
}

function renderUserOverview() {
  const profile = state.currentProfile || {};
  $('#metric-current-streak').textContent = Number(profile.current_streak || 0);
  $('#metric-longest-streak').textContent = Number(profile.longest_streak || 0);
  $('#metric-average-score').textContent = calculateAverageScore(profile);
  $('#metric-tests').textContent = state.scoresHistory.length;

  const recent = [...state.scoresHistory].slice(-5).reverse();
  $('#recent-tests-list').innerHTML = recent.map((test, index) => `
    <div class="compact-item">
      <div>
        <strong>Test ${state.scoresHistory.length - index}</strong>
        <small>Total score: ${Number(test.totalScore || 0)}</small>
      </div>
      <span class="pill">${Number(test.scores?.length || 0)} skills</span>
    </div>
  `).join('') || '<p class="muted">No test history yet.</p>';

  $('#top-highscores-list').innerHTML = topScores().map((item) => `
    <div class="compact-item ${HIGHSCORE_ICONS[item.field] ? 'highscore-compact-item' : ''}">
      ${renderHighscoreIcon(item.field, 'small')}
      <div>
        <strong>${escapeHtml(item.label)}</strong>
        <small>Personal best</small>
      </div>
      <span class="pill good">${item.score}</span>
    </div>
  `).join('') || '<p class="muted">Play a few games to fill this in.</p>';
}

function renderHistory() {
  const reversed = [...state.scoresHistory].reverse();
  $('#history-list').innerHTML = reversed.map((test, index) => {
    const testNumber = state.scoresHistory.length - index;
    const skills = (test.scores || []).map((skill) => `
      <span class="pill">${escapeHtml(skill.category || 'Skill')}: ${Number(skill.score || 0)}</span>
    `).join('');

    return `
      <div class="compact-item history-item">
        <div>
          <strong>Test ${testNumber} - ${Number(test.totalScore || 0)}</strong>
          <small>${skills || 'No skill breakdown stored'}</small>
        </div>
      </div>
    `;
  }).join('') || '<p class="muted">No test history found yet.</p>';
}

function renderHighscores() {
  syncComparisonInputs();
  renderComparisonSummary();
  const container = $('#highscore-groups');
  if (!container) return;

  container.innerHTML = HIGHSCORE_GROUPS.map((group) => `
    <section class="score-section" id="${group.id}-highscores-section">
      <div class="score-section-heading">
        <p class="eyebrow">${escapeHtml(group.eyebrow)}</p>
        <h3>${escapeHtml(group.title)}</h3>
      </div>
      <div class="highscore-grid">${renderHighscoreCards(group.fields)}</div>
    </section>
  `).join('');
}

function renderHighscoreCards(fields) {
  const comparisonUser = getComparisonUser();
  const current = state.currentProfile || {};

  return fields.map((field) => {
    const label = HIGHSCORE_FIELDS[field];
    const userScore = Number(current?.[field] || 0);
    const compareScore = comparisonUser ? Number(comparisonUser?.[field] || 0) : null;
    const comparisonClass = comparisonUser
      ? userScore > compareScore
        ? 'you-win'
        : compareScore > userScore
          ? 'they-win'
          : 'tie'
      : '';

    return `
      <article class="highscore-card ${HIGHSCORE_ICONS[field] ? 'with-icon' : ''} ${comparisonUser ? 'comparison-card' : ''} ${comparisonClass}">
        ${renderHighscoreIcon(field)}
        <div class="highscore-copy">
          <span>${escapeHtml(label)}</span>
          ${comparisonUser ? `
            <div class="score-comparison-pair">
              <strong>${userScore}</strong>
              <strong>${compareScore}</strong>
            </div>
            <div class="score-comparison-labels">
              <small>You</small>
              <small>${escapeHtml(getUserName(comparisonUser))}</small>
            </div>
          ` : `<strong>${userScore}</strong>`}
        </div>
      </article>
    `;
  }).join('');
}

function syncComparisonInputs() {
  ['compare-player-email', 'leaderboard-compare-email'].forEach((id) => {
    const input = $(`#${id}`);
    if (!input) return;
    if (document.activeElement !== input) input.value = state.comparisonEmail || '';
  });
}

function renderComparisonSummary() {
  const comparisonUser = getComparisonUser();
  const targets = ['#comparison-summary', '#leaderboard-comparison'];
  const current = state.currentProfile || {};

  targets.forEach((selector) => {
    const container = $(selector);
    if (!container) return;
    if (!comparisonUser) {
      container.innerHTML = '<p class="muted">Write another player\'s email to compare average score, streaks, and game scores.</p>';
      return;
    }

    const currentAverage = calculateAverageScore(current);
    const comparisonAverage = calculateAverageScore(comparisonUser);
    const currentWins = Object.keys(HIGHSCORE_FIELDS)
      .filter((field) => Number(current[field] || 0) > Number(comparisonUser[field] || 0)).length;
    const comparisonWins = Object.keys(HIGHSCORE_FIELDS)
      .filter((field) => Number(comparisonUser[field] || 0) > Number(current[field] || 0)).length;

    container.innerHTML = `
      <div class="comparison-stat">
        <span>You</span>
        <strong>${currentAverage}</strong>
        <small>${countScoredGames(current)} scored games</small>
      </div>
      <div class="comparison-stat">
        <span>${escapeHtml(getUserName(comparisonUser))}</span>
        <strong>${comparisonAverage}</strong>
        <small>${countScoredGames(comparisonUser)} scored games</small>
      </div>
      <div class="comparison-stat">
        <span>Game wins</span>
        <strong>${currentWins} / ${comparisonWins}</strong>
        <small>You / ${escapeHtml(getUserName(comparisonUser))}</small>
      </div>
      <div class="comparison-stat">
        <span>Streaks</span>
        <strong>${Number(current.current_streak || 0)} / ${Number(comparisonUser.current_streak || 0)}</strong>
        <small>Current streak</small>
      </div>
    `;
  });
}

function renderLeaderboard() {
  const ranked = getRankedLeaderboard();
  const comparisonUser = getComparisonUser();
  const comparisonMode = Boolean(comparisonUser);
  const searchQuery = state.leaderboardSearch.trim().toLowerCase();
  const filteredRows = comparisonMode
    ? ranked.filter((user) => [state.currentProfile?.id, comparisonUser.id].includes(user.id))
    : ranked.filter((user) => matchesLeaderboardSearch(user, searchQuery));
  const sortedRows = sortLeaderboardRows(filteredRows);
  const pageCount = Math.max(1, Math.ceil(sortedRows.length / LEADERBOARD_PAGE_SIZE));
  state.leaderboardPage = Math.min(Math.max(Number(state.leaderboardPage) || 1, 1), pageCount);
  const pageStart = comparisonMode ? 0 : (state.leaderboardPage - 1) * LEADERBOARD_PAGE_SIZE;
  const visibleRows = comparisonMode
    ? sortedRows
    : sortedRows.slice(pageStart, pageStart + LEADERBOARD_PAGE_SIZE);
  const pageEnd = comparisonMode ? visibleRows.length : pageStart + visibleRows.length;
  syncComparisonInputs();
  renderComparisonSummary();

  const totalTests = ranked.reduce((sum, user) => sum + Number(user.testCount || 0), 0);
  const topScore = ranked.reduce((max, user) => Math.max(max, Number(user.score || 0)), 0);
  const currentRank = getCurrentRank();

  $('#leaderboard-warning').textContent = state.leaderboardError;
  $('#leaderboard-warning').hidden = !state.leaderboardError;
  $('#leaderboard-total-players').textContent = ranked.length;
  $('#leaderboard-total-tests').textContent = totalTests;
  $('#leaderboard-top-score').textContent = topScore;
  $('#leaderboard-current-rank').textContent = currentRank ? `Your rank: #${currentRank}` : 'Your rank is not listed yet';
  $('#leaderboard-pagination-info').textContent = comparisonMode
    ? `Comparison view: showing ${visibleRows.length} players`
    : filteredRows.length
      ? `Showing ${pageStart + 1}-${pageEnd} of ${filteredRows.length}`
      : 'No matching players';
  $('#leaderboard-prev-btn').disabled = comparisonMode || state.leaderboardPage <= 1;
  $('#leaderboard-next-btn').disabled = comparisonMode || state.leaderboardPage >= pageCount;

  $$('[data-leaderboard-sort]').forEach((button) => {
    const field = button.dataset.leaderboardSort;
    const active = state.leaderboardSortField === field;
    button.classList.toggle('active', active);
    button.dataset.direction = sortIndicator(field);
    button.setAttribute('aria-pressed', String(active));
    button.closest('th')?.setAttribute('aria-sort', active
      ? (state.leaderboardSortDirection === 'asc' ? 'ascending' : 'descending')
      : 'none');
  });

  const searchInput = $('#leaderboard-search');
  if (searchInput && document.activeElement !== searchInput) {
    searchInput.value = state.leaderboardSearch;
  }

  $('#leaderboard-list').innerHTML = visibleRows.map((user) => `
    <tr class="${user.rank === 1 ? 'top-leaderboard-row' : ''} ${user.id === state.currentProfile?.id ? 'current-user-row' : ''} ${user.id === state.comparisonUserId ? 'comparison-user-row' : ''}">
      <td><span class="leaderboard-rank">${user.rank}</span></td>
      <td>${escapeHtml(user.name)}</td>
      <td>${Number(user.testCount || 0)}</td>
      <td class="leaderboard-score">${Number(user.score || 0)}</td>
    </tr>
  `).join('') || '<tr><td colspan="4" class="empty-table">No leaderboard data found.</td></tr>';
}

function clearComparison() {
  state.comparisonUserId = '';
  state.comparisonUser = null;
  state.comparisonEmail = '';
  renderHighscores();
  renderLeaderboard();
}

function findCurrentPlayerInLeaderboard() {
  const rank = getCurrentRank();
  if (!rank) {
    toast('Your player is not ranked yet.', true);
    return;
  }

  if (state.comparisonUserId) {
    state.comparisonUserId = '';
    state.comparisonUser = null;
    state.comparisonEmail = '';
    renderHighscores();
  }

  state.leaderboardSearch = '';
  state.leaderboardPage = Math.ceil(rank / LEADERBOARD_PAGE_SIZE);
  renderLeaderboard();
  toast(`You are on leaderboard page ${state.leaderboardPage}.`);
}

function setLeaderboardSort(field) {
  const defaultDirection = field === 'rank' || field === 'name' ? 'asc' : 'desc';

  if (state.leaderboardSortField === field) {
    state.leaderboardSortDirection = state.leaderboardSortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    state.leaderboardSortField = field;
    state.leaderboardSortDirection = defaultDirection;
  }

  state.leaderboardPage = 1;
  renderLeaderboard();
}

function reportMetric(label, value) {
  return `<div class="report-metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function scoreReportRows(fields, comparisonUser = null) {
  const current = state.currentProfile || {};
  return fields.map((field) => `
    <tr>
      <td>${escapeHtml(HIGHSCORE_FIELDS[field])}</td>
      <td>${Number(current[field] || 0)}</td>
      ${comparisonUser ? `<td>${Number(comparisonUser[field] || 0)}</td>` : ''}
    </tr>
  `).join('');
}

function buildOverviewReport() {
  const recentRows = [...state.scoresHistory].slice(-10).reverse().map((test, index) => `
    <tr>
      <td>Test ${state.scoresHistory.length - index}</td>
      <td>${Number(test.totalScore || 0)}</td>
      <td>${Number(test.scores?.length || 0)}</td>
    </tr>
  `).join('');

  const topRows = topScores(10).map((item) => `
    <tr>
      <td>${escapeHtml(item.label)}</td>
      <td>${item.score}</td>
    </tr>
  `).join('');

  return `
    <h2>Overview</h2>
    <div class="report-grid">
      ${reportMetric('Current streak', Number(state.currentProfile?.current_streak || 0))}
      ${reportMetric('Best streak', Number(state.currentProfile?.longest_streak || 0))}
      ${reportMetric('Average score', calculateAverageScore(state.currentProfile))}
      ${reportMetric('Tests logged', state.scoresHistory.length)}
    </div>
    <h3>Recent Tests</h3>
    <table><thead><tr><th>Test</th><th>Total score</th><th>Skills</th></tr></thead><tbody>${recentRows || '<tr><td colspan="3">No tests logged.</td></tr>'}</tbody></table>
    <h3>Top High Scores</h3>
    <table><thead><tr><th>Game</th><th>Score</th></tr></thead><tbody>${topRows || '<tr><td colspan="2">No high scores yet.</td></tr>'}</tbody></table>
  `;
}

function buildHistoryReport() {
  const rows = [...state.scoresHistory].reverse().map((test, index) => {
    const testNumber = state.scoresHistory.length - index;
    const skills = (test.scores || [])
      .map((skill) => `${skill.category || 'Skill'}: ${Number(skill.score || 0)}`)
      .join(', ');
    return `
      <tr>
        <td>Test ${testNumber}</td>
        <td>${Number(test.totalScore || 0)}</td>
        <td>${escapeHtml(skills || 'No skill breakdown')}</td>
      </tr>
    `;
  }).join('');

  return `
    <h2>Test History</h2>
    <table><thead><tr><th>Test</th><th>Total score</th><th>Breakdown</th></tr></thead><tbody>${rows || '<tr><td colspan="3">No test history found.</td></tr>'}</tbody></table>
  `;
}

function buildHighscoresReport() {
  const comparisonUser = getComparisonUser();
  const compareHeader = comparisonUser ? `<th>${escapeHtml(getUserName(comparisonUser))}</th>` : '';
  const groupTables = HIGHSCORE_GROUPS.map((group) => `
    <h3>${escapeHtml(group.title)}</h3>
    <table><thead><tr><th>Game</th><th>You</th>${compareHeader}</tr></thead><tbody>${scoreReportRows(group.fields, comparisonUser)}</tbody></table>
  `).join('');

  return `
    <h2>High Scores</h2>
    ${comparisonUser ? `<p class="report-note">Comparison: You vs ${escapeHtml(getUserName(comparisonUser))}</p>` : ''}
    ${groupTables}
  `;
}

function buildLeaderboardReport() {
  const ranked = getRankedLeaderboard();
  const rows = ranked.map((user, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(user.name)}</td>
      <td>${Number(user.testCount || 0)}</td>
      <td>${Number(user.score || 0)}</td>
    </tr>
  `).join('');

  return `
    <h2>Leaderboard</h2>
    <div class="report-grid">
      ${reportMetric('Total players', ranked.length)}
      ${reportMetric('Total tests', ranked.reduce((sum, user) => sum + Number(user.testCount || 0), 0))}
      ${reportMetric('Top score', ranked.reduce((max, user) => Math.max(max, Number(user.score || 0)), 0))}
      ${reportMetric('Your rank', getCurrentRank() ? `#${getCurrentRank()}` : 'Not ranked')}
    </div>
    ${getComparisonUser() ? `<p class="report-note">Comparison player: ${escapeHtml(getUserName(getComparisonUser()))}</p>` : ''}
    <table><thead><tr><th>Rank</th><th>Name</th><th>Tests</th><th>Score</th></tr></thead><tbody>${rows || '<tr><td colspan="4">No leaderboard data.</td></tr>'}</tbody></table>
  `;
}

async function comparePlayerByEmail(rawEmail) {
  const email = String(rawEmail || '').trim().toLowerCase();
  if (!email) {
    toast('Write a player\'s email to compare.', true);
    return;
  }

  if (email === String(state.currentProfile?.email || '').toLowerCase()) {
    toast('That is your account. Write another player\'s email.', true);
    return;
  }

  let data = null;
  try {
    data = await lookupComparisonProfile(email);
  } catch (error) {
    toast(`Could not compare that player: ${error.message}`, true);
    return;
  }

  if (!data?.id) {
    toast('No active player found with that email.', true);
    return;
  }

  state.comparisonUserId = data.id;
  state.comparisonUser = data;
  state.comparisonEmail = email;
  state.leaderboardSearch = '';
  state.leaderboardPage = 1;

  const existingIndex = state.leaderboardUsers.findIndex((user) => user.id === data.id);
  if (existingIndex === -1) state.leaderboardUsers.push(data);
  else state.leaderboardUsers[existingIndex] = { ...state.leaderboardUsers[existingIndex], ...data };

  renderHighscores();
  renderLeaderboard();
  toast(`Comparing with ${getUserName(data)}.`);
}

function buildReportBody() {
  if (state.activeTab === 'history') return buildHistoryReport();
  if (state.activeTab === 'highscores') return buildHighscoresReport();
  if (state.activeTab === 'leaderboard') return buildLeaderboardReport();
  return buildOverviewReport();
}

function exportActiveReport() {
  if (!state.session) return;

  const profile = state.currentProfile || {};
  const title = `${getUserName(profile)} - Photo Memory ${state.activeTab || 'overview'} report`;
  const reportWindow = window.open('', '_blank');
  if (!reportWindow) {
    toast('Popup blocked. Allow popups to export the report.', true);
    return;
  }

  reportWindow.document.write(`<!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${escapeHtml(title)}</title>
        <style>
          body { margin: 0; padding: 40px; color: #191816; font-family: Inter, Arial, sans-serif; background: #fffdf6; }
          .report { max-width: 980px; margin: 0 auto; }
          header { display: flex; justify-content: space-between; gap: 24px; align-items: flex-start; padding-bottom: 22px; border-bottom: 3px solid #201d19; }
          h1, h2, h3, p { margin: 0; }
          h1 { font-size: 34px; }
          h2 { margin-top: 28px; font-size: 26px; }
          h3 { margin-top: 24px; font-size: 17px; text-transform: uppercase; color: #1b6477; }
          .meta { text-align: right; color: #706a60; font-size: 13px; }
          .identity { display: grid; gap: 5px; margin-top: 12px; color: #706a60; }
          .report-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin: 18px 0 20px; }
          .report-metric { padding: 14px; border: 1px solid #d8cfbf; border-radius: 10px; background: #fff8e8; }
          .report-metric span { display: block; color: #706a60; font-size: 12px; text-transform: uppercase; }
          .report-metric strong { display: block; margin-top: 5px; font-size: 24px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; background: #fff; }
          th { background: #f6a21a; color: #191816; text-align: left; font-size: 12px; text-transform: uppercase; }
          th, td { padding: 11px 12px; border-bottom: 1px solid #ddd2bf; }
          .report-note { margin-top: 12px; color: #706a60; }
          @media print { body { padding: 20px; } .report { max-width: none; } }
        </style>
      </head>
      <body>
        <main class="report">
          <header>
            <div>
              <p style="color:#1b6477;font-weight:800;text-transform:uppercase;font-size:12px;">Photo Memory dashboard</p>
              <h1>${escapeHtml(title)}</h1>
              <div class="identity">
                <span>${escapeHtml(profile.email || 'No email recorded')}</span>
                <span>${state.isAdmin ? 'Admin' : profile.is_pro ? 'Pro player' : 'Player'} account</span>
              </div>
            </div>
            <div class="meta">
              <strong>Generated</strong><br>
              ${escapeHtml(new Date().toLocaleString())}
            </div>
          </header>
          ${buildReportBody()}
        </main>
      </body>
    </html>`);
  reportWindow.document.close();
  reportWindow.focus();
  reportWindow.print();
}

function getFilteredAdminUsers() {
  const query = $('#user-search').value.trim().toLowerCase();
  const status = $('#verified-filter').value;
  const minStreak = Number($('#min-streak-filter').value || 0);
  const joinedAfter = $('#joined-after-filter').value;
  const joinedBefore = $('#joined-before-filter').value;

  return state.adminUsers.filter((user) => {
    const joined = user.created_at ? user.created_at.slice(0, 10) : '';
    const text = `${user.email || ''} ${user.username || ''}`.toLowerCase();
    const passesText = !query || text.includes(query);
    const passesStatus = status === 'all' ||
      (status === 'verified' && isVerified(user)) ||
      (status === 'unverified' && !isVerified(user)) ||
      (status === 'blocked' && isBlocked(user));
    const passesStreak = Number(user.current_streak || 0) >= minStreak;
    const passesAfter = !joinedAfter || joined >= joinedAfter;
    const passesBefore = !joinedBefore || joined <= joinedBefore;

    return passesText && passesStatus && passesStreak && passesAfter && passesBefore;
  });
}

function getAudienceUsers(kind) {
  if (kind === 'selected') {
    return state.adminUsers.filter((user) => state.selectedUserIds.has(user.id));
  }
  if (kind === 'filtered') return getFilteredAdminUsers();
  if (kind === 'unverified') return state.adminUsers.filter((user) => !isVerified(user));
  return state.adminUsers;
}

function getAudienceUserIds(kind) {
  return getAudienceUsers(kind).map((user) => user.id);
}

function normalizeEmail(value = '') {
  return String(value).trim().toLowerCase();
}

function getRecipientConfig(context) {
  const isMail = context === 'mail';
  return {
    context,
    title: isMail ? 'Mail recipients' : 'Push recipients',
    eyebrow: isMail ? 'Mail Studio' : 'Push Notifications',
    audience: $(isMail ? '#mail-audience' : '#notification-audience')?.value || 'selected',
    overrideKey: isMail ? 'mailRecipientOverrides' : 'notificationRecipientOverrides',
    manualKey: isMail ? 'mailManualEmails' : null,
    button: $(isMail ? '#mail-review-recipients-btn' : '#notification-review-recipients-btn'),
    allowExternalEmail: isMail
  };
}

function getCampaignRecipients(context) {
  const config = getRecipientConfig(context);
  const defaultIds = getAudienceUserIds(config.audience);
  const overrideSet = state[config.overrideKey];
  const userIds = overrideSet ? Array.from(overrideSet) : defaultIds;
  const emails = config.manualKey ? [...new Set((state[config.manualKey] || []).map(normalizeEmail).filter(Boolean))] : [];
  return { userIds, emails, audience: config.audience, overridden: Boolean(overrideSet) };
}

function updateRecipientButtons() {
  ['mail', 'notifications'].forEach((context) => {
    const config = getRecipientConfig(context);
    if (!config.button) return;
    const recipients = getCampaignRecipients(context);
    const count = recipients.userIds.length + recipients.emails.length;
    config.button.textContent = `Review recipients (${count})`;
  });
}

function buildRecipientDialogRows() {
  const context = state.recipientDialogContext;
  const config = getRecipientConfig(context);
  const draft = state.recipientDraft || { ids: new Set(), emails: [] };
  const query = normalizeEmail($('#recipient-search')?.value || '');
  const audienceUsers = getAudienceUsers(config.audience);
  const userById = new Map(state.adminUsers.map((user) => [user.id, user]));

  draft.ids.forEach((id) => {
    const user = userById.get(id);
    if (user && !audienceUsers.some((candidate) => candidate.id === id)) audienceUsers.push(user);
  });

  const rows = audienceUsers
    .filter((user) => {
      const text = `${getUserName(user)} ${user.email || ''}`.toLowerCase();
      return !query || text.includes(query);
    })
    .sort((a, b) => {
      const selectedA = draft.ids.has(a.id) ? 0 : 1;
      const selectedB = draft.ids.has(b.id) ? 0 : 1;
      if (selectedA !== selectedB) return selectedA - selectedB;
      return getUserName(a).localeCompare(getUserName(b));
    })
    .map((user) => {
      const checked = draft.ids.has(user.id) ? 'checked' : '';
      const inactive = checked ? '' : ' inactive';
      return `
        <article class="recipient-row${inactive}">
          <label class="recipient-row-main">
            <input class="recipient-toggle" type="checkbox" data-recipient-user-id="${escapeHtml(user.id)}" ${checked} />
            <span>
              <strong>${escapeHtml(getUserName(user))}</strong>
              <small>${escapeHtml(user.email || 'No email')}</small>
            </span>
          </label>
          <button class="recipient-remove-btn secondary-button" type="button" data-recipient-remove-id="${escapeHtml(user.id)}">Remove</button>
        </article>
      `;
    });

  if (config.allowExternalEmail) {
    draft.emails
      .filter((email) => !query || email.includes(query))
      .forEach((email) => {
        rows.push(`
          <article class="recipient-row">
            <label class="recipient-row-main">
              <input class="recipient-toggle" type="checkbox" data-recipient-manual-email="${escapeHtml(email)}" checked />
              <span>
                <strong>${escapeHtml(email)}</strong>
                <small>Manual email</small>
              </span>
            </label>
            <button class="recipient-remove-btn secondary-button" type="button" data-recipient-remove-email="${escapeHtml(email)}">Remove</button>
          </article>
        `);
      });
  }

  return rows;
}

function renderRecipientDialog() {
  const context = state.recipientDialogContext;
  const config = getRecipientConfig(context);
  const draft = state.recipientDraft || { ids: new Set(), emails: [] };
  const selectedCount = draft.ids.size + (draft.emails?.length || 0);
  $('#recipient-dialog-eyebrow').textContent = config.eyebrow;
  $('#recipient-dialog-title').textContent = config.title;
  $('#recipient-dialog-count').textContent = selectedCount;
  $('#recipient-dialog-summary').textContent = config.allowExternalEmail
    ? `${selectedCount} recipient${selectedCount === 1 ? '' : 's'} selected. You can add dashboard users or manual email addresses.`
    : `${selectedCount} user${selectedCount === 1 ? '' : 's'} selected. Push notifications can only go to existing users.`;
  $('#recipient-list').innerHTML = buildRecipientDialogRows().join('') || '<p class="muted">No recipients match this audience or search.</p>';
}

function openRecipientDialog(context) {
  const config = getRecipientConfig(context);
  const recipients = getCampaignRecipients(context);
  state.recipientDialogContext = context;
  state.recipientDraft = {
    ids: new Set(recipients.userIds),
    emails: config.allowExternalEmail ? [...recipients.emails] : []
  };
  $('#recipient-search').value = '';
  $('#recipient-manual-email').value = '';
  renderRecipientDialog();
  $('#recipient-dialog').showModal();
}

function addRecipientByEmail() {
  const config = getRecipientConfig(state.recipientDialogContext);
  const draft = state.recipientDraft;
  const email = normalizeEmail($('#recipient-manual-email').value);
  if (!draft || !email || !email.includes('@')) {
    toast('Enter a valid email address.', true);
    return;
  }

  const matchingUser = state.adminUsers.find((user) => normalizeEmail(user.email) === email);
  if (matchingUser) {
    draft.ids.add(matchingUser.id);
  } else if (config.allowExternalEmail) {
    draft.emails = [...new Set([...(draft.emails || []), email])];
  } else {
    toast('Push notifications can only go to existing dashboard users.', true);
    return;
  }

  $('#recipient-manual-email').value = '';
  renderRecipientDialog();
}

function applyRecipientDialogSelection() {
  const config = getRecipientConfig(state.recipientDialogContext);
  const draft = state.recipientDraft;
  if (!draft) return;
  state[config.overrideKey] = new Set(draft.ids);
  if (config.manualKey) state[config.manualKey] = [...new Set((draft.emails || []).map(normalizeEmail).filter(Boolean))];
  updateRecipientButtons();
  $('#recipient-dialog').close();
}

function renderUsers() {
  const users = getFilteredAdminUsers();
  const tbody = $('#users-table-body');
  
  const page = state.adminUsersPage || 1;
  const limit = state.adminUsersLimit || 25;
  const total = users.length;
  const totalPages = Math.ceil(total / limit) || 1;
  
  const clampedPage = Math.min(Math.max(1, page), totalPages);
  state.adminUsersPage = clampedPage;
  
  const start = (clampedPage - 1) * limit;
  const end = Math.min(start + limit, total);
  const paginatedUsers = users.slice(start, end);

  tbody.innerHTML = paginatedUsers.map((user) => {
    const statusText = isBlocked(user) ? 'Blocked' : (isVerified(user) ? 'Verified' : 'Unverified');
    const statusClass = isBlocked(user) ? 'danger' : (isVerified(user) ? 'good' : 'warn');
    const role = user.role || 'user';
    const checked = state.selectedUserIds.has(user.id) ? 'checked' : '';

    return `
      <tr>
        <td><input class="user-select" type="checkbox" data-user-id="${user.id}" ${checked} aria-label="Select ${escapeHtml(getUserName(user))}" /></td>
        <td>
          <div class="user-cell">
            <strong>${escapeHtml(getUserName(user))}</strong>
            <small>${escapeHtml(user.email || 'No email')}</small>
            <span class="pill">${escapeHtml(role)}</span>
          </div>
        </td>
        <td><span class="pill ${statusClass}">${statusText}</span></td>
        <td>${Number(user.current_streak || 0)} / ${Number(user.longest_streak || 0)}</td>
        <td>${formatDate(user.created_at)}</td>
        <td>${Number(user.email_sent_count || 0)}</td>
        <td>
          <div class="table-actions">
            <button data-user-id="${user.id}" data-user-action="email">Email</button>
            <button data-user-id="${user.id}" data-user-action="verify">Verify</button>
            <button data-user-id="${user.id}" data-user-action="reset">Reset</button>
            <button data-user-id="${user.id}" data-user-action="role">${role === 'admin' ? 'Make user' : 'Make admin'}</button>
            <button data-user-id="${user.id}" data-user-action="block">${isBlocked(user) ? 'Unblock' : 'Block'}</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Update pagination info & buttons
  const infoEl = $('#users-pagination-info');
  const prevBtn = $('#users-prev-page-btn');
  const nextBtn = $('#users-next-page-btn');
  if (infoEl) {
    if (total === 0) {
      infoEl.textContent = 'Showing 0-0 of 0';
    } else {
      infoEl.textContent = `Showing ${start + 1}-${end} of ${total}`;
    }
  }
  if (prevBtn) prevBtn.disabled = clampedPage <= 1;
  if (nextBtn) nextBtn.disabled = clampedPage >= totalPages;

  $('#select-all-users').checked = paginatedUsers.length > 0 && paginatedUsers.every((user) => state.selectedUserIds.has(user.id));
  updateRecipientButtons();
}

function renderDailyList() {
  $('#daily-list').innerHTML = state.dailyChallenges.map((challenge) => `
    <div class="compact-item">
      <div>
        <strong>${escapeHtml(challenge.challenge_date)}</strong>
        <small>${escapeHtml(challenge.image_path || 'No image path')}</small>
      </div>
      <div class="row-actions">
        <button data-daily-edit="${challenge.id}">Edit</button>
        <button data-daily-delete="${challenge.id}">Delete</button>
      </div>
    </div>
  `).join('') || '<p class="muted">No challenges yet.</p>';
}

function renderContextualList() {
  $('#contextual-list').innerHTML = state.contextualLevels.map((level) => `
    <div class="compact-item">
      <div>
        <strong>${escapeHtml(level.level_name)}</strong>
        <small>${level.variations?.length || 0} variations - ${level.questions_to_ask || 0} questions asked</small>
      </div>
      <div class="row-actions">
        <button data-contextual-edit="${level.id}">Edit</button>
        <button data-contextual-delete="${level.id}">Delete</button>
      </div>
    </div>
  `).join('') || '<p class="muted">No contextual levels yet.</p>';
}

function switchTab(tab) {
  if (ADMIN_TABS.has(tab) && !state.isAdmin) tab = 'overview';

  state.activeTab = tab;
  $$('.side-nav button').forEach((button) => {
    button.classList.toggle('active', button.dataset.tab === tab);
  });
  $$('.panel').forEach((panel) => panel.classList.remove('active'));
  $(`#${tab}-panel`)?.classList.add('active');
  $('#page-title').textContent = {
    overview: 'Overview',
    history: 'Test History',
    highscores: 'High Scores',
    leaderboard: 'Leaderboard',
    users: 'All Users',
    mail: 'Mail Studio',
    notifications: 'Push Notifications',
    daily: 'Daily Challenges',
    contextual: 'Contextual Memory'
  }[tab] || 'Dashboard';
  document.body.classList.remove('sidebar-open');
  history.replaceState(null, '', `#${tab}`);
}

function resetDailyForm(challenge = null) {
  $('#daily-form').reset();
  $('#daily-id').value = challenge?.id || '';
  $('#daily-form-title').textContent = challenge ? `Edit ${challenge.challenge_date}` : 'New challenge';
  $('#daily-date').value = challenge?.challenge_date || new Date().toISOString().slice(0, 10);
  $('#daily-image-path').value = challenge?.image_path || '';
  $('#daily-image-preview').innerHTML = challenge?.image_url
    ? `<img src="${escapeHtml(challenge.image_url)}" alt="Daily challenge preview" />`
    : 'No image selected';
  $('#daily-questions').innerHTML = '';

  const questions = challenge?.questions?.length ? challenge.questions : [{ answers: [{ is_correct: true }, {}] }];
  questions.forEach((question) => addDailyQuestionBlock(question));
}

function addDailyQuestionBlock(question = {}) {
  const questionId = makeId('daily');
  const block = document.createElement('div');
  block.className = 'nested-block question-block daily-question-block';
  block.dataset.radioName = questionId;
  block.innerHTML = `
    <div class="block-header">
      <h3>Question</h3>
      <button type="button" data-remove-block>Remove</button>
    </div>
    <label>Question text<input class="question-text" type="text" required /></label>
    <div class="answers-container"></div>
    <button type="button" data-add-answer>Add answer</button>
  `;
  block.querySelector('.question-text').value = question.question_text || '';
  const answersContainer = block.querySelector('.answers-container');
  const answers = question.answers?.length ? question.answers : [{ is_correct: true }, {}];
  answers.forEach((answer) => addAnswerBlock(answersContainer, questionId, answer));
  $('#daily-questions').appendChild(block);
}

function addAnswerBlock(container, radioName, answer = {}) {
  const block = document.createElement('div');
  block.className = 'answer-grid answer-block';
  block.innerHTML = `
    <input class="answer-text" type="text" placeholder="Answer text" required />
    <label><input class="answer-correct" type="radio" name="${radioName}" /> Correct</label>
    <button type="button" data-remove-answer>Remove</button>
  `;
  block.querySelector('.answer-text').value = answer.answer_text || '';
  block.querySelector('.answer-correct').checked = Boolean(answer.is_correct);
  container.appendChild(block);
}

function collectQuestionBlocks(rootSelector) {
  return $$(rootSelector).map((questionBlock, index) => ({
    question_text: questionBlock.querySelector('.question-text').value.trim(),
    order_index: index,
    answers: $$('.answer-block', questionBlock).map((answerBlock) => ({
      answer_text: answerBlock.querySelector('.answer-text').value.trim(),
      is_correct: answerBlock.querySelector('.answer-correct').checked
    })).filter((answer) => answer.answer_text)
  })).filter((question) => question.question_text);
}

async function saveDailyChallenge(event) {
  event.preventDefault();
  const button = event.submitter;
  setBusy(button, true, 'Saving...');

  try {
    const imageFile = await fileToUploadPayload($('#daily-image-file').files[0]);
    await api('saveDailyChallenge', {
      challenge: {
        id: $('#daily-id').value || null,
        challenge_date: $('#daily-date').value,
        image_path: $('#daily-image-path').value.trim(),
        imageFile,
        questions: collectQuestionBlocks('.daily-question-block')
      }
    });

    toast('Daily challenge saved.');
    await loadAdminDashboard();
  } catch (error) {
    toast(error.message, true);
  } finally {
    setBusy(button, false);
  }
}

function resetContextualForm(level = null) {
  $('#contextual-form').reset();
  $('#contextual-id').value = level?.id || '';
  $('#contextual-form-title').textContent = level ? `Edit ${level.level_name}` : 'New level';
  $('#contextual-level-name').value = level?.level_name || '';
  $('#contextual-question-count').value = level?.questions_to_ask || 5;
  $('#variations-container').innerHTML = '';

  const variations = level?.variations?.length ? level.variations : [{}];
  variations.forEach((variation) => addVariationBlock(variation));
}

function addVariationBlock(variation = {}) {
  const block = document.createElement('div');
  block.className = 'nested-block variation-block variation-item';
  block.innerHTML = `
    <div class="block-header">
      <h3>Variation</h3>
      <button type="button" data-remove-block>Remove</button>
    </div>
    <label>Variation name<input class="variation-name" type="text" required /></label>
    <div class="scenes-container"></div>
    <button type="button" data-add-scene>Add evidence scene</button>
  `;
  block.querySelector('.variation-name').value = variation.variation_name || '';
  const scenes = variation.evidence_scenes?.length ? variation.evidence_scenes : [{}];
  scenes.forEach((scene) => addSceneBlock(block.querySelector('.scenes-container'), scene));
  $('#variations-container').appendChild(block);
}

function addSceneBlock(container, scene = {}) {
  const block = document.createElement('div');
  block.className = 'nested-block scene-block scene-item';
  block.innerHTML = `
    <div class="block-header">
      <h3>Evidence scene</h3>
      <button type="button" data-remove-block>Remove</button>
    </div>
    <label>Existing image path<input class="scene-image-path" type="text" /></label>
    <label>Upload image<input class="scene-image-file" type="file" accept="image/png,image/jpeg,image/webp" /></label>
    <div class="image-preview scene-preview">No image selected</div>
    <div class="scene-questions"></div>
    <button type="button" data-add-scene-question>Add question</button>
  `;
  block.querySelector('.scene-image-path').value = scene.image_path || '';
  block.querySelector('.scene-preview').innerHTML = scene.image_url
    ? `<img src="${escapeHtml(scene.image_url)}" alt="Evidence scene preview" />`
    : 'No image selected';

  const questions = scene.questions_cm?.length ? scene.questions_cm : [{ answers_cm: [{ is_correct: true }, {}] }];
  questions.forEach((question) => addSceneQuestionBlock(block.querySelector('.scene-questions'), question));
  container.appendChild(block);
}

function addSceneQuestionBlock(container, question = {}) {
  const questionId = makeId('cm');
  const block = document.createElement('div');
  block.className = 'nested-block question-block scene-question-block';
  block.dataset.radioName = questionId;
  block.innerHTML = `
    <div class="block-header">
      <h3>Question</h3>
      <button type="button" data-remove-block>Remove</button>
    </div>
    <label>Question text<input class="question-text" type="text" required /></label>
    <div class="answers-container"></div>
    <button type="button" data-add-answer>Add answer</button>
  `;
  block.querySelector('.question-text').value = question.question_text || '';
  const answers = question.answers_cm?.length ? question.answers_cm : [{ is_correct: true }, {}];
  answers.forEach((answer) => addAnswerBlock(block.querySelector('.answers-container'), questionId, answer));
  container.appendChild(block);
}

async function collectContextualPayload() {
  const variations = [];

  for (const variationBlock of $$('.variation-item')) {
    const scenes = [];

    for (const sceneBlock of $$('.scene-item', variationBlock)) {
      const imageFile = await fileToUploadPayload(sceneBlock.querySelector('.scene-image-file').files[0]);
      const questions_cm = $$('.scene-question-block', sceneBlock).map((questionBlock) => ({
        question_text: questionBlock.querySelector('.question-text').value.trim(),
        answers_cm: $$('.answer-block', questionBlock).map((answerBlock) => ({
          answer_text: answerBlock.querySelector('.answer-text').value.trim(),
          is_correct: answerBlock.querySelector('.answer-correct').checked
        })).filter((answer) => answer.answer_text)
      })).filter((question) => question.question_text);

      scenes.push({
        image_path: sceneBlock.querySelector('.scene-image-path').value.trim(),
        imageFile,
        questions_cm
      });
    }

    variations.push({
      variation_name: variationBlock.querySelector('.variation-name').value.trim(),
      evidence_scenes: scenes
    });
  }

  return {
    id: $('#contextual-id').value || null,
    level_name: $('#contextual-level-name').value.trim(),
    questions_to_ask: Number($('#contextual-question-count').value || 5),
    variations
  };
}

async function saveContextualLevel(event) {
  event.preventDefault();
  const button = event.submitter;
  setBusy(button, true, 'Saving...');

  try {
    await api('saveContextualLevel', {
      level: await collectContextualPayload()
    });
    toast('Contextual level saved.');
    await loadAdminDashboard();
  } catch (error) {
    toast(error.message, true);
  } finally {
    setBusy(button, false);
  }
}

function openEmailDialog(userId) {
  const user = state.adminUsers.find((candidate) => candidate.id === userId);
  if (!user) return;
  state.dialogUserId = userId;
  $('#email-dialog-recipient').textContent = `${getUserName(user)} - ${user.email || 'No email'}`;
  $('#dialog-email-subject').value = 'A note from Photo Memory';
  $('#dialog-email-body').value = `Hi ${getUserName(user)},\n\n`;
  $('#email-dialog').showModal();
}

async function handleUserAction(action, userId, button) {
  const user = state.adminUsers.find((candidate) => candidate.id === userId);
  if (!user || !state.isAdmin) return;

  if (action === 'email') {
    openEmailDialog(userId);
    return;
  }

  setBusy(button, true);

  try {
    if (action === 'verify') {
      await api('sendActionLink', { userId, linkType: 'verification' });
      toast(`Verification email sent to ${user.email}.`);
    } else if (action === 'reset') {
      await api('sendActionLink', { userId, linkType: 'recovery' });
      toast(`Password reset email sent to ${user.email}.`);
    } else if (action === 'role') {
      const newRole = user.role === 'admin' ? 'user' : 'admin';
      if (user.id === state.session.user.id && newRole !== 'admin' && !confirm('Demote your own admin account?')) return;
      await api('setRole', { userId, role: newRole });
      toast(`${getUserName(user)} is now ${newRole}.`);
      await loadUserDashboard();
      await loadAdminDashboard();
    } else if (action === 'block') {
      await api('setBlocked', { userId, blocked: !isBlocked(user) });
      toast(`${getUserName(user)} ${isBlocked(user) ? 'unblocked' : 'blocked'}.`);
      await loadAdminDashboard();
    }
  } catch (error) {
    toast(error.message, true);
  } finally {
    setBusy(button, false);
  }
}

async function sendDialogEmail(event) {
  event.preventDefault();
  const user = state.adminUsers.find((candidate) => candidate.id === state.dialogUserId);
  if (!user) return;

  const button = $('#dialog-send-email-btn');
  setBusy(button, true, 'Sending...');

  try {
    await api('sendEmail', {
      userId: user.id,
      subject: $('#dialog-email-subject').value.trim(),
      html: `<p>${escapeHtml($('#dialog-email-body').value).replaceAll('\n', '<br>')}</p>`,
      emailType: 'individual'
    });
    $('#email-dialog').close();
    toast(`Email sent to ${user.email}.`);
    await loadAdminDashboard();
  } catch (error) {
    toast(error.message, true);
  } finally {
    setBusy(button, false);
  }
}

async function sendBulkMail() {
  const recipients = getCampaignRecipients('mail');
  const userIds = recipients.userIds;
  const emails = recipients.emails;
  const totalRecipients = userIds.length + emails.length;
  if (!totalRecipients) {
    toast('No users match that email audience.', true);
    return;
  }

  const button = $('#send-mail-btn');
  setBusy(button, true, 'Sending...');

  try {
    const html = getMailContentHtml();
    
    // Package payloads
    const emailPayload = {
      userIds,
      emails,
      subject: $('#mail-subject').value.trim(),
      html: html,
      emailType: 'custom',
      attachments: mailAttachments.length ? mailAttachments : null,
      inlineImages: mailInlineImages.length ? mailInlineImages : null
    };

    await api('sendBulkEmail', emailPayload);

    toast(`Campaign dispatched successfully to ${totalRecipients} recipient${totalRecipients === 1 ? '' : 's'}.`);
    
    // Clear files
    mailAttachments = [];
    mailInlineImages = [];
    if ($('#mail-attachments-file')) $('#mail-attachments-file').value = '';
    if ($('#mail-images-file')) $('#mail-images-file').value = '';
    if ($('#mail-attachments-status')) $('#mail-attachments-status').textContent = 'No attachments';
    if ($('#mail-images-status')) $('#mail-images-status').textContent = 'No inline images';

    await loadAdminDashboard();
  } catch (error) {
    toast(error.message, true);
  } finally {
    setBusy(button, false);
  }
}

// --- Mail Studio Advanced Enhancements ---

let mailAttachments = [];
let mailInlineImages = [];
let mailEditorMode = 'visual';
let activeMailPresetId = '';
let selectedMailBlockId = '';
let mailBlocks = [];
let mailDrag = null;
let mailPreviewMode = 'light';
let mailDesign = defaultMailDesign();

function defaultMailDesign() {
  return {
    width: 640,
    height: 720,
    backgroundColor: '#fff8e8',
    cardColor: '#fffdf6',
    darkBackgroundColor: '#11100f',
    darkCardColor: '#1d1a17',
    darkTextColor: '#fff8e8',
    fontLink: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap',
    fontFamily: 'Inter, Arial, sans-serif'
  };
}

function defaultMailBlocks() {
  return [
    {
      id: makeId('mail-block'),
      type: 'text',
      x: 36,
      y: 34,
      width: 560,
      height: 86,
      text: 'Hello from Photo Memory',
      color: '#191816',
      backgroundColor: '#fffdf6',
      fontSize: 34,
      radius: 0
    },
    {
      id: makeId('mail-block'),
      type: 'text',
      x: 38,
      y: 138,
      width: 540,
      height: 98,
      text: 'We have something new ready for you. Keep your streak alive and sharpen your visual memory today.',
      color: '#3f3931',
      backgroundColor: '#fffdf6',
      fontSize: 17,
      radius: 0
    },
    {
      id: makeId('mail-block'),
      type: 'button',
      x: 38,
      y: 266,
      width: 214,
      height: 50,
      text: 'Open dashboard',
      href: 'https://photographicmemory.vercel.app/dashboard/',
      color: '#191816',
      backgroundColor: '#f6a21a',
      fontSize: 16,
      radius: 999
    }
  ];
}

// Convert file to base64 payload helper
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}

// Load presets from Local Storage
function getMailPresets() {
  const data = localStorage.getItem('photo_memory_email_presets');
  if (!data) return [];
  try {
    return JSON.parse(data) || [];
  } catch {
    return [];
  }
}

function saveMailPresets(presets) {
  localStorage.setItem('photo_memory_email_presets', JSON.stringify(presets));
}

function stripHtmlText(html = '') {
  const element = document.createElement('div');
  element.innerHTML = html;
  return (element.textContent || element.innerText || '').replace(/\s+/g, ' ').trim();
}

function legacyRenderMailPresetCards() {
  const list = $('#mail-preset-list');
  if (!list) return;

  const cards = getMailPresets().map((preset, index) => ({ ...preset, token: `custom:${index}` }));

  $('#mail-preset-count').textContent = cards.length;
  list.innerHTML = cards.map((preset) => {
    const preview = stripHtmlText(preset.html || '').slice(0, 118) || 'No preview text yet.';
    const activeClass = preset.token === activeMailPresetId ? ' active' : '';
    return `
      <article class="mail-preset-card${activeClass}">
        <button class="mail-preset-main" type="button" data-mail-preset-load="${escapeHtml(preset.token)}">
          <span class="mail-preset-kicker">Saved preset</span>
          <strong>${escapeHtml(preset.name || 'Untitled preset')}</strong>
          <small>${escapeHtml(preview)}</small>
        </button>
        <div class="mail-preset-actions">
          <button class="icon-action" type="button" data-mail-preset-load="${escapeHtml(preset.token)}" aria-label="Edit preset" title="Edit preset">✎</button>
          ${preset.builtIn ? '' : `<button class="icon-action danger" type="button" data-mail-preset-delete="${escapeHtml(preset.token)}" aria-label="Remove preset" title="Remove preset">×</button>`}
        </div>
      </article>
    `;
  }).join('');
}

async function legacyResolveMailPreset(token) {
  if (token?.startsWith('builtin:')) {
    const presetId = token.replace('builtin:', '');
    const preset = BUILT_IN_MAIL_PRESETS.find((candidate) => candidate.id === presetId);
    if (!preset) return null;

    if (presetId === 'unverified-reminder') {
      try {
        const preview = await api('previewVerificationEmail');
        return {
          ...preset,
          builtIn: true,
          subject: preview.subject || preset.subject,
          html: preview.bodyHtml || preset.html
        };
      } catch (error) {
        toast('Could not load that preset.', true);
      }
    }

    return { ...preset, builtIn: true };
  }

  if (token?.startsWith('custom:')) {
    const index = Number(token.replace('custom:', ''));
    const preset = getMailPresets()[index] || null;
    return preset ? { ...preset, builtIn: false } : null;
  }

  return null;
}

function legacyApplyMailPreset(preset, token = '') {
  if (!preset) return;
  activeMailPresetId = token;
  $('#mail-preset-name').value = preset.builtIn ? '' : (preset.name || '');
  $('#mail-subject').value = preset.subject || '';
  $('#mail-audience').value = preset.audience || 'selected';

  const html = preset.html || '';
  $('#mail-editor').innerHTML = html;
  $('#mail-editor-source').value = html;
  renderMailPresetCards();
}

async function legacyLoadMailPreset(token) {
  const preset = await resolveMailPreset(token);
  if (!preset) {
    toast('That preset could not be loaded.', true);
    return;
  }

  applyMailPreset(preset, token);
  if (token === 'builtin:unverified-reminder') {
    toast('Unverified reminder template loaded. Use Send reminders for real activation links.');
  } else {
    toast(`Loaded "${preset.name}".`);
  }
}

function legacySaveCurrentMailPreset() {
  const name = $('#mail-preset-name').value.trim();
  if (!name) {
    toast('Please enter a preset name.', true);
    return;
  }

  const presets = getMailPresets();
  const newPreset = {
    name,
    subject: $('#mail-subject').value.trim(),
    html: getMailContentHtml(),
    audience: $('#mail-audience').value
  };

  const existingIndex = presets.findIndex((preset) => preset.name.toLowerCase() === name.toLowerCase());
  if (existingIndex !== -1) {
    presets[existingIndex] = newPreset;
    activeMailPresetId = `custom:${existingIndex}`;
    toast(`Preset "${name}" updated.`);
  } else {
    presets.push(newPreset);
    activeMailPresetId = `custom:${presets.length - 1}`;
    toast(`Preset "${name}" saved.`);
  }

  saveMailPresets(presets);
  renderMailPresetCards();
}

function deleteMailPreset(token) {
  const index = Number(String(token || '').replace('custom:', ''));
  const presets = getMailPresets();
  const preset = presets[index];
  if (!preset) {
    toast('That preset no longer exists.', true);
    renderMailPresetCards();
    return;
  }

  if (!confirm(`Remove "${preset.name}"?`)) return;
  presets.splice(index, 1);
  saveMailPresets(presets);
  if (activeMailPresetId === token) activeMailPresetId = '';
  renderMailPresetCards();
  toast(`Removed "${preset.name}".`);
}

function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
  return Promise.resolve();
}

// Sync content from editors
function legacyGetMailContentHtml() {
  if (mailEditorMode === 'html') {
    return $('#mail-editor-source').value;
  }
  return $('#mail-editor').innerHTML;
}

function legacySyncMailContentEditors() {
  if (mailEditorMode === 'visual') {
    $('#mail-editor-source').value = $('#mail-editor').innerHTML;
  } else {
    $('#mail-editor').innerHTML = $('#mail-editor-source').value;
  }
}

// Initialize all listeners and features
function legacyInitMailStudio() {
  renderMailPresetCards();

  $('#mail-preset-list').addEventListener('click', (event) => {
    const loadButton = event.target.closest('[data-mail-preset-load]');
    if (loadButton) {
      loadMailPreset(loadButton.dataset.mailPresetLoad);
      return;
    }

    const deleteButton = event.target.closest('[data-mail-preset-delete]');
    if (deleteButton) {
      deleteMailPreset(deleteButton.dataset.mailPresetDelete);
    }
  });

  $('#save-preset-btn').addEventListener('click', saveCurrentMailPreset);

  // Editor Toggle HTML Mode Button
  $('#toggle-editor-mode-btn').addEventListener('click', () => {
    const visualEditor = $('#mail-editor');
    const sourceEditor = $('#mail-editor-source');
    const btn = $('#toggle-editor-mode-btn');

    if (mailEditorMode === 'visual') {
      syncMailContentEditors();
      visualEditor.style.display = 'none';
      sourceEditor.style.display = 'block';
      mailEditorMode = 'html';
      btn.textContent = 'Visual';
    } else {
      syncMailContentEditors();
      sourceEditor.style.display = 'none';
      visualEditor.style.display = 'block';
      mailEditorMode = 'visual';
      btn.textContent = 'HTML';
    }
  });

  // File Attachments Input
  $('#mail-attachments-file').addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    mailAttachments = [];
    
    for (const file of files) {
      try {
        const base64 = await fileToBase64(file);
        mailAttachments.push({
          name: file.name,
          type: file.type || 'application/octet-stream',
          dataUrl: base64
        });
      } catch (err) {
        toast(`Error reading attachment: ${file.name}`, true);
      }
    }
    
    const status = $('#mail-attachments-status');
    if (status) {
      status.textContent = mailAttachments.length 
        ? `${mailAttachments.length} files attached` 
        : 'No attachments';
    }
  });

  // Inline Images Input
  $('#mail-images-file').addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    mailInlineImages = [];
    
    for (const file of files) {
      try {
        const base64 = await fileToBase64(file);
        mailInlineImages.push({
          name: file.name,
          type: file.type || 'image/png',
          dataUrl: base64
        });
      } catch (err) {
        toast(`Error reading inline image: ${file.name}`, true);
      }
    }
    
    const status = $('#mail-images-status');
    if (status) {
      status.textContent = mailInlineImages.length 
        ? `${mailInlineImages.length} images added` 
        : 'No inline images';
    }
  });

  // Copy ChatGPT template generator prompt helper
  $('#generate-ai-prompt-btn').addEventListener('click', () => {
    const desc = $('#mail-ai-desc').value.trim() || 'A monthly updates email giving players visual streak tips';
    const promptText = [
      `Write a premium, beautiful responsive email HTML template themed around this request:`,
      `"${desc}"`,
      ``,
      `You MUST wrap your final HTML template code in a single formatless block inside \`<TO COPY>\` and \`</TO COPY>\` tags like this:`,
      `<TO COPY>`,
      `<!DOCTYPE html><html><body><h1>Header</h1><p>Welcome message</p></body></html>`,
      `</TO COPY>`,
      ``,
      `Use professional inlined CSS styling with elegant harmonized colors, Outfit/Inter fonts, clean dividers, and smooth spacings. Do not include markdown codeblocks inside the tags.`
    ].join('\n');
    
    copyToClipboard(promptText)
      .then(() => toast('ChatGPT prompt template copied to clipboard! Paste it in ChatGPT.'))
      .catch(() => toast('Failed to copy to clipboard automatically.', true));
  });

  // Extract from pasted ChatGPT response
  $('#extract-ai-mail-btn').addEventListener('click', () => {
    const responseText = $('#mail-ai-response').value;
    if (!responseText) {
      toast('Please paste the ChatGPT response containing the <TO COPY> tags first.', true);
      return;
    }

    const match = responseText.match(/<TO[- ]COPY>([\s\S]*?)<\/TO[- ]COPY>/i);
    if (!match) {
      toast('Could not find the <TO COPY> and </TO COPY> tags in the pasted text.', true);
      return;
    }

    const cleanHtml = match[1].replace(/```(?:html|json|css)?/gi, '').replace(/```/g, '').trim();
    if (!cleanHtml) {
      toast('The code block inside the copy tags is empty.', true);
      return;
    }

    if (mailEditorMode === 'visual') {
      $('#mail-editor').innerHTML = cleanHtml;
      $('#mail-editor-source').value = cleanHtml;
    } else {
      $('#mail-editor-source').value = cleanHtml;
      $('#mail-editor').innerHTML = cleanHtml;
    }

    toast('Template HTML extracted and loaded successfully!');
    $('#mail-ai-response').value = '';
  });
}

function renderMailPresetCards() {
  const list = $('#mail-preset-list');
  if (!list) return;

  const cards = getMailPresets().map((preset, index) => ({ ...preset, token: `custom:${index}` }));
  $('#mail-preset-count').textContent = cards.length;
  list.innerHTML = cards.map((preset) => {
    const preview = stripHtmlText(preset.html || '').slice(0, 118) || 'No preview text yet.';
    const activeClass = preset.token === activeMailPresetId ? ' active' : '';
    return `
      <article class="mail-preset-card${activeClass}">
        <button class="mail-preset-main" type="button" data-mail-preset-load="${escapeHtml(preset.token)}">
          <span class="mail-preset-kicker">Saved preset</span>
          <strong>${escapeHtml(preset.name || 'Untitled preset')}</strong>
          <small>${escapeHtml(preview)}</small>
        </button>
        <div class="mail-preset-actions">
          <button class="icon-action" type="button" data-mail-preset-load="${escapeHtml(preset.token)}" aria-label="Edit preset" title="Edit preset">Edit</button>
          <button class="icon-action danger" type="button" data-mail-preset-delete="${escapeHtml(preset.token)}" aria-label="Remove preset" title="Remove preset">X</button>
        </div>
      </article>
    `;
  }).join('') || '<p class="muted">No saved mail presets yet. Design one below and save it.</p>';
}

async function resolveMailPreset(token) {
  if (!token?.startsWith('custom:')) return null;
  const index = Number(token.replace('custom:', ''));
  return getMailPresets()[index] || null;
}

function textToHtml(text = '') {
  return escapeHtml(text).replaceAll('\n', '<br>');
}

function blockInlineStyle(block, darkPreview = false) {
  const background = darkPreview && block.backgroundColor === mailDesign.cardColor ? mailDesign.darkCardColor : block.backgroundColor;
  const color = darkPreview && block.color === '#191816' ? mailDesign.darkTextColor : block.color;
  return [
    'position:absolute',
    `left:${Number(block.x || 0)}px`,
    `top:${Number(block.y || 0)}px`,
    `width:${Number(block.width || 120)}px`,
    `height:${Number(block.height || 40)}px`,
    `color:${color || '#191816'}`,
    `background:${background || 'transparent'}`,
    `font-size:${Number(block.fontSize || 16)}px`,
    `border-radius:${Number(block.radius || 0)}px`,
    'box-sizing:border-box',
    'overflow:hidden',
    'line-height:1.35'
  ].join(';');
}

function renderEmailBlock(block, darkPreview = false) {
  const style = blockInlineStyle(block, darkPreview);
  if (block.type === 'image') {
    return `<img src="${escapeHtml(block.src || '')}" alt="" style="${style};object-fit:cover;display:block;" />`;
  }
  if (block.type === 'button') {
    return `<a href="${escapeHtml(block.href || '#')}" style="${style};display:flex;align-items:center;justify-content:center;text-decoration:none;font-weight:800;text-align:center;padding:0 14px;">${textToHtml(block.text || 'Button')}</a>`;
  }
  if (block.type === 'spacer') {
    return `<div style="${style};"></div>`;
  }
  return `<div style="${style};padding:4px 0;font-weight:${Number(block.fontSize || 16) >= 28 ? 800 : 500};">${textToHtml(block.text || '')}</div>`;
}

function buildMailHtml(options = {}) {
  const darkPreview = Boolean(options.darkPreview);
  const previewMode = Boolean(options.previewMode);
  const pageColor = darkPreview ? mailDesign.darkBackgroundColor : mailDesign.backgroundColor;
  const cardColor = darkPreview ? mailDesign.darkCardColor : mailDesign.cardColor;
  const textColor = darkPreview ? mailDesign.darkTextColor : '#191816';
  const fontLink = String(mailDesign.fontLink || '').trim();
  const fontTag = fontLink ? `<link href="${escapeHtml(fontLink)}" rel="stylesheet">` : '';

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    ${fontTag}
    <style>
      @media (prefers-color-scheme: dark) {
        body { background:${mailDesign.darkBackgroundColor} !important; }
        .pm-mail-stage { background:${mailDesign.darkCardColor} !important; color:${mailDesign.darkTextColor} !important; }
      }
    </style>
  </head>
  <body style="margin:0;background:${pageColor};font-family:${escapeHtml(mailDesign.fontFamily)};-webkit-text-size-adjust:100%;text-size-adjust:100%;">
    <div style="width:100%;background:${pageColor};padding:${previewMode ? '0' : '28px 12px'};box-sizing:border-box;">
      <div class="pm-mail-stage" style="position:relative;margin:0 auto;width:100%;max-width:${Number(mailDesign.width)}px;height:${Number(mailDesign.height)}px;background:${cardColor};color:${textColor};box-sizing:border-box;overflow:hidden;">
        ${mailBlocks.map((block) => renderEmailBlock(block, darkPreview)).join('\n        ')}
      </div>
    </div>
  </body>
</html>`;
}

function getMailContentHtml() {
  return mailEditorMode === 'html' ? $('#mail-editor-source').value : buildMailHtml();
}

function syncMailContentEditors() {
  if (mailEditorMode === 'visual') $('#mail-editor-source').value = buildMailHtml();
  updateMailPreviews();
}

function extractMailHtmlFromText(text = '') {
  const value = String(text || '').trim();
  if (!value) return '';

  const tagged = value.match(/<TO[- ]COPY>([\s\S]*?)<\/TO[- ]COPY>/i);
  const fenced = value.match(/```(?:html)?\s*([\s\S]*?)```/i);
  const candidate = (tagged?.[1] || fenced?.[1] || value)
    .replace(/```(?:html|json|css)?/gi, '')
    .replace(/```/g, '')
    .trim();

  return /<html[\s>]|<!doctype\s+html|<body[\s>]|<table[\s>]|<div[\s>]/i.test(candidate) ? candidate : '';
}

function loadMailHtmlSource(html, message = 'Template HTML loaded in source mode.') {
  const cleanHtml = String(html || '').trim();
  if (!cleanHtml) {
    toast('No HTML was found to load.', true);
    return;
  }

  $('#mail-editor-source').value = cleanHtml;
  $('#mail-editor').style.display = 'none';
  $('#mail-editor-source').style.display = 'block';
  mailEditorMode = 'html';
  $('#toggle-editor-mode-btn').textContent = 'Visual';
  updateMailPreviews();
  toast(message);
}

function syncMailDesignControls() {
  $('#mail-canvas-width').value = mailDesign.width;
  $('#mail-canvas-height').value = mailDesign.height;
  $('#mail-bg-color').value = mailDesign.backgroundColor;
  $('#mail-card-color').value = mailDesign.cardColor;
  $('#mail-dark-bg-color').value = mailDesign.darkBackgroundColor;
  $('#mail-dark-card-color').value = mailDesign.darkCardColor;
  $('#mail-dark-text-color').value = mailDesign.darkTextColor;
  $('#mail-font-link').value = mailDesign.fontLink;
  $('#mail-font-family').value = mailDesign.fontFamily;
}

function applyMailDesignControls() {
  mailDesign = {
    ...mailDesign,
    width: Number($('#mail-canvas-width').value || 640),
    height: Number($('#mail-canvas-height').value || 720),
    backgroundColor: $('#mail-bg-color').value || '#fff8e8',
    cardColor: $('#mail-card-color').value || '#fffdf6',
    darkBackgroundColor: $('#mail-dark-bg-color').value || '#11100f',
    darkCardColor: $('#mail-dark-card-color').value || '#1d1a17',
    darkTextColor: $('#mail-dark-text-color').value || '#fff8e8',
    fontLink: $('#mail-font-link').value.trim(),
    fontFamily: $('#mail-font-family').value.trim() || 'Arial, sans-serif'
  };
  renderMailCanvas();
}

function selectedMailBlock() {
  return mailBlocks.find((block) => block.id === selectedMailBlockId) || null;
}

function renderCanvasBlock(block) {
  const selected = block.id === selectedMailBlockId ? ' selected' : '';
  const style = blockInlineStyle(block);
  const common = `class="mail-canvas-block${selected}" data-mail-block-id="${escapeHtml(block.id)}" style="${style}"`;
  const handle = '<span class="mail-block-handle" title="Drag block"></span>';
  if (block.type === 'image') return `<div ${common}>${handle}<img src="${escapeHtml(block.src || '')}" alt="" /></div>`;
  if (block.type === 'button') return `<div ${common}>${handle}<div class="mail-block-button-text" data-mail-text contenteditable="true">${textToHtml(block.text || 'Button')}</div></div>`;
  if (block.type === 'spacer') return `<div ${common}>${handle}</div>`;
  return `<div ${common}>${handle}<div data-mail-text contenteditable="true">${textToHtml(block.text || '')}</div></div>`;
}

function renderMailCanvas() {
  const canvas = $('#mail-editor');
  if (!canvas) return;
  canvas.style.width = `${Number(mailDesign.width)}px`;
  canvas.style.height = `${Number(mailDesign.height)}px`;
  canvas.style.minHeight = `${Number(mailDesign.height)}px`;
  canvas.style.background = mailDesign.cardColor;
  canvas.style.fontFamily = mailDesign.fontFamily;
  canvas.innerHTML = mailBlocks.map(renderCanvasBlock).join('');
  const sourceEditor = $('#mail-editor-source');
  if (sourceEditor) {
    sourceEditor.style.height = `${Number(mailDesign.height)}px`;
    sourceEditor.style.minHeight = `${Number(mailDesign.height)}px`;
  }
  updateMailBlockControls();
  updateMailPreviews();
}

function updateMailPreviews() {
  const preview = $('#mail-preview-frame');
  if (preview) {
    const sourceHtml = $('#mail-editor-source')?.value || '';
    const previewHtml = mailEditorMode === 'html'
      ? sourceHtml
      : buildMailHtml({ darkPreview: mailPreviewMode === 'dark', previewMode: true });
    const baseHeight = Number(mailDesign.height) || 720;
    preview.style.height = `${baseHeight}px`;
    preview.style.maxWidth = mailEditorMode === 'html' ? '100%' : `${Number(mailDesign.width)}px`;
    preview.onload = () => {
      try {
        const doc = preview.contentDocument;
        const contentHeight = Math.max(
          doc?.body?.scrollHeight || 0,
          doc?.documentElement?.scrollHeight || 0,
          baseHeight
        );
        preview.style.height = `${Math.min(contentHeight, 1800)}px`;
      } catch (_error) {
        preview.style.height = `${baseHeight}px`;
      }
    };
    preview.srcdoc = previewHtml;
  }
  $$('[data-mail-preview-mode]').forEach((button) => {
    const active = button.dataset.mailPreviewMode === mailPreviewMode;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  if (mailEditorMode === 'visual' && $('#mail-editor-source')) $('#mail-editor-source').value = buildMailHtml();
}

function updateMailBlockControls() {
  const block = selectedMailBlock();
  const controls = ['mail-block-text', 'mail-block-link', 'mail-block-x', 'mail-block-y', 'mail-block-width', 'mail-block-height', 'mail-block-font-size', 'mail-block-radius', 'mail-block-color', 'mail-block-bg'];
  controls.forEach((id) => {
    const input = $(`#${id}`);
    if (input) input.disabled = !block;
  });
  if (!block) return;
  $('#mail-block-text').value = block.text || '';
  $('#mail-block-link').value = block.href || '';
  $('#mail-block-x').value = Math.round(block.x || 0);
  $('#mail-block-y').value = Math.round(block.y || 0);
  $('#mail-block-width').value = Math.round(block.width || 0);
  $('#mail-block-height').value = Math.round(block.height || 0);
  $('#mail-block-font-size').value = Number(block.fontSize || 16);
  $('#mail-block-radius').value = Number(block.radius || 0);
  $('#mail-block-color').value = block.color || '#191816';
  $('#mail-block-bg').value = block.backgroundColor || '#ffffff';
}

function selectMailBlock(id) {
  selectedMailBlockId = id || '';
  renderMailCanvas();
}

function updateSelectedMailBlock(patch) {
  const block = selectedMailBlock();
  if (!block) return;
  Object.assign(block, patch);
  renderMailCanvas();
}

function addMailBlock(type, overrides = {}) {
  const base = {
    id: makeId('mail-block'),
    type,
    x: 42,
    y: Math.min(540, 42 + mailBlocks.length * 32),
    width: type === 'image' ? 260 : 320,
    height: type === 'text' ? 72 : 54,
    text: type === 'button' ? 'Call to action' : type === 'text' ? 'Write your message' : '',
    href: '',
    src: '',
    color: '#191816',
    backgroundColor: type === 'button' ? '#f6a21a' : type === 'spacer' ? '#f6a21a' : mailDesign.cardColor,
    fontSize: type === 'button' ? 16 : 18,
    radius: type === 'button' ? 999 : 0
  };
  mailBlocks.push({ ...base, ...overrides });
  selectedMailBlockId = mailBlocks[mailBlocks.length - 1].id;
  renderMailCanvas();
}

async function uploadHostedMailImage() {
  const input = $('#mail-hosted-image-file');
  const file = input?.files?.[0];
  if (!file) {
    toast('Choose an image to host first.', true);
    return;
  }

  const button = $('#mail-upload-hosted-image-btn');
  setBusy(button, true, 'Uploading...');

  try {
    const result = await api('uploadMailImage', {
      imageFile: await fileToUploadPayload(file)
    });
    if (!result.publicUrl) throw new Error('The image uploaded, but no public URL was returned.');
    $('#mail-image-url').value = result.publicUrl;
    $('#mail-hosted-image-status').textContent = `Hosted at ${result.path || 'mail folder'}`;
    addMailBlock('image', {
      src: result.publicUrl,
      width: 320,
      height: 200,
      backgroundColor: '#f5ead5',
      radius: 8
    });
    toast('Hosted image uploaded and added to the email.');
  } catch (error) {
    toast(error.message || String(error), true);
  } finally {
    setBusy(button, false);
  }
}

function duplicateSelectedMailBlock() {
  const block = selectedMailBlock();
  if (!block) return;
  const copy = { ...block, id: makeId('mail-block'), x: Number(block.x || 0) + 18, y: Number(block.y || 0) + 18 };
  mailBlocks.push(copy);
  selectedMailBlockId = copy.id;
  renderMailCanvas();
}

function deleteSelectedMailBlock() {
  if (!selectedMailBlockId) return;
  mailBlocks = mailBlocks.filter((block) => block.id !== selectedMailBlockId);
  selectedMailBlockId = mailBlocks[0]?.id || '';
  renderMailCanvas();
}

function applyMailPreset(preset, token = '') {
  if (!preset) return;
  activeMailPresetId = token;
  $('#mail-preset-name').value = preset.name || '';
  $('#mail-subject').value = preset.subject || '';
  $('#mail-audience').value = preset.audience || 'selected';

  if (preset.mode !== 'html' && preset.design && Array.isArray(preset.blocks)) {
    mailDesign = { ...defaultMailDesign(), ...preset.design };
    mailBlocks = preset.blocks.map((block) => ({ ...block, id: block.id || makeId('mail-block') }));
    selectedMailBlockId = mailBlocks[0]?.id || '';
    mailEditorMode = 'visual';
    $('#mail-editor-source').style.display = 'none';
    $('#mail-editor').style.display = 'block';
    $('#toggle-editor-mode-btn').textContent = 'HTML';
    syncMailDesignControls();
    renderMailCanvas();
  } else {
    mailEditorMode = 'html';
    $('#mail-editor-source').value = preset.html || '';
    $('#mail-editor-source').style.display = 'block';
    $('#mail-editor').style.display = 'none';
    $('#toggle-editor-mode-btn').textContent = 'Visual';
    updateMailPreviews();
  }
  renderMailPresetCards();
}

async function loadMailPreset(token) {
  const preset = await resolveMailPreset(token);
  if (!preset) {
    toast('That preset could not be loaded.', true);
    return;
  }
  applyMailPreset(preset, token);
  toast(`Loaded "${preset.name}".`);
}

function saveCurrentMailPreset() {
  const name = $('#mail-preset-name').value.trim();
  if (!name) {
    toast('Please enter a preset name.', true);
    return;
  }
  const presets = getMailPresets();
  const html = getMailContentHtml();
  const newPreset = {
    name,
    subject: $('#mail-subject').value.trim(),
    html,
    audience: $('#mail-audience').value,
    mode: mailEditorMode
  };
  if (mailEditorMode === 'visual') {
    newPreset.design = { ...mailDesign };
    newPreset.blocks = mailBlocks.map((block) => ({ ...block }));
  }
  const existingIndex = presets.findIndex((preset) => preset.name.toLowerCase() === name.toLowerCase());
  if (existingIndex !== -1) {
    presets[existingIndex] = newPreset;
    activeMailPresetId = `custom:${existingIndex}`;
    toast(`Preset "${name}" updated.`);
  } else {
    presets.push(newPreset);
    activeMailPresetId = `custom:${presets.length - 1}`;
    toast(`Preset "${name}" saved.`);
  }
  saveMailPresets(presets);
  renderMailPresetCards();
}

function initMailStudio() {
  if (!mailBlocks.length) {
    mailBlocks = defaultMailBlocks();
    selectedMailBlockId = mailBlocks[0]?.id || '';
  }
  syncMailDesignControls();
  renderMailCanvas();
  renderMailPresetCards();
  if ($('.mail-studio')?.classList.contains('mail-expanded')) {
    $('#mail-expand-canvas-btn').textContent = 'Compact view';
  }

  $('#mail-preset-list')?.addEventListener('click', (event) => {
    const loadButton = event.target.closest('[data-mail-preset-load]');
    if (loadButton) {
      loadMailPreset(loadButton.dataset.mailPresetLoad);
      return;
    }
    const deleteButton = event.target.closest('[data-mail-preset-delete]');
    if (deleteButton) deleteMailPreset(deleteButton.dataset.mailPresetDelete);
  });

  $('#save-preset-btn')?.addEventListener('click', saveCurrentMailPreset);
  ['mail-font-link', 'mail-font-family', 'mail-canvas-width', 'mail-canvas-height', 'mail-bg-color', 'mail-card-color', 'mail-dark-bg-color', 'mail-dark-card-color', 'mail-dark-text-color'].forEach((id) => {
    $(`#${id}`)?.addEventListener('input', applyMailDesignControls);
  });

  $('#mail-add-text-btn')?.addEventListener('click', () => addMailBlock('text'));
  $('#mail-add-button-btn')?.addEventListener('click', () => addMailBlock('button'));
  $('#mail-add-spacer-btn')?.addEventListener('click', () => addMailBlock('spacer', { width: 520, height: 4, radius: 0 }));
  $('#mail-add-image-btn')?.addEventListener('click', () => {
    const src = $('#mail-image-url').value.trim();
    if (!src) {
      toast('Paste an image URL first, or upload an image below.', true);
      return;
    }
    addMailBlock('image', { src, width: 300, height: 190, backgroundColor: '#f5ead5', radius: 8 });
  });
  $('#mail-upload-hosted-image-btn')?.addEventListener('click', uploadHostedMailImage);
  $('#mail-hosted-image-file')?.addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    $('#mail-hosted-image-status').textContent = file ? `Ready to upload: ${file.name}` : 'No hosted image selected';
  });
  $('#mail-expand-canvas-btn')?.addEventListener('click', () => {
    const expanded = $('.mail-studio')?.classList.toggle('mail-expanded');
    $('#mail-expand-canvas-btn').textContent = expanded ? 'Compact view' : 'Full view';
  });
  $$('[data-mail-preview-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      mailPreviewMode = button.dataset.mailPreviewMode || 'light';
      updateMailPreviews();
    });
  });

  $('#mail-editor')?.addEventListener('click', (event) => {
    const block = event.target.closest('[data-mail-block-id]');
    if (block) selectMailBlock(block.dataset.mailBlockId);
  });
  $('#mail-editor')?.addEventListener('input', (event) => {
    const textElement = event.target.closest('[data-mail-text]');
    const blockElement = event.target.closest('[data-mail-block-id]');
    const block = mailBlocks.find((candidate) => candidate.id === blockElement?.dataset.mailBlockId);
    if (textElement && block) {
      block.text = textElement.innerText;
      updateMailBlockControls();
      updateMailPreviews();
    }
  });
  $('#mail-editor')?.addEventListener('pointerdown', (event) => {
    const handle = event.target.closest('.mail-block-handle');
    const blockElement = event.target.closest('[data-mail-block-id]');
    if (!handle || !blockElement) return;
    const block = mailBlocks.find((candidate) => candidate.id === blockElement.dataset.mailBlockId);
    if (!block) return;
    selectedMailBlockId = block.id;
    mailDrag = {
      id: block.id,
      startX: event.clientX,
      startY: event.clientY,
      originalX: Number(block.x || 0),
      originalY: Number(block.y || 0)
    };
    blockElement.setPointerCapture?.(event.pointerId);
    event.preventDefault();
    renderMailCanvas();
  });
  $('#mail-editor')?.addEventListener('pointermove', (event) => {
    if (!mailDrag) return;
    const block = mailBlocks.find((candidate) => candidate.id === mailDrag.id);
    if (!block) return;
    block.x = Math.max(0, mailDrag.originalX + event.clientX - mailDrag.startX);
    block.y = Math.max(0, mailDrag.originalY + event.clientY - mailDrag.startY);
    const element = $(`[data-mail-block-id="${block.id}"]`);
    if (element) {
      element.style.left = `${block.x}px`;
      element.style.top = `${block.y}px`;
    }
    updateMailBlockControls();
    updateMailPreviews();
  });
  $('#mail-editor')?.addEventListener('pointerup', () => {
    mailDrag = null;
    const block = selectedMailBlock();
    const element = block ? $(`[data-mail-block-id="${block.id}"]`) : null;
    if (block && element) {
      block.width = element.offsetWidth;
      block.height = element.offsetHeight;
      updateMailBlockControls();
      updateMailPreviews();
    }
  });

  ['mail-block-text', 'mail-block-link', 'mail-block-x', 'mail-block-y', 'mail-block-width', 'mail-block-height', 'mail-block-font-size', 'mail-block-radius', 'mail-block-color', 'mail-block-bg'].forEach((id) => {
    $(`#${id}`)?.addEventListener('input', () => {
      updateSelectedMailBlock({
        text: $('#mail-block-text').value,
        href: $('#mail-block-link').value.trim(),
        x: Number($('#mail-block-x').value || 0),
        y: Number($('#mail-block-y').value || 0),
        width: Number($('#mail-block-width').value || 120),
        height: Number($('#mail-block-height').value || 40),
        fontSize: Number($('#mail-block-font-size').value || 16),
        radius: Number($('#mail-block-radius').value || 0),
        color: $('#mail-block-color').value,
        backgroundColor: $('#mail-block-bg').value
      });
    });
  });
  $('#mail-duplicate-block-btn')?.addEventListener('click', duplicateSelectedMailBlock);
  $('#mail-delete-block-btn')?.addEventListener('click', deleteSelectedMailBlock);

  $('#toggle-editor-mode-btn')?.addEventListener('click', () => {
    const visualEditor = $('#mail-editor');
    const sourceEditor = $('#mail-editor-source');
    const btn = $('#toggle-editor-mode-btn');
    if (mailEditorMode === 'visual') {
      syncMailContentEditors();
      visualEditor.style.display = 'none';
      sourceEditor.style.display = 'block';
      mailEditorMode = 'html';
      btn.textContent = 'Visual';
    } else {
      sourceEditor.style.display = 'none';
      visualEditor.style.display = 'block';
      mailEditorMode = 'visual';
      btn.textContent = 'HTML';
      renderMailCanvas();
    }
  });
  $('#mail-editor-source')?.addEventListener('input', updateMailPreviews);
  $('#mail-editor-source')?.addEventListener('paste', () => {
    window.setTimeout(updateMailPreviews, 0);
  });

  $('#mail-attachments-file')?.addEventListener('change', async (event) => {
    mailAttachments = [];
    for (const file of Array.from(event.target.files)) {
      try {
        mailAttachments.push({ name: file.name, type: file.type || 'application/octet-stream', dataUrl: await fileToBase64(file) });
      } catch (_error) {
        toast(`Error reading attachment: ${file.name}`, true);
      }
    }
    $('#mail-attachments-status').textContent = mailAttachments.length ? `${mailAttachments.length} files attached` : 'No attachments';
  });

  $('#mail-images-file')?.addEventListener('change', async (event) => {
    mailInlineImages = [];
    for (const file of Array.from(event.target.files)) {
      try {
        const dataUrl = await fileToBase64(file);
        mailInlineImages.push({ name: file.name, type: file.type || 'image/png', dataUrl });
        addMailBlock('image', { src: dataUrl, width: 300, height: 190, backgroundColor: '#f5ead5', radius: 8 });
      } catch (_error) {
        toast(`Error reading inline image: ${file.name}`, true);
      }
    }
    $('#mail-images-status').textContent = mailInlineImages.length ? `${mailInlineImages.length} images added to canvas` : 'No uploaded images';
  });

  $('#generate-ai-prompt-btn')?.addEventListener('click', () => {
    const desc = $('#mail-ai-desc').value.trim() || 'A monthly updates email giving players visual streak tips';
    const promptText = [
      'Write a premium responsive email HTML template themed around this request:',
      `"${desc}"`,
      '',
      'Wrap the final complete HTML document in <TO COPY> and </TO COPY> tags. Include inline CSS and keep it email friendly.'
    ].join('\n');
    copyToClipboard(promptText)
      .then(() => toast('ChatGPT prompt copied to clipboard.'))
      .catch(() => toast('Failed to copy to clipboard automatically.', true));
  });

  $('#extract-ai-mail-btn')?.addEventListener('click', () => {
    const responseText = $('#mail-ai-response').value;
    const cleanHtml = extractMailHtmlFromText(responseText);
    if (!cleanHtml) {
      toast('Paste HTML, a fenced HTML block, or a response containing <TO COPY> tags.', true);
      return;
    }
    loadMailHtmlSource(cleanHtml);
    $('#mail-ai-response').value = '';
  });
}

async function createNotification() {
  const audience = $('#notification-audience').value;
  const recipients = getCampaignRecipients('notifications');
  const userIds = recipients.userIds;
  if (!userIds.length) {
    toast('No users match that notification audience.', true);
    return;
  }

  const button = $('#create-notification-btn');
  setBusy(button, true, 'Queuing...');

  try {
    await api('createNotification', {
      userIds,
      audience: recipients.overridden ? 'custom' : audience,
      title: $('#notification-title').value.trim(),
      body: $('#notification-body').value.trim(),
      href: $('#notification-link').value.trim(),
      scheduledAt: localDateTimeToIso($('#notification-scheduled-at').value)
    });
    toast(`Push notification queued for ${userIds.length} user${userIds.length === 1 ? '' : 's'}.`);
  } catch (error) {
    toast(error.message, true);
  } finally {
    setBusy(button, false);
  }
}

function showOtpStep(email) {
  state.otpEmail = email;
  $('#email-step').hidden = true;
  $('#otp-step').hidden = false;
  $('#otp-email-display').textContent = email;
  $$('.otp-input')[0].focus();
}

function showEmailStep() {
  $('#email-step').hidden = false;
  $('#otp-step').hidden = true;
  $('#login-error').textContent = '';
  $$('.otp-input').forEach((input) => {
    input.value = '';
  });
}

async function sendOtp(event) {
  event.preventDefault();
  const email = $('#login-email').value.trim();
  if (!email) return;

  const button = $('#send-otp-btn');
  $('#login-error').textContent = '';
  setBusy(button, true, 'Sending...');

  const { error } = await client.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false
    }
  });

  if (error) {
    $('#login-error').textContent = error.message;
  } else {
    showOtpStep(email);
  }

  setBusy(button, false);
}

async function verifyOtp() {
  const token = $$('.otp-input').map((input) => input.value.trim()).join('');
  if (token.length !== 6) {
    $('#login-error').textContent = 'Enter the full 6-digit code.';
    return;
  }

  const button = $('#verify-otp-btn');
  setBusy(button, true, 'Verifying...');

  const { error } = await client.auth.verifyOtp({
    email: state.otpEmail,
    token,
    type: 'email'
  });

  if (error) $('#login-error').textContent = error.message;
  setBusy(button, false);
}

function attachEventListeners() {
  initMailStudio();
  $('#login-form').addEventListener('submit', sendOtp);
  $('#verify-otp-btn').addEventListener('click', verifyOtp);
  $('#change-email-btn').addEventListener('click', showEmailStep);
  $$('.otp-input').forEach((input, index, inputs) => {
    input.addEventListener('input', () => {
      input.value = input.value.replace(/\D/g, '').slice(0, 1);
      if (input.value && inputs[index + 1]) inputs[index + 1].focus();
    });
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Backspace' && !input.value && inputs[index - 1]) inputs[index - 1].focus();
    });
    input.addEventListener('paste', (event) => {
      event.preventDefault();
      const value = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
      value.split('').forEach((digit, digitIndex) => {
        if (inputs[digitIndex]) inputs[digitIndex].value = digit;
      });
      inputs[Math.min(value.length, inputs.length) - 1]?.focus();
    });
  });

  $('#logout-btn').addEventListener('click', () => client.auth.signOut());
  $('#refresh-btn').addEventListener('click', refreshAll);
  $('#export-report-btn').addEventListener('click', exportActiveReport);
  $('#menu-btn').addEventListener('click', () => document.body.classList.toggle('sidebar-open'));

  $$('.side-nav button').forEach((button) => {
    button.addEventListener('click', () => switchTab(button.dataset.tab));
  });

  $$('[data-jump]').forEach((button) => {
    button.addEventListener('click', () => switchTab(button.dataset.jump));
  });

  [
    ['compare-player-email', 'compare-player-btn'],
    ['leaderboard-compare-email', 'leaderboard-compare-btn']
  ].forEach(([inputId, buttonId]) => {
    const input = $(`#${inputId}`);
    const button = $(`#${buttonId}`);
    button?.addEventListener('click', () => comparePlayerByEmail(input?.value));
    input?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        comparePlayerByEmail(input.value);
      }
    });
  });

  ['clear-comparison-btn', 'leaderboard-clear-comparison-btn'].forEach((id) => {
    $(`#${id}`)?.addEventListener('click', clearComparison);
  });

  $('#leaderboard-search')?.addEventListener('input', (event) => {
    state.leaderboardSearch = event.target.value;
    state.leaderboardPage = 1;
    renderLeaderboard();
  });

  $('#leaderboard-find-me-btn')?.addEventListener('click', findCurrentPlayerInLeaderboard);

  $('#leaderboard-prev-btn')?.addEventListener('click', () => {
    state.leaderboardPage = Math.max(1, state.leaderboardPage - 1);
    renderLeaderboard();
  });

  $('#leaderboard-next-btn')?.addEventListener('click', () => {
    state.leaderboardPage += 1;
    renderLeaderboard();
  });

  $$('[data-leaderboard-sort]').forEach((button) => {
    button.addEventListener('click', () => setLeaderboardSort(button.dataset.leaderboardSort));
  });

  ['user-search', 'verified-filter', 'min-streak-filter', 'joined-after-filter', 'joined-before-filter'].forEach((id) => {
    $(`#${id}`).addEventListener('input', () => {
      state.adminUsersPage = 1;
      renderUsers();
    });
  });

  $('#users-prev-page-btn').addEventListener('click', () => {
    if (state.adminUsersPage > 1) {
      state.adminUsersPage -= 1;
      renderUsers();
    }
  });

  $('#users-next-page-btn').addEventListener('click', () => {
    const users = getFilteredAdminUsers();
    const totalPages = Math.ceil(users.length / (state.adminUsersLimit || 25)) || 1;
    if (state.adminUsersPage < totalPages) {
      state.adminUsersPage += 1;
      renderUsers();
    }
  });

  $('#select-all-users').addEventListener('change', (event) => {
    getFilteredAdminUsers().forEach((user) => {
      if (event.target.checked) state.selectedUserIds.add(user.id);
      else state.selectedUserIds.delete(user.id);
    });
    renderUsers();
  });

  $('#users-table-body').addEventListener('change', (event) => {
    if (!event.target.matches('.user-select')) return;
    const userId = event.target.dataset.userId;
    if (event.target.checked) state.selectedUserIds.add(userId);
    else state.selectedUserIds.delete(userId);
    renderUsers();
  });

  document.body.addEventListener('click', async (event) => {
    const userActionButton = event.target.closest('[data-user-action]');
    if (userActionButton) {
      await handleUserAction(userActionButton.dataset.userAction, userActionButton.dataset.userId, userActionButton);
      return;
    }

    const dailyEditButton = event.target.closest('[data-daily-edit]');
    if (dailyEditButton) {
      try {
        const result = await api('getDailyChallenge', { id: dailyEditButton.dataset.dailyEdit });
        resetDailyForm(result.challenge);
        switchTab('daily');
      } catch (error) {
        toast(error.message, true);
      }
      return;
    }

    const dailyDeleteButton = event.target.closest('[data-daily-delete]');
    if (dailyDeleteButton && confirm('Delete this daily challenge?')) {
      await api('deleteDailyChallenge', { id: dailyDeleteButton.dataset.dailyDelete });
      await loadAdminDashboard();
      return;
    }

    const contextualEditButton = event.target.closest('[data-contextual-edit]');
    if (contextualEditButton) {
      const level = state.contextualLevels.find((item) => String(item.id) === String(contextualEditButton.dataset.contextualEdit));
      resetContextualForm(level);
      switchTab('contextual');
      return;
    }

    const contextualDeleteButton = event.target.closest('[data-contextual-delete]');
    if (contextualDeleteButton && confirm('Delete this contextual level?')) {
      await api('deleteContextualLevel', { id: contextualDeleteButton.dataset.contextualDelete });
      await loadAdminDashboard();
    }
  });

  $('#email-selected-btn').addEventListener('click', () => switchTab('mail'));
  $('#notify-selected-btn').addEventListener('click', () => switchTab('notifications'));
  $('#dialog-send-email-btn').addEventListener('click', sendDialogEmail);
  $('#send-mail-btn').addEventListener('click', sendBulkMail);
  $('#create-notification-btn').addEventListener('click', createNotification);
  $('#mail-review-recipients-btn')?.addEventListener('click', () => openRecipientDialog('mail'));
  $('#notification-review-recipients-btn')?.addEventListener('click', () => openRecipientDialog('notifications'));
  $('#mail-audience')?.addEventListener('change', () => {
    state.mailRecipientOverrides = null;
    updateRecipientButtons();
  });
  $('#notification-audience')?.addEventListener('change', () => {
    state.notificationRecipientOverrides = null;
    updateRecipientButtons();
  });
  $('#recipient-search')?.addEventListener('input', renderRecipientDialog);
  $('#recipient-add-email-btn')?.addEventListener('click', addRecipientByEmail);
  $('#recipient-manual-email')?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addRecipientByEmail();
    }
  });
  $('#recipient-apply-btn')?.addEventListener('click', applyRecipientDialogSelection);
  $('#recipient-list')?.addEventListener('change', (event) => {
    const draft = state.recipientDraft;
    if (!draft || !event.target.matches('.recipient-toggle')) return;
    const userId = event.target.dataset.recipientUserId;
    const email = event.target.dataset.recipientManualEmail;
    if (userId) {
      if (event.target.checked) draft.ids.add(userId);
      else draft.ids.delete(userId);
    }
    if (email && !event.target.checked) {
      draft.emails = (draft.emails || []).filter((candidate) => candidate !== email);
    }
    renderRecipientDialog();
  });
  $('#recipient-list')?.addEventListener('click', (event) => {
    const draft = state.recipientDraft;
    if (!draft) return;
    const removeId = event.target.closest('[data-recipient-remove-id]')?.dataset.recipientRemoveId;
    const removeEmail = event.target.closest('[data-recipient-remove-email]')?.dataset.recipientRemoveEmail;
    if (!removeId && !removeEmail) return;
    if (removeId) draft.ids.delete(removeId);
    if (removeEmail) draft.emails = (draft.emails || []).filter((email) => email !== removeEmail);
    renderRecipientDialog();
  });

  $$('.editor-toolbar button[data-format]').forEach((button) => {
    button.addEventListener('click', () => {
      const command = button.dataset.format;
      const value = command === 'createLink' ? prompt('Paste the link URL') : null;
      document.execCommand(command, false, value);
      $('#mail-editor').focus();
    });
  });

  $('#new-daily-btn').addEventListener('click', () => resetDailyForm());
  $('#add-daily-question-btn').addEventListener('click', () => addDailyQuestionBlock());
  $('#daily-form').addEventListener('submit', saveDailyChallenge);
  $('#daily-image-file').addEventListener('change', (event) => previewImage(event.target.files[0], $('#daily-image-preview')));
  $('#daily-questions').addEventListener('click', (event) => {
    const questionBlock = event.target.closest('.daily-question-block');
    if (event.target.matches('[data-remove-block]')) questionBlock?.remove();
    if (event.target.matches('[data-add-answer]')) addAnswerBlock(questionBlock.querySelector('.answers-container'), questionBlock.dataset.radioName);
    if (event.target.matches('[data-remove-answer]')) event.target.closest('.answer-block')?.remove();
  });

  $('#new-contextual-btn').addEventListener('click', () => resetContextualForm());
  $('#add-variation-btn').addEventListener('click', () => addVariationBlock());
  $('#contextual-form').addEventListener('submit', saveContextualLevel);
  $('#variations-container').addEventListener('click', (event) => {
    const variationBlock = event.target.closest('.variation-item');
    const sceneBlock = event.target.closest('.scene-item');
    const questionBlock = event.target.closest('.scene-question-block');

    if (event.target.matches('[data-remove-block]')) event.target.closest('.nested-block')?.remove();
    if (event.target.matches('[data-add-scene]')) addSceneBlock(variationBlock.querySelector('.scenes-container'));
    if (event.target.matches('[data-add-scene-question]')) addSceneQuestionBlock(sceneBlock.querySelector('.scene-questions'));
    if (event.target.matches('[data-add-answer]')) addAnswerBlock(questionBlock.querySelector('.answers-container'), questionBlock.dataset.radioName);
    if (event.target.matches('[data-remove-answer]')) event.target.closest('.answer-block')?.remove();
  });
  $('#variations-container').addEventListener('change', (event) => {
    if (event.target.matches('.scene-image-file')) {
      previewImage(event.target.files[0], event.target.closest('.scene-item').querySelector('.scene-preview'));
    }
  });
}

function previewImage(file, container) {
  if (!file) return;
  const url = URL.createObjectURL(file);
  container.innerHTML = `<img src="${url}" alt="Selected image preview" />`;
}

async function handleSession(session) {
  state.session = session;
  $('#login-view').hidden = Boolean(session);
  $('#app-view').hidden = !session;

  if (!session) {
    state.currentProfile = null;
    state.scoresHistory = [];
    state.leaderboardUsers = [];
    state.leaderboardPage = 1;
    state.leaderboardSearch = '';
    state.leaderboardSortField = 'rank';
    state.leaderboardSortDirection = 'asc';
    state.comparisonUserId = '';
    state.comparisonUser = null;
    state.comparisonEmail = '';
    state.adminUsers = [];
    state.selectedUserIds.clear();
    state.mailRecipientOverrides = null;
    state.mailManualEmails = [];
    state.notificationRecipientOverrides = null;
    state.recipientDialogContext = '';
    state.recipientDraft = null;
    state.isAdmin = false;
    showEmailStep();
    return;
  }

  await refreshAll();
  resetDailyForm();
  resetContextualForm();
}

attachEventListeners();

client.auth.onAuthStateChange((_event, session) => {
  handleSession(session);
});

client.auth.getSession().then(({ data }) => {
  const requestedTab = location.hash.replace('#', '') || 'overview';
  if ($(`#${requestedTab}-panel`)) switchTab(requestedTab);
  handleSession(data.session);
});
