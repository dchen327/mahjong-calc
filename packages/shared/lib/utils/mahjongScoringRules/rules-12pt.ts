import { getAllTilesFromGrouping, getKnitted, getKongs, getPungs } from '../mahjongTile.js';
import type { MahjongScoringRule } from '../types.js';

// 12 point rules
// Lesser Honors and Knitted Tiles - The hand is entirely composed of single (unpaired) honors and single tiles from different knitted sequences. If this rule is satisfied, the player can win without the standard 4 triples and a pair.
export const lesserHonorsAndKnittedTiles: MahjongScoringRule = {
  name: '44. Lesser Honors and Knitted Tiles',
  points: 12,
  excludes: ['17. Concealed Hand', '31. All Types'],
  evaluate: grouping => (grouping.length !== 1 || grouping[0].kind !== 'knitted-and-honors' ? 0 : 1),
};

// Knitted Straight - Winning with a hand that has 1,4,7 in one suit, 2,5,8 in a second suit and 3,6,9 in the third suit. This knitted straight is considered to be 3 Chows for the requirement of 4 triples and a pair.
export const knittedStraight: MahjongScoringRule = {
  name: '45. Knitted Straight',
  points: 12,
  evaluate: grouping => {
    // Check if there is knitted-and-honors group
    if (grouping.length === 1 && grouping[0].kind === 'knitted-and-honors') {
      const allTiles = getAllTilesFromGrouping(grouping);
      // Ensure all values from 1-9 are present
      const values = allTiles.map(tile => tile.value).filter(value => typeof value === 'number');
      if (values.length === 9 && new Set(values).size === 9) return 1;
    }

    const knitted = getKnitted(grouping);
    if (knitted.length !== 3) return 0;
    const [k1, k2, k3] = knitted;
    const values = [k1.tile.value, k2.tile.value, k3.tile.value].map(Number).sort((a, b) => a - b);
    const suits = [k1.tile.type, k2.tile.type, k3.tile.type];
    const allDifferentSuits = new Set(suits).size === 3;
    const isConsecutive = values[0] === 1 && values[1] === 2 && values[2] === 3;
    return allDifferentSuits && isConsecutive ? 1 : 0;
  },
};

// Upper Four - The hand is composed of only suit tiles with numerical values of 6 or greater.
export const upperFour: MahjongScoringRule = {
  name: '46. Upper Four',
  points: 12,
  excludes: ['8. No Honor Tiles'],
  evaluate: grouping => {
    const allTiles = getAllTilesFromGrouping(grouping);
    return allTiles.every(tile => typeof tile.value === 'number' && tile.value >= 6) ? 1 : 0;
  },
};

// Lower Four - The hand is composed of only suit tiles with numerical values of 4 or less.
export const lowerFour: MahjongScoringRule = {
  name: '47. Lower Four',
  points: 12,
  excludes: ['8. No Honor Tiles'],
  evaluate: grouping => {
    const allTiles = getAllTilesFromGrouping(grouping);
    return allTiles.every(tile => typeof tile.value === 'number' && tile.value <= 4) ? 1 : 0;
  },
};

// Big Three Winds - Three Pungs or Kongs of Winds.
// Does not combine with:
// Pung of Terminals or Honors (Unless you have an additional non-wind Pung)
export const bigThreeWinds: MahjongScoringRule = {
  name: '48. Big Three Winds',
  points: 12,
  excludes: ['5. Pung of Terminals or Honors'],
  evaluate: grouping => {
    const pungs = getPungs(grouping).filter(pung => pung.tile.type === 'wind');
    const kongs = getKongs(grouping).filter(kong => kong.tile.type === 'wind');
    const total = pungs.length + kongs.length;
    return total == 3 ? 1 : 0;
  },
};
