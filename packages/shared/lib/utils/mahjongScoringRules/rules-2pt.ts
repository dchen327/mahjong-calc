import {
  getChows,
  getPungs,
  getKongs,
  getPairs,
  toString,
  isHonor,
  getAllTilesFromGrouping,
  parseTile,
  isSameTile,
} from '../mahjongTile.js';
import type { MahjongScoringRule, TileType } from '../types.js';

// 2 points rules
// Dragon Pung - A Pung or Kong of Dragons.
export const dragonPung: MahjongScoringRule = {
  name: '14. Dragon Pung',
  points: 2,
  evaluate: grouping => {
    const pungs = getPungs(grouping);
    const kongs = getKongs(grouping);
    return [...pungs, ...kongs].filter(group => group.tile.type === 'dragon').length;
  },
};

// Prevalent Wind - A Pung or Kong of the prevalent Wind.
export const prevalentWind: MahjongScoringRule = {
  name: '15. Prevalent Wind',
  points: 2,
  evaluate: (grouping, gameState) => {
    if (!gameState.prevalentWind) return 0;
    const prevalent = parseTile(gameState.prevalentWind);
    const pungs = getPungs(grouping);
    const kongs = getKongs(grouping);
    return [...pungs, ...kongs].some(group => group.tile.type === 'wind' && group.tile.value === prevalent.value)
      ? 1
      : 0;
  },
};

// Seat Wind - A Pung or Kong of the player's seat Wind.
export const seatWind: MahjongScoringRule = {
  name: '16. Seat Wind',
  points: 2,
  evaluate: (grouping, gameState) => {
    if (!gameState.seatWind) return 0;
    const seat = parseTile(gameState.seatWind);
    const pungs = getPungs(grouping);
    const kongs = getKongs(grouping);
    return [...pungs, ...kongs].some(group => group.tile.type === 'wind' && group.tile.value === seat.value) ? 1 : 0;
  },
};

// Concealed Hand - The hand has no melded sets and is won by discard.
export const concealedHand: MahjongScoringRule = {
  name: '17. Concealed Hand',
  points: 2,
  evaluate: (grouping, gameState) => {
    const winningTile = parseTile(gameState.winningTile);
    return grouping
      .filter(group => group.kind !== 'pair')
      .every(group => {
        if (!group.concealed) {
          // If not concealed, must contain the winning tile
          return isSameTile([group.tile, winningTile]);
        }
        return true;
      }) && gameState.winFromDiscard
      ? 1
      : 0;
  },
};

// All Chows - The hand has four Chows and no Honors.
export const allChows: MahjongScoringRule = {
  name: '18. All Chows',
  points: 2,
  excludes: ['8. No Honor Tiles'],
  evaluate: grouping => {
    const chowCount = getChows(grouping).length;
    const pair = getPairs(grouping)[0];
    if (!pair) return 0;
    return chowCount === 4 && !isHonor(pair.tile) ? 1 : 0;
  },
};

// Tile Hog - The player uses all 4 copies of a tile without using them as a Kong.
export const tileHog: MahjongScoringRule = {
  name: '19. Tile Hog',
  points: 2,
  evaluate: grouping => {
    const tileCounts = new Map<string, number>();
    for (const group of grouping) {
      const tileStr = toString(group.tile);
      if (group.kind === 'chow' && typeof group.tile.value === 'number') {
        for (let i = 0; i < 3; i++) {
          const chowTile = toString({ type: group.tile.type, value: group.tile.value + i });
          tileCounts.set(chowTile, (tileCounts.get(chowTile) || 0) + 1);
        }
      } else if (group.kind === 'pung') {
        tileCounts.set(tileStr, (tileCounts.get(tileStr) || 0) + 3);
      } else if (group.kind === 'pair') {
        tileCounts.set(tileStr, (tileCounts.get(tileStr) || 0) + 2);
      }
    }
    return Array.from(tileCounts.values()).filter(count => count === 4).length;
  },
};

// Double Pung - Two Pungs (or Kongs) of the same number but in different suits.
export const doublePung: MahjongScoringRule = {
  name: '20. Double Pung',
  points: 2,
  evaluate: grouping => {
    const groups = [...getPungs(grouping), ...getKongs(grouping)].filter(g => !isHonor(g.tile));
    const suitMap = new Map<number, Set<TileType>>();
    for (const { tile } of groups) {
      if (typeof tile.value === 'number') {
        if (!suitMap.has(tile.value)) suitMap.set(tile.value, new Set());
        suitMap.get(tile.value)!.add(tile.type);
      }
    }
    // Count how many numbers have at least 2 different suits
    return Array.from(suitMap.values()).filter(suits => suits.size >= 2).length;
  },
};

// Two Concealed Pungs - Two concealed Pungs or Kongs.
export const twoConcealedPungs: MahjongScoringRule = {
  name: '21. Two Concealed Pungs',
  points: 2,
  evaluate: grouping => {
    const concealedPungs = getPungs(grouping).filter(pung => pung.concealed);
    const concealedKongs = getKongs(grouping).filter(kong => kong.concealed);
    return concealedPungs.length + concealedKongs.length >= 2 ? 1 : 0;
  },
};

// Concealed Kong - A concealed Kong.
export const concealedKong: MahjongScoringRule = {
  name: '22. Concealed Kong',
  points: 2,
  evaluate: grouping => {
    const concealedKongs = getKongs(grouping).filter(kong => kong.concealed);
    return concealedKongs.length > 0 ? 1 : 0;
  },
};

// All Simples - The hand is composed of only Simples (tiles that aren't Honors or 1's and 9's).
export const allSimples: MahjongScoringRule = {
  name: '23. All Simples',
  points: 2,
  excludes: ['8. No Honor Tiles'],
  evaluate: grouping => {
    const allTiles = getAllTilesFromGrouping(grouping);
    return allTiles.every(tile => !isHonor(tile) && typeof tile.value === 'number' && tile.value > 1 && tile.value < 9)
      ? 1
      : 0;
  },
};
