import { getPungs, getKongs, getPairs, isHonor, isGreen, getAllTilesFromGrouping } from '../mahjongTile.js';
import type { MahjongScoringRule } from '../types.js';

// 88 point rules
// Big Four Winds - Four Pungs or Kongs of Winds.
export const bigFourWinds: MahjongScoringRule = {
  name: '75. Big Four Winds',
  points: 88,
  excludes: [
    '5. Pung of Terminals or Honors',
    '15. Prevalent Wind',
    '16. Seat Wind',
    '28. All Pungs',
    '48. Big Three Winds',
  ],
  evaluate: grouping => {
    const pungsAndKongs = [...getPungs(grouping), ...getKongs(grouping)];
    const winds = pungsAndKongs.filter(group => group.tile.type === 'wind');
    return winds.length === 4 ? 1 : 0;
  },
};

// Big Three Dragons - Three Pungs or Kongs of Dragons.
export const bigThreeDragons: MahjongScoringRule = {
  name: '76. Big Three Dragons',
  points: 88,
  excludes: ['14. Dragon Pung', '33. Two Dragon Pungs'],
  evaluate: grouping => {
    const pungsAndKongs = [...getPungs(grouping), ...getKongs(grouping)];
    const dragons = pungsAndKongs.filter(group => group.tile.type === 'dragon');
    return dragons.length === 3 ? 1 : 0;
  },
};

// All Green - The hand is composed entirely of green tiles (2,3,4,6,8 Bamboo; Green Dragon).
export const allGreen: MahjongScoringRule = {
  name: '77. All Green',
  points: 88,
  evaluate: grouping => {
    const allTiles = getAllTilesFromGrouping(grouping);
    return allTiles.every(tile => isGreen(tile)) ? 1 : 0;
  },
};

// Nine Gates - The hand is concealed and has 1,1,1,2,3,4,5,6,7,8,9,9,9 in one suit and a 14th tile in the suit.
export const nineGates: MahjongScoringRule = {
  name: '78. Nine Gates',
  points: 88,
  excludes: [
    '5. Pung of Terminals or Honors',
    '7. One Voided Suit',
    '17. Concealed Hand',
    '29. Half Flush',
    '58. Full Flush',
  ],
  evaluate: grouping => {
    const allTiles = getAllTilesFromGrouping(grouping).filter(tile => !isHonor(tile));
    if (allTiles.length !== 14 || new Set(allTiles.map(tile => tile.type)).size !== 1) return 0;
    const counts = Array(10).fill(0); // index 1-9
    for (const tile of allTiles) {
      const v = Number(tile.value);
      if (v < 1 || v > 9) return 0;
      counts[v]++;
    }
    // Check pattern: 1 and 9 appear at least 3 times, 2-8 at least once
    if (counts[1] < 3 || counts[9] < 3) return 0;
    for (let v = 2; v <= 8; v++) {
      if (counts[v] < 1) return 0;
    }
    return 1;
  },
};

// Four Kongs - Four Kongs (either melded or concealed).
export const fourKongs: MahjongScoringRule = {
  name: '79. Four Kongs',
  points: 88,
  excludes: ['6. Melded Kong', '13. Pair Wait', '26. Two Melded Kongs', '28. All Pungs', '65. Three Kongs'],
  evaluate: grouping => {
    const kongs = getKongs(grouping);
    return kongs.length === 4 ? 1 : 0;
  },
};

// Seven Shifted Pairs - Seven pairs in one suit, shifted up by one.
export const sevenShiftedPairs: MahjongScoringRule = {
  name: '80. Seven Shifted Pairs',
  points: 88,
  excludes: [
    '7. One Voided Suit',
    '8. No Honor Tiles',
    '13. Pair Wait',
    '17. Concealed Hand',
    '29. Half Flush',
    '55. Seven Pairs',
    '58. Full Flush',
  ],
  evaluate: grouping => {
    const pairs = getPairs(grouping);
    if (pairs.length !== 7) return 0;
    const suit = pairs[0].tile.type;
    if (!pairs.every(pair => pair.tile.type === suit)) return 0;
    const values = pairs.map(pair => Number(pair.tile.value)).sort((a, b) => a - b);
    // Check if all pairs are shifted up by one
    for (let i = 1; i < values.length; i++) {
      if (values[i] - values[i - 1] !== 1) return 0;
    }
    return 1;
  },
};

// Thirteen Orphans - One of each Honor and Terminal (1 or 9) tile, and a second copy of any Honor or Terminal tile.
export const thirteenOrphans: MahjongScoringRule = {
  name: '81. Thirteen Orphans',
  points: 88,
  excludes: ['17. Concealed Hand', '24. Outside Hand', '31. All Types', '66. All Terminals and Honors'],
  evaluate: grouping => (grouping.length === 1 && grouping[0].kind === 'thirteen-orphans' ? 1 : 0),
};
