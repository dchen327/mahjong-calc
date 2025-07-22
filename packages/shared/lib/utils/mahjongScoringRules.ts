import { isSameChow } from './mahjongTile.js';
import type { MahjongScoringRule, ChowGroup } from './types.js';

export const pureDoubleChow: MahjongScoringRule = {
  name: '1. Pure Double Chow',
  points: 1,
  evaluate: grouping => {
    const chows = grouping.filter(group => group.kind === 'chow') as ChowGroup[];
    for (let i = 0; i < chows.length; i++) {
      for (let j = i + 1; j < chows.length; j++) {
        if (isSameChow(chows[i], chows[j])) {
          return true;
        }
      }
    }
    return false;
  },
};

export const allChows: MahjongScoringRule = {
  name: '18. All Chows',
  points: 2,
  excludes: ['No Honor Tiles'],
  evaluate: grouping => {
    const chowCount = grouping.filter(group => group.kind === 'chow').length;
    const pairCount = grouping.filter(group => group.kind === 'pair').length;
    return chowCount === 4 && pairCount === 1 && grouping.length === 5;
  },
};

export const mahjongScoringRules: MahjongScoringRule[] = [pureDoubleChow, allChows];
