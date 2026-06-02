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

function defaultLineItUpImagesRoot() {
  return path.resolve(__dirname, '..', 'content', 'line-it-up-daily-challenges', 'images');
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
  const defaultUA = chatSession.getUserAgent();
  const cleanUA = defaultUA
    .replace(/Electron\/\S+\s?/g, '')
    .replace(/PhotoMemory\/\S+\s?/g, '')
    .replace(/electron-admin\/\S+\s?/g, '');
  
  chatSession.setUserAgent(cleanUA);

  chatSession.webRequest.onBeforeSendHeaders((details, callback) => {
    const requestHeaders = {
      ...details.requestHeaders,
      'User-Agent': cleanUA,
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

  function hashDate(str) {
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }

    return Math.abs(hash);
  }

  const LOCATIONS = [
    'tiny apartment kitchen',
    'retro arcade',
    'school classroom',
    'supermarket aisle',
    'family garage',
    'beach picnic',
    'library reading area',
    'camping tent',
    'bakery counter',
    'train station waiting area',
    'pet shop',
    'toy store',
    'music studio',
    'office break room',
    'rooftop garden',
    'museum gift shop',
    'small convenience store',
    'food truck area',
    'art classroom',
    'messy living room',
    'flea market stall',
    'bus stop',
    'garden shed',
    'birthday party table',
    'old attic',
    'school cafeteria'
  ];

  const MOODS = [
    'warm sunset',
    'rainy afternoon',
    'bright sunny morning',
    'cozy evening',
    'cloudy daytime',
    'golden hour',
    'late night',
    'soft morning light'
  ];

  const ACTIVITIES = [
    'preparing for a birthday',
    'cleaning up after a meal',
    'working on a school project',
    'packing for a trip',
    'repairing something',
    'setting up decorations',
    'preparing food',
    'sorting old objects',
    'getting ready for a picnic',
    'organizing supplies',
    'taking a break',
    'shopping for groceries',
    'playing a board game',
    'painting something',
    'fixing a bicycle',
    'building a toy',
    'watering plants',
    'feeding pets',
    'doing laundry',
    'making coffee',
    'reading quietly',
    'studying for a test',
    'wrapping gifts',
    'moving into a new place',
    'searching for something lost',
    'decorating cookies',
    'making pizza',
    'assembling furniture',
    'cleaning after a party',
    'hosting a movie night',
    'playing video games',
    'taking photos',
    'drawing cartoons',
    'preparing camping gear',
    'washing a car',
    'repairing electronics',
    'setting up a yard sale',
    'getting ready for school',
    'preparing breakfast',
    'painting a wall',
    'organizing books',
    'building a science project',
    'writing letters',
    'packing lunch',
    'gardening',
    'getting ready for Halloween',
    'setting up holiday decorations',
    'preparing for a concert',
    'making crafts',
    'training a pet',
    'making smoothies',
    'playing music',
    'building a puzzle',
    'hosting a game night',
    'getting ready for a beach day',
    'making popcorn',
    'cleaning a fish tank',
    'taking care of plants',
    'decorating a classroom',
    'repairing a skateboard',
    'preparing for a storm',
    'setting up fireworks',
    'painting miniatures',
    'baking bread',
    'making sandwiches',
    'fixing plumbing',
    'organizing toys',
    'preparing a surprise',
    'making ice cream',
    'preparing art supplies',
    'setting up a picnic',
    'feeding birds',
    'taking care of a sick pet',
    'building a robot',
    'practicing magic tricks',
    'setting up a birthday cake',
    'making hot chocolate',
    'preparing a barbecue',
    'fixing a lamp',
    'testing inventions',
    'watching the rain',
    'setting up a treasure hunt',
    'repairing old furniture',
    'preparing gardening tools',
    'doing homework',
    'making decorations',
    'planning a road trip',
    'packing moving boxes',
    'setting up a camera',
    'playing cards',
    'cleaning sports equipment',
    'getting ready for visitors',
    'preparing party snacks',
    'painting signs',
    'washing dishes',
    'building a blanket fort',
    'taking care of baby animals',
    'restocking shelves',
    'testing recipes'
  ];

  const ANIMALS = [
    'orange cat',
    'sleepy dog',
    'small hamster',
    'green parrot',
    'goldfish',
    'tiny turtle',
    'white rabbit',
    'black cat',
    'golden retriever',
    'duckling',
    'baby chick',
    'brown owl',
    'playful corgi',
    'striped kitten',
    'tiny frog',
    'raccoon',
    'hedgehog',
    'ferret',
    'goat',
    'pony',
    'seagull',
    'pigeon',
    'crow',
    'penguin',
    'red panda',
    'fox',
    'shiba inu',
    'beagle',
    'dalmatian',
    'tabby cat',
    'calico cat',
    'mouse',
    'gecko',
    'iguana',
    'crab',
    'seahorse',
    'butterfly',
    'bee',
    'ladybug',
    'snail',
    'squirrel',
    'chipmunk',
    'koala',
    'sloth',
    'alpaca',
    'llama',
    'piglet',
    'cow',
    'sheep',
    'deer',
    'baby dinosaur toy made to look alive'
  ];

  const seed = hashDate(dateValue);

  const location = LOCATIONS[seed % LOCATIONS.length];
  const mood = MOODS[(seed * 7) % MOODS.length];
  const activity = ACTIVITIES[(seed * 13) % ACTIVITIES.length];

  const animalCount = seed % 3;

  const selectedAnimals = [];

  for (let i = 0; i < animalCount; i++) {
    selectedAnimals.push(
      ANIMALS[(seed * (i + 5)) % ANIMALS.length]
    );
  }

  const scenePrompt = [
    `Create the image-generation prompt for one Photo Memory daily challenge for ${dateValue}.`,
    '',
    `The scene MUST take place inside or around a ${location}.`,
    `The overall mood should feel like ${mood}.`,
    `The scene should imply that someone was ${activity}.`,
    '',
    ...(selectedAnimals.length > 0
      ? [`Include these animals naturally in the scene: ${selectedAnimals.join(', ')}.`]
      : []),
    '',
    'IMPORTANT:',
    'The image MUST stay VERY SIMPLE and EASY TO READ.',
    'Do NOT overcrowd the scene.',
    'Use NO MORE THAN 5 MAIN ELEMENTS OR FOCAL OBJECT GROUPS.',
    'The scene should feel more empty than full, with lots of negative space.',
    'The composition should be instantly understandable at a glance.',
    '',
    'Examples of main elements:',
    '- a table',
    '- a couch',
    '- a birthday cake',
    '- a pet',
    '- a backpack',
    '',
    'Small supporting details are allowed, but the scene should still feel visually clean.',
    '',
    'Include:',
    '- 8 to 12 total visible details',
    '- colorful objects',
    '- memorable object placements',
    '- environmental storytelling',
    '- one or two funny or unexpected details',
    '',
    'The scene should naturally support:',
    '- direct memory questions',
    '- contextual/common-sense questions',
    '',
    'Examples of contextual clues:',
    '- wet umbrella suggesting rain',
    '- birthday decorations suggesting a celebration',
    '- grocery bags suggesting shopping',
    '- packed luggage suggesting travel',
    '- beach towels suggesting swimming',
    '- burnt toast suggesting cooking failed',
    '',
    'Avoid visual clutter.',
    'Avoid crowded environments.',
    'Avoid tiny unreadable details.',
    'Avoid repeating laundromats, cafes, coffee shops, or plain bedrooms.',
    '',
    'Every daily challenge must feel unique and visually distinct.',
    '',
    'Use a flat vintage rubberhose colorful cartoony style.',
    'Consistent retro art style.',
    'Warm lighting.',
    'Clean composition.',
    'Simple readable shapes.',
    'No text labels.',
    'No logos.',
    'No UI.',
    '',
    'Return ONLY the final image-generation prompt as plain text.',
    'Do not generate questions yet.'
  ].join('\n');

  const questionsPrompt = [
    `Using the image you generated for ${dateValue}, create between 3 and 6 multiple-choice memory questions.`,
    '',
    'Mix different question TYPES.',
    '',
    'Some questions should be DIRECT MEMORY questions:',
    '- colors',
    '- positions',
    '- quantities',
    '- visible objects',
    '- animals',
    '',
    'Some questions should be CONTEXTUAL or COMMON-SENSE questions:',
    '- what someone was probably doing',
    '- what likely happened recently',
    '- what the environment suggests',
    '- deductions based on visible clues',
    '',
    'Examples:',
    '- "Why were there beach towels near the chairs?"',
    '- "What suggests it had been raining?"',
    '- "What was someone most likely preparing for?"',
    '',
    'Do NOT make contextual questions ambiguous.',
    'The answer should feel obvious from the visual clues.',
    '',
    'Avoid repetitive "How many..." questions.',
    'Vary the question styles naturally.',
    '',
    'You MUST randomize the correct answer position.',
    'Do NOT always place the correct answer first.',
    '',
    'Return ONLY valid JSON wrapped EXACTLY like this:',
    '',
    '<TO COPY>',
    '{"questions":[{"question_text":"What was beside the red mug?","answers":[{"answer_text":"A blue notebook","is_correct":true},{"answer_text":"A green backpack","is_correct":false},{"answer_text":"A brass bell","is_correct":false},{"answer_text":"A toy plane","is_correct":false}]}]}',
    '</TO COPY>',
    '',
    'Each question must contain:',
    '- question_text',
    '- 4 answers',
    '- exactly 1 correct answer',
    '',
    'Do NOT include markdown codeblocks inside the tags.'
  ].join('\n');

  return {
    date: dateValue,
    seed,
    location,
    mood,
    activity,
    selectedAnimals,
    scenePrompt,
    imagePrompt: '',
    questionsPrompt,
    fullPrompt: [
      'Step 1 - ask ChatGPT to create the scene/image prompt:',
      scenePrompt,
      '',
      'Step 2 - send the generated prompt back to ChatGPT to create the image.',
      '',
      'Step 3 - after the image is finished, ask for challenge JSON:',
      questionsPrompt,
    ].join('\n')
  };
}

function buildLineItUpPromptPack(dateValue) {
  const ideaPrompt = [
    `Create one Line It Up daily challenge for ${dateValue}.`,
    '',
    'The player will see five generated image cards in a random order and must infer the hidden ordering rule.',
    '',
    'Requirements:',
    '- Pick one ordered idea with exactly five items.',
    '- Be creative with the domain: historical events, historical people, inventions, countries, cities, landmarks, geography, population, sports teams, World Cups/trophies, languages, space objects, cultural facts, famous works, or everyday objects are all allowed.',
    '- Do NOT make the order too obvious like oldest-to-newest, created first, a life cycle, recipe steps, alphabet order, or a timeline with dates in the item names.',
    '- Prefer hidden but fair clues that the player can discover by looking closely or thinking about the names: color grading, number of repeated visual details, shape complexity, amount of something shown, name length, first/last letter, syllables, category size, population, land area, trophy count, distance, height, depth, speed, rarity, usual size/weight/value, or another objective property.',
    '- It can still use history, people, countries, sports, or facts, but avoid the plain "what happened first" version unless the ordering clue is disguised in a more playful way.',
    '- The puzzle should feel surprising but reasonable. After the answer is revealed, the reaction should be "ohh, that makes sense", not "are you serious?"',
    '- The five images should look like a set, but they should not directly reveal the order by showing arrows, numbers, stages, progress, or labels. Subtle countable details or color shifts are allowed when they are the hidden clue.',
    '- The player-facing order_description must be a subtle clue, not the answer. Example: "Small clue: look for what quietly changes across the set."',
    '- Avoid expert-only trivia. A curious player should be able to reason it out or make a good guess.',
    '- Keep each item name short enough for a game card and do not put the ordering value in the item name.',
    '- Make the puzzle playful, visual, and satisfying.',
    '- Create an image prompt for ONE single 1x5 horizontal strip made of five square icon panels.',
    '- Each panel must be a separate square rounded-corner icon card so the app can slice the strip into five square images.',
    '- All five icons must share the same style, scale, lighting, line weight, and camera angle.',
    '- Art style must match the provided coffee mug icon: flat cartoony illustration, rounded-corner colored tile/box, centered simple subject, clean dark outline, soft flat shading, warm highlight, polished casual game asset.',
    '- The rounded square tile/card must have NO outline, NO border, and NO stroke around its edge. The centered subject may have a clean dark outline.',
    '- Transparent outside the rounded cards. No full scene. No text labels. No numbers. No arrows. No UI. No logos.',
    '',
    'Return ONLY valid JSON wrapped EXACTLY like this:',
    '',
    '<TO COPY>',
    '{"theme":"Market Treats by Hidden Count","order_description":"Small clue: count what quietly repeats.","items":["Lemon Tart","Berry Pie","Apple Basket","Orange Stand","Grape Bowl"],"image_prompt":"Create one 1x5 horizontal strip of five separate square rounded-corner icon cards in this exact order: Lemon Tart, Berry Pie, Apple Basket, Orange Stand, Grape Bowl. Hide the order through countable details: the lemon tart has 1 small lemon slice, the berry pie has 2 berries, the apple basket has 3 apples, the orange stand has 4 oranges, and the grape bowl has 5 grape clusters. Each card has transparent background outside the rounded tile, a simple warm flat colored tile inside, and a centered cartoony subject. The rounded tile itself has no outline, no border, and no stroke. Match the attached coffee mug icon style: flat cartoony illustration, clean dark subject outline, subtle flat shading, warm highlight, consistent scale and camera angle, no text, no numbers, no arrows, no labels, no UI, no logos."}',
    '</TO COPY>',
    '',
    'Do not generate the image yet.'
  ].join('\n');

  return {
    date: dateValue,
    scenePrompt: ideaPrompt,
    questionsPrompt: '',
    fullPrompt: [
      'Step 1 - ask ChatGPT to create the ordered Line It Up idea JSON:',
      ideaPrompt,
      '',
      'Step 2 - send the returned image_prompt back to ChatGPT to generate one 1x5 horizontal strip.',
      '',
      'Step 3 - the app captures the image, slices it into five panels, and uploads the Line It Up daily challenge.',
    ].join('\n')
  };
}

function loadChallenge(rootPath, dateValue, mode = 'daily') {
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
    promptPack: mode === 'line-it-up' ? buildLineItUpPromptPack(dateValue) : buildPromptPack(dateValue),
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

function saveLineItUpChallengeData(rootPath, dateValue, plan, dataUrl) {
  const match = String(dataUrl || '').match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error('ChatGPT image capture did not return image data.');
  if (!plan?.theme || !plan?.order_description || !Array.isArray(plan.items) || plan.items.length !== 5) {
    throw new Error('Line It Up plan must include theme, order_description, and five items.');
  }

  const mimeType = match[1].toLowerCase();
  const extension = mimeType.includes('webp')
    ? '.webp'
    : mimeType.includes('jpeg') || mimeType.includes('jpg')
      ? '.jpg'
      : '.png';
  const parts = datePathParts(dateValue);
  const monthPath = dateImageDirectory(rootPath, dateValue);
  fs.mkdirSync(monthPath, { recursive: true });

  const imagePath = path.join(monthPath, `${parts.day}${extension}`);
  assertInsideRoot(rootPath, imagePath);
  fs.writeFileSync(imagePath, Buffer.from(match[2], 'base64'));

  const jsonPath = challengeJsonPath(rootPath, dateValue);
  fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
  const challenge = {
    challenge_date: dateValue,
    theme: plan.theme,
    order_description: plan.order_description,
    items: plan.items.map((name, index) => ({
      name,
      correct_index: index,
    })),
    prompt: plan.image_prompt || null,
    image_path: path.relative(rootPath, imagePath).replace(/\\/g, '/'),
    image_file: imagePath,
    created_at: new Date().toISOString(),
    source: 'chatgpt-webview',
  };

  fs.writeFileSync(jsonPath, `${JSON.stringify(challenge, null, 2)}\n`);

  return {
    destinationPath: imagePath,
    jsonPath,
    scan: scanDailyFolder(rootPath),
    challenge: loadChallenge(rootPath, dateValue, 'line-it-up'),
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
ipcMain.handle('daily:default-root', (_event, mode) => (
  mode === 'line-it-up' ? defaultLineItUpImagesRoot() : defaultImagesRoot()
));
ipcMain.handle('daily:scan', (_event, rootPath, mode) => {
  const fallbackRoot = mode === 'line-it-up' ? defaultLineItUpImagesRoot() : defaultImagesRoot();
  return scanDailyFolder(rootPath || fallbackRoot);
});

ipcMain.handle('daily:pick-root', async (_event, mode) => {
  const isLineItUp = mode === 'line-it-up';
  const result = await dialog.showOpenDialog({
    title: isLineItUp ? 'Select Line It Up daily challenge images folder' : 'Select daily challenge images folder',
    defaultPath: isLineItUp ? defaultLineItUpImagesRoot() : defaultImagesRoot(),
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
  return payload.mode === 'line-it-up'
    ? buildLineItUpPromptPack(payload.date)
    : buildPromptPack(payload.date);
});

ipcMain.handle('daily:load-challenge', (_event, payload) => {
  const rootPath = payload.rootPath || (payload.mode === 'line-it-up' ? defaultLineItUpImagesRoot() : defaultImagesRoot());
  if (!payload.date) throw new Error('Choose a date first.');
  return loadChallenge(rootPath, payload.date, payload.mode || 'daily');
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

ipcMain.handle('line-it-up:save-challenge-data', (_event, payload) => {
  const rootPath = payload.rootPath || defaultLineItUpImagesRoot();
  if (!payload.date) throw new Error('Choose a date first.');
  return saveLineItUpChallengeData(rootPath, payload.date, payload.plan, payload.dataUrl);
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
