import { mahjongScoringRules } from './mahjongScoringRules/index.js';
import {
  compareTiles,
  isHonor,
  isKnitted,
  isSameTile,
  isSequential,
  isTerminal,
  parseTile,
  toString,
} from './mahjongTile.js';
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
  let finalGroupings = allCombinations.map(groups => [...declaredGroups, ...groups.flat()]);

  // Filter final groupings
  // ensure knitted groups are part of knitted straights
  finalGroupings = finalGroupings.filter(grouping => {
    const isValidKnittedGrouping = (grouping: MahjongGroup[]): boolean => {
      const knittedGroups = grouping.filter(g => g.kind === 'knitted');
      if (knittedGroups.length !== 3) return false;
      const suits = new Set(knittedGroups.map(g => g.tile.type));
      const values = new Set(knittedGroups.map(g => g.tile.value));
      return suits.size === 3 && values.size === 3;
    };

    return !grouping.some(g => g.kind === 'knitted') || isValidKnittedGrouping(grouping);
  });

  // ensure groupings with pairs either have exactly 1 or 7 pairs
  finalGroupings = finalGroupings.filter(grouping => {
    const hasValidPairs = (grouping: MahjongGroup[]): boolean => {
      const pairs = grouping.filter(g => g.kind === 'pair');
      return pairs.length === 1 || pairs.length === 7;
    };

    return hasValidPairs(grouping);
  });

  if (finalGroupings.length === 0) {
    // check for knitted tiles and unpaired honors
    const knittedGrouping = checkKnittedTilesAndUnpairedHonors(nonDeclaredTiles.map(t => parseTile(t)));
    if (knittedGrouping.length > 0) finalGroupings.push(knittedGrouping);

    // check for thirteen orphans
    const thirteenOrphansGrouping = checkThirteenOrphans(nonDeclaredTiles.map(t => parseTile(t)));
    if (thirteenOrphansGrouping.length > 0) finalGroupings.push(thirteenOrphansGrouping);
  }

  return finalGroupings;
};

const parseDeclaredSet = (tiles: MahjongTile[]): MahjongGroup | null => {
  if (tiles.length === 3 && isSameTile(tiles)) {
    return { kind: 'pung', tile: tiles[0], concealed: false, declaredInGame: true };
  }
  if (tiles.length === 4) {
    return { kind: 'kong', tile: tiles[1], concealed: tiles[0].type === 'flipped', declaredInGame: true };
  }
  if (tiles.length === 3 && isSequential(tiles)) {
    return { kind: 'chow', tile: tiles[0], concealed: false, declaredInGame: true };
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

  if (presentKnittedGroupIdxs.sort((a, b) => a - b).toString() === '0,1,2') {
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

const checkThirteenOrphans = (tiles: MahjongTile[]): MahjongGroup[] => {
  // One of each Honor and Terminal (1 or 9) tile, and a second copy of any Honor or Terminal tile.
  if (tiles.length !== 14) return [];
  if (!tiles.every(tile => isHonor(tile) || isTerminal(tile))) return [];
  // One dupliate means set has length 13
  const uniqueTiles = new Set(tiles.map(t => toString(t)));
  if (uniqueTiles.size !== 13) return [];
  return [{ kind: 'thirteen-orphans', tile: tiles[0], tiles, concealed: true }];
};

const findAllSuitGroupings = (tiles: MahjongTile[], winningTile: MahjongTile): MahjongGroup[][] => {
  const results: MahjongGroup[][] = [];
  tiles.sort(compareTiles);
  const winningTileIdx = tiles.findIndex(t => isSameTile([t, winningTile]));
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
          { kind: 'pung', tile: remaining[i], concealed: !containsWinning, declaredInGame: false },
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
            search(next, nextIndices, [
              ...currentGroups,
              { kind: 'chow', tile: trio[0], concealed: !containsWinning, declaredInGame: false },
            ]);
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
  return results;
};

// Score a single grouping using all rules
const scoreGrouping = (
  grouping: MahjongGroup[],
  gameState: MahjongGameState,
): { score: number; matched: { rule: MahjongScoringRule; quant: number }[] } => {
  let score = 0;

  // First pass: collect all matched rules
  const matched = mahjongScoringRules
    .map(rule => {
      const quant = rule.evaluate(grouping, gameState);
      return quant > 0 ? { rule, quant } : null;
    })
    .filter(Boolean) as { rule: (typeof mahjongScoringRules)[number]; quant: number }[];

  // Second pass: apply exclusions iteratively from highest to lowest points
  // Keep iterating until no more rules are excluded
  let final = [...matched];
  let changed = true;

  while (changed) {
    changed = false;
    // Sort by points descending so we process highest scoring rules first
    final.sort((a, b) => b.rule.points - a.rule.points);

    // Check each rule to see if it should be excluded by any higher-scoring rule that's already confirmed
    const nextFinal: typeof final = [];
    for (const rule of final) {
      // Check if this rule is excluded by any rule already confirmed in nextFinal
      const isExcluded = nextFinal.some(other => other.rule.excludes && other.rule.excludes.includes(rule.rule.name));
      if (!isExcluded) {
        nextFinal.push(rule);
      } else {
        changed = true; // We excluded something, so we need to iterate again
      }
    }
    final = nextFinal;
  }

  // Third pass: enforce group usage constraints
  // Account-Once Principle: When scoring a pattern, at least one group must be "fresh" (not yet used)
  // Process higher-point rules first to maximize score
  final.sort((a, b) => b.rule.points - a.rule.points);

  // Collect instances per rule
  type ScoringInstance = { rule: (typeof final)[number]; groups: number[]; ruleIdx: number };
  const instancesByRule: ScoringInstance[][] = [];
  const rulesWithoutGroups: typeof final = [];

  for (let ruleIdx = 0; ruleIdx < final.length; ruleIdx++) {
    const matchedRule = final[ruleIdx];
    if (matchedRule.rule.getUsedGroupsPerInstance) {
      const instanceGroups = matchedRule.rule.getUsedGroupsPerInstance(grouping, gameState);
      const ruleInstances = instanceGroups.map(groups => ({ rule: matchedRule, groups, ruleIdx }));
      if (ruleInstances.length > 0) {
        instancesByRule.push(ruleInstances);
      }
    } else {
      rulesWithoutGroups.push(matchedRule);
    }
  }

  // Sort rules by points (descending)
  instancesByRule.sort((a, b) => b[0].rule.rule.points - a[0].rule.rule.points);

  // Group rules by point value
  const rulesByPoints = new Map<number, number[]>();
  for (let i = 0; i < instancesByRule.length; i++) {
    const points = instancesByRule[i][0].rule.rule.points;
    if (!rulesByPoints.has(points)) {
      rulesByPoints.set(points, []);
    }
    rulesByPoints.get(points)!.push(i);
  }

  // Helper to try scoring with a specific ordering
  const tryScoring = (ordering: number[]): Map<string, number> => {
    const usedGroups = new Set<number>();
    const instanceCounts = new Map<string, number>();
    const instanceIndices = ordering.map(() => 0);

    let madeProgress = true;
    while (madeProgress) {
      madeProgress = false;
      for (let idx = 0; idx < ordering.length; idx++) {
        const i = ordering[idx];
        const instances = instancesByRule[i];
        while (instanceIndices[idx] < instances.length) {
          const instance = instances[instanceIndices[idx]];
          const hasFreshGroup = instance.groups.some(g => !usedGroups.has(g));

          if (hasFreshGroup) {
            for (const g of instance.groups) {
              usedGroups.add(g);
            }
            const ruleName = instance.rule.rule.name;
            instanceCounts.set(ruleName, (instanceCounts.get(ruleName) || 0) + 1);
            instanceIndices[idx]++;
            madeProgress = true;
            break;
          } else {
            instanceIndices[idx]++;
          }
        }
      }
    }
    return instanceCounts;
  };

  // Helper to generate permutations
  const permute = <T>(arr: T[]): T[][] => {
    if (arr.length <= 1) return [arr];
    const result: T[][] = [];
    for (let i = 0; i < arr.length; i++) {
      const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
      const perms = permute(rest);
      for (const perm of perms) {
        result.push([arr[i], ...perm]);
      }
    }
    return result;
  };

  // Try all permutations within each point group and pick the best
  let bestInstanceCounts = new Map<string, number>();
  let bestScore = 0;

  // Build all possible orderings by permuting within each point group
  const pointGroups = Array.from(rulesByPoints.entries()).sort((a, b) => b[0] - a[0]);
  const allPermutations: number[][] = [[]];

  for (const [, ruleIndices] of pointGroups) {
    if (ruleIndices.length <= 6) {
      // Only permute if reasonable number (6! = 720)
      const perms = permute(ruleIndices);
      const newPermutations: number[][] = [];
      for (const basePerm of allPermutations) {
        for (const perm of perms) {
          newPermutations.push([...basePerm, ...perm]);
        }
      }
      allPermutations.length = 0;
      allPermutations.push(...newPermutations);
    } else {
      // Too many to permute, just use original order
      for (let i = 0; i < allPermutations.length; i++) {
        allPermutations[i].push(...ruleIndices);
      }
    }
  }

  // Try each permutation and keep the best
  for (const ordering of allPermutations) {
    const instanceCounts = tryScoring(ordering);
    let score = 0;
    for (const [ruleName, count] of instanceCounts) {
      const rule = final.find(r => r.rule.name === ruleName);
      if (rule) {
        score += rule.rule.points * count;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestInstanceCounts = instanceCounts;
    }
  }

  // Build final list from best instance counts
  // Apply Non-Identical Principle: Rules using 3+ groups can only score once
  const validRules: typeof final = [...rulesWithoutGroups];
  for (const matchedRule of final) {
    if (matchedRule.rule.getUsedGroupsPerInstance) {
      let count = bestInstanceCounts.get(matchedRule.rule.name) || 0;
      if (count > 0) {
        // Check the number of groups used by this rule
        const instances = matchedRule.rule.getUsedGroupsPerInstance(grouping, gameState);
        if (instances.length > 0 && instances[0].length >= 3) {
          // Rules using 3+ groups can only score once (Non-Identical Principle)
          count = 1;
        }
        validRules.push({ ...matchedRule, quant: count });
      }
    }
  }
  final = validRules;

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
  score = final.reduce((sum, { rule, quant }) => sum + rule.points * quant, 0);

  return { score, matched: final };
};

export const getWaitTiles = memoize((gameState: MahjongGameState): MahjongTile[] => {
  // Try all possible tiles as the winning tile
  const waits: MahjongTile[] = [];
  for (const tileStr of allPlayableTiles) {
    const testState = { ...gameState, winningTile: tileStr };
    if (getAllGroups(testState).length > 0) waits.push(parseTile(tileStr));
  }
  return waits;
});

export const calculateMahjongScore = (gameState: MahjongGameState): HandScoreResult => {
  try {
    const results = getAllGroups(gameState).map(grouping => scoreGrouping(grouping, gameState));
    if (results.length === 0) {
      return { score: 0, matched: [] };
    }
    // Find the result with the maximum score
    const maxResult = results.reduce((max, curr) => (curr.score > max.score ? curr : max), results[0]);
    const matched: HandScoreRuleSummary[] = maxResult.matched.map(({ rule, quant }) => ({
      name: rule.name,
      points: rule.points,
      quant,
    }));
    return { score: maxResult.score, matched };
  } catch (e) {
    // Gracefully handle any unexpected errors
    console.error('Error calculating Mahjong score:', e);
    return { score: 0, matched: [] };
  }
};
