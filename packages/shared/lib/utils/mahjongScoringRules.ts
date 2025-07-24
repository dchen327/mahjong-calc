import { getWaitTiles } from './mahjong.js';
import {
  isSameChow,
  isMixedChow,
  isShortStraight,
  isTerminalOrHonorPung,
  sortChows,
  isHonor,
  parseTile,
  isSameTile,
  getChows,
  getPungs,
  getKongs,
  getPairs,
  toString,
  isTerminalOrHonorGroup,
} from './mahjongTile.js';
import type { MahjongScoringRule, TileType } from './types.js';

// 1 point rules
// Pure Double Chow - Two identical Chows in the same suit.
export const pureDoubleChow: MahjongScoringRule = {
  name: '1. Pure Double Chow',
  points: 1,
  evaluate: grouping => {
    const chows = getChows(grouping);
    let count = 0;
    for (let i = 0; i < chows.length; i++) {
      for (let j = i + 1; j < chows.length; j++) {
        if (isSameChow(chows[i], chows[j])) {
          count++;
        }
      }
    }
    return count;
  },
};

// Mixed Double Chow - Two Chows of the same numbers in different suits.
export const mixedDoubleChow: MahjongScoringRule = {
  name: '2. Mixed Double Chow',
  points: 1,
  evaluate: grouping => {
    const chows = getChows(grouping);
    let count = 0;
    for (let i = 0; i < chows.length; i++) {
      for (let j = i + 1; j < chows.length; j++) {
        if (isMixedChow(chows[i], chows[j])) {
          count++;
        }
      }
    }
    return count;
  },
};

// Short Straight - Two Chows that form a 6-tile straight.
export const shortStraight: MahjongScoringRule = {
  name: '3. Short Straight',
  points: 1,
  evaluate: grouping => {
    const chows = getChows(grouping);
    let count = 0;
    for (let i = 0; i < chows.length; i++) {
      for (let j = i + 1; j < chows.length; j++) {
        if (isShortStraight(chows[i], chows[j])) {
          count++;
        }
      }
    }
    return count;
  },
};

// Two Terminal Chows - A Chow of 1,2,3 and a Chow of 7,8,9 in the same suit.
export const twoTerminalChows: MahjongScoringRule = {
  name: '4. Two Terminal Chows',
  points: 1,
  evaluate: grouping => {
    const chows = sortChows(getChows(grouping));
    let count = 0;
    for (let i = 0; i < chows.length; i++) {
      for (let j = i + 1; j < chows.length; j++) {
        if (chows[i].tile.type === chows[j].tile.type && chows[i].tile.value === 1 && chows[j].tile.value === 7) {
          count++;
        }
      }
    }
    return count;
  },
};

// Pung of Terminals or Honors - A Pung or Kong of 1's, 9's, or Winds that are not your Seat Wind or Prevalent Wind.
export const pungOfTerminalsOrHonors: MahjongScoringRule = {
  name: '5. Pung of Terminals or Honors',
  points: 1,
  evaluate: (grouping, gameState) => {
    const pungs = getPungs(grouping);
    const kongs = getKongs(grouping);
    let count = 0;
    for (const group of [...pungs, ...kongs]) {
      if (isTerminalOrHonorPung(group, gameState.seatWind, gameState.prevalentWind)) {
        count++;
      }
    }
    return count;
  },
};

// Melded Kong - A Melded Kong.
export const meldedKong: MahjongScoringRule = {
  name: '6. Melded Kong',
  points: 1,
  evaluate: grouping => {
    const kongs = getKongs(grouping);
    return kongs.filter(kong => !kong.concealed).length;
  },
};

// One Voided Suit - The hand has no tiles from a specific suit.
export const oneVoidedSuit: MahjongScoringRule = {
  name: '7. One Voided Suit',
  points: 1,
  evaluate: grouping => {
    const suits = new Set(grouping.map(group => group.tile.type));
    const allSuits: TileType[] = ['bamboo', 'wan', 'circle'];
    const missing = allSuits.filter(suit => !suits.has(suit));
    return missing.length;
  },
};

// No Honor Tiles - The hand has no Honor tiles.
export const noHonorTiles: MahjongScoringRule = {
  name: '8. No Honor Tiles',
  points: 1,
  evaluate: grouping => (grouping.some(group => isHonor(group.tile)) ? 0 : 1),
};

// Self Drawn - The player wins by drawing the winning tile.
export const selfDrawn: MahjongScoringRule = {
  name: '9. Self-Drawn',
  points: 1,
  evaluate: (grouping, gameState) => (gameState.winFromWall ? 1 : 0),
};

// Edge Wait - Winning on a 3 to form a Chow of 1,2,3 or a 7 to form a Chow of 7,8,9.
export const edgeWait: MahjongScoringRule = {
  name: '11. Edge Wait',
  points: 1,
  evaluate: (grouping, gameState) => {
    const waitingTiles = getWaitTiles(gameState);
    if (waitingTiles.length > 1) return 0;
    const winningTile = parseTile(gameState.winningTile);
    if (isHonor(winningTile)) return 0;
    const chows = getChows(grouping).filter(group => group.tile.type === winningTile.type);
    return chows.some(
      chow => (chow.tile.value === 1 && winningTile.value === 3) || (chow.tile.value === 7 && winningTile.value === 7),
    )
      ? 1
      : 0;
  },
};

// Closed Wait - Winning on the middle tile of a Chow. For instance a 3 to form a Chow of 2,3,4.
export const closedWait: MahjongScoringRule = {
  name: '12. Closed Wait',
  points: 1,
  evaluate: (grouping, gameState) => {
    const waitingTiles = getWaitTiles(gameState);
    if (waitingTiles.length > 1) return 0;
    const winningTile = parseTile(gameState.winningTile);
    if (isHonor(winningTile)) return 0;
    const chows = getChows(grouping).filter(group => group.tile.type === winningTile.type);
    return chows.some(chow => typeof winningTile.value === 'number' && chow.tile.value === winningTile.value - 1)
      ? 1
      : 0;
  },
};

// Pair Wait - Winning on a tile to form a Pair.
// Rules 11-13 only apply if the player can only win off of a single type of tile. For instance, only winning off of Bamboo 1.
export const pairWait: MahjongScoringRule = {
  name: '13. Pair Wait',
  points: 1,
  excludes: ['11. Edge Wait', '12. Closed Wait'],
  evaluate: (grouping, gameState) => {
    const waitingTiles = getWaitTiles(gameState);
    if (waitingTiles.length > 1) return 0;
    const winningTile = parseTile(gameState.winningTile);
    const pairs = getPairs(grouping);
    return pairs.some(pair => isSameTile([pair.tile, winningTile])) ? 1 : 0;
  },
};
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
  evaluate: (_, gameState) => (gameState.declaredSets.length === 0 && gameState.winFromDiscard ? 1 : 0),
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
    const counts = new Map<number, Set<TileType>>();
    for (const group of groups) {
      const { type, value } = group.tile;
      if (typeof value === 'number') {
        if (!counts.has(value)) counts.set(value, new Set());
        counts.get(value)!.add(type);
      }
    }
    return Array.from(counts.values()).filter(suitSet => suitSet.size >= 2).length;
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
    const allTiles = grouping.flatMap(group => {
      if (group.kind === 'chow' && typeof group.tile.value === 'number') {
        return [
          group.tile,
          { type: group.tile.type, value: group.tile.value + 1 },
          { type: group.tile.type, value: group.tile.value + 2 },
        ];
      }
      return [group.tile];
    });
    return allTiles.every(tile => !isHonor(tile) && typeof tile.value === 'number' && tile.value > 1 && tile.value < 9)
      ? 1
      : 0;
  },
};

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
  excludes: ['9. Self-Drawn'],
  points: 4,
  evaluate: (grouping, gameState) => {
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
    const meldedKongs = getKongs(grouping).filter(kong => !kong.concealed);
    return meldedKongs.length >= 2 ? 1 : 0;
  },
};

// Last of its Kind - Winning on the publicly last tile of its kind. This tile must be the last tile based on the visible discards and melds.
export const lastOfItsKind: MahjongScoringRule = {
  name: '27. Last of its Kind',
  points: 4,
  evaluate: (_, gameState) => (gameState.lastTileOfKind ? 1 : 0),
};

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
    const suits = new Set(grouping.map(group => group.tile.type));
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
  evaluate: grouping => {
    const chows = getChows(grouping);
    // Check all unique triples of chows
    for (let i = 0; i < chows.length; i++) {
      for (let j = i + 1; j < chows.length; j++) {
        for (let k = j + 1; k < chows.length; k++) {
          const [c1, c2, c3] = [chows[i], chows[j], chows[k]];
          const values = [c1.tile.value, c2.tile.value, c3.tile.value].map(Number).sort();
          const suits = [c1.tile.type, c2.tile.type, c3.tile.type];
          const allDifferentSuits = new Set(suits).size === 3;
          const consecutive = values[1] === values[0] + 1 && values[2] === values[1] + 1;
          if (allDifferentSuits && consecutive) {
            return 1;
          }
        }
      }
    }
    return 0;
  },
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

// Melded Hand - Four melded groups and is won by discard.
export const meldedHand: MahjongScoringRule = {
  name: '32. Melded Hand',
  points: 6,
  excludes: ['13. Pair Wait'],
  evaluate: (grouping, gameState) => {
    const meldedGroups = grouping.filter(group => group.kind !== 'pair' && !group.concealed);
    return meldedGroups.length === 4 && gameState.winFromDiscard ? 1 : 0;
  },
};

// Two Dragon Pungs - Two Pungs or Kongs of Dragons
// Does not combine with:
// Dragon Pung
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

export const mahjongScoringRules: MahjongScoringRule[] = [
  pureDoubleChow, // 1 point
  mixedDoubleChow,
  shortStraight,
  twoTerminalChows,
  pungOfTerminalsOrHonors,
  meldedKong,
  oneVoidedSuit,
  noHonorTiles,
  selfDrawn,
  edgeWait,
  closedWait,
  pairWait,
  dragonPung, // 2 points
  prevalentWind,
  seatWind,
  concealedHand,
  allChows,
  tileHog,
  doublePung,
  twoConcealedPungs,
  concealedKong,
  allSimples,
  outsideHand, // 4 points
  fullyConcealedHand,
  twoMeldedKongs,
  lastOfItsKind,
  allPungs, // 6 points
  halfFlush,
  mixedShiftedChows,
  allTypes,
  meldedHand,
  twoDragonPungs,
];
