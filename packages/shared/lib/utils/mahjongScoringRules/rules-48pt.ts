import { getChows, getPungs, getKongs, isSameChow, getAllChowIndices, getAllPungIndices } from '../mahjongTile.js';
import type { MahjongGroup, MahjongScoringRule } from '../types.js';

// Matcher for quadruple chow - all 4 chows are identical
const isQuadrupleChow = (grouping: MahjongGroup[]): boolean => {
  const chows = getChows(grouping);
  return chows.length === 4 && chows.every(chow => isSameChow(chow, chows[0]));
};

// Matcher for four pure shifted pungs - all 4 pungs in same suit, shifted by 1
const isFourPureShiftedPungs = (grouping: MahjongGroup[]): boolean => {
  const pungsAndKongs = [...getPungs(grouping), ...getKongs(grouping)];
  if (pungsAndKongs.length !== 4) return false;
  const suit = pungsAndKongs[0].tile.type;
  if (!pungsAndKongs.every(pung => pung.tile.type === suit)) return false;
  const values = pungsAndKongs.map(p => Number(p.tile.value)).sort((a, b) => a - b);
  return values.every((val, i) => i === 0 || val === values[i - 1] + 1);
};

// 48 point rules
// Quadruple Chow - Four identical Chows in the same suit.
export const quadrupleChow: MahjongScoringRule = {
  name: '67. Quadruple Chow',
  points: 48,
  excludes: ['1. Pure Double Chow', '19. Tile Hog', '59. Pure Triple Chow'],
  evaluate: grouping => (isQuadrupleChow(grouping) ? 1 : 0),
  getUsedGroupsPerInstance: grouping => (isQuadrupleChow(grouping) ? getAllChowIndices(grouping) : []),
};

// Four Pure Shifted Pungs - Four Pungs or Kongs in the same suit, shifted up by one.
export const fourPureShiftedPungs: MahjongScoringRule = {
  name: '68. Four Pure Shifted Pungs',
  points: 48,
  excludes: ['28. All Pungs', '60. Pure Shifted Pung'],
  evaluate: grouping => (isFourPureShiftedPungs(grouping) ? 1 : 0),
  getUsedGroupsPerInstance: grouping => (isFourPureShiftedPungs(grouping) ? getAllPungIndices(grouping) : []),
};
