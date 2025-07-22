import { isSameChow, isMixedChow, isShortStraight, isTerminalOrHonorPung, sortChows, isHonor } from './mahjongTile.js';
import type { MahjongScoringRule, ChowGroup, PungGroup, KongGroup } from './types.js';

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
        if (chows[i].first.type === chows[j].first.type && chows[i].first.value === 1 && chows[j].first.value === 7) {
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

// 2 points rules

export const allChows: MahjongScoringRule = {
  name: '18. All Chows',
  points: 2,
  excludes: ['No Honor Tiles'],
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
  allChows,
];
