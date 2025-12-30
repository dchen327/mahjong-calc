import { handScoreStorage, mahjongGameStateStorage } from '@extension/storage';
import type { MahjongGameState } from '@extension/storage/lib/base';

console.log('[CEB] mahjong soft content script loaded');

// 🧪 AUTO-TEST MODE: Set to true to automatically test hands until a wrong answer is found
const AUTO_TEST_MODE = true;
const AUTO_TEST_MAX_ITERATIONS = 10000;
const AUTO_TEST_DELAY_MS = 50;

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

// Parse expected answer from fans_table
const parseExpectedAnswer = () => {
  const fansTable = document.getElementById('fans_table');
  if (!fansTable) return null;

  const rows = Array.from(fansTable.querySelectorAll('tr'));
  const rules: { name: string; quantity: number; points: number }[] = [];
  let totalPoints = 0;

  for (const row of rows) {
    const cells = row.querySelectorAll('td');
    if (cells.length === 4) {
      const name = cells[1].textContent?.trim() || '';
      const quantity = parseInt(cells[2].textContent || '0');
      const points = parseInt(cells[3].textContent || '0');

      if (name === 'Total') {
        totalPoints = points;
      } else if (name && !name.includes('Fans')) {
        rules.push({ name, quantity, points });
      }
    }
  }

  return { rules, totalPoints };
};

// Monitor score element to detect when we get the answer wrong
let previousWrongCount = 0;

const scoreElement = document.getElementById('score');
if (scoreElement) {
  const scoreObserver = new MutationObserver(() => {
    const scoreText = scoreElement.textContent || '0:0';
    const [correct, wrong] = scoreText.split(':').map(Number);

    if (wrong > previousWrongCount) {
      // Wrong counter increased! Log the details
      const currentScore = handScoreStorage.getSnapshot();
      const currentGameState = mahjongGameStateStorage.getSnapshot();
      const expectedAnswer = parseExpectedAnswer();

      console.log('❌ WRONG ANSWER DETECTED ❌');
      console.log(`Score: Expected ${expectedAnswer?.totalPoints || '?'} vs Calculated ${currentScore?.score || 0}`);

      console.log('\n📊 YOUR CALCULATED RULES:');
      console.table(
        currentScore?.matched.map(rule => ({
          Name: rule.name,
          Quantity: rule.quant,
          Points: rule.points,
        })) || [],
      );

      if (expectedAnswer) {
        console.log('\n✅ MAHJONGSOFT EXPECTED RULES:');
        console.table(
          expectedAnswer.rules.map(rule => ({
            Name: rule.name,
            Quantity: rule.quantity,
            Points: rule.points,
          })),
        );
      }

      console.log('\n🔍 Game State:', currentGameState);

      previousWrongCount = wrong;
    } else if (correct > 0 || wrong > 0) {
      // Update tracking but don't log
      previousWrongCount = wrong;
    }
  });

  scoreObserver.observe(scoreElement, {
    childList: true,
    characterData: true,
    subtree: true,
  });

  console.log('[CEB] Score monitoring enabled. Wrong answers will be logged.');
}

// Auto-test mode: automatically click Next until we find a wrong answer
// Waits for user to click Next manually once, then takes over
if (AUTO_TEST_MODE && scoreElement) {
  let autoTestRunning = false;
  let autoTestIteration = 0;
  let autoTestInitialWrongCount = 0;
  let autoTestInitialized = false;

  const startAutoTest = () => {
    if (autoTestRunning) return;
    autoTestRunning = true;
    autoTestIteration = 0;

    // Get initial wrong count
    const initialScoreText = scoreElement.textContent || '0:0';
    const [, initialWrong] = initialScoreText.split(':').map(Number);
    autoTestInitialWrongCount = initialWrong;
    previousWrongCount = initialWrong;

    console.log(`🧪 AUTO-TEST MODE STARTED`);
    console.log(`Initial wrong count: ${initialWrong}`);
    console.log(`Max iterations: ${AUTO_TEST_MAX_ITERATIONS}`);
    console.log(`Delay between clicks: ${AUTO_TEST_DELAY_MS}ms`);

    const clickNext = async () => {
      if (autoTestIteration >= AUTO_TEST_MAX_ITERATIONS) {
        console.log(`🧪 AUTO-TEST COMPLETE: Reached max iterations (${AUTO_TEST_MAX_ITERATIONS})`);
        autoTestRunning = false;
        return;
      }

      // Wait for next button to become available (up to 5 seconds for slow hands like Nine Gates)
      let nextButton = document.getElementById('next_button') as HTMLButtonElement;
      let retries = 0;
      const maxRetries = 20;
      const retryDelay = 500;

      while ((!nextButton || nextButton.disabled) && retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        nextButton = document.getElementById('next_button') as HTMLButtonElement;
        retries++;
      }

      if (!nextButton || nextButton.disabled) {
        console.log(`🧪 AUTO-TEST STOPPED: Next button not available after ${maxRetries * retryDelay}ms wait`);
        autoTestRunning = false;
        return;
      }

      autoTestIteration++;

      // Click next button
      nextButton.click();

      // Wait for the extension to process (parse → calculate → auto-fill → check → score updates)
      // We wait a bit longer to ensure the score counter has time to update
      await new Promise(resolve => setTimeout(resolve, AUTO_TEST_DELAY_MS));

      // Check if wrong count increased (this means we found an error)
      const currentScoreText = scoreElement.textContent || '0:0';
      const [, currentWrong] = currentScoreText.split(':').map(Number);
      if (currentWrong > autoTestInitialWrongCount) {
        console.log(`🧪 AUTO-TEST STOPPED: Wrong answer detected at iteration ${autoTestIteration}`);
        autoTestRunning = false;
        return;
      }

      // Continue to next iteration
      clickNext();
    };

    // Start clicking after delay to let first manual click process
    setTimeout(() => clickNext(), AUTO_TEST_DELAY_MS + 200);
  };

  // Listen for the first manual click on Next button
  const nextButton = document.getElementById('next_button') as HTMLButtonElement;
  if (nextButton) {
    const onFirstClick = () => {
      if (!autoTestInitialized) {
        autoTestInitialized = true;
        console.log('🧪 AUTO-TEST MODE ENABLED: Will start after this hand is processed');
        // Remove this listener so it only triggers once
        nextButton.removeEventListener('click', onFirstClick);
        // Start auto-test after giving time for the manual click to process
        setTimeout(() => startAutoTest(), AUTO_TEST_DELAY_MS + 500);
      }
    };

    nextButton.addEventListener('click', onFirstClick);
    console.log(
      '🧪 AUTO-TEST MODE READY: Click "Next" to start automated testing (max iterations: ' +
        AUTO_TEST_MAX_ITERATIONS +
        ')',
    );
  }
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
