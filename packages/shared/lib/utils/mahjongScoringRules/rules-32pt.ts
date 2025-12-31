import { getAllTilesFromGrouping, getChows, isHonor, isTerminal, getAllChowIndices } from '../mahjongTile.js';
import type { KongGroup, MahjongGroup, MahjongScoringRule } from '../types.js';

// Matcher for four shifted chows - all 4 chows in same suit, shifted by 1 or 2
const isFourShiftedChows = (grouping: MahjongGroup[]): boolean => {
  const chows = getChows(grouping);
  if (chows.length !== 4) return false;
  const suit = chows[0].tile.type;
  if (!chows.every(chow => chow.tile.type === suit)) return false;
  const values = chows.map(chow => Number(chow.tile.value)).sort((a, b) => a - b);
  const diffs = values.slice(1).map((v, i) => v - values[i]);
  return diffs.every(d => d === 1) || diffs.every(d => d === 2);
};

// 32 point rules
// Four Shifted Chows - Four Chows in a suit, each shifted up by one or two but not a combination of both.
export const fourShiftedChows: MahjongScoringRule = {
  name: '64. Four Shifted Chows',
  points: 32,
  excludes: ['3. Short Straight', '51. Pure Shifted Chows'],
  evaluate: grouping => (isFourShiftedChows(grouping) ? 1 : 0),
  getUsedGroupsPerInstance: grouping => (isFourShiftedChows(grouping) ? getAllChowIndices(grouping) : []),
};

// Three Kongs - Three Kongs (either melded or concealed).
export const threeKongs: MahjongScoringRule = {
  name: '65. Three Kongs',
  points: 32,
  excludes: ['6. Melded Kong', '22. Concealed Kong', '26. Two Melded Kongs', '38. Two Concealed Kongs'],
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
