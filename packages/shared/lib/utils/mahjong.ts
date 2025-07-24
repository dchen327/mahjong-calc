import { mahjongScoringRules } from './mahjongScoringRules.js';
import { compareTiles, isSameTile, isSequential, parseTile } from './mahjongTile.js';
import type { MahjongGameState } from '@extension/storage/lib/base/types.js';
import type { MahjongGroup, MahjongTile } from 'index.mjs';

const allPlayableTiles = [
  'bamboo-1',
  'bamboo-2',
  'bamboo-3',
  'bamboo-4',
  'bamboo-5',
  'bamboo-6',
  'bamboo-7',
  'bamboo-8',
  'bamboo-9',
  'wan-1',
  'wan-2',
  'wan-3',
  'wan-4',
  'wan-5',
  'wan-6',
  'wan-7',
  'wan-8',
  'wan-9',
  'circle-1',
  'circle-2',
  'circle-3',
  'circle-4',
  'circle-5',
  'circle-6',
  'circle-7',
  'circle-8',
  'circle-9',
  'wind-east',
  'wind-south',
  'wind-west',
  'wind-north',
  'dragon-red',
  'dragon-green',
  'dragon-white',
];

// Generic cartesian product for arrays of arrays
const cartesianProduct = <T>(arrays: T[][]): T[][] =>
  arrays.reduce<T[][]>((acc, curr) => acc.map(a => curr.map(b => a.concat(b))).reduce((a, b) => a.concat(b), []), [[]]);

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
  const suitGroupings: MahjongGroup[][][] = Object.values(groupedNonDeclared).map(tileList =>
    findAllSuitGroupings(tileList),
  );

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
    return { kind: 'kong', tile: tiles[0], concealed: false };
  }
  if (tiles.length === 3 && isSequential(tiles)) {
    return { kind: 'chow', tile: tiles[0], concealed: false };
  }
  return null;
};

const memoize = <Args extends unknown[], R>(fn: (...args: Args) => R): ((...args: Args) => R) => {
  const cache = new Map<string, R>();
  return (...args: Args): R => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key)!;
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

const findAllSuitGroupings = (tiles: MahjongTile[]): MahjongGroup[][] => {
  const results: MahjongGroup[][] = [];
  tiles.sort(compareTiles);
  const seen = new Set<string>();
  const serializeGrouping = (groups: MahjongGroup[]) =>
    groups
      .map(g => {
        if (g.kind === 'chow' || g.kind === 'pung' || g.kind === 'pair') {
          return `${g.kind}:${g.tile.type}-${g.tile.value}`;
        }
        return `${g.kind}`;
      })
      .sort()
      .join('|');

  const search = (remaining: MahjongTile[], currentGroups: MahjongGroup[]) => {
    if (remaining.length === 0) {
      const key = serializeGrouping(currentGroups);
      if (!seen.has(key)) {
        seen.add(key);
        results.push(currentGroups);
      }
      return;
    }

    // Try all possible pungs (only check sorted, consecutive tiles)
    for (let i = 0; i < remaining.length - 2; i++) {
      if (isSameTile([remaining[i], remaining[i + 1], remaining[i + 2]])) {
        // Remove these three tiles by index
        const next = remaining.filter((_, idx) => idx !== i && idx !== i + 1 && idx !== i + 2);
        search(next, [...currentGroups, { kind: 'pung', tile: remaining[i], concealed: true }]);
      }
    }

    // Try all possible pairs
    for (let i = 0; i < remaining.length - 1; i++) {
      if (isSameTile([remaining[i], remaining[i + 1]])) {
        const next = remaining.filter((_, idx) => idx !== i && idx !== i + 1);
        search(next, [...currentGroups, { kind: 'pair', tile: remaining[i] }]);
      }
    }
    // Try all possible chows (i < j < k)
    for (let i = 0; i < remaining.length; i++) {
      for (let j = i + 1; j < remaining.length; j++) {
        for (let k = j + 1; k < remaining.length; k++) {
          const trio = [remaining[i], remaining[j], remaining[k]];
          if (isSequential(trio)) {
            const next = remaining.filter((_, idx) => idx !== i && idx !== j && idx !== k);
            search(next, [...currentGroups, { kind: 'chow', tile: trio[0], concealed: true }]);
          }
        }
      }
    }
  };

  search(tiles, []);
  // console.log(`Found ${results.length} groupings for ${tiles.map(t => `${t.type}-${t.value}`).join(', ')}`);
  return results;
};

// Score a single grouping using all rules
const scoreGrouping = (grouping: MahjongGroup[], gameState: MahjongGameState): number => {
  let score = 0;
  const nameHeader = 'Name'.padEnd(30);
  const quantHeader = 'Quantity'.padEnd(8);
  const pointsHeader = 'Points'.padEnd(8);
  console.log(`${nameHeader} ${quantHeader} ${pointsHeader}`);

  // First pass: collect all matched rules
  const matched = mahjongScoringRules
    .map(rule => {
      const quant = rule.evaluate(grouping, gameState);
      return quant > 0 ? { rule, quant } : null;
    })
    .filter(Boolean) as { rule: (typeof mahjongScoringRules)[number]; quant: number }[];

  // Second pass: filter out rules that are excluded by another matched rule
  const final = matched.filter(
    m => !matched.some(other => other !== m && other.rule.excludes && other.rule.excludes.includes(m.rule.name)),
  );

  // Print and sum
  final.reverse().forEach(({ rule, quant }) => {
    const nameCol = (rule.name + ' '.repeat(30)).slice(0, 30);
    const quantCol = `x${quant}`.padEnd(8);
    const pointsCol = `${rule.points} pts`.padEnd(8);
    console.log(`${nameCol} ${quantCol} ${pointsCol}`);
    score += rule.points * quant;
  });

  return score;
};

export const getWaitTiles = memoize((gameState: MahjongGameState): MahjongTile[] => {
  // Try all possible tiles as the winning tile
  const waits: MahjongTile[] = [];
  for (const tileStr of allPlayableTiles) {
    const testState = { ...gameState, winningTile: tileStr };
    if (getAllGroups(testState).length > 0) {
      waits.push(parseTile(tileStr));
    }
  }
  return waits;
});

export const calculateMahjongScore = (gameState: MahjongGameState): number => {
  const scores = getAllGroups(gameState).map(grouping => scoreGrouping(grouping, gameState));
  return Math.max(...scores);
};
