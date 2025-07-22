import { compareTiles, isSameTile, isSequential, parseTile } from './mahjongTile.js';
import type { MahjongGameState } from '@extension/storage/lib/base/types.js';
import type { MahjongGroup, MahjongTile } from 'index.mjs';

// Generic cartesian product for arrays of arrays
const cartesianProduct = <T>(arrays: T[][]): T[][] =>
  arrays.reduce<T[][]>(
    (acc, curr) => acc.map(a => curr.map(b => [...a, ...b])).reduce((a, b) => a.concat(b), []),
    [[]],
  );

const getAllGroups = (gameState: MahjongGameState): MahjongGroup[][] => {
  // Return list of different 14 tile groupings
  // TODO: fix naming later, right now sets are unparsed, then parsed into groups
  const { declaredSets, concealedTiles, winningTile } = gameState;
  // Add parsed declared sets to groups
  const declaredGroups: MahjongGroup[] = declaredSets
    .map(set => parseDeclaredSet(set.map(parseTile)))
    .filter(Boolean) as MahjongGroup[];

  // non declared is concealedTiles + winningTile
  const nonDeclaredTiles = [...concealedTiles, winningTile];

  // group non-declared tiles by type (to make groups)
  const groupedNonDeclared: Record<string, MahjongTile[]> = {};
  nonDeclaredTiles.forEach(tile => {
    const parsedTile = parseTile(tile);
    // key is tile.type
    if (!groupedNonDeclared[parsedTile.type]) {
      groupedNonDeclared[parsedTile.type] = [];
    }
    groupedNonDeclared[parsedTile.type].push(parsedTile);
  });

  // For each suit/type, get all possible groupings
  const suitGroupings: MahjongGroup[][][] = Object.values(groupedNonDeclared).map(tileList => {
    tileList.sort(compareTiles);
    return findAllSuitGroupings(tileList);
  });

  // Cartesian product of all suit groupings
  const allCombinations = cartesianProduct(suitGroupings);

  // Add declared groups to each combination
  const finalGroupings = allCombinations.map(groups => [...declaredGroups, ...groups.flat()]);

  return finalGroupings;
};

const parseDeclaredSet = (tiles: MahjongTile[]): MahjongGroup | null => {
  if (tiles.length === 2 && isSameTile(tiles)) {
    return { kind: 'pair', tile: tiles[0] };
  }
  if (tiles.length === 3 && isSameTile(tiles)) {
    return { kind: 'pung', tile: tiles[0], concealed: false };
  }
  if (tiles.length === 4 && isSameTile(tiles)) {
    return { kind: 'kong', tile: tiles[0], concealed: false, declared: true };
  }
  if (tiles.length === 3 && isSequential(tiles)) {
    return { kind: 'chow', first: tiles[0], concealed: false };
  }
  return null;
};

const findAllSuitGroupings = (tiles: MahjongTile[]): MahjongGroup[][] => {
  const results: MahjongGroup[][] = [];

  const search = (remaining: MahjongTile[], currentGroups: MahjongGroup[]) => {
    if (remaining.length === 0) {
      results.push(currentGroups);
      return;
    }

    // Try to make a pung (3 identical tiles)
    if (remaining.length >= 3 && isSameTile(remaining.slice(0, 3))) {
      search(remaining.slice(3), [...currentGroups, { kind: 'pung', tile: remaining[0], concealed: true }]);
    }

    // Try to make a chow (3 sequential tiles, only for suited tiles)
    if (remaining.length >= 3 && isSequential(remaining.slice(0, 3))) {
      search(remaining.slice(3), [...currentGroups, { kind: 'chow', first: remaining[0], concealed: true }]);
    }

    // Try to make a pair (2 identical tiles)
    if (remaining.length >= 2 && isSameTile(remaining.slice(0, 2))) {
      search(remaining.slice(2), [...currentGroups, { kind: 'pair', tile: remaining[0] }]);
    }

    // No group formed: do nothing (do not skip tiles for complete hands)
  };

  search(tiles, []);
  return results;
};

export const calculateMahjongScore = (gameState: MahjongGameState): number => {
  getAllGroups(gameState);
  return Math.floor(Math.random() * 10) + 1;
};
