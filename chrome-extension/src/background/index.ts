import 'webextension-polyfill';
import { calculateMahjongScore } from '@extension/shared/lib/utils/mahjong';
import { handScoreStorage, mahjongGameStateStorage } from '@extension/storage';

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

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(error => console.error(error));
// Subscribe to mahjong game state storage changes
mahjongGameStateStorage.subscribe(() => {
  const currentGameState = mahjongGameStateStorage.getSnapshot();
  if (!currentGameState) {
    console.warn('No current Mahjong game state found.');
    return;
  }
  const score = calculateMahjongScore(currentGameState);
  handScoreStorage.updateScore(score).catch(error => console.error('Failed to update hand score:', error));
});

console.log('Background loaded');
console.log("Edit 'chrome-extension/src/background/index.ts' and save to reload.");
