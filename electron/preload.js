const { ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector);
    if (element) element.innerText = text;
  };

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type]);
  }
});

ipcRenderer.on('save-game', () => {
  window.dispatchEvent(new CustomEvent('save-game'));
});

ipcRenderer.on('load-game', () => {
  window.dispatchEvent(new CustomEvent('load-game'));
});

ipcRenderer.on('init-game', () => {
  window.dispatchEvent(new CustomEvent('init-game'));
});
