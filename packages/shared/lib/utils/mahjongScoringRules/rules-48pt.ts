import { getChows, getPungs, getKongs, isSameChow } from '../mahjongTile.js';
import type { MahjongScoringRule } from '../types.js';

// 48 point rules
// Quadruple Chow - Four identical Chows in the same suit.
export const quadrupleChow: MahjongScoringRule = {
  name: '67. Quadruple Chow',
  points: 48,
  excludes: ['1. Pure Double Chow', '19. Tile Hog', '59. Pure Triple Chow'],
  evaluate: grouping => {
    const chows = getChows(grouping);
    return chows.length === 4 && chows.every(chow => isSameChow(chow, chows[0])) ? 1 : 0;
  },
};

// Four Pure Shifted Pungs - Four Pungs or Kongs in the same suit, shifted up by one.
export const fourPureShiftedPungs: MahjongScoringRule = {
  name: '68. Four Pure Shifted Pungs',
  points: 48,
  excludes: ['28. All Pungs', '60. Pure Shifted Pung'],
  evaluate: grouping => {
    const pungsAndKongs = [...getPungs(grouping), ...getKongs(grouping)];
    if (pungsAndKongs.length !== 4) return 0;
    const suit = pungsAndKongs[0].tile.type;
    if (!pungsAndKongs.every(pung => pung.tile.type === suit)) return 0;
    // check that sorted vals are all consecutive and shifted by 1
    const values = pungsAndKongs
      .map(pung => pung.tile.value)
      .map(Number)
      .sort();
    return values.every((val, i) => i === 0 || val === values[i - 1] + 1) ? 1 : 0;
  },
};
