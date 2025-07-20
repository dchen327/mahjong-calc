import 'webextension-polyfill';
import { exampleThemeStorage } from '@extension/storage';

// Only allow side panel for specific sites
const ALLOWED_ORIGINS = ['https://mahjongsoft.com', 'https://playmahjong.io'];

chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (!tab.url) return;
  const url = new URL(tab.url);
  if (ALLOWED_ORIGINS.includes(url.origin)) {
    await chrome.sidePanel.setOptions({
      tabId,
      path: 'side-panel/index.html',
      enabled: true,
    });
  } else {
    await chrome.sidePanel.setOptions({
      tabId,
      enabled: false,
    });
  }
});

exampleThemeStorage.get().then(theme => {
  console.log('theme', theme);
});

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(error => console.error(error));

console.log('Background loaded');
console.log("Edit 'chrome-extension/src/background/index.ts' and save to reload.");
