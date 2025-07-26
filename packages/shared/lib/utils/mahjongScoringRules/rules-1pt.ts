import { getWaitTiles } from '../mahjong.js';
import {
  getChows,
  isSameChow,
  isMixedChow,
  isShortStraight,
  sortChows,
  getPungs,
  getKongs,
  getPairs,
  isTerminalOrHonorPung,
  isHonor,
  getAllTilesFromGrouping,
  parseTile,
  isSameTile,
} from '../mahjongTile.js';
import type { MahjongScoringRule, TileType } from '../types.js';

// 1 point rules
// Pure Double Chow - Two identical Chows in the same suit.
export const pureDoubleChow: MahjongScoringRule = {
  name: '1. Pure Double Chow',
  points: 1,
  evaluate: grouping => {
    const chows = getChows(grouping);
    let count = 0;
    for (let i = 0; i < chows.length; i++) {
      for (let j = i + 1; j < chows.length; j++) {
        if (isSameChow(chows[i], chows[j])) {
          count++;
        }
      }
    }
    return count;
  },
};

// Mixed Double Chow - Two Chows of the same numbers in different suits.
export const mixedDoubleChow: MahjongScoringRule = {
  name: '2. Mixed Double Chow',
  points: 1,
  evaluate: grouping => {
    const chows = getChows(grouping);
    const used = Array(chows.length).fill(false);
    let count = 0;
    for (let i = 0; i < chows.length; i++) {
      if (used[i]) continue;
      for (let j = i + 1; j < chows.length; j++) {
        if (!used[j] && isMixedChow(chows[i], chows[j])) {
          used[i] = used[j] = true;
          count++;
          break;
        }
      }
    }
    return count;
  },
};

// Short Straight - Two Chows that form a 6-tile straight.
export const shortStraight: MahjongScoringRule = {
  name: '3. Short Straight',
  points: 1,
  evaluate: grouping => {
    const chows = getChows(grouping);
    const used = Array(chows.length).fill(false);
    let count = 0;
    for (let i = 0; i < chows.length; i++) {
      if (used[i]) continue;
      for (let j = i + 1; j < chows.length; j++) {
        if (!used[j] && isShortStraight(chows[i], chows[j])) {
          used[i] = used[j] = true;
          count++;
          break;
        }
      }
    }
    return count;
  },
};

// Two Terminal Chows - A Chow of 1,2,3 and a Chow of 7,8,9 in the same suit.
export const twoTerminalChows: MahjongScoringRule = {
  name: '4. Two Terminal Chows',
  points: 1,
  evaluate: grouping => {
    const chows = sortChows(getChows(grouping));
    const used = Array(chows.length).fill(false);
    let count = 0;
    for (let i = 0; i < chows.length; i++) {
      if (used[i] || chows[i].tile.value !== 1) continue;
      for (let j = 0; j < chows.length; j++) {
        if (i !== j && !used[j] && chows[j].tile.type === chows[i].tile.type && chows[j].tile.value === 7) {
          used[i] = used[j] = true;
          count++;
          break;
        }
      }
    }
    return count;
  },
};

// Pung of Terminals or Honors - A Pung or Kong of 1's, 9's, or Winds that are not your Seat Wind or Prevalent Wind.
export const pungOfTerminalsOrHonors: MahjongScoringRule = {
  name: '5. Pung of Terminals or Honors',
  points: 1,
  evaluate: (grouping, gameState) => {
    const pungs = getPungs(grouping);
    const kongs = getKongs(grouping);
    let count = 0;
    for (const group of [...pungs, ...kongs]) {
      if (isTerminalOrHonorPung(group, gameState.seatWind, gameState.prevalentWind)) {
        count++;
      }
    }
    return count;
  },
};

// Melded Kong - A Melded Kong.
export const meldedKong: MahjongScoringRule = {
  name: '6. Melded Kong',
  points: 1,
  evaluate: grouping => {
    const kongs = getKongs(grouping);
    return kongs.filter(kong => !kong.concealed).length;
  },
};

// One Voided Suit - The hand has no tiles from a specific suit.
export const oneVoidedSuit: MahjongScoringRule = {
  name: '7. One Voided Suit',
  points: 1,
  evaluate: grouping => {
    const allTiles = getAllTilesFromGrouping(grouping);
    const suits = new Set(allTiles.map(tile => tile.type));
    const allSuits: TileType[] = ['bamboo', 'wan', 'circle'];
    const missing = allSuits.filter(suit => !suits.has(suit));
    return missing.length;
  },
};

// No Honor Tiles - The hand has no Honor tiles.
export const noHonorTiles: MahjongScoringRule = {
  name: '8. No Honor Tiles',
  points: 1,
  evaluate: grouping => {
    const allTiles = getAllTilesFromGrouping(grouping);
    return allTiles.some(tile => isHonor(tile)) ? 0 : 1;
  },
};
// Self Drawn - The player wins by drawing the winning tile.
export const selfDrawn: MahjongScoringRule = {
  name: '9. Self Drawn',
  points: 1,
  evaluate: (grouping, gameState) => (gameState.winFromWall ? 1 : 0),
};

// Edge Wait - Winning on a 3 to form a Chow of 1,2,3 or a 7 to form a Chow of 7,8,9.
export const edgeWait: MahjongScoringRule = {
  name: '11. Edge Wait',
  points: 1,
  evaluate: (grouping, gameState) => {
    const waitingTiles = getWaitTiles(gameState);
    if (waitingTiles.length > 1) return 0;
    const winningTile = parseTile(gameState.winningTile);
    if (isHonor(winningTile)) return 0;
    const chows = getChows(grouping).filter(group => !group.declaredInGame && group.tile.type === winningTile.type);
    return chows.some(
      chow => (chow.tile.value === 1 && winningTile.value === 3) || (chow.tile.value === 7 && winningTile.value === 7),
    )
      ? 1
      : 0;
  },
};

// Closed Wait - Winning on the middle tile of a Chow. For instance a 3 to form a Chow of 2,3,4.
export const closedWait: MahjongScoringRule = {
  name: '12. Closed Wait',
  points: 1,
  evaluate: (grouping, gameState) => {
    const waitingTiles = getWaitTiles(gameState);
    if (waitingTiles.length > 1) return 0;
    const winningTile = parseTile(gameState.winningTile);
    if (isHonor(winningTile)) return 0;
    console.log(getChows(grouping));
    const chows = getChows(grouping).filter(group => !group.declaredInGame && group.tile.type === winningTile.type);
    return chows.some(chow => typeof winningTile.value === 'number' && chow.tile.value === winningTile.value - 1)
      ? 1
      : 0;
  },
};

// Pair Wait - Winning on a tile to form a Pair.
// Rules 11-13 only apply if the player can only win off of a single type of tile. For instance, only winning off of Bamboo 1.
export const pairWait: MahjongScoringRule = {
  name: '13. Pair Wait',
  points: 1,
  excludes: ['11. Edge Wait', '12. Closed Wait'],
  evaluate: (grouping, gameState) => {
    const waitingTiles = getWaitTiles(gameState);
    if (waitingTiles.length > 1) return 0;
    const winningTile = parseTile(gameState.winningTile);
    const pairs = getPairs(grouping);
    return pairs.some(pair => isSameTile([pair.tile, winningTile])) ? 1 : 0;
  },
};
