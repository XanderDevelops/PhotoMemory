const dashboardView = document.getElementById('dashboard-view');
const chatgptView = document.getElementById('chatgpt-view');
const assistantPane = document.getElementById('assistant-pane');
const imagesRootInput = document.getElementById('images-root');
const scanSummary = document.getElementById('scan-summary');
const missingDateSelect = document.getElementById('missing-date-select');
const challengeDateInput = document.getElementById('challenge-date');
const generateCountInput = document.getElementById('generate-count');
const scheduleAmountInput = document.getElementById('schedule-amount');
const scheduleUnitSelect = document.getElementById('schedule-unit');
const scheduleUnlimitedInput = document.getElementById('schedule-unlimited');
const promptPreview = document.getElementById('prompt-preview');
const scenePromptInput = document.getElementById('scene-prompt');
const sourceImageInput = document.getElementById('source-image');
const questionsJsonInput = document.getElementById('questions-json');
const importResult = document.getElementById('import-result');
const challengePreview = document.getElementById('challenge-preview');
const chatStatus = document.getElementById('chat-status');
const CHATGPT_LOGIN_URL = 'https://chatgpt.com/';

let scanState = null;
let activePromptPack = null;
let queueTimer = null;
let queueItems = [];
let queueRunning = false;
let chatReady = false;
let lastGoogleNoticeAt = 0;
let lastCapturedImageDataUrl = null;

function setStatus(message) {
  importResult.textContent = message;
}

function isGoogleAuthUrl(url = '') {
  return /accounts\.google\.com|\/signin\/oauth\/|GeneralOAuthFlow|client_id_not_found_in_session|unsupportedbrowser|oauth2\/v2\/auth/i.test(url);
}

function showGoogleLoginNotice(url = '') {
  const now = Date.now();
  if (now - lastGoogleNoticeAt < 1500) return;
  lastGoogleNoticeAt = now;

  if (/client_id_not_found_in_session/i.test(url)) {
    chatStatus.textContent = 'That Google login flow lost its original session. Click Reset, then start Google login again inside this ChatGPT pane.';
    return;
  }

  chatStatus.textContent = 'Continue Google login in this ChatGPT pane. Keep the login flow in one browser session.';
}

function selectedDate() {
  return challengeDateInput.value || missingDateSelect.value;
}

function delayMs() {
  const amount = Math.max(1, Number(scheduleAmountInput.value || 1));
  return amount * (scheduleUnitSelect.value === 'hours' ? 60 * 60 * 1000 : 60 * 1000);
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

async function copyText(text, successMessage = 'Copied.') {
  await window.photoMemoryAdmin.copyText(text || '');
  setStatus(successMessage);
}

async function waitForChatGPTReady(timeoutMs = 60000) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const url = chatgptView.getURL?.() || '';
    const loading = chatgptView.isLoading?.() || false;
    if (chatReady && url && !loading) return;
    chatStatus.textContent = `Waiting for ChatGPT to be ready... ${formatDuration(timeoutMs - (Date.now() - start))}`;
    await wait(700);
  }

  throw new Error('ChatGPT is not ready yet. Reload the ChatGPT pane or log in first.');
}

async function runChatGPTScript(script, label) {
  await waitForChatGPTReady();

  try {
    const result = await chatgptView.executeJavaScript(script, true);
    if (result?.ok === false) {
      throw new Error(result.error || 'Unknown ChatGPT page error.');
    }
    return result?.ok === true ? result.value : result;
  } catch (error) {
    const message = error?.message || String(error);
    throw new Error(`${label}: ${message}`);
  }
}

async function buildPromptPack(date = selectedDate()) {
  if (!date) return null;
  activePromptPack = await window.photoMemoryAdmin.buildPromptPack({ date });
  promptPreview.value = activePromptPack.fullPrompt;
  if (!scenePromptInput.value.trim()) {
    scenePromptInput.placeholder = activePromptPack.scenePrompt;
  }
  return activePromptPack;
}

function renderScan(scan) {
  scanState = scan;
  imagesRootInput.value = scan.rootPath;
  const missing = scan.nextMissingDates || [];
  scanSummary.textContent = [
    `${scan.existingCount} images`,
    `${scan.challengeCount || 0} saved challenge JSON files`,
    `Next missing: ${scan.nextFiveMissing.join(', ') || 'none found'}`,
  ].join('. ');

  missingDateSelect.innerHTML = missing.slice(0, 365)
    .map((date) => `<option value="${date}">${date}</option>`)
    .join('');

  if (!challengeDateInput.value && missing[0]) {
    challengeDateInput.value = missing[0];
  }

  buildPromptPack().catch((error) => setStatus(error.message || String(error)));
}

function renderChallenge(challenge) {
  const questions = challenge.challenge?.questions || [];
  const imageHtml = challenge.imageUrl
    ? `<img src="${challenge.imageUrl}" alt="Daily challenge ${challenge.date}" />`
    : '<p>No image found for this date yet.</p>';
  const questionHtml = questions.length
    ? `<ol>${questions.map((question) => `<li>${question.question_text}</li>`).join('')}</ol>`
    : '<p>No saved questions JSON for this date yet.</p>';

  challengePreview.innerHTML = [
    `<strong>${challenge.date}</strong>`,
    imageHtml,
    `<small>${challenge.imagePath || 'No image path'}</small>`,
    `<small>${challenge.jsonExists ? challenge.jsonPath : 'No challenge JSON yet'}</small>`,
    questionHtml,
  ].join('');
}

async function scanFolder(rootPath) {
  const scan = await window.photoMemoryAdmin.scanDailyFolder(rootPath || imagesRootInput.value);
  renderScan(scan);
  return scan;
}

async function loadChallengeForSelectedDate() {
  const date = selectedDate();
  if (!date) return;
  const challenge = await window.photoMemoryAdmin.loadChallenge({
    rootPath: imagesRootInput.value,
    date,
  });
  renderChallenge(challenge);
  promptPreview.value = challenge.promptPack.fullPrompt;
  activePromptPack = challenge.promptPack;
}

async function sendPromptToChatGPT(prompt) {
  if (!prompt) throw new Error('No prompt ready.');

  // Wait for any active ChatGPT response generation to finish (up to 15 seconds)
  const waitScript = `
    (async () => {
      const getStopButton = () => 
        document.querySelector('[data-testid="stop-button"]') || 
        document.querySelector('button[aria-label*="Stop"]') ||
        document.querySelector('button[aria-label*="stop"]');
      
      let start = Date.now();
      while (Date.now() - start < 15000) {
        if (!getStopButton()) break;
        await new Promise(r => setTimeout(r, 500));
      }
      // Give React page state another second to settle
      await new Promise(r => setTimeout(r, 1000));
      return true;
    })();
  `;
  await runChatGPTScript(waitScript, 'Wait for ChatGPT idle');

  const script = `
    (async () => {
      try {
        const prompt = ${JSON.stringify(prompt)};
        const editor =
          document.querySelector('#prompt-textarea') ||
          document.querySelector('[data-testid="composer-input"]') ||
          document.querySelector('[contenteditable="true"]') ||
          document.querySelector('textarea');

        if (!editor) {
          return { ok: false, error: 'Could not find the ChatGPT message box. Log in or reload ChatGPT first.' };
        }

        editor.focus();
        
        // Clear any existing text first
        if (editor.tagName === 'TEXTAREA') {
          editor.value = '';
          const valueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
          if (valueSetter) valueSetter.call(editor, '');
          editor.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
          editor.textContent = '';
          document.execCommand('selectAll', false, null);
          document.execCommand('delete', false, null);
        }
        
        await new Promise(r => setTimeout(r, 200));

        // Insert new prompt text
        if (editor.tagName === 'TEXTAREA') {
          editor.value = prompt;
          const valueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
          if (valueSetter) {
            valueSetter.call(editor, prompt);
          }
          editor.dispatchEvent(new Event('input', { bubbles: true }));
          editor.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
          document.execCommand('insertText', false, prompt);
          editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: prompt }));
          editor.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // Wait brief moment for React state to digest the change
        await new Promise(r => setTimeout(r, 300));

        const selectors = [
          '#composer-submit-button',
          '[data-testid="send-button"]',
          'button[aria-label*="Send"]',
          'button[aria-label*="send"]',
          'button[aria-label*="Enviar"]',
          'button[aria-label*="enviar"]',
          'button.composer-submit-btn',
          'button.composer-submit-button-color'
        ];
        const sendButton =
          selectors.map((selector) => document.querySelector(selector)).find(Boolean) ||
          Array.from(document.querySelectorAll('button')).find((button) => {
            const label = (button.getAttribute('aria-label') || button.id || button.className || button.textContent || '').toLowerCase();
            return label.includes('send') || label.includes('submit') || label.includes('enviar') || label.includes('composer-submit');
          });

        if (sendButton) {
          sendButton.removeAttribute('disabled');
          sendButton.click();
        }
        
        // Dispatch Enter key as an direct alternative/fallback
        const enterEvent = new KeyboardEvent('keydown', {
          bubbles: true,
          cancelable: true,
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          which: 13
        });
        editor.dispatchEvent(enterEvent);

        return { ok: true, value: true };
      } catch (error) {
        return { ok: false, error: error.message || String(error) };
      }
    })();
  `;

  await runChatGPTScript(script, 'Send prompt to ChatGPT');
}

async function getLatestAssistantText() {
  const script = `
    (() => {
      try {
        const nodes = Array.from(document.querySelectorAll('[data-message-author-role="assistant"], article, main [role="article"]'));
        const textNode = nodes.reverse().find((node) => (node.innerText || '').trim().length > 40);
        return { ok: true, value: textNode ? textNode.innerText.trim() : '' };
      } catch (error) {
        return { ok: false, error: error.message || String(error) };
      }
    })();
  `;
  return runChatGPTScript(script, 'Read latest ChatGPT answer');
}

async function captureLatestAssistantText() {
  const text = await getLatestAssistantText();
  if (!text) throw new Error('No ChatGPT answer found yet.');
  return text;
}

async function waitForStableAssistantText(previousText, label, timeoutMs = 240000) {
  const start = Date.now();
  let lastText = '';
  let stableCount = 0;

  while (Date.now() - start < timeoutMs) {
    if (!queueRunning) {
      throw new Error('Auto queue stopped.');
    }

    const text = await getLatestAssistantText().catch(() => '');
    const normalizedText = String(text || '').trim();

    if (normalizedText && normalizedText !== previousText) {
      if (normalizedText === lastText) {
        stableCount += 1;
      } else {
        lastText = normalizedText;
        stableCount = 0;
      }

      if (stableCount >= 2) {
        return normalizedText;
      }
    }

    setStatus(`Waiting for ChatGPT ${label}... ${formatDuration(timeoutMs - (Date.now() - start))}`);
    await wait(3000);
  }

  throw new Error(`Timed out waiting for ChatGPT ${label}.`);
}

async function getLatestChatGPTImageInfo() {
  const script = `
    (() => {
      try {
        const images = Array.from(document.images)
          .filter((image) => image.naturalWidth >= 256 && image.naturalHeight >= 256);
        const image = images[images.length - 1];
        if (!image) return { ok: true, value: null };
        return {
          ok: true,
          value: {
            source: image.currentSrc || image.src || '',
            width: image.naturalWidth,
            height: image.naturalHeight,
            count: images.length
          }
        };
      } catch (error) {
        return { ok: false, error: error.message || String(error) };
      }
    })();
  `;
  return runChatGPTScript(script, 'Read latest ChatGPT image').catch(() => null);
}

async function waitForNewChatGPTImage(previousImage, timeoutMs = 360000) {
  const previousSource = previousImage?.source || '';
  const previousCount = previousImage?.count || 0;
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    if (!queueRunning) {
      throw new Error('Auto queue stopped.');
    }

    const image = await getLatestChatGPTImageInfo();
    if (image?.source && (image.source !== previousSource || image.count > previousCount)) {
      await wait(3500);
      return captureLatestChatGPTImage();
    }

    setStatus(`Waiting for ChatGPT image... ${formatDuration(timeoutMs - (Date.now() - start))}`);
    await wait(5000);
  }

  throw new Error('Timed out waiting for ChatGPT image.');
}

async function captureScenePrompt() {
  const text = await captureLatestAssistantText();
  scenePromptInput.value = text;
  setStatus('Scene/image prompt captured from ChatGPT.');
  return text;
}

async function captureLatestChatGPTAnswer() {
  const text = await captureLatestAssistantText();
  questionsJsonInput.value = text;
  return text;
}

async function captureLatestChatGPTImage() {
  const script = `
    (async () => {
      try {
        const images = Array.from(document.images)
          .filter((image) => image.naturalWidth >= 256 && image.naturalHeight >= 256);
        const image = images[images.length - 1];
        if (!image) return { ok: false, error: 'No generated image found in ChatGPT yet.' };

        const source = image.currentSrc || image.src;
        let blob = null;

        try {
          const response = await fetch(source);
          blob = await response.blob();
        } catch (_error) {
          const canvas = document.createElement('canvas');
          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;
          const context = canvas.getContext('2d');
          if (!context) return { ok: false, error: 'Could not create canvas to capture the image.' };
          context.drawImage(image, 0, 0);
          blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
        }

        if (!blob) return { ok: false, error: 'Could not read the generated image. Try using ChatGPT download; the app will rename it automatically.' };

        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        });

        return {
          ok: true,
          value: {
            dataUrl,
            width: image.naturalWidth,
            height: image.naturalHeight,
          }
        };
      } catch (error) {
        return { ok: false, error: error.message || String(error) };
      }
    })();
  `;
  const image = await runChatGPTScript(script, 'Capture ChatGPT image');
  lastCapturedImageDataUrl = image.dataUrl;
  const result = await window.photoMemoryAdmin.saveImageData({
    rootPath: imagesRootInput.value,
    date: selectedDate(),
    dataUrl: image.dataUrl,
  });
  renderScan(result.scan);
  renderChallenge(result.challenge);
  setStatus(`Captured ${image.width}x${image.height} image to ${result.destinationPath}`);
  return result;
}

async function sendScenePrompt() {
  const date = selectedDate();
  const pack = await buildPromptPack(date);
  await sendPromptToChatGPT(pack.scenePrompt);
  setStatus(`Scene prompt request sent for ${date}.`);
}

async function sendImagePrompt() {
  const date = selectedDate();
  const pack = await buildPromptPack(date);
  const scenePrompt = scenePromptInput.value.trim();
  if (!scenePrompt) {
    throw new Error('Capture or paste ChatGPT scene prompt first.');
  }
  await window.photoMemoryAdmin.setPendingDownload({
    rootPath: imagesRootInput.value,
    date,
  });
  await sendPromptToChatGPT([
    `Generate the Photo Memory daily challenge image for ${date} using this exact image prompt:`,
    scenePrompt,
    '',
    'Generate the image only. No questions yet.'
  ].join('\n'));
  setStatus(`Image prompt sent for ${date}. Download the generated image; it will save into that date folder.`);
}

async function sendQuestionsPrompt() {
  const date = selectedDate();
  const pack = await buildPromptPack(date);
  await sendPromptToChatGPT(pack.questionsPrompt);
  setStatus(`Questions prompt sent for ${date}.`);
}

function queueDates() {
  const missing = scanState?.nextMissingDates || [];
  const start = selectedDate();
  const startIndex = Math.max(0, missing.indexOf(start));
  const count = Math.max(1, Number(generateCountInput.value || 1));
  return missing.slice(startIndex, startIndex + count);
}

async function createFullChallenge(date) {
  challengeDateInput.value = date;
  scenePromptInput.value = '';
  questionsJsonInput.value = '';

  setStatus(`Starting full ChatGPT challenge for ${date}...`);
  await buildPromptPack(date);

  const beforeScene = await getLatestAssistantText().catch(() => '');
  await sendScenePrompt();
  const scenePrompt = await waitForStableAssistantText(beforeScene, 'scene prompt', 180000);
  scenePromptInput.value = scenePrompt;

  const beforeImage = await getLatestChatGPTImageInfo();
  await sendImagePrompt();
  await waitForNewChatGPTImage(beforeImage, 420000);

  const beforeQuestions = await getLatestAssistantText().catch(() => '');
  await sendQuestionsPrompt();
  const questionsText = await waitForStableAssistantText(beforeQuestions, 'questions JSON', 240000);
  questionsJsonInput.value = questionsText;

  const challenge = await window.photoMemoryAdmin.saveQuestions({
    rootPath: imagesRootInput.value,
    date,
    text: questionsText,
    scenePrompt,
  });
  renderChallenge(challenge);
  await scanFolder();
  setStatus(`Daily challenge complete locally for ${date}. Syncing to Supabase...`);
  await uploadChallengeToSupabase(date, challenge);
}

async function waitBetweenChallenges() {
  const total = delayMs();
  const start = Date.now();

  while (queueRunning && Date.now() - start < total) {
    setStatus(`Waiting before next challenge... ${formatDuration(total - (Date.now() - start))}`);
    await wait(1000);
  }
}

async function runQueue() {
  while (queueRunning) {
    if (!queueItems.length && scheduleUnlimitedInput.checked) {
      await scanFolder();
      queueItems = queueDates();
    }

    if (!queueItems.length) {
      stopQueue('Auto queue complete.');
      return;
    }

    const currentDate = queueItems.shift();
    try {
      await createFullChallenge(currentDate);
    } catch (error) {
      stopQueue(error.message || String(error));
      return;
    }

    if (queueRunning && (queueItems.length || scheduleUnlimitedInput.checked)) {
      await waitBetweenChallenges();
    }
  }
}

function stopQueue(message = 'Auto queue stopped.') {
  window.clearTimeout(queueTimer);
  queueTimer = null;
  queueRunning = false;
  queueItems = [];
  setStatus(message);
}

document.getElementById('reload-dashboard-btn').addEventListener('click', () => dashboardView.reload());
document.getElementById('reload-chat-btn').addEventListener('click', () => {
  chatStatus.textContent = 'Reloading ChatGPT...';
  chatgptView.loadURL(CHATGPT_LOGIN_URL);
});
document.getElementById('reset-chat-btn').addEventListener('click', async () => {
  chatStatus.textContent = 'Resetting ChatGPT session...';
  await window.photoMemoryAdmin.resetChatSession();
  chatgptView.loadURL(CHATGPT_LOGIN_URL);
});
document.getElementById('open-chat-chrome-btn').addEventListener('click', async () => {
  const result = await window.photoMemoryAdmin.openChatInChrome(CHATGPT_LOGIN_URL);
  chatStatus.textContent = result.browser === 'chrome'
    ? 'Opened ChatGPT in Google Chrome as a separate browser fallback. To sign in this pane, keep the login inside the pane.'
    : 'Chrome was not found, so ChatGPT opened in your default browser as a separate browser fallback.';
});
document.getElementById('toggle-chat-btn').addEventListener('click', () => assistantPane.classList.toggle('collapsed'));

document.getElementById('pick-root-btn').addEventListener('click', async () => {
  const scan = await window.photoMemoryAdmin.pickDailyRoot();
  if (scan) renderScan(scan);
});

document.getElementById('scan-btn').addEventListener('click', () => scanFolder());

missingDateSelect.addEventListener('change', () => {
  challengeDateInput.value = missingDateSelect.value;
  buildPromptPack().catch((error) => setStatus(error.message || String(error)));
});

challengeDateInput.addEventListener('change', () => {
  buildPromptPack().catch((error) => setStatus(error.message || String(error)));
});

document.getElementById('copy-prompt-btn').addEventListener('click', async () => {
  const pack = activePromptPack || await buildPromptPack();
  await copyText(pack.fullPrompt, 'Full prompt copied. Paste it into ChatGPT or use the send buttons.');
});

document.getElementById('send-scene-prompt-btn').addEventListener('click', () => {
  sendScenePrompt().catch((error) => setStatus(error.message || String(error)));
});

document.getElementById('capture-scene-prompt-btn').addEventListener('click', () => {
  captureScenePrompt().catch((error) => setStatus(error.message || String(error)));
});

document.getElementById('send-image-prompt-btn').addEventListener('click', () => {
  sendImagePrompt().catch((error) => setStatus(error.message || String(error)));
});

document.getElementById('send-questions-prompt-btn').addEventListener('click', () => {
  sendQuestionsPrompt().catch((error) => setStatus(error.message || String(error)));
});

document.getElementById('start-queue-btn').addEventListener('click', async () => {
  window.clearTimeout(queueTimer);
  queueItems = queueDates();
  queueRunning = true;
  setStatus('Starting auto queue...');
  await runQueue();
});

document.getElementById('stop-queue-btn').addEventListener('click', () => stopQueue());
document.getElementById('load-challenge-btn').addEventListener('click', () => {
  loadChallengeForSelectedDate().catch((error) => setStatus(error.message || String(error)));
});

document.getElementById('pick-image-btn').addEventListener('click', async () => {
  const imagePath = await window.photoMemoryAdmin.pickImage();
  if (imagePath) sourceImageInput.value = imagePath;
});

document.getElementById('import-image-btn').addEventListener('click', async () => {
  try {
    const result = await window.photoMemoryAdmin.importImage({
      rootPath: imagesRootInput.value,
      sourcePath: sourceImageInput.value,
      date: selectedDate(),
    });
    setStatus(`Imported to ${result.destinationPath}`);
    renderScan(result.scan);
    renderChallenge(result.challenge);
  } catch (error) {
    setStatus(error.message || String(error));
  }
});

document.getElementById('capture-image-btn').addEventListener('click', () => {
  captureLatestChatGPTImage().catch((error) => setStatus(error.message || String(error)));
});

document.getElementById('capture-questions-btn').addEventListener('click', async () => {
  try {
    await captureLatestChatGPTAnswer();
    setStatus('Latest ChatGPT answer captured.');
  } catch (error) {
    setStatus(error.message || String(error));
  }
});

document.getElementById('save-questions-btn').addEventListener('click', async () => {
  try {
    const challenge = await window.photoMemoryAdmin.saveQuestions({
      rootPath: imagesRootInput.value,
      date: selectedDate(),
      text: questionsJsonInput.value,
      scenePrompt: scenePromptInput.value.trim(),
    });
    renderChallenge(challenge);
    setStatus(`Saved questions JSON locally for ${challenge.date}. Syncing to Supabase...`);
    await uploadChallengeToSupabase(challenge.date, challenge);
  } catch (error) {
    setStatus(error.message || String(error));
  }
});

window.photoMemoryAdmin.onDownloadSaved((payload) => {
  if (payload.state === 'completed') {
    setStatus(`Downloaded image saved to ${payload.destinationPath}`);
    renderScan(payload.scan);
    loadChallengeForSelectedDate().catch(() => {});
  } else {
    setStatus(`Image download ${payload.state}.`);
  }
});

window.photoMemoryAdmin.dashboardUrl().then((url) => {
  dashboardView.src = url;
});

window.photoMemoryAdmin.defaultDailyRoot().then((rootPath) => {
  imagesRootInput.value = rootPath;
  scanFolder(rootPath);
});

chatgptView.addEventListener('did-start-loading', () => {
  chatReady = false;
  chatStatus.textContent = 'Loading ChatGPT...';
});

chatgptView.addEventListener('did-stop-loading', () => {
  chatReady = true;
  const url = chatgptView.getURL() || '';
  if (isGoogleAuthUrl(url)) {
    showGoogleLoginNotice(url);
    return;
  }
  chatStatus.textContent = `ChatGPT loaded: ${url || 'ready'}`;
});

chatgptView.addEventListener('dom-ready', () => {
  chatReady = true;
  const url = chatgptView.getURL() || '';
  if (isGoogleAuthUrl(url)) {
    showGoogleLoginNotice(url);
    return;
  }
  chatStatus.textContent = `ChatGPT ready: ${url || 'ready'}`;
});

chatgptView.addEventListener('did-fail-load', (event) => {
  const failedUrl = event.validatedURL || event.url || '';
  if (event.errorCode === -3 || isGoogleAuthUrl(failedUrl)) {
    return;
  }
  if (event.isMainFrame) {
    chatReady = false;
    chatStatus.textContent = `ChatGPT failed to load: ${event.errorDescription || event.errorCode}`;
  }
});

chatgptView.addEventListener('new-window', async (event) => {
  const url = event.url || '';
  if (isGoogleAuthUrl(url)) {
    event.preventDefault();
    showGoogleLoginNotice(url);
    chatgptView.loadURL(url);
  }
});

chatgptView.addEventListener('will-navigate', async (event) => {
  const url = event.url || '';
  if (isGoogleAuthUrl(url)) {
    showGoogleLoginNotice(url);
  }
});

chatgptView.addEventListener('did-navigate', async (event) => {
  const url = event.url || '';
  if (isGoogleAuthUrl(url)) {
    showGoogleLoginNotice(url);
  }
});

chatgptView.addEventListener('did-redirect-navigation', async (event) => {
  const url = event.newURL || event.url || '';
  if (isGoogleAuthUrl(url)) {
    showGoogleLoginNotice(url);
  }
});

async function uploadChallengeToSupabase(date, challengeResult) {
  try {
    setStatus(`Uploading challenge for ${date} to Supabase...`);
    
    if (!challengeResult?.challenge?.questions) {
      throw new Error('No parsed questions found in local challenge data.');
    }

    // Try reading base64 from disk or fallback to lastCapturedImageDataUrl
    let imageFile = null;
    let base64 = lastCapturedImageDataUrl || await window.photoMemoryAdmin.readImageBase64({
      rootPath: imagesRootInput.value,
      date: date
    });

    if (base64) {
      imageFile = {
        name: `${date}.png`,
        type: 'image/png',
        dataUrl: base64
      };
    }
    
    const challengeData = {
      id: null, // New challenge to insert
      challenge_date: date,
      image_path: `daily/${date}.png`, // standard path in bucket
      imageFile: imageFile,
      questions: challengeResult.challenge.questions
    };

    const uploadResult = await dashboardView.executeJavaScript(`
      (async () => {
        try {
          if (typeof api !== 'function') {
            throw new Error('Dashboard API function not found. Make sure you are logged in to the dashboard!');
          }
          const res = await api('saveDailyChallenge', {
            challenge: ${JSON.stringify(challengeData)}
          });
          // Refresh the dashboard data
          if (typeof loadAdminDashboard === 'function') {
            await loadAdminDashboard();
          }
          return { ok: true, res };
        } catch (err) {
          return { ok: false, error: err.message || String(err) };
        }
      })();
    `);

    if (!uploadResult?.ok) {
      throw new Error(uploadResult?.error || 'Failed to upload through dashboard webview.');
    }
    
    setStatus(`Challenge successfully synced to Supabase & game database for ${date}!`);
    lastCapturedImageDataUrl = null; // Clear image data after successful sync
  } catch (error) {
    setStatus(`Supabase Sync Warning: ${error.message}. Local files saved successfully.`);
    console.error('Supabase upload failed:', error);
  }
}

// --- Drag Resize Splitters ---
(() => {
  const desktopGrid = document.querySelector('.desktop-grid');
  const dividerVertical = document.getElementById('drag-divider-vertical');
  const assistantPane = document.getElementById('assistant-pane');
  
  const dividerHorizontal = document.getElementById('drag-divider-horizontal');
  const toolCard = document.querySelector('.tool-card');
  const chatPane = document.querySelector('.chat-pane');

  let isDraggingVertical = false;
  let isDraggingHorizontal = false;

  // Webview overlay fixes during drag (so webviews don't capture mouse events)
  function setPointerEvents(enable) {
    document.querySelectorAll('webview').forEach(webview => {
      webview.style.pointerEvents = enable ? 'auto' : 'none';
    });
  }

  // Vertical Dragging (Assistant Width)
  dividerVertical.addEventListener('mousedown', (e) => {
    isDraggingVertical = true;
    dividerVertical.classList.add('active');
    setPointerEvents(false);
    e.preventDefault();
  });

  // Horizontal Dragging (Chat vs Queue Generator Height)
  dividerHorizontal.addEventListener('mousedown', (e) => {
    isDraggingHorizontal = true;
    dividerHorizontal.classList.add('active');
    setPointerEvents(false);
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (isDraggingVertical) {
      const gridRect = desktopGrid.getBoundingClientRect();
      const newWidth = Math.max(300, Math.min(gridRect.width - 200, gridRect.right - e.clientX));
      desktopGrid.style.gridTemplateColumns = `1fr 6px ${newWidth}px`;
    }
    
    if (isDraggingHorizontal) {
      const paneRect = assistantPane.getBoundingClientRect();
      const relativeY = e.clientY - paneRect.top;
      const newHeight = Math.max(150, Math.min(paneRect.height - 150, relativeY));
      assistantPane.style.gridTemplateRows = `${newHeight}px auto 1fr`;
    }
  });

  document.addEventListener('mouseup', () => {
    if (isDraggingVertical) {
      isDraggingVertical = false;
      dividerVertical.classList.remove('active');
      setPointerEvents(true);
    }
    if (isDraggingHorizontal) {
      isDraggingHorizontal = false;
      dividerHorizontal.classList.remove('active');
      setPointerEvents(true);
    }
  });
})();
