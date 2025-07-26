import { handScoreStorage, mahjongGameStateStorage } from '@extension/storage';
import type { MahjongGameState } from '@extension/storage/lib/base';

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

let hasGameStarted = false;

const getCardFromTileDiv = (tileDiv: HTMLDivElement | null): string | null => {
  if (!tileDiv || tileDiv.style.display === 'none') return null;
  const x = tileDiv.style.backgroundPosition.split(' ')[0].replace('px', '');
  const index = parseInt(x) / -50;
  return cards[index] || 'unknown';
};

const parseRow1 = (table: HTMLTableElement): string[][] => {
  const sets: string[][] = [];
  let currentSet: string[] = [];
  const tds = table.querySelectorAll('tr')[1]?.querySelectorAll('td') ?? [];

  tds.forEach(td => {
    const tile = getCardFromTileDiv(td.querySelector('.tile'));
    if (tile) currentSet.push(tile);

    if (td.querySelector('.interset')) {
      if (!isAllBlank(currentSet)) sets.push(currentSet);
      currentSet = [];
    }
  });

  if (!isAllBlank(currentSet)) sets.push(currentSet);
  return sets;
};

const isAllBlank = (tiles: string[]) => tiles.length === 4 && tiles.every(tile => tile === 'blank');

const parseRow2 = (table: HTMLTableElement) => {
  const concealedTiles: string[] = [];
  let winningTile: string | null = null;
  let foundInterset = false;

  const tds = Array.from(table.querySelectorAll('tr')[1]?.querySelectorAll('td') ?? []);

  for (const td of tds) {
    if (td.querySelector('.interset')) {
      foundInterset = true;
      continue;
    }

    const tile = getCardFromTileDiv(td.querySelector('.tile'));
    if (!tile || tile === 'blank') continue;

    if (!foundInterset) concealedTiles.push(tile);
    else {
      winningTile = tile;
      break;
    }
  }

  const winFromWall = document.getElementById('from_wall')?.classList.contains('selected') ?? false;

  return { concealedTiles, winningTile, winFromWall };
};

const parseRow3 = (table: HTMLTableElement) => {
  const getWind = (id: string): string | null => {
    const tileDiv = table.querySelector<HTMLDivElement>(`#${id}`);
    return getCardFromTileDiv(tileDiv);
  };

  return {
    prevalentWind: getWind('round_wind'),
    seatWind: getWind('seat_wind'),
    lastTileInGame: !!table.querySelector<HTMLInputElement>('#last_tile_game')?.checked,
    lastTileOfKind: !!table.querySelector<HTMLInputElement>('#last_tile_kind')?.checked,
    replacementTile: !!table.querySelector<HTMLInputElement>('#out_replacement')?.checked,
    robbingTheKong: !!table.querySelector<HTMLInputElement>('#robbing_kong')?.checked,
  };
};

const handElement = document.getElementById('hand');
if (!handElement) {
  console.error('[CEB] Hand element not found. Cannot set up MutationObserver.');
} else {
  const [row1Table, row2Table, row3Table] = Array.from(handElement.querySelectorAll('table')).slice(0, 3);
  const observerConfig: MutationObserverInit = {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true,
  };

  let lastGameState: MahjongGameState | null = null;

  const observer = new MutationObserver(() => {
    console.log('[CEB] Detected DOM change in monitored tables. Updating game state.');

    const declaredSets = row1Table ? parseRow1(row1Table) : [];
    const { concealedTiles, winningTile, winFromWall } = row2Table
      ? parseRow2(row2Table)
      : {
          concealedTiles: [],
          winningTile: 'unknown',
          winFromWall: false,
        };
    const { prevalentWind, seatWind, lastTileInGame, lastTileOfKind, replacementTile, robbingTheKong } = row3Table
      ? parseRow3(row3Table)
      : {
          prevalentWind: null,
          seatWind: null,
          lastTileInGame: false,
          lastTileOfKind: false,
          replacementTile: false,
          robbingTheKong: false,
        };

    const newGameState: MahjongGameState = {
      declaredSets,
      concealedTiles,
      winningTile: winningTile ?? 'unknown',
      winFromWall,
      winFromDiscard: !winFromWall,
      prevalentWind,
      seatWind,
      lastTileInGame,
      lastTileOfKind,
      replacementTile,
      robbingTheKong,
    };

    const hasChanged = !lastGameState || JSON.stringify(lastGameState) !== JSON.stringify(newGameState);

    if (hasChanged) {
      mahjongGameStateStorage.updateGameState(newGameState);
      handScoreStorage
        .updateScore({ score: 0, matched: [] })
        .catch(error => console.error('Failed to reset hand score:', error));
      lastGameState = newGameState;
      hasGameStarted = true;
    }
  });

  [row1Table, row2Table, row3Table].forEach(table => {
    if (table) observer.observe(table, observerConfig);
  });
}

// Subscribe to handScoreStorage changes
handScoreStorage.subscribe(() => {
  const currentScore = handScoreStorage.getSnapshot();

  if (currentScore && currentScore.score > 0 && hasGameStarted) {
    const pointsInput = document.getElementById('points') as HTMLInputElement;
    if (pointsInput) {
      pointsInput.value = currentScore.score.toString();
      pointsInput.dispatchEvent(new Event('input', { bubbles: true }));
      const checkButton = document.getElementById('check_button') as HTMLButtonElement;
      if (checkButton) {
        checkButton.disabled = false;
        setTimeout(() => {
          checkButton.click();
        }, 20);
      }
    } else {
      console.warn('[CEB] Points input element not found');
    }
  }
});
