import { getKongs, isTerminalOrHonorGroup } from '../mahjongTile.js';
import type { MahjongScoringRule } from '../types.js';

// 4 point rules
// Outside Hand - Each group (triples and pair) includes a Terminal (1 or 9) or Honor tile.
export const outsideHand: MahjongScoringRule = {
  name: '24. Outside Hand',
  points: 4,
  evaluate: grouping => (grouping.every(group => isTerminalOrHonorGroup(group)) ? 1 : 0),
};

// Fully Concealed Hand - The hand has four concealed groups and is won by self-draw.
export const fullyConcealedHand: MahjongScoringRule = {
  name: '25. Fully Concealed Hand',
  excludes: ['9. Self Drawn'],
  points: 4,
  evaluate: (grouping, gameState) => {
    // special case for knitted
    if (grouping.length === 1 && grouping[0].kind === 'knitted-and-honors' && gameState.winFromWall) return 1;
    // special case for seven pairs
    if (grouping.length === 7 && grouping.every(group => group.kind === 'pair') && gameState.winFromWall) return 1;
    // all non pair groups must be concealed (must be 4 groups too)
    const concealedGroups = grouping.filter(group => group.kind !== 'pair' && group.concealed);
    return concealedGroups.length === 4 && gameState.winFromWall ? 1 : 0;
  },
};

// Two Melded Kongs - Two Kongs. Note that this can combine with Concealed Kong for a total of 6 points.
export const twoMeldedKongs: MahjongScoringRule = {
  name: '26. Two Melded Kongs',
  points: 4,
  excludes: ['6. Melded Kong'],
  evaluate: grouping => {
    const meldedKongs = getKongs(grouping);
    // return 1 if there are 2 not concealed kongs or 1 concealed and 1 not concealed
    return meldedKongs.filter(kong => !kong.concealed).length >= 2 ||
      (meldedKongs.filter(kong => kong.concealed).length === 1 &&
        meldedKongs.filter(kong => !kong.concealed).length === 1)
      ? 1
      : 0;
  },
};

// Last of its Kind - Winning on the publicly last tile of its kind. This tile must be the last tile based on the visible discards and melds.
export const lastOfItsKind: MahjongScoringRule = {
  name: '27. Last of its Kind',
  points: 4,
  evaluate: (_, gameState) => (gameState.lastTileOfKind ? 1 : 0),
};
