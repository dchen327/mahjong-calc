import { getChows, getPungs, getKongs, getPairs, isHonor } from '../mahjongTile.js';
import type { MahjongScoringRule, TileType } from '../types.js';

// 16 point rules
// Pure Straight - A Chow of 1,2,3, Chow of 4,5,6 and Chow of 7,8,9 in the same suit.
export const pureStraight: MahjongScoringRule = {
  name: '49. Pure Straight',
  points: 16,
  excludes: ['3. Short Straight', '4. Two Terminal Chows'],
  evaluate: grouping => {
    const chows = getChows(grouping);
    // Find all chows in the same suit with values 1, 4, 7
    for (const suit of ['bamboo', 'wan', 'circle'] as TileType[]) {
      const values = new Set(
        chows
          .filter(
            chow =>
              chow.tile.type === suit && (chow.tile.value === 1 || chow.tile.value === 4 || chow.tile.value === 7),
          )
          .map(chow => chow.tile.value),
      );
      if (values.has(1) && values.has(4) && values.has(7)) return 1;
    }
    return 0;
  },
};

// Three-Suited Terminal Chows - A Chow of 1,2,3 and Chow of 7,8,9 in one suit, a Chow of 1,2,3 and Chow of 7,8,9 in another suit, and a Pair of 5's in the last suit.
export const threeSuitedTerminalChows: MahjongScoringRule = {
  name: '50. Three-Suited Terminal Chows',
  points: 16,
  excludes: ['2. Mixed Double Chow', '4. Two Terminal Chows', '8. No Honor Tiles', '18. All Chows'],
  evaluate: grouping => {
    const chows = getChows(grouping);
    const pair = getPairs(grouping)[0];
    if (!pair || pair.tile.value !== 5) return 0;
    const pairSuit = pair.tile.type;
    const otherSuits: TileType[] = ['bamboo', 'wan', 'circle'].filter(suit => suit !== pairSuit) as TileType[];
    return otherSuits.every(
      suit =>
        chows.some(chow => chow.tile.type === suit && chow.tile.value === 1) &&
        chows.some(chow => chow.tile.type === suit && chow.tile.value === 7),
    )
      ? 1
      : 0;
  },
};

// Pure Shifted Chows - Three Chows in a suit, each shifted up by one or two but not a combination of both.
export const pureShiftedChows: MahjongScoringRule = {
  name: '51. Pure Shifted Chows',
  points: 16,
  evaluate: grouping => {
    const chows = getChows(grouping);
    // Check all unique triples of chows in the same suit
    for (let i = 0; i < chows.length; i++) {
      for (let j = i + 1; j < chows.length; j++) {
        for (let k = j + 1; k < chows.length; k++) {
          const [c1, c2, c3] = [chows[i], chows[j], chows[k]];
          if (c1.tile.type !== c2.tile.type || c1.tile.type !== c3.tile.type) continue;
          const values = [c1.tile.value, c2.tile.value, c3.tile.value].map(Number).sort((a, b) => a - b);
          const diff1 = values[1] - values[0];
          const diff2 = values[2] - values[1];
          // All differences must be 1 (shifted by one) or all 2 (shifted by two)
          if ((diff1 === 1 && diff2 === 1) || (diff1 === 2 && diff2 === 2)) {
            return 1;
          }
        }
      }
    }
    return 0;
  },
};

// All Fives - Each group (triples and pair) has a 5.
export const allFives: MahjongScoringRule = {
  name: '52. All Fives',
  points: 16,
  excludes: ['8. No Honor Tiles', '23. All Simples'],
  evaluate: grouping =>
    grouping.length === 5 &&
    grouping.every(group =>
      group.kind === 'chow' ? [3, 4, 5].includes(Number(group.tile.value)) : group.tile.value === 5,
    )
      ? 1
      : 0,
};

// Triple Pung - Three pungs (or Kongs) of the same number but in the three different suits.
export const triplePung: MahjongScoringRule = {
  name: '53. Triple Pung',
  points: 16,
  excludes: ['20. Double Pung'],
  evaluate: grouping => {
    const groups = [...getPungs(grouping), ...getKongs(grouping)].filter(g => !isHonor(g.tile));
    const suitMap = new Map<number, Set<TileType>>();
    for (const { tile } of groups) {
      if (typeof tile.value === 'number') {
        if (!suitMap.has(tile.value)) suitMap.set(tile.value, new Set());
        suitMap.get(tile.value)!.add(tile.type);
      }
    }
    // Return the count of numbers that appear as pungs/kongs in all 3 suits
    return Array.from(suitMap.values()).some(suits => suits.size === 3) ? 1 : 0;
  },
};
// Three Concealed Pungs - Three concealed Pungs or Kongs.
export const threeConcealedPungs: MahjongScoringRule = {
  name: '54. Three Concealed Pungs',
  points: 16,
  excludes: ['21. Two Concealed Pungs'],
  evaluate: grouping => {
    const concealedPungs = getPungs(grouping).filter(pung => pung.concealed);
    const concealedKongs = getKongs(grouping).filter(kong => kong.concealed);
    return concealedPungs.length + concealedKongs.length >= 3 ? 1 : 0;
  },
};
