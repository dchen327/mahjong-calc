import { mahjongScoringRules } from './mahjongScoringRules.js';
import { compareTiles, isHonor, isKnitted, isSameTile, isSequential, parseTile, toString } from './mahjongTile.js';
import type { HandScoreResult, HandScoreRuleSummary } from '@extension/storage';
import type { MahjongGameState } from '@extension/storage/lib/base/types.js';
import type { MahjongGroup, MahjongScoringRule, MahjongTile } from 'index.mjs';

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
  console.log(declaredGroups);

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
    findAllSuitGroupings(
      tileList,
      gameState.winFromDiscard ? parseTile(winningTile) : ({ type: 'flipped', value: 0 } as MahjongTile),
    ),
  );

  // Cartesian product of all suit groupings
  const allCombinations = cartesianProduct(suitGroupings);

  // Add declared groups to each combination
  const finalGroupings = allCombinations.map(groups => [...declaredGroups, ...groups.flat()]);

  if (finalGroupings.length === 0) {
    // check for knitted tiles and unpaired honors
    const knittedGrooping = checkKnittedTilesAndUnpairedHonors(nonDeclaredTiles.map(t => parseTile(t)));
    if (knittedGrooping.length > 0) finalGroupings.push(knittedGrooping);
  }

  return finalGroupings;
};

const parseDeclaredSet = (tiles: MahjongTile[]): MahjongGroup | null => {
  if (tiles.length === 2 && isSameTile(tiles)) {
    return { kind: 'pair', tile: tiles[0] };
  }
  if (tiles.length === 3 && isSameTile(tiles)) {
    return { kind: 'pung', tile: tiles[0], concealed: false };
  }
  if (tiles.length === 4) {
    return { kind: 'kong', tile: tiles[1], concealed: tiles[0].type === 'flipped' };
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

const checkKnittedTilesAndUnpairedHonors = (tiles: MahjongTile[]): MahjongGroup[] => {
  // Check that all tiles are unpaired and length is 14
  const tileStrs = tiles.map(t => toString(t));
  if (tiles.length !== 14 || new Set(tileStrs).size !== tiles.length) return [];
  // Knitted sequences are singles of 1,4,7 in one suit, 2,5,8 in a second suit and 3,6,9 in the third suit.
  // Collect suited tiles
  const suits = ['circle', 'bamboo', 'wan'] as const;
  type SuitType = (typeof suits)[number];
  const suitedTiles: Record<SuitType, MahjongTile[]> = {
    circle: [],
    bamboo: [],
    wan: [],
  };
  tiles.forEach(tile => {
    if (suits.includes(tile.type as SuitType)) {
      suitedTiles[tile.type as SuitType].push(tile);
    }
  });

  const knittedGroups = [
    [1, 4, 7],
    [2, 5, 8],
    [3, 6, 9],
  ];

  const presentKnittedGroupIdxs = []; // we want 0,1,2 present

  // Check for knitted sequences
  for (const suit of suits) {
    const suitTiles = suitedTiles[suit];

    // Loop through knittedGroups with index
    for (let i = 0; i < knittedGroups.length; i++) {
      const knittedGroup = knittedGroups[i];
      // check if suitTiles is subset of knitted group
      if (suitTiles.every(tile => typeof tile.value === 'number' && knittedGroup.includes(tile.value))) {
        presentKnittedGroupIdxs.push(i);
      }
    }
  }

  if (presentKnittedGroupIdxs.sort().toString() === '0,1,2') {
    // We have a knitted group, return it
    return [
      {
        kind: 'knitted-and-honors',
        tile: tiles[0],
        tiles,
        concealed: true,
      },
    ];
  }

  return [];
};

const findAllSuitGroupings = (tiles: MahjongTile[], winningTile: MahjongTile): MahjongGroup[][] => {
  const results: MahjongGroup[][] = [];
  const winningTileIdx = tiles.findIndex(t => isSameTile([t, winningTile]));
  tiles.sort(compareTiles);
  const seen = new Set<string>();
  const serializeGrouping = (groups: MahjongGroup[]) =>
    groups
      .map(g => {
        let base = `${g.kind}:${g.tile.type}-${g.tile.value}`;
        if ('concealed' in g) {
          base += `:concealed=${g.concealed}`;
        }
        return base;
      })
      .sort()
      .join('|');

  const search = (remaining: MahjongTile[], remainingIndices: number[], currentGroups: MahjongGroup[]) => {
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
        const groupIndices = [i, i + 1, i + 2].map(idx => remainingIndices[idx]);
        const containsWinning = groupIndices.includes(winningTileIdx);
        const next = remaining.filter((_, idx) => ![i, i + 1, i + 2].includes(idx));
        const nextIndices = remainingIndices.filter((_, idx) => ![i, i + 1, i + 2].includes(idx));
        search(next, nextIndices, [
          ...currentGroups,
          { kind: 'pung', tile: remaining[i], concealed: !containsWinning },
        ]);
      }
    }

    // Try all possible pairs
    for (let i = 0; i < remaining.length - 1; i++) {
      if (isSameTile([remaining[i], remaining[i + 1]])) {
        const next = remaining.filter((_, idx) => idx !== i && idx !== i + 1);
        const nextIndices = remainingIndices.filter((_, idx) => idx !== i && idx !== i + 1);
        search(next, nextIndices, [...currentGroups, { kind: 'pair', tile: remaining[i] }]);
      }
    }

    // Try all possible chows and knitted groups
    for (let i = 0; i < remaining.length; i++) {
      for (let j = i + 1; j < remaining.length; j++) {
        for (let k = j + 1; k < remaining.length; k++) {
          const trio = [remaining[i], remaining[j], remaining[k]];
          if (isSequential(trio)) {
            const groupIndices = [i, j, k].map(idx => remainingIndices[idx]);
            const containsWinning = groupIndices.includes(winningTileIdx);
            const next = remaining.filter((_, idx) => idx !== i && idx !== j && idx !== k);
            const nextIndices = remainingIndices.filter((_, idx) => idx !== i && idx !== j && idx !== k);
            search(next, nextIndices, [...currentGroups, { kind: 'chow', tile: trio[0], concealed: !containsWinning }]);
          }
          if (isKnitted(trio)) {
            const next = remaining.filter((_, idx) => idx !== i && idx !== j && idx !== k);
            const nextIndices = remainingIndices.filter((_, idx) => idx !== i && idx !== j && idx !== k);
            search(next, nextIndices, [...currentGroups, { kind: 'knitted', tile: trio[0], concealed: true }]);
          }
        }
      }
    }
  };

  const originalIndices = tiles.map((_, idx) => idx);
  search(tiles, originalIndices, []);
  // console.log(`Found ${results.length} groupings for ${tiles.map(t => `${t.type}-${t.value}`).join(', ')}`);
  return results;
};

// Score a single grouping using all rules
const scoreGrouping = (
  grouping: MahjongGroup[],
  gameState: MahjongGameState,
): { score: number; matched: { rule: MahjongScoringRule; quant: number }[] } => {
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

  // Edge cases
  // If 48. Big Three Winds, check for pung of terminals and add back
  if (final.some(m => m.rule.name === '48. Big Three Winds')) {
    const hasTerminalPung = grouping.some(
      g => (g.kind === 'pung' || g.kind === 'kong') && !isHonor(g.tile) && (g.tile.value === 1 || g.tile.value === 9),
    );
    if (hasTerminalPung) {
      // Add pungOfTerminalsOrHonors back in
      const rule = mahjongScoringRules.find(r => r.name === '5. Pung of Terminals or Honors');
      if (rule) final.push({ rule, quant: 1 });
    }
  }

  // If no rules matched, add 43. Chicken Hand x1
  if (final.length === 0) final.push({ rule: { name: '43. Chicken Hand', points: 8, evaluate: () => 8 }, quant: 1 });

  // Print and sum
  final.reverse().forEach(({ rule, quant }) => {
    const nameCol = (rule.name + ' '.repeat(30)).slice(0, 30);
    const quantCol = `x${quant}`.padEnd(8);
    const pointsCol = `${rule.points} pts`.padEnd(8);
    console.log(`${nameCol} ${quantCol} ${pointsCol}`);
    score += rule.points * quant;
  });

  return { score, matched: final };
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

export const calculateMahjongScore = (gameState: MahjongGameState): HandScoreResult => {
  const results = getAllGroups(gameState).map(grouping => scoreGrouping(grouping, gameState));
  // Find the result with the maximum score
  const maxResult = results.reduce((max, curr) => (curr.score > max.score ? curr : max), results[0]);
  const matched: HandScoreRuleSummary[] = maxResult.matched.map(({ rule, quant }) => ({
    name: rule.name,
    points: rule.points,
    quant,
  }));
  return { score: maxResult.score, matched };
};
