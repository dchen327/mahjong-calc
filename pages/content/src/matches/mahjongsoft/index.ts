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
// Row 1 is for declared sets
const parseRow1 = (table: HTMLTableElement): string[][] => {
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

// Row 2 is for concealed tiles and winning tile
const parseRow2 = (
  table: HTMLTableElement,
): { concealedTiles: string[]; winningTile: string | null; winFromWall: boolean } => {
  const concealedTiles: string[] = [];
  let winningTile: string | null = null;
  let winFromWall = false;

  const rows = table.querySelectorAll('tr');
  if (rows.length < 2) return { concealedTiles, winningTile, winFromWall };
  const tds = Array.from(rows[1].querySelectorAll('td'));

  let foundInterset = false;
  for (let i = 0; i < tds.length; i++) {
    const td = tds[i];
    if (td.querySelector('.interset')) {
      foundInterset = true;
      continue;
    }
    const tileDiv = td.querySelector<HTMLDivElement>('.tile');
    if (tileDiv && tileDiv.style.display !== 'none') {
      const bgPos = tileDiv.style.backgroundPosition;
      const x = bgPos.split(' ')[0].replace('px', '');
      const index = parseInt(x) / -50;
      const card = cards[index] || 'unknown';
      if (!foundInterset) {
        if (card !== 'blank') {
          concealedTiles.push(card);
        }
      } else {
        // First visible tile after interset is the winning tile
        winningTile = card;
        break; // Only one winning tile expected
      }
    }
  }

  const fromWallSpan = document.getElementById('from_wall');
  winFromWall = fromWallSpan?.classList.contains('selected') ?? false;

  return { concealedTiles, winningTile, winFromWall };
};

// Row 3 is for round wind, seat wind, and other winning flags
const parseRow3 = (
  table: HTMLTableElement,
): {
  roundWind: string | null;
  seatWind: string | null;
  lastTileInGame: boolean;
  lastTileOfKind: boolean;
  replacementTile: boolean;
  robbingTheKong: boolean;
} => {
  let roundWind: string | null = null;
  let seatWind: string | null = null;
  let lastTileInGame = false;
  let lastTileOfKind = false;
  let replacementTile = false;
  let robbingTheKong = false;

  // Parse round wind and seat wind from the first two .tile divs
  const roundWindDiv = table.querySelector<HTMLDivElement>('#round_wind');
  const seatWindDiv = table.querySelector<HTMLDivElement>('#seat_wind');
  if (roundWindDiv && roundWindDiv.style.display !== 'none') {
    const bgPos = roundWindDiv.style.backgroundPosition;
    const x = bgPos.split(' ')[0].replace('px', '');
    const index = parseInt(x) / -50;
    roundWind = cards[index] || null;
  }
  if (seatWindDiv && seatWindDiv.style.display !== 'none') {
    const bgPos = seatWindDiv.style.backgroundPosition;
    const x = bgPos.split(' ')[0].replace('px', '');
    const index = parseInt(x) / -50;
    seatWind = cards[index] || null;
  }

  // Parse checkboxes
  lastTileInGame = !!table.querySelector<HTMLInputElement>('#last_tile_game')?.checked;
  lastTileOfKind = !!table.querySelector<HTMLInputElement>('#last_tile_kind')?.checked;
  replacementTile = !!table.querySelector<HTMLInputElement>('#out_replacement')?.checked;
  robbingTheKong = !!table.querySelector<HTMLInputElement>('#robbing_kong')?.checked;

  return { roundWind, seatWind, lastTileInGame, lastTileOfKind, replacementTile, robbingTheKong };
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

    let declaredSets: string[][] = [];
    let concealedTiles: string[] = [];
    let winningTile: string = 'unknown';
    let winFromWall = false;
    let winFromDiscard = false;
    let roundWind: string | null = null;
    let seatWind: string | null = null;
    let lastTileInGame = false;
    let lastTileOfKind = false;
    let replacementTile = false;
    let robbingTheKong = false;

    if (targetTables.length > 0) {
      declaredSets = parseRow1(targetTables[0] as HTMLTableElement);
    }
    if (targetTables.length > 1) {
      const row2 = parseRow2(targetTables[1] as HTMLTableElement);
      concealedTiles = row2.concealedTiles;
      winningTile = row2.winningTile || 'unknown'; // Default to 'unknown' if no winning tile found
      winFromWall = row2.winFromWall;
      winFromDiscard = !row2.winFromWall;
    }
    if (targetTables.length > 2) {
      const row3 = parseRow3(targetTables[2] as HTMLTableElement);
      roundWind = row3.roundWind;
      seatWind = row3.seatWind;
      lastTileInGame = row3.lastTileInGame;
      lastTileOfKind = row3.lastTileOfKind;
      replacementTile = row3.replacementTile;
      robbingTheKong = row3.robbingTheKong;
    }

    mahjongGameStateStorage.updateGameState({
      declaredSets,
      concealedTiles,
      winningTile,
      winFromWall,
      winFromDiscard,
      roundWind,
      seatWind,
      lastTileInGame,
      lastTileOfKind,
      replacementTile,
      robbingTheKong,
    });
  });

  targetTables.forEach(table => {
    observer.observe(table, observerConfig);
    console.log(`[CEB] Mutation Observer observing table:`, table);
  });
}
