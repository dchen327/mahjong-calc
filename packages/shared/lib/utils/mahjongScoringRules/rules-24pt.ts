import {
  getPairs,
  getPungs,
  getKongs,
  getAllTilesFromGrouping,
  isHonor,
  findChowTriplets,
  findPungTriplets,
  isPureTripleChow,
  isPureShiftedPungs,
} from '../mahjongTile.js';
import type { MahjongScoringRule } from '../types.js';

// 24 point rules
// Seven Pairs - Seven pairs. If this rule is satisfied, the player can win without the standard 4 triples and a pair.
export const sevenPairs: MahjongScoringRule = {
  name: '55. Seven Pairs',
  points: 24,
  excludes: ['13. Pair Wait', '17. Concealed Hand'],
  evaluate: grouping => {
    const pairs = getPairs(grouping);
    return pairs.length === 7 && grouping.length === 7 && grouping.every(group => group.kind === 'pair') ? 1 : 0;
  },
};

// Greater Honors and Knitted Tiles - The hand is composed of one of each honor and single tiles from different knitted sequences. If this rule is satisfied, the player can win without the standard 4 triples and a pair.
export const greaterHonorsAndKnittedTiles: MahjongScoringRule = {
  name: '56. Greater Honors and Knitted Tiles',
  points: 24,
  excludes: ['17. Concealed Hand', '31. All Types', '44. Lesser Honors and Knitted Tiles'],
  evaluate: grouping =>
    grouping.length === 1 &&
    grouping[0].kind === 'knitted-and-honors' &&
    getAllTilesFromGrouping(grouping).filter(isHonor).length === 7
      ? 1
      : 0,
};

// All Even Pungs - Four Pungs or Kongs and a pair of even suit tiles.
export const allEvenPungs: MahjongScoringRule = {
  name: '57. All Even Pungs',
  points: 24,
  excludes: ['8. No Honor Tiles', '23. All Simples', '28. All Pungs'],
  evaluate: grouping => {
    const pungs = getPungs(grouping).filter(pung => typeof pung.tile.value === 'number' && pung.tile.value % 2 === 0);
    const kongs = getKongs(grouping).filter(kong => typeof kong.tile.value === 'number' && kong.tile.value % 2 === 0);
    const pairs = getPairs(grouping).filter(pair => typeof pair.tile.value === 'number' && pair.tile.value % 2 === 0);
    return pungs.length + kongs.length === 4 && pairs.length === 1 ? 1 : 0;
  },
};

// Full Flush - The hand is composed entirely of a single suit.
export const fullFlush: MahjongScoringRule = {
  name: '58. Full Flush',
  points: 24,
  excludes: ['7. One Voided Suit', '8. No Honor Tiles', '29. Half Flush'],
  evaluate: grouping => {
    const allTiles = getAllTilesFromGrouping(grouping);
    const suit = allTiles[0].type;
    return allTiles.every(tile => tile.type === suit) ? 1 : 0;
  },
};

// Pure Triple Chow - Three identical Chows in the same suit.
export const pureTripleChow: MahjongScoringRule = {
  name: '59. Pure Triple Chow',
  points: 24,
  excludes: ['1. Pure Double Chow'],
  evaluate: grouping => findChowTriplets(grouping, isPureTripleChow).length,
  getUsedGroupsPerInstance: grouping => findChowTriplets(grouping, isPureTripleChow),
};

// Pure Shifted Pungs - Three Pungs or Kongs in the same suit, shifted up by one.
export const pureShiftedPungs: MahjongScoringRule = {
  name: '60. Pure Shifted Pungs',
  points: 24,
  evaluate: grouping => findPungTriplets(grouping, isPureShiftedPungs).length,
  getUsedGroupsPerInstance: grouping => findPungTriplets(grouping, isPureShiftedPungs),
};

// Upper Tiles - The hand is composed of only suit tiles with numerical values of 7 or greater.
export const upperTiles: MahjongScoringRule = {
  name: '61. Upper Tiles',
  points: 24,
  excludes: ['8. No Honor Tiles', '46. Upper Four'],
  evaluate: grouping => {
    const allTiles = getAllTilesFromGrouping(grouping);
    return allTiles.every(tile => typeof tile.value === 'number' && tile.value >= 7) ? 1 : 0;
  },
};

// Middle Tiles - The hand is composed of only suit tiles with numerical values of 4, 5, 6.
export const middleTiles: MahjongScoringRule = {
  name: '62. Middle Tiles',
  points: 24,
  excludes: ['8. No Honor Tiles', '23. All Simples'],
  evaluate: grouping => {
    const allTiles = getAllTilesFromGrouping(grouping);
    return allTiles.every(tile => typeof tile.value === 'number' && tile.value >= 4 && tile.value <= 6) ? 1 : 0;
  },
};

// Lower Tiles - The hand is composed of only suit tiles with numerical values of 3 or less.
export const lowerTiles: MahjongScoringRule = {
  name: '63. Lower Tiles',
  points: 24,
  excludes: ['8. No Honor Tiles', '47. Lower Four'],
  evaluate: grouping => {
    const allTiles = getAllTilesFromGrouping(grouping);
    return allTiles.every(tile => typeof tile.value === 'number' && tile.value <= 3) ? 1 : 0;
  },
};
