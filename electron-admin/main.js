const { app, BrowserWindow, dialog, ipcMain, clipboard, session, shell } = require('electron');
const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'];
const CHROME_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36';
const CHATGPT_LOGIN_URL = 'https://chatgpt.com/';
let mainWindow = null;
let pendingDownload = null;

function defaultImagesRoot() {
  return path.resolve(__dirname, '..', 'content', 'daily-challenges', 'images');
}

function defaultChallengeRoot(rootPath = defaultImagesRoot()) {
  return path.resolve(rootPath, '..', 'challenges');
}

function dashboardUrl() {
  return pathToFileURL(path.resolve(__dirname, '..', 'dashboard', 'index.html')).href;
}

function findChromePath() {
  const candidates = [
    process.env.CHROME_PATH,
    path.join(process.env.PROGRAMFILES || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(process.env['PROGRAMFILES(X86)'] || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    readChromePathFromRegistry('HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\chrome.exe'),
    readChromePathFromRegistry('HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\chrome.exe'),
    findChromePathFromWhere(),
  ];
  return candidates.find((candidate) => candidate && fs.existsSync(candidate));
}

function readChromePathFromRegistry(registryPath) {
  if (process.platform !== 'win32') return null;
  const result = spawnSync('reg', ['query', registryPath, '/ve'], {
    encoding: 'utf8',
    windowsHide: true,
  });
  if (result.status !== 0) return null;
  const match = result.stdout.match(/REG_SZ\s+(.+?chrome\.exe)/i);
  return match ? match[1].trim() : null;
}

function findChromePathFromWhere() {
  if (process.platform !== 'win32') return null;
  const result = spawnSync('where', ['chrome'], {
    encoding: 'utf8',
    windowsHide: true,
  });
  if (result.status !== 0) return null;
  return result.stdout.split(/\r?\n/).map((line) => line.trim()).find(Boolean) || null;
}

async function openInChrome(url = CHATGPT_LOGIN_URL) {
  const chromePath = findChromePath();

  if (chromePath) {
    const child = spawn(chromePath, [url], {
      detached: true,
      stdio: 'ignore',
    });
    child.unref();
    return { ok: true, browser: 'chrome' };
  }

  await shell.openExternal(url);
  return { ok: true, browser: 'default' };
}

function createWindow() {
  const chatSession = session.fromPartition('persist:photo-memory-chatgpt');
  chatSession.setUserAgent(CHROME_UA);
  chatSession.webRequest.onBeforeSendHeaders((details, callback) => {
    const requestHeaders = {
      ...details.requestHeaders,
      'User-Agent': CHROME_UA,
      'sec-ch-ua': '"Chromium";v="148", "Google Chrome";v="148", "Not=A?Brand";v="99"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
    };
    callback({ requestHeaders });
  });

  const win = new BrowserWindow({
    width: 1480,
    height: 940,
    minWidth: 1060,
    minHeight: 720,
    title: 'Photo Memory Admin',
    backgroundColor: '#fff8e8',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true
    }
  });

  mainWindow = win;
  win.webContents.session.on('will-download', (_event, item) => handleDownload(item));
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

function parseDate(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function datePathParts(dateValue) {
  const date = parseDate(dateValue);
  return {
    year: String(date.getFullYear()),
    month: MONTHS[date.getMonth()],
    day: String(date.getDate()),
  };
}

function dateImageDirectory(rootPath, dateValue) {
  const parts = datePathParts(dateValue);
  return path.join(rootPath, parts.year, parts.month);
}

function findImagePath(rootPath, dateValue) {
  const parts = datePathParts(dateValue);
  const monthPath = dateImageDirectory(rootPath, dateValue);
  for (const extension of IMAGE_EXTENSIONS) {
    const candidate = path.join(monthPath, `${parts.day}${extension}`);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function challengeJsonPath(rootPath, dateValue) {
  const parts = datePathParts(dateValue);
  return path.join(defaultChallengeRoot(rootPath), parts.year, parts.month, `${parts.day}.json`);
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch (_error) {
    return null;
  }
}

function extractJsonFromText(text) {
  const cleaned = String(text || '').trim();

  // Try matching <TO COPY> tags (case-insensitive, optional dash or space)
  const copyMatch = cleaned.match(/<TO[- ]COPY>([\s\S]*?)<\/TO[- ]COPY>/i);
  if (copyMatch) {
    const innerText = copyMatch[1].replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
    const parsed = safeJsonParse(innerText);
    if (parsed) return parsed;
  }

  // Fallback to standard markdown code block match
  const codeMatch = cleaned.replace(/```(?:json)?/gi, '```').match(/```([\s\S]*?)```/);
  if (codeMatch) {
    const parsed = safeJsonParse(codeMatch[1].trim());
    if (parsed) return parsed;
  }

  // Fallback to first '{' and last '}'
  const objectStart = cleaned.indexOf('{');
  const objectEnd = cleaned.lastIndexOf('}');
  if (objectStart !== -1 && objectEnd > objectStart) {
    const parsed = safeJsonParse(cleaned.slice(objectStart, objectEnd + 1));
    if (parsed) return parsed;
  }

  // Fallback to first '[' and last ']'
  const arrayStart = cleaned.indexOf('[');
  const arrayEnd = cleaned.lastIndexOf(']');
  if (arrayStart !== -1 && arrayEnd > arrayStart) {
    const parsed = safeJsonParse(cleaned.slice(arrayStart, arrayEnd + 1));
    if (parsed) return parsed;
  }

  throw new Error('Could not find valid JSON in the ChatGPT answer.');
}

function normalizeQuestions(rawValue) {
  const rawQuestions = Array.isArray(rawValue) ? rawValue : rawValue?.questions;
  if (!Array.isArray(rawQuestions) || !rawQuestions.length) {
    throw new Error('The JSON must include a questions array.');
  }

  return rawQuestions.slice(0, 12).map((question, questionIndex) => {
    const answers = Array.isArray(question.answers) ? question.answers : [];
    const questionText = String(question.question_text || question.text || '').trim();
    if (!questionText || answers.length < 2) {
      throw new Error(`Question ${questionIndex + 1} needs text and at least two answers.`);
    }

    const normalizedAnswers = answers.slice(0, 6).map((answer) => ({
      answer_text: String(answer.answer_text || answer.text || '').trim(),
      is_correct: Boolean(answer.is_correct || answer.correct),
    })).filter((answer) => answer.answer_text);

    if (normalizedAnswers.length < 2) {
      throw new Error(`Question ${questionIndex + 1} needs at least two valid answers.`);
    }

    const correctIndex = normalizedAnswers.findIndex((answer) => answer.is_correct);
    normalizedAnswers.forEach((answer, index) => {
      answer.is_correct = index === (correctIndex === -1 ? 0 : correctIndex);
    });

    return {
      question_text: questionText,
      order_index: questionIndex,
      answers: normalizedAnswers,
    };
  });
}

function buildPromptPack(dateValue) {
  const scenePrompt = [
    `Create the image-generation prompt for one Photo Memory daily challenge for ${dateValue}.`,
    'You choose the scene yourself.',
    'Make it a simple, memorable everyday scene with 8 to 12 visible details that players can later remember.',
    'Include objects, colors, positions, and small countable details.',
    'Use a vintage rubberhose colorful cartoony style, consistent, clean, playful retro, warm light, clean composition, no text labels, no logos, and no UI.',
    'Return only the final image prompt as plain text. Do not generate questions yet.'
  ].join(' ');

  const questionsPrompt = [
    `Using the image you just generated for ${dateValue}, create a random number of multiple-choice memory questions between 3 and 6.`,
    'Ask about visible objects, colors, positions, quantities, and small details in the image.',
    'Ensure the questions are creative and entirely themed around your generated scene. The example below is purely for structural reference of the JSON schema—do not repeat this example\'s scenic content.',
    'You MUST place the correct answer in a random position (not always first) for each question.',
    'You MUST wrap your final JSON code in a single formatless block inside `<TO COPY>` and `</TO COPY>` tags exactly like this:',
    '<TO COPY>',
    '{"questions":[{"question_text":"What was beside the red mug?","answers":[{"answer_text":"A blue notebook","is_correct":true},{"answer_text":"A green backpack","is_correct":false},{"answer_text":"A brass bell","is_correct":false},{"answer_text":"A toy plane","is_correct":false}]}]}',
    '</TO COPY>',
    'Each question must have 4 short answers and exactly one correct answer. Do not include markdown codeblocks inside the tags.'
  ].join('\n');

  return {
    date: dateValue,
    scenePrompt,
    imagePrompt: '',
    questionsPrompt,
    fullPrompt: [
      'Step 1 - ask ChatGPT to create the scene/image prompt:',
      scenePrompt,
      '',
      'Step 2 - send the scene prompt back to ChatGPT to generate the image.',
      '',
      'Step 3 - after the image is finished, ask for challenge JSON:',
      questionsPrompt,
    ].join('\n')
  };
}

function loadChallenge(rootPath, dateValue) {
  const imagePath = findImagePath(rootPath, dateValue);
  const jsonPath = challengeJsonPath(rootPath, dateValue);
  const challenge = fs.existsSync(jsonPath) ? safeJsonParse(fs.readFileSync(jsonPath, 'utf8')) : null;

  return {
    date: dateValue,
    imagePath,
    imageUrl: imagePath ? pathToFileURL(imagePath).href : null,
    jsonPath,
    jsonExists: fs.existsSync(jsonPath),
    challenge,
    promptPack: buildPromptPack(dateValue),
  };
}

function saveChallengeQuestions(rootPath, dateValue, answerText, scenePrompt = "") {
  const parsed = extractJsonFromText(answerText);
  const questions = normalizeQuestions(parsed);
  const imagePath = findImagePath(rootPath, dateValue);
  const jsonPath = challengeJsonPath(rootPath, dateValue);
  fs.mkdirSync(path.dirname(jsonPath), { recursive: true });

  const challenge = {
    challenge_date: dateValue,
    image_path: imagePath ? path.relative(rootPath, imagePath).replace(/\\/g, '/') : null,
    image_file: imagePath,
    created_at: new Date().toISOString(),
    source: 'chatgpt-webview',
    scene_prompt: scenePrompt || null,
    questions,
  };

  fs.writeFileSync(jsonPath, `${JSON.stringify(challenge, null, 2)}\n`);
  return loadChallenge(rootPath, dateValue);
}

function saveImageData(rootPath, dateValue, dataUrl) {
  const match = String(dataUrl || '').match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error('ChatGPT image capture did not return image data.');

  const mimeType = match[1].toLowerCase();
  const extension = mimeType.includes('webp')
    ? '.webp'
    : mimeType.includes('jpeg') || mimeType.includes('jpg')
      ? '.jpg'
      : '.png';
  const parts = datePathParts(dateValue);
  const monthPath = dateImageDirectory(rootPath, dateValue);
  fs.mkdirSync(monthPath, { recursive: true });

  const destinationPath = path.join(monthPath, `${parts.day}${extension}`);
  assertInsideRoot(rootPath, destinationPath);
  fs.writeFileSync(destinationPath, Buffer.from(match[2], 'base64'));
  if (pendingDownload?.date === dateValue && path.resolve(pendingDownload.rootPath) === path.resolve(rootPath)) {
    pendingDownload = null;
  }

  return {
    destinationPath,
    scan: scanDailyFolder(rootPath),
    challenge: loadChallenge(rootPath, dateValue),
  };
}

function handleDownload(item) {
  if (!pendingDownload?.date || !pendingDownload.rootPath) return;

  const dateValue = pendingDownload.date;
  const rootPath = pendingDownload.rootPath;
  const originalName = item.getFilename() || 'challenge.png';
  const originalExtension = path.extname(originalName).toLowerCase();
  const extension = IMAGE_EXTENSIONS.includes(originalExtension) ? originalExtension : '.png';
  const parts = datePathParts(dateValue);
  const monthPath = dateImageDirectory(rootPath, dateValue);
  fs.mkdirSync(monthPath, { recursive: true });

  const destinationPath = path.join(monthPath, `${parts.day}${extension}`);
  assertInsideRoot(rootPath, destinationPath);
  item.setSavePath(destinationPath);

  item.once('done', (_event, state) => {
    const result = {
      state,
      date: dateValue,
      destinationPath,
      scan: scanDailyFolder(rootPath),
    };
    pendingDownload = null;
    mainWindow?.webContents.send('daily:download-saved', result);
  });
}

function scanExistingDates(rootPath) {
  const dates = new Set();
  if (!fs.existsSync(rootPath)) return dates;

  for (const yearEntry of fs.readdirSync(rootPath, { withFileTypes: true })) {
    if (!yearEntry.isDirectory() || !/^\d{4}$/.test(yearEntry.name)) continue;
    const yearPath = path.join(rootPath, yearEntry.name);

    for (const monthEntry of fs.readdirSync(yearPath, { withFileTypes: true })) {
      if (!monthEntry.isDirectory()) continue;
      const monthIndex = MONTHS.indexOf(monthEntry.name.toLowerCase());
      if (monthIndex === -1) continue;
      const monthPath = path.join(yearPath, monthEntry.name);

      for (const fileEntry of fs.readdirSync(monthPath, { withFileTypes: true })) {
        if (!fileEntry.isFile() || !/\.(png|jpg|jpeg|webp)$/i.test(fileEntry.name)) continue;
        const day = Number(path.parse(fileEntry.name).name);
        if (!Number.isInteger(day) || day < 1 || day > 31) continue;
        dates.add(`${yearEntry.name}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
      }
    }
  }

  return dates;
}

function scanChallengeDates(rootPath) {
  const dates = new Set();
  const challengeRoot = defaultChallengeRoot(rootPath);
  if (!fs.existsSync(challengeRoot)) return dates;

  for (const yearEntry of fs.readdirSync(challengeRoot, { withFileTypes: true })) {
    if (!yearEntry.isDirectory() || !/^\d{4}$/.test(yearEntry.name)) continue;
    const yearPath = path.join(challengeRoot, yearEntry.name);

    for (const monthEntry of fs.readdirSync(yearPath, { withFileTypes: true })) {
      if (!monthEntry.isDirectory()) continue;
      const monthIndex = MONTHS.indexOf(monthEntry.name.toLowerCase());
      if (monthIndex === -1) continue;
      const monthPath = path.join(yearPath, monthEntry.name);

      for (const fileEntry of fs.readdirSync(monthPath, { withFileTypes: true })) {
        if (!fileEntry.isFile() || path.extname(fileEntry.name).toLowerCase() !== '.json') continue;
        const day = Number(path.parse(fileEntry.name).name);
        if (!Number.isInteger(day) || day < 1 || day > 31) continue;
        dates.add(`${yearEntry.name}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
      }
    }
  }

  return dates;
}

function scanDailyFolder(rootPath = defaultImagesRoot(), daysToInspect = 730) {
  const existingDates = scanExistingDates(rootPath);
  const challengeDates = scanChallengeDates(rootPath);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const missingDates = [];

  for (let offset = 0; offset < daysToInspect; offset += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    const dateValue = formatDate(date);
    if (!existingDates.has(dateValue)) missingDates.push(dateValue);
  }

  return {
    rootPath,
    challengeRoot: defaultChallengeRoot(rootPath),
    existingCount: existingDates.size,
    challengeCount: challengeDates.size,
    existingDates: Array.from(existingDates).sort(),
    challengeDates: Array.from(challengeDates).sort(),
    availableDates: Array.from(new Set([...existingDates, ...challengeDates])).sort(),
    nextMissingDates: missingDates,
    nextFiveMissing: missingDates.slice(0, 5),
  };
}

function assertInsideRoot(rootPath, destinationPath) {
  const resolvedRoot = path.resolve(rootPath);
  const resolvedDestination = path.resolve(destinationPath);
  const relative = path.relative(resolvedRoot, resolvedDestination);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Destination path is outside the selected image root.');
  }
}

ipcMain.handle('app:dashboard-url', () => dashboardUrl());
ipcMain.handle('daily:default-root', () => defaultImagesRoot());
ipcMain.handle('daily:scan', (_event, rootPath) => scanDailyFolder(rootPath || defaultImagesRoot()));

ipcMain.handle('daily:pick-root', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Select daily challenge images folder',
    defaultPath: defaultImagesRoot(),
    properties: ['openDirectory', 'createDirectory'],
  });

  if (result.canceled || !result.filePaths[0]) return null;
  return scanDailyFolder(result.filePaths[0]);
});

ipcMain.handle('daily:pick-image', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Select generated challenge image',
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] }],
  });

  if (result.canceled || !result.filePaths[0]) return null;
  return result.filePaths[0];
});

ipcMain.handle('daily:import-image', async (_event, payload) => {
  const rootPath = payload.rootPath || defaultImagesRoot();
  const sourcePath = payload.sourcePath;
  const dateValue = payload.date;

  if (!sourcePath || !fs.existsSync(sourcePath)) throw new Error('Select a generated image first.');
  if (!dateValue) throw new Error('Choose the date to fill.');

  const parts = datePathParts(dateValue);
  const monthPath = path.join(rootPath, parts.year, parts.month);
  fs.mkdirSync(monthPath, { recursive: true });

  const sourceExtension = path.extname(sourcePath).toLowerCase();
  const extension = IMAGE_EXTENSIONS.includes(sourceExtension) ? sourceExtension : '.png';
  const destinationPath = path.join(monthPath, `${parts.day}${extension}`);
  assertInsideRoot(rootPath, destinationPath);
  fs.copyFileSync(sourcePath, destinationPath);

  return {
    destinationPath,
    scan: scanDailyFolder(rootPath),
    challenge: loadChallenge(rootPath, dateValue),
  };
});

ipcMain.handle('daily:prompt-pack', (_event, payload) => {
  if (!payload?.date) throw new Error('Choose a date first.');
  return buildPromptPack(payload.date);
});

ipcMain.handle('daily:load-challenge', (_event, payload) => {
  const rootPath = payload.rootPath || defaultImagesRoot();
  if (!payload.date) throw new Error('Choose a date first.');
  return loadChallenge(rootPath, payload.date);
});

ipcMain.handle('daily:save-questions', (_event, payload) => {
  const rootPath = payload.rootPath || defaultImagesRoot();
  if (!payload.date) throw new Error('Choose a date first.');
  if (!payload.text) throw new Error('Paste or capture the ChatGPT JSON answer first.');
  return saveChallengeQuestions(rootPath, payload.date, payload.text, payload.scenePrompt || "");
});

ipcMain.handle('daily:save-image-data', (_event, payload) => {
  const rootPath = payload.rootPath || defaultImagesRoot();
  if (!payload.date) throw new Error('Choose a date first.');
  return saveImageData(rootPath, payload.date, payload.dataUrl);
});

ipcMain.handle('daily:read-image-base64', (_event, payload) => {
  const rootPath = payload.rootPath || defaultImagesRoot();
  if (!payload.date) throw new Error('Choose a date first.');
  const imagePath = findImagePath(rootPath, payload.date);
  if (!imagePath || !fs.existsSync(imagePath)) return null;
  const buffer = fs.readFileSync(imagePath);
  const ext = path.extname(imagePath).toLowerCase();
  const mime = ext === '.webp' ? 'image/webp' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
  return `data:${mime};base64,${buffer.toString('base64')}`;
});

ipcMain.handle('daily:set-pending-download', (_event, payload) => {
  const rootPath = payload.rootPath || defaultImagesRoot();
  if (!payload.date) throw new Error('Choose a date first.');
  pendingDownload = {
    rootPath,
    date: payload.date,
  };
  return { ok: true, date: payload.date };
});

ipcMain.handle('clipboard:write-text', (_event, text) => {
  clipboard.writeText(String(text || ''));
  return { ok: true };
});

ipcMain.handle('chat:reset-session', async () => {
  const chatSession = session.fromPartition('persist:photo-memory-chatgpt');
  await chatSession.clearCache();
  await chatSession.clearStorageData();
  return { ok: true };
});

ipcMain.handle('chat:open-chrome', (_event, url) => openInChrome(url || CHATGPT_LOGIN_URL));

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
