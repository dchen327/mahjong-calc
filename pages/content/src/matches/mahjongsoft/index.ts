import { mahjongGameStateStorage } from '@extension/storage';
import { sampleFunction } from '@src/sample-function';

console.log('[CEB] mahjong soft Example content script loaded');

void sampleFunction();

// Add a MutationObserver to watch for DOM changes and update game state
const observer = new MutationObserver(() => {
  // Example random update: toggle lastTileInGame
  mahjongGameStateStorage.updateGameState({
    declaredSets: [Math.floor(Math.random() * 1000).toString()],
  });
});

observer.observe(document.body, { childList: true, subtree: true });
