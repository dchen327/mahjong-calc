import { mahjongGameStateStorage } from '@extension/storage';

console.log('[CEB] mahjong soft content script loaded');

const cards = [
  'flipped',
  'bamboo-1',
  'bamboo-2',
  'bamboo-3',
  'bamboo-4',
  'bamboo-5',
  'bamboo-6',
  'bamboo-7',
  'bamboo-8',
  'bamboo-9',
  'wan-1',
  'wan-2',
  'wan-3',
  'wan-4',
  'wan-5',
  'wan-6',
  'wan-7',
  'wan-8',
  'wan-9',
  'circle-1',
  'circle-2',
  'circle-3',
  'circle-4',
  'circle-5',
  'circle-6',
  'circle-7',
  'circle-8',
  'circle-9',
  'wind-east',
  'wind-south',
  'wind-west',
  'wind-north',
  'dragon-red',
  'dragon-green',
  'dragon-white',
  'flower-1',
  'flower-2',
  'flower-3',
  'flower-4',
  'season-1',
  'season-2',
  'season-3',
  'season-4',
  'empty',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  'blank',
  'blank',
];

// Helper to parse declared sets from a table
// Card elements have background-position like "-50px 0px" for the 1 index tile
const parseDeclaredSets = (table: HTMLTableElement): string[][] => {
  const sets: string[][] = [];
  let currentSet: string[] = [];

  // Find all <td> in the second row (where the tiles and interset divs are)
  const rows = table.querySelectorAll('tr');
  if (rows.length < 2) return sets;
  const tds = rows[1].querySelectorAll('td');

  tds.forEach(td => {
    const tileDiv = td.querySelector<HTMLDivElement>('.tile');
    if (tileDiv && tileDiv.style.display !== 'none') {
      // Extract x from background-position: "-50px 0px"
      const bgPos = tileDiv.style.backgroundPosition;
      const x = bgPos.split(' ')[0].replace('px', '');
      const index = parseInt(x) / -50;
      currentSet.push(cards[index] || 'unknown');
    }
    if (td.querySelector('.interset')) {
      // End of a set, push and start a new one if not all blanks
      if (currentSet.length > 0 && !(currentSet.length === 4 && currentSet.every(card => card === 'blank'))) {
        sets.push(currentSet);
      }
      currentSet = [];
    }
  });
  // Push the last set if any and not all blanks
  if (currentSet.length > 0 && !(currentSet.length === 4 && currentSet.every(card => card === 'blank'))) {
    sets.push(currentSet);
  }

  return sets;
};

// Add a MutationObserver to watch for DOM changes and update game state
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

    const declaredSets: string[][] = [];
    if (targetTables.length > 0) {
      declaredSets.push(...parseDeclaredSets(targetTables[0] as HTMLTableElement));
    }

    mahjongGameStateStorage.updateGameState({
      declaredSets,
    });
  });

  targetTables.forEach(table => {
    observer.observe(table, observerConfig);
    console.log(`[CEB] Mutation Observer observing table:`, table);
  });
}
