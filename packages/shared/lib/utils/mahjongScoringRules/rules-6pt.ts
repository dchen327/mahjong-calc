import {
  getPungs,
  getKongs,
  getPairs,
  getChows,
  getAllTilesFromGrouping,
  isHonor,
  parseTile,
  isSameTile,
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
  evaluate: grouping => {
    const chows = getChows(grouping);
    const used = Array(chows.length).fill(false);
    let count = 0;
    for (let i = 0; i < chows.length; i++) {
      if (used[i]) continue;
      for (let j = 0; j < chows.length; j++) {
        if (i === j || used[j]) continue;
        for (let k = 0; k < chows.length; k++) {
          if (i === k || j === k || used[k]) continue;
          const [c1, c2, c3] = [chows[i], chows[j], chows[k]];
          const values = [c1.tile.value, c2.tile.value, c3.tile.value].map(Number).sort();
          const suits = [c1.tile.type, c2.tile.type, c3.tile.type];
          const allDifferentSuits = new Set(suits).size === 3;
          const isConsecutive = values[1] === values[0] + 1 && values[2] === values[1] + 1;
          if (allDifferentSuits && isConsecutive) {
            used[i] = used[j] = used[k] = true;
            count++;
            break;
          }
        }
        if (used[i]) break;
      }
    }
    return count;
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
