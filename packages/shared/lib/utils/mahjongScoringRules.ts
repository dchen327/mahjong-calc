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
  getAllTilesFromGrouping,
  getKnitted,
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
    const used = new Set<number>();
    let count = 0;
    for (let i = 0; i < chows.length; i++) {
      if (used.has(i)) continue;
      for (let j = i + 1; j < chows.length; j++) {
        if (used.has(j)) continue;
        if (isMixedChow(chows[i], chows[j])) {
          used.add(i);
          used.add(j);
          count++;
          break; // move to next i to avoid reuse
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
    const allTiles = getAllTilesFromGrouping(grouping);
    const suits = new Set(allTiles.map(tile => tile.type));
    const allSuits: TileType[] = ['bamboo', 'wan', 'circle'];
    const missing = allSuits.filter(suit => !suits.has(suit));
    return missing.length;
  },
};

// No Honor Tiles - The hand has no Honor tiles.
export const noHonorTiles: MahjongScoringRule = {
  name: '8. No Honor Tiles',
  points: 1,
  evaluate: grouping => {
    const allTiles = getAllTilesFromGrouping(grouping);
    return allTiles.some(tile => isHonor(tile)) ? 0 : 1;
  },
};
// Self Drawn - The player wins by drawing the winning tile.
export const selfDrawn: MahjongScoringRule = {
  name: '9. Self Drawn',
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
          const isConsecutive = values[1] === values[0] + 1 && values[2] === values[1] + 1;
          if (allDifferentSuits && isConsecutive) return 1;
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
    const pairs = getPairs(grouping);
    const winningTile = parseTile(gameState.winningTile);
    // Ensure there is exactly one pair and the winning tile matches the pair
    return meldedGroups.length === 4 &&
      gameState.winFromDiscard &&
      pairs.length === 1 &&
      isSameTile([pairs[0].tile, winningTile])
      ? 1
      : 0;
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

// Mixed Straight - A Chow of 1,2,3, a Chow of 4,5,6 and a Chow of 7,8,9 in three different suits.
export const mixedStraight: MahjongScoringRule = {
  name: '34. Mixed Straight',
  points: 8,
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
          // ensure values are [1, 4, 7]
          const isStraight = values[0] === 1 && values[1] === 4 && values[2] === 7;
          if (allDifferentSuits && isStraight) return 1;
        }
      }
    }
    return 0;
  },
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
  evaluate: grouping => {
    const chows = getChows(grouping);
    for (let i = 0; i < chows.length; i++) {
      for (let j = i + 1; j < chows.length; j++) {
        for (let k = j + 1; k < chows.length; k++) {
          const [c1, c2, c3] = [chows[i], chows[j], chows[k]];
          const values = [c1.tile.value, c2.tile.value, c3.tile.value].map(Number).sort();
          const suits = [c1.tile.type, c2.tile.type, c3.tile.type];
          const allDifferentSuits = new Set(suits).size === 3;
          const isSameValue = values[0] === values[1] && values[1] === values[2];
          if (allDifferentSuits && isSameValue) return 1;
        }
      }
    }
    return 0;
  },
};

// Mixed Shifted Pungs - Three Pungs or Kongs in the three different suits, shifted up by one.
export const mixedShiftedPungs: MahjongScoringRule = {
  name: '37. Mixed Shifted Pungs',
  points: 8,
  evaluate: grouping => {
    const pungsAndKongs = [...getPungs(grouping), ...getKongs(grouping)];
    for (let i = 0; i < pungsAndKongs.length; i++) {
      for (let j = i + 1; j < pungsAndKongs.length; j++) {
        for (let k = j + 1; k < pungsAndKongs.length; k++) {
          const [p1, p2, p3] = [pungsAndKongs[i], pungsAndKongs[j], pungsAndKongs[k]];
          const values = [p1.tile.value, p2.tile.value, p3.tile.value].map(Number).sort();
          const suits = [p1.tile.type, p2.tile.type, p3.tile.type];
          const allDifferentSuits = new Set(suits).size === 3;
          const isConsecutive = values[1] === values[0] + 1 && values[2] === values[1] + 1;
          if (allDifferentSuits && isConsecutive) return 1;
        }
      }
    }
    return 0;
  },
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
// Does not combine with:
// Self Drawn
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
// Does not combine with:
// Last of its Kind
export const robbingTheKong: MahjongScoringRule = {
  name: '42. Robbing the Kong',
  points: 8,
  excludes: ['27. Last of its Kind'],
  evaluate: (_, gameState) => (gameState.robbingTheKong ? 1 : 0),
};

// Chicken Hand - Winning with a hand that would otherwise be worth 0 points other than flowers
// This is checked in mahjong.ts after checking all other rules

// 12 point rules
// Lesser Honors and Knitted Tiles - The hand is entirely composed of single (unpaired) honors and single tiles from different knitted sequences. If this rule is satisfied, the player can win without the standard 4 triples and a pair.
export const lesserHonorsAndKnittedTiles: MahjongScoringRule = {
  name: '44. Lesser Honors and Knitted Tiles',
  points: 12,
  excludes: ['17. Concealed Hand', '31. All Types'],
  evaluate: grouping => (grouping.length !== 1 || grouping[0].kind !== 'knitted-and-honors' ? 0 : 1),
};

// Knitted Straight - Winning with a hand that has 1,4,7 in one suit, 2,5,8 in a second suit and 3,6,9 in the third suit. This knitted straight is considered to be 3 Chows for the requirement of 4 triples and a pair.
export const knittedStraight: MahjongScoringRule = {
  name: '45. Knitted Straight',
  points: 12,
  evaluate: grouping => {
    // Check if there is knitted-and-honors group
    if (grouping.length === 1 && grouping[0].kind === 'knitted-and-honors') {
      const allTiles = getAllTilesFromGrouping(grouping);
      // Ensure all values from 1-9 are present
      const values = allTiles.map(tile => tile.value).filter(value => typeof value === 'number');
      if (values.length === 9 && new Set(values).size === 9) return 1;
    }

    const knitted = getKnitted(grouping);
    if (knitted.length !== 3) return 0;
    const [k1, k2, k3] = knitted;
    const values = [k1.tile.value, k2.tile.value, k3.tile.value].map(Number).sort();
    const suits = [k1.tile.type, k2.tile.type, k3.tile.type];
    const allDifferentSuits = new Set(suits).size === 3;
    const isConsecutive = values[0] === 1 && values[1] === 2 && values[2] === 3;
    return allDifferentSuits && isConsecutive ? 1 : 0;
  },
};

// Upper Four - The hand is composed of only suit tiles with numerical values of 6 or greater.
export const upperFour: MahjongScoringRule = {
  name: '46. Upper Four',
  points: 12,
  excludes: ['8. No Honor Tiles'],
  evaluate: grouping => {
    const allTiles = getAllTilesFromGrouping(grouping);
    return allTiles.every(tile => typeof tile.value === 'number' && tile.value >= 6) ? 1 : 0;
  },
};

// Lower Four - The hand is composed of only suit tiles with numerical values of 4 or less.
export const lowerFour: MahjongScoringRule = {
  name: '47. Lower Four',
  points: 12,
  excludes: ['8. No Honor Tiles'],
  evaluate: grouping => {
    const allTiles = getAllTilesFromGrouping(grouping);
    return allTiles.every(tile => typeof tile.value === 'number' && tile.value <= 4) ? 1 : 0;
  },
};

// Big Three Winds - Three Pungs or Kongs of Winds.
// Does not combine with:
// Pung of Terminals or Honors (Unless you have an additional non-wind Pung)
export const bigThreeWinds: MahjongScoringRule = {
  name: '48. Big Three Winds',
  points: 12,
  excludes: ['5. Pung of Terminals or Honors'],
  evaluate: grouping => {
    const pungs = getPungs(grouping).filter(pung => pung.tile.type === 'wind');
    const kongs = getKongs(grouping).filter(kong => kong.tile.type === 'wind');
    const total = pungs.length + kongs.length;
    return total == 3 ? 1 : 0;
  },
};

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

// 24 point rules
// Seven Pairs - Seven pairs. If this rule is satisfied, the player can win without the standard 4 triples and a pair.
export const sevenPairs: MahjongScoringRule = {
  name: '55. Seven Pairs',
  points: 24,
  excludes: ['13. Pair Wait', '17. Concealed Hand'],
  evaluate: grouping => {
    const pairs = getPairs(grouping);
    return pairs.length === 7 && grouping.length === 7 && grouping.every(group => group.kind === 'pair') ? 1 : 0;
  },
};

// Greater Honors and Knitted Tiles - The hand is composed of one of each honor and single tiles from different knitted sequences. If this rule is satisfied, the player can win without the standard 4 triples and a pair.
export const greaterHonorsAndKnittedTiles: MahjongScoringRule = {
  name: '56. Greater Honors and Knitted Tiles',
  points: 24,
  excludes: ['17. Concealed Hand', '31. All Types', '44. Lesser Honors and Knitted Tiles'],
  evaluate: grouping =>
    grouping.length === 1 &&
    grouping[0].kind === 'knitted-and-honors' &&
    getAllTilesFromGrouping(grouping).filter(isHonor).length === 7
      ? 1
      : 0,
};

// All Even Pungs - Four Pungs or Kongs and a pair of even suit tiles.
// Does not combine with:
// No Honor Tiles
// All Simples
// All Pungs
export const allEvenPungs: MahjongScoringRule = {
  name: '57. All Even Pungs',
  points: 24,
  excludes: ['8. No Honor Tiles', '23. All Simples', '28. All Pungs'],
  evaluate: grouping => {
    const pungs = getPungs(grouping).filter(pung => typeof pung.tile.value === 'number' && pung.tile.value % 2 === 0);
    const kongs = getKongs(grouping).filter(kong => typeof kong.tile.value === 'number' && kong.tile.value % 2 === 0);
    const pairs = getPairs(grouping).filter(pair => typeof pair.tile.value === 'number' && pair.tile.value % 2 === 0);
    return pungs.length + kongs.length === 4 && pairs.length === 1 ? 1 : 0;
  },
};

// Full Flush - The hand is composed entirely of a single suit.
// Does not combine with:
// One Voided Suit
// No Honor Tiles
// Half Flush
export const fullFlush: MahjongScoringRule = {
  name: '58. Full Flush',
  points: 24,
  excludes: ['7. One Voided Suit', '8. No Honor Tiles', '29. Half Flush'],
  evaluate: grouping => {
    const allTiles = getAllTilesFromGrouping(grouping);
    const suit = allTiles[0].type;
    return allTiles.every(tile => tile.type === suit) ? 1 : 0;
  },
};

// Pure Triple Chow - Three identical Chows in the same suit.
// Does not combine with:
// Pure Double Chow
export const pureTripleChow: MahjongScoringRule = {
  name: '59. Pure Triple Chow',
  points: 24,
  excludes: ['1. Pure Double Chow'],
  evaluate: grouping => {
    const chows = getChows(grouping);
    for (let i = 0; i < chows.length; i++) {
      for (let j = i + 1; j < chows.length; j++) {
        for (let k = j + 1; k < chows.length; k++) {
          const [c1, c2, c3] = [chows[i], chows[j], chows[k]];
          if (c1.tile.type === c2.tile.type && c1.tile.type === c3.tile.type) {
            const values = [c1.tile.value, c2.tile.value, c3.tile.value].map(Number);
            // All values must be the same
            if (values[0] === values[1] && values[1] === values[2]) return 1;
          }
        }
      }
    }
    return 0;
  },
};

// Pure Shifted Pungs - Three Pungs or Kongs in the same suit, shifted up by one.
export const pureShiftedPungs: MahjongScoringRule = {
  name: '60. Pure Shifted Pungs',
  points: 24,
  evaluate: grouping => {
    const pungsAndKongs = [...getPungs(grouping), ...getKongs(grouping)];
    // Check all unique triples of pungs/kongs in the same suit
    for (let i = 0; i < pungsAndKongs.length; i++) {
      for (let j = i + 1; j < pungsAndKongs.length; j++) {
        for (let k = j + 1; k < pungsAndKongs.length; k++) {
          const [p1, p2, p3] = [pungsAndKongs[i], pungsAndKongs[j], pungsAndKongs[k]];
          if (p1.tile.type !== p2.tile.type || p1.tile.type !== p3.tile.type) continue;
          const values = [p1.tile.value, p2.tile.value, p3.tile.value].map(Number).sort((a, b) => a - b);
          const diff1 = values[1] - values[0];
          const diff2 = values[2] - values[1];
          // All differences must be 1 (shifted by one)
          if (diff1 === 1 && diff2 === 1) return 1;
        }
      }
    }
    return 0;
  },
};

// Upper Tiles - The hand is composed of only suit tiles with numerical values of 7 or greater.
export const upperTiles: MahjongScoringRule = {
  name: '61. Upper Tiles',
  points: 24,
  excludes: ['8. No Honor Tiles', '46. Upper Four'],
  evaluate: grouping => {
    const allTiles = getAllTilesFromGrouping(grouping);
    return allTiles.every(tile => typeof tile.value === 'number' && tile.value >= 7) ? 1 : 0;
  },
};

// Middle Tiles - The hand is composed of only suit tiles with numerical values of 4, 5, 6.
export const middleTiles: MahjongScoringRule = {
  name: '62. Middle Tiles',
  points: 24,
  excludes: ['8. No Honor Tiles', '23. All Simples'],
  evaluate: grouping => {
    const allTiles = getAllTilesFromGrouping(grouping);
    return allTiles.every(tile => typeof tile.value === 'number' && tile.value >= 4 && tile.value <= 6) ? 1 : 0;
  },
};

// Lower Tiles - The hand is composed of only suit tiles with numerical values of 3 or less.
export const lowerTiles: MahjongScoringRule = {
  name: '63. Lower Tiles',
  points: 24,
  excludes: ['8. No Honor Tiles', '47. Lower Four'],
  evaluate: grouping => {
    const allTiles = getAllTilesFromGrouping(grouping);
    return allTiles.every(tile => typeof tile.value === 'number' && tile.value <= 3) ? 1 : 0;
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
  mixedStraight, // 8 points
  reversibleTiles,
  mixedTripleChow,
  mixedShiftedPungs,
  twoConcealedKongs,
  lastTileDraw,
  lastTileClaim,
  outWithReplacementTile,
  robbingTheKong,
  lesserHonorsAndKnittedTiles, // 12 points
  knittedStraight,
  upperFour,
  lowerFour,
  bigThreeWinds,
  pureStraight, // 16 points
  threeSuitedTerminalChows,
  pureShiftedChows,
  allFives,
  triplePung,
  threeConcealedPungs,
  sevenPairs, // 24 points
  greaterHonorsAndKnittedTiles,
  allEvenPungs,
  fullFlush,
  pureTripleChow,
  pureShiftedPungs,
  upperTiles,
  middleTiles,
  lowerTiles,
];
