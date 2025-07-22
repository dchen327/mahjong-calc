import { calculateMahjongScore } from '../mahjong.js';
import { describe, it, expect } from 'vitest';

const cases = [
  {
    name: 'Mixed Shifted Chows',
    expected: 6,
    state: {
      declaredSets: [],
      concealedTiles: [
        'bamboo-2',
        'bamboo-3',
        'bamboo-4',
        'circle-3',
        'circle-4',
        'circle-5',
        'wan-4',
        'wan-5',
        'wan-6',
        'bamboo-2',
        'bamboo-3',
        'wind-east',
        'wind-east',
      ],
      winningTile: 'bamboo-1',
      winFromWall: true,
      winFromDiscard: false,
      prevalentWind: null,
      seatWind: null,
      lastTileInGame: false,
      lastTileOfKind: false,
      replacementTile: false,
      robbingTheKong: false,
      roundWind: null,
    },
  },
  {
    name: 'Test 1',
    expected: 8,
    state: {
      concealedTiles: [
        'bamboo-1',
        'bamboo-1',
        'bamboo-1',
        'bamboo-3',
        'bamboo-4',
        'bamboo-5',
        'bamboo-7',
        'bamboo-9',
        'circle-3',
        'circle-4',
        'circle-5',
        'wan-4',
        'wan-4',
      ],
      declaredSets: [],
      lastTileInGame: false,
      lastTileOfKind: false,
      prevalentWind: 'flipped',
      replacementTile: false,
      robbingTheKong: false,
      roundWind: 'flipped',
      seatWind: 'flipped',
      winFromDiscard: false,
      winFromWall: true,
      winningTile: 'bamboo-8',
    },
  },
  {
    name: 'Test 2',
    expected: 4,
    state: {
      concealedTiles: ['wind-west', 'wind-west', 'wind-west', 'bamboo-8', 'bamboo-9', 'wan-5', 'wan-5'],
      declaredSets: [
        ['bamboo-7', 'bamboo-8', 'bamboo-9'],
        ['circle-5', 'circle-6', 'circle-7'],
      ],
      lastTileInGame: false,
      lastTileOfKind: false,
      prevalentWind: 'wind-west',
      replacementTile: false,
      robbingTheKong: false,
      roundWind: 'flipped',
      seatWind: 'wind-east',
      winFromDiscard: true,
      winFromWall: false,
      winningTile: 'bamboo-7',
    },
  },
  {
    name: 'Test 3',
    expected: 9,
    state: {
      concealedTiles: [
        'bamboo-8',
        'bamboo-8',
        'wan-6',
        'wan-7',
        'wan-8',
        'wan-8',
        'wan-8',
        'wan-8',
        'bamboo-1',
        'bamboo-1',
      ],
      declaredSets: [['wan-4', 'wan-5', 'wan-6']],
      lastTileInGame: false,
      lastTileOfKind: false,
      prevalentWind: 'flipped',
      replacementTile: false,
      robbingTheKong: false,
      roundWind: 'flipped',
      seatWind: 'flipped',
      winFromDiscard: false,
      winFromWall: true,
      winningTile: 'bamboo-8',
    },
  },
  {
    name: 'Test 4',
    expected: -1,
    state: {
      concealedTiles: ['wan-5', 'wan-5', 'wan-5', 'wan-6', 'wan-7', 'wan-8', 'wan-8', 'wan-8', 'bamboo-1', 'bamboo-1'],
      declaredSets: [['wan-4', 'wan-5', 'wan-6']],
      lastTileInGame: false,
      lastTileOfKind: false,
      prevalentWind: 'flipped',
      replacementTile: false,
      robbingTheKong: false,
      roundWind: 'flipped',
      seatWind: 'flipped',
      winFromDiscard: false,
      winFromWall: true,
      winningTile: 'bamboo-8',
    },
  },
];

describe('calculateMahjongScore (cases)', () => {
  cases.forEach(({ name, state, expected }) => {
    // TODO: run all tests
    if (name === 'Test 4') {
      it.only(`returns ${expected} for ${name}`, async () => {
        expect(calculateMahjongScore(state)).toBe(expected);
      });
    }
  });
});
