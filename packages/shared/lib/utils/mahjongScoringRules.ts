import {
  isSameChow,
  isMixedChow,
  isShortStraight,
  isTerminalOrHonorPung,
  sortChows,
  isHonor,
  parseTile,
  isSameTile,
} from './mahjongTile.js';
import type { MahjongScoringRule, ChowGroup, PungGroup, KongGroup, TileType, PairGroup } from './types.js';

// 1 point rules

export const pureDoubleChow: MahjongScoringRule = {
  name: '1. Pure Double Chow',
  points: 1,
  evaluate: grouping => {
    const chows = grouping.filter(group => group.kind === 'chow') as ChowGroup[];
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

export const mixedDoubleChow: MahjongScoringRule = {
  name: '2. Mixed Double Chow',
  points: 1,
  evaluate: grouping => {
    const chows = grouping.filter(group => group.kind === 'chow') as ChowGroup[];
    let count = 0;
    for (let i = 0; i < chows.length; i++) {
      for (let j = i + 1; j < chows.length; j++) {
        if (isMixedChow(chows[i], chows[j])) {
          count++;
        }
      }
    }
    return count;
  },
};

export const shortStraight: MahjongScoringRule = {
  name: '3. Short Straight',
  points: 1,
  evaluate: grouping => {
    const chows = grouping.filter(group => group.kind === 'chow') as ChowGroup[];
    let count = 0;
    for (let i = 0; i < chows.length; i++) {
      for (let j = i + 1; j < chows.length; j++) {
        if (isShortStraight(chows[i], chows[j])) {
          count++;
        }
      }
    }
    return count;
  },
};

export const twoTerminalChows: MahjongScoringRule = {
  name: '4. Two Terminal Chows',
  points: 1,
  evaluate: grouping => {
    const chows = sortChows(grouping.filter(group => group.kind === 'chow') as ChowGroup[]);
    let count = 0;
    for (let i = 0; i < chows.length; i++) {
      for (let j = i + 1; j < chows.length; j++) {
        if (chows[i].tile.type === chows[j].tile.type && chows[i].tile.value === 1 && chows[j].tile.value === 7) {
          count++;
        }
      }
    }
    return count;
  },
};

export const pungOfTerminalsOrHonors: MahjongScoringRule = {
  name: '5. Pung of Terminals or Honors',
  points: 1,
  evaluate: (grouping, gameState) => {
    const pungs = grouping.filter(group => group.kind === 'pung') as PungGroup[];
    const kongs = grouping.filter(group => group.kind === 'kong') as KongGroup[];
    let count = 0;
    for (const group of [...pungs, ...kongs]) {
      if (isTerminalOrHonorPung(group, gameState.seatWind, gameState.prevalentWind)) {
        count++;
      }
    }
    return count;
  },
};

export const meldedKong: MahjongScoringRule = {
  name: '6. Melded Kong',
  points: 1,
  evaluate: grouping => {
    const kongs = grouping.filter(group => group.kind === 'kong') as KongGroup[];
    return kongs.filter(kong => !kong.concealed).length;
  },
};

export const oneVoidedSuit: MahjongScoringRule = {
  name: '7. One Voided Suit',
  points: 1,
  evaluate: grouping => {
    // Collect all tile types in the hand
    const suits = new Set(grouping.map(group => group.tile.type));
    // Check if at least one suit is missing
    const allSuits: TileType[] = ['bamboo', 'wan', 'circle'];
    const missing = allSuits.filter(suit => !suits.has(suit));
    return missing.length;
  },
};

export const noHonorTiles: MahjongScoringRule = {
  name: '8. No Honor Tiles',
  points: 1,
  evaluate: grouping => (grouping.some(group => isHonor(group.tile)) ? 0 : 1),
};

export const selfDrawn: MahjongScoringRule = {
  name: '9. Self-Drawn',
  points: 1,
  evaluate: (grouping, gameState) => (gameState.winFromWall ? 1 : 0),
};

export const edgeWait: MahjongScoringRule = {
  name: '11. Edge Wait',
  points: 1,
  evaluate: (grouping, gameState) => {
    const winningTile = parseTile(gameState.winningTile);
    if (isHonor(winningTile)) return 0;
    const chows = grouping.filter(
      group => group.kind === 'chow' && group.tile.type === winningTile.type,
    ) as ChowGroup[];
    return chows.some(
      chow => (chow.tile.value === 1 && winningTile.value === 3) || (chow.tile.value === 7 && winningTile.value === 7),
    )
      ? 1
      : 0;
  },
};

export const closedWait: MahjongScoringRule = {
  name: '12. Closed Wait',
  points: 1,
  evaluate: (grouping, gameState) => {
    const winningTile = parseTile(gameState.winningTile);
    if (isHonor(winningTile)) return 0;
    const chows = grouping.filter(
      group => group.kind === 'chow' && group.tile.type === winningTile.type,
    ) as ChowGroup[];
    return chows.some(chow => typeof winningTile.value === 'number' && chow.tile.value === winningTile.value - 1)
      ? 1
      : 0;
  },
};

export const pairWait: MahjongScoringRule = {
  name: '13. Pair Wait',
  points: 1,
  // NOTE: if it's possible for pair wait or another wait, we always pick pair wait (that will give 1 point, whereas another wait could give zero)
  excludes: ['11. Edge Wait', '12. Closed Wait'],
  evaluate: (grouping, gameState) => {
    const winningTile = parseTile(gameState.winningTile);
    // return true if there is a pair containing the winning tile
    const pairs = grouping.filter(group => group.kind === 'pair') as PairGroup[];
    return pairs.some(pair => isSameTile([pair.tile, winningTile])) ? 1 : 0;
  },
};

// 2 points rules

export const allChows: MahjongScoringRule = {
  name: '18. All Chows',
  points: 2,
  excludes: ['8. No Honor Tiles'],
  evaluate: grouping => {
    const chowCount = grouping.filter(group => group.kind === 'chow').length;
    const pair = grouping.find(group => group.kind === 'pair');
    if (!pair) return 0;
    return chowCount === 4 && !isHonor(pair.tile) ? 1 : 0;
  },
};

export const mahjongScoringRules: MahjongScoringRule[] = [
  pureDoubleChow,
  mixedDoubleChow,
  shortStraight,
  twoTerminalChows,
  pungOfTerminalsOrHonors,
  meldedKong,
  oneVoidedSuit,
  noHonorTiles,
  selfDrawn,
  allChows,
];
