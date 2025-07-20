import { mahjongGameStateStorage } from '@extension/storage';
import { sampleFunction } from '@src/sample-function';

console.log('[CEB] mahjong soft Example content script loaded');

void sampleFunction();

// Add a MutationObserver to watch for DOM changes and update game state
// We only want to observe changes in the first 3 tables of the hand
const handElement = document.getElementById('hand');
if (!handElement) {
  console.error('[CEB] Hand element not found. Cannot set up MutationObserver.');
} else {
  const allTables = handElement.querySelectorAll('table');
  const targetTables = Array.from(allTables).slice(0, 3);

  const observerConfig = {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true,
  };

  const observer = new MutationObserver(() => {
    console.log('[CEB] Detected DOM change in monitored tables. Updating game state.');

    mahjongGameStateStorage.updateGameState({
      declaredSets: [Math.floor(Math.random() * 1000).toString()],
    });
  });

  targetTables.forEach(table => {
    observer.observe(table, observerConfig);
    console.log(`[CEB] Mutation Observer observing table:`, table);
  });
}
