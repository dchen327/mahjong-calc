import {
  getPungs,
  getKongs,
  getPairs,
  getAllTilesFromGrouping,
  isHonor,
  findChowTriplets,
  isMixedShiftedChows,
} from '../mahjongTile.js';
import type { MahjongScoringRule, TileType } from '../types.js';

// 6 point rules
// All Pungs - Four Pungs or Kongs and a pair.
export const allPungs: MahjongScoringRule = {
  name: '28. All Pungs',
  points: 6,
  evaluate: grouping => {
    const pungs = getPungs(grouping);
    const kongs = getKongs(grouping);
    const pairs = getPairs(grouping);
    return pungs.length + kongs.length === 4 && pairs.length === 1 ? 1 : 0;
  },
};

// Half Flush - The hand is composed entirely of honors and a single suit.
export const halfFlush: MahjongScoringRule = {
  name: '29. Half Flush',
  points: 6,
  excludes: ['7. One Voided Suit'],
  evaluate: grouping => {
    const allTiles = getAllTilesFromGrouping(grouping);
    const suits = new Set(allTiles.map(tile => tile.type));
    const hasHonors = grouping.some(group => isHonor(group.tile));
    const allSuits: TileType[] = ['bamboo', 'wan', 'circle'];
    const missing = allSuits.filter(suit => !suits.has(suit));
    return missing.length === 2 && hasHonors ? 1 : 0;
  },
};

// Mixed Shifted Chows - Three chows in the 3 different suits, shifted up by 1.
export const mixedShiftedChows: MahjongScoringRule = {
  name: '30. Mixed Shifted Chows',
  points: 6,
  evaluate: grouping => findChowTriplets(grouping, isMixedShiftedChows).length,
  getUsedGroupsPerInstance: grouping => findChowTriplets(grouping, isMixedShiftedChows),
};

// All Types - The player's hand contains a Bamboo tile, a Character tile, a Circle tile, a Dragon tile and a Wind tile.
export const allTypes: MahjongScoringRule = {
  name: '31. All Types',
  points: 6,
  evaluate: grouping => {
    const types = new Set(grouping.map(group => group.tile.type));
    return types.size === 5 ? 1 : 0;
  },
};

// Melded Hand - Four melded groups (declared before winning) and is won by discard.
// A group is "melded" if it was declared/exposed before winning (declaredInGame)
// A concealed kong is NOT melded even if declared during the game
// The winning tile must complete the pair (since all 4 groups are already melded)
export const meldedHand: MahjongScoringRule = {
  name: '32. Melded Hand',
  points: 6,
  excludes: ['13. Pair Wait'],
  evaluate: (grouping, gameState) => {
    // Only count groups that were declared before winning (not groups formed with winning tile)
    const meldedGroups = grouping.filter(group => group.kind !== 'pair' && group.declaredInGame && !group.concealed);
    return meldedGroups.length === 4 && gameState.winFromDiscard ? 1 : 0;
  },
};

// Two Dragon Pungs - Two Pungs or Kongs of Dragons
export const twoDragonPungs: MahjongScoringRule = {
  name: '33. Two Dragon Pungs',
  points: 6,
  excludes: ['14. Dragon Pung'],
  evaluate: grouping => {
    const pungs = getPungs(grouping).filter(pung => pung.tile.type === 'dragon');
    const kongs = getKongs(grouping).filter(kong => kong.tile.type === 'dragon');
    return pungs.length + kongs.length >= 2 ? 1 : 0;
  },
};
