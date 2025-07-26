import {
  getChows,
  getPungs,
  getKongs,
  getPairs,
  isHonor,
  getAllTilesFromGrouping,
  isTerminal,
} from '../mahjongTile.js';
import type { MahjongScoringRule } from '../types.js';

// 64 point rules
// All Terminals - The hand is composed entirely of Terminal (1 or 9) tiles.
export const AllTerminals: MahjongScoringRule = {
  name: '69. All Terminals',
  points: 64,
  excludes: [
    '5. Pung of Terminals or Honors',
    '8. No Honor Tiles',
    '24. Outside Hand',
    '28. All Pungs',
    '66. All Terminals and Honors',
  ],
  evaluate: grouping => {
    const allTiles = getAllTilesFromGrouping(grouping);
    return allTiles.every(tile => isTerminal(tile)) ? 1 : 0;
  },
};

// All Honors - The hand is composed entirely of Honor tiles.
export const AllHonors: MahjongScoringRule = {
  name: '70. All Honors',
  points: 64,
  excludes: [
    '5. Pung of Terminals or Honors',
    '7. One Voided Suit',
    '24. Outside Hand',
    '28. All Pungs',
    '66. All Terminals and Honors',
  ],
  evaluate: grouping => {
    const allTiles = getAllTilesFromGrouping(grouping);
    return allTiles.every(tile => isHonor(tile)) ? 1 : 0;
  },
};

// Little Four Winds - Three Pungs or Kongs of Winds and a pair of the last Wind.
export const littleFourWinds: MahjongScoringRule = {
  name: '71. Little Four Winds',
  points: 64,
  excludes: ['5. Pung of Terminals or Honors', '48. Big Three Winds'],
  evaluate: grouping => {
    const pungsAndKongs = [...getPungs(grouping), ...getKongs(grouping)];
    const winds = pungsAndKongs.filter(group => group.tile.type === 'wind');
    if (winds.length !== 3) return 0;
    // ensure the pair is a wind too
    const pairs = getPairs(grouping);
    if (pairs.length !== 1 || !(pairs[0].tile.type === 'wind')) return 0;
    return 1;
  },
};

// Little Three Dragons - Two Pungs or Kongs of Dragons and a pair of the last Dragon.
// Does not combine with:
// Dragon Pung
// Two Dragon Pungs
export const littleThreeDragons: MahjongScoringRule = {
  name: '72. Little Three Dragons',
  points: 64,
  excludes: ['14. Dragon Pung', '33. Two Dragon Pungs'],
  evaluate: grouping => {
    const pungsAndKongs = [...getPungs(grouping), ...getKongs(grouping)];
    const dragons = pungsAndKongs.filter(group => group.tile.type === 'dragon');
    if (dragons.length !== 2) return 0;
    // ensure the pair is a dragon too
    const pairs = getPairs(grouping);
    if (pairs.length !== 1 || !(pairs[0].tile.type === 'dragon')) return 0;
    return 1;
  },
};

// Four Concealed Pungs - Four concealed Pungs or Kongs
// Does not combine with:
// Concealed Hand
// Two Concealed Pungs
// All Pungs
// Three Concealed Pungs
export const fourConcealedPungs: MahjongScoringRule = {
  name: '73. Four Concealed Pungs',
  points: 64,
  excludes: ['17. Concealed Hand', '21. Two Concealed Pungs', '28. All Pungs', '54. Three Concealed Pungs'],
  evaluate: grouping => {
    const concealedPungs = getPungs(grouping).filter(pung => pung.concealed);
    const concealedKongs = getKongs(grouping).filter(kong => kong.concealed);
    return concealedPungs.length + concealedKongs.length >= 4 ? 1 : 0;
  },
};

// Pure Terminal Chows - Two Chows of 1,2,3, two Chows of 7,8,9 and a pair of 5's in one suit.
export const pureTerminalChows: MahjongScoringRule = {
  name: '74. Pure Terminal Chows',
  points: 64,
  excludes: [
    '1. Pure Double Chow',
    '4. Two Terminal Chows',
    '7. One Voided Suit',
    '18. All Chows',
    '29. Half Flush',
    '58. Full Flush',
  ],
  evaluate: grouping => {
    const allTiles = getAllTilesFromGrouping(grouping);
    if (allTiles.length !== 14) return 0;
    const suit = allTiles[0]?.type;
    if (
      !suit ||
      !allTiles.every(tile => tile.type === suit && (suit === 'bamboo' || suit === 'wan' || suit === 'circle'))
    )
      return 0;
    const chows = getChows(grouping);
    const pairs = getPairs(grouping);
    if (chows.length !== 4 || pairs.length !== 1) return 0;
    const pair = pairs[0];
    if (pair.tile.value !== 5) return 0;
    // Chow.tile values must be 1, 1, 7, 7
    const values = chows
      .map(chow => chow.tile.value)
      .map(Number)
      .sort();
    return values[0] === 1 && values[1] === 1 && values[2] === 7 && values[3] === 7 ? 1 : 0;
  },
};
