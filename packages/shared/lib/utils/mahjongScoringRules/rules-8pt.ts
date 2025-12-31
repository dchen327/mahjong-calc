import {
  getKongs,
  getAllTilesFromGrouping,
  toString,
  findChowTriplets,
  findPungTriplets,
  isMixedStraight,
  isMixedTripleChow,
  isMixedShiftedPungs,
} from '../mahjongTile.js';
import type { MahjongScoringRule } from '../types.js';

// 8 point rules
// Mixed Straight - A Chow of 1,2,3, a Chow of 4,5,6 and a Chow of 7,8,9 in three different suits.
export const mixedStraight: MahjongScoringRule = {
  name: '34. Mixed Straight',
  points: 8,
  evaluate: grouping => findChowTriplets(grouping, isMixedStraight).length,
  getUsedGroupsPerInstance: grouping => findChowTriplets(grouping, isMixedStraight),
};

// Reversible Tiles - The hand is composed of only Reversible (1,2,3,4,5,8,9 Circle; 2,4,5,6,8,9 Bamboo; White Dragon) tiles.
export const reversibleTiles: MahjongScoringRule = {
  name: '35. Reversible Tiles',
  points: 8,
  excludes: ['7. One Voided Suit'],
  evaluate: grouping => {
    const reversibleTiles = new Set([
      'circle-1',
      'circle-2',
      'circle-3',
      'circle-4',
      'circle-5',
      'circle-8',
      'circle-9',
      'bamboo-2',
      'bamboo-4',
      'bamboo-5',
      'bamboo-6',
      'bamboo-8',
      'bamboo-9',
      'dragon-white',
    ]);
    const allTiles = getAllTilesFromGrouping(grouping);
    return allTiles.every(tile => reversibleTiles.has(toString(tile))) ? 1 : 0;
  },
};

// Mixed Triple Chow - Three Chows of the same numbers in the 3 different suits.
export const mixedTripleChow: MahjongScoringRule = {
  name: '36. Mixed Triple Chow',
  points: 8,
  excludes: ['2. Mixed Double Chow'],
  evaluate: grouping => findChowTriplets(grouping, isMixedTripleChow).length,
  getUsedGroupsPerInstance: grouping => findChowTriplets(grouping, isMixedTripleChow),
};

// Mixed Shifted Pungs - Three Pungs or Kongs in the three different suits, shifted up by one.
export const mixedShiftedPungs: MahjongScoringRule = {
  name: '37. Mixed Shifted Pungs',
  points: 8,
  evaluate: grouping => findPungTriplets(grouping, isMixedShiftedPungs).length,
  getUsedGroupsPerInstance: grouping => findPungTriplets(grouping, isMixedShiftedPungs),
};

// Two Concealed Kongs - Two concealed Kongs.
export const twoConcealedKongs: MahjongScoringRule = {
  name: '38. Two Concealed Kongs',
  points: 8,
  excludes: ['21. Two Concealed Pungs', '22. Concealed Kong'],
  evaluate: grouping => {
    const concealedKongs = getKongs(grouping).filter(kong => kong.concealed);
    return concealedKongs.length >= 2 ? 1 : 0;
  },
};

// Last Tile Draw - Winning by draw on the last tile of the wall.
export const lastTileDraw: MahjongScoringRule = {
  name: '39. Last Tile Draw',
  points: 8,
  excludes: ['9. Self Drawn'],
  evaluate: (_, gameState) => (gameState.lastTileInGame && gameState.winFromWall ? 1 : 0),
};

// Last Tile Claim - Winning by discard after the last tile of the wall is drawn.
export const lastTileClaim: MahjongScoringRule = {
  name: '40. Last Tile Claim',
  points: 8,
  evaluate: (_, gameState) => (gameState.lastTileInGame && gameState.winFromDiscard ? 1 : 0),
};

// Out with Replacement Tile - Winning on the replacement tile from declaring a Kong.
export const outWithReplacementTile: MahjongScoringRule = {
  name: '41. Out with Replacement Tile',
  points: 8,
  excludes: ['9. Self Drawn'],
  evaluate: (_, gameState) => (gameState.replacementTile ? 1 : 0),
};

// Robbing the Kong - Winning off the tile that another player attempts to use to promote a Pung to a Kong.
export const robbingTheKong: MahjongScoringRule = {
  name: '42. Robbing the Kong',
  points: 8,
  excludes: ['27. Last of its Kind'],
  evaluate: (_, gameState) => (gameState.robbingTheKong ? 1 : 0),
};

// Chicken Hand - Winning with a hand that would otherwise be worth 0 points other than flowers
// This is checked in mahjong.ts after checking all other rules
