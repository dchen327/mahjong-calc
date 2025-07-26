import { getAllTilesFromGrouping, getChows, isHonor, isTerminal } from '../mahjongTile.js';
import type { KongGroup, MahjongScoringRule } from 'index.mjs';

// 32 point rules
// Four Shifted Chows - Four Chows in a suit, each shifted up by one or two but not a combination of both.
// Does not combine with:
// Short Straight
// Pure Shifted Chows
export const fourShiftedChows: MahjongScoringRule = {
  name: '64. Four Shifted Chows',
  points: 32,
  excludes: ['3. Short Straight', '51. Pure Shifted Chows'],
  evaluate: grouping => {
    const chows = getChows(grouping);
    // ensure there are exactly 4 chows of same suit
    if (chows.length !== 4) return 0;
    const suit = chows[0].tile.type;
    if (!chows.every(chow => chow.tile.type === suit)) return 0;
    // sort and check if shifted by 1 or 2
    const values = chows.map(chow => Number(chow.tile.value)).sort();
    const diffs = values.map((v, i) => (i > 0 ? v - values[i - 1] : 0));
    const isShiftedByOne = diffs.every(diff => diff === 1);
    const isShiftedByTwo = diffs.every(diff => diff === 2);
    return isShiftedByOne || isShiftedByTwo ? 1 : 0;
  },
};

// Three Kongs - Three Kongs (either melded or concealed).
export const threeKongs: MahjongScoringRule = {
  name: '65. Three Kongs',
  points: 32,
  excludes: ['6. Melded Kong', '26. Two Melded Kongs'],
  evaluate: grouping => {
    const kongs = grouping.filter(g => g.kind === 'kong') as KongGroup[];
    return kongs.length === 3 ? 1 : 0;
  },
};

// All Terminals and Honors - The hand is composed entirely of Terminal (1 or 9) and Honor tiles.
export const allTerminalsAndHonors: MahjongScoringRule = {
  name: '66. All Terminals and Honors',
  points: 32,
  excludes: ['5. Pung of Terminals or Honors', '24. Outside Hand', '28. All Pungs'],
  evaluate: grouping => {
    const allTiles = getAllTilesFromGrouping(grouping);
    return allTiles.every(tile => isTerminal(tile) || isHonor(tile)) ? 1 : 0;
  },
};
