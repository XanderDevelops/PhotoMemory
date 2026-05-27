const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('photoMemoryAdmin', {
  dashboardUrl: () => ipcRenderer.invoke('app:dashboard-url'),
  defaultDailyRoot: () => ipcRenderer.invoke('daily:default-root'),
  scanDailyFolder: (rootPath) => ipcRenderer.invoke('daily:scan', rootPath),
  pickDailyRoot: () => ipcRenderer.invoke('daily:pick-root'),
  pickImage: () => ipcRenderer.invoke('daily:pick-image'),
  importImage: (payload) => ipcRenderer.invoke('daily:import-image', payload),
  buildPromptPack: (payload) => ipcRenderer.invoke('daily:prompt-pack', payload),
  loadChallenge: (payload) => ipcRenderer.invoke('daily:load-challenge', payload),
  saveQuestions: (payload) => ipcRenderer.invoke('daily:save-questions', payload),
  saveImageData: (payload) => ipcRenderer.invoke('daily:save-image-data', payload),
  readImageBase64: (payload) => ipcRenderer.invoke('daily:read-image-base64', payload),
  setPendingDownload: (payload) => ipcRenderer.invoke('daily:set-pending-download', payload),
  copyText: (text) => ipcRenderer.invoke('clipboard:write-text', text),
  resetChatSession: () => ipcRenderer.invoke('chat:reset-session'),
  openChatInChrome: (url) => ipcRenderer.invoke('chat:open-chrome', url),
  onDownloadSaved: (callback) => {
    ipcRenderer.removeAllListeners('daily:download-saved');
    ipcRenderer.on('daily:download-saved', (_event, payload) => callback(payload));
  }
});
