import { calculateMahjongScore } from '../mahjong.js';
import { describe, it, expect } from 'vitest';

const cases = [
  {
    name: 'Mixed Shifted Chows',
    expected: 12,
    state: {
      concealedTiles: [
        'wan-4',
        'wan-6',
        'bamboo-6',
        'bamboo-7',
        'bamboo-8',
        'bamboo-2',
        'bamboo-3',
        'bamboo-4',
        'circle-3',
        'circle-3',
      ],
      declaredSets: [['circle-3', 'circle-4', 'circle-5']],
      lastTileInGame: false,
      lastTileOfKind: false,
      prevalentWind: 'flipped',
      replacementTile: false,
      robbingTheKong: false,
      seatWind: 'flipped',
      winFromDiscard: false,
      winFromWall: true,
      winningTile: 'wan-5',
    },
  },
  {
    name: 'Seven Pairs',
    expected: 24,
    state: {
      concealedTiles: [
        'wan-5',
        'wan-5',
        'wan-6',
        'wan-6',
        'wan-9',
        'wan-9',
        'circle-8',
        'circle-8',
        'bamboo-1',
        'bamboo-1',
        'bamboo-5',
        'bamboo-5',
        'wind-north',
      ],
      declaredSets: [],
      lastTileInGame: false,
      lastTileOfKind: false,
      prevalentWind: 'flipped',
      replacementTile: false,
      robbingTheKong: false,
      seatWind: 'flipped',
      winFromDiscard: true,
      winFromWall: false,
      winningTile: 'wind-north',
    },
  },
  {
    name: 'Chicken Hand',
    expected: 8,
    state: {
      concealedTiles: ['dragon-red', 'dragon-red', 'wan-3', 'wan-4'],
      declaredSets: [
        ['circle-2', 'circle-3', 'circle-4'],
        ['circle-6', 'circle-6', 'circle-6'],
        ['bamboo-7', 'bamboo-7', 'bamboo-7'],
      ],
      lastTileInGame: false,
      lastTileOfKind: false,
      prevalentWind: 'flipped',
      replacementTile: false,
      robbingTheKong: false,
      seatWind: 'flipped',
      winFromDiscard: true,
      winFromWall: false,
      winningTile: 'wan-5',
    },
  },
  {
    name: 'Big Three Winds',
    expected: 30,
    state: {
      concealedTiles: ['wan-2'],
      declaredSets: [
        ['wind-east', 'wind-east', 'wind-east'],
        ['wind-south', 'wind-south', 'wind-south'],
        ['wind-north', 'wind-north', 'wind-north'],
        ['bamboo-1', 'bamboo-1', 'bamboo-1'],
      ],
      lastTileInGame: false,
      lastTileOfKind: false,
      prevalentWind: 'west-east',
      replacementTile: false,
      robbingTheKong: false,
      seatWind: 'west-east',
      winFromDiscard: true,
      winFromWall: false,
      winningTile: 'wan-2',
    },
  },
  {
    name: 'Lesser Honors and Knitted Tiles',
    expected: 12,
    state: {
      concealedTiles: [
        'bamboo-1',
        'bamboo-4',
        'bamboo-7',
        'wan-2',
        'wan-5',
        'wan-8',
        'circle-3',
        'circle-9',
        'wind-west',
        'wind-north',
        'dragon-red',
        'dragon-white',
        'dragon-green',
      ],
      declaredSets: [],
      lastTileInGame: false,
      lastTileOfKind: false,
      prevalentWind: 'west-east',
      replacementTile: false,
      robbingTheKong: false,
      seatWind: 'west-east',
      winFromDiscard: true,
      winFromWall: false,
      winningTile: 'wind-south',
    },
  },
  {
    name: 'Greater Honors and Knitted Tiles',
    expected: 28,
    state: {
      concealedTiles: [
        'bamboo-1',
        'bamboo-4',
        'bamboo-7',
        'wan-2',
        'wan-5',
        'wan-8',
        'circle-3',
        'wind-east',
        'wind-west',
        'wind-north',
        'dragon-red',
        'dragon-white',
        'dragon-green',
      ],
      declaredSets: [],
      lastTileInGame: false,
      lastTileOfKind: false,
      prevalentWind: 'west-east',
      replacementTile: false,
      robbingTheKong: false,
      seatWind: 'west-east',
      winFromDiscard: false,
      winFromWall: true,
      winningTile: 'wind-south',
    },
  },
  {
    name: 'Knitted Straight',
    expected: 14,
    state: {
      concealedTiles: [
        'bamboo-1',
        'bamboo-4',
        'bamboo-7',
        'wan-2',
        'wan-5',
        'wan-8',
        'circle-3',
        'circle-6',
        'circle-9',
        'wind-north',
      ],
      declaredSets: [['wind-west', 'wind-west', 'wind-west']],
      lastTileInGame: false,
      lastTileOfKind: false,
      prevalentWind: 'west-east',
      replacementTile: false,
      robbingTheKong: false,
      seatWind: 'west-east',
      winFromDiscard: true,
      winFromWall: false,
      winningTile: 'wind-north',
    },
  },
  {
    name: 'Pure Straight with Short Straight',
    expected: 29,
    state: {
      concealedTiles: ['wind-west'],
      declaredSets: [
        ['bamboo-1', 'bamboo-2', 'bamboo-3'],
        ['bamboo-4', 'bamboo-5', 'bamboo-6'],
        ['bamboo-7', 'bamboo-8', 'bamboo-9'],
        ['bamboo-4', 'bamboo-5', 'bamboo-6'],
      ],
      lastTileInGame: false,
      lastTileOfKind: false,
      prevalentWind: 'west-east',
      replacementTile: false,
      robbingTheKong: false,
      seatWind: 'west-east',
      winFromDiscard: true,
      winFromWall: false,
      winningTile: 'wind-west',
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
      seatWind: 'flipped',
      winFromDiscard: false,
      winFromWall: true,
      winningTile: 'bamboo-8',
    },
  },
  {
    name: 'Test 4',
    expected: 8,
    state: {
      concealedTiles: [
        'bamboo-2',
        'bamboo-2',
        'wan-1',
        'wan-1',
        'wan-1',
        'wan-2',
        'wan-3',
        'wan-4',
        'wan-4',
        'wan-4',
        'circle-5',
        'circle-6',
        'circle-7',
      ],
      declaredSets: [],
      lastTileInGame: false,
      lastTileOfKind: false,
      prevalentWind: 'flipped',
      replacementTile: false,
      robbingTheKong: false,
      seatWind: 'flipped',
      winFromDiscard: false,
      winFromWall: true,
      winningTile: 'bamboo-2',
    },
  },
  {
    name: 'Test 5',
    expected: 6,
    state: {
      concealedTiles: [
        'circle-4',
        'circle-5',
        'circle-6',
        'wan-5',
        'wan-6',
        'wan-7',
        'circle-1',
        'circle-2',
        'circle-3',
        'circle-1',
      ],
      declaredSets: [['wan-5', 'wan-6', 'wan-7']],
      lastTileInGame: false,
      lastTileOfKind: false,
      prevalentWind: 'flipped',
      replacementTile: false,
      robbingTheKong: false,
      seatWind: 'flipped',
      winFromDiscard: false,
      winFromWall: true,
      winningTile: 'circle-1',
    },
  },
  {
    name: 'Test 6',
    expected: 6,
    state: {
      concealedTiles: ['wan-5', 'wan-7', 'wan-3', 'wan-3'],
      declaredSets: [
        ['wan-7', 'wan-8', 'wan-9'],
        ['circle-2', 'circle-3', 'circle-4'],
        ['circle-7', 'circle-8', 'circle-9'],
      ],
      lastTileInGame: false,
      lastTileOfKind: false,
      prevalentWind: 'flipped',
      replacementTile: false,
      robbingTheKong: false,
      seatWind: 'flipped',
      winFromDiscard: false,
      winFromWall: true,
      winningTile: 'wan-6',
    },
  },
  {
    name: 'Test 7',
    expected: 16,
    state: {
      concealedTiles: [
        'dragon-red',
        'dragon-red',
        'dragon-red',
        'wan-4',
        'wan-5',
        'wan-6',
        'circle-3',
        'circle-4',
        'circle-5',
        'bamboo-3',
        'bamboo-4',
        'bamboo-5',
        'bamboo-9',
      ],
      declaredSets: [],
      lastTileInGame: true,
      lastTileOfKind: false,
      prevalentWind: 'flipped',
      replacementTile: false,
      robbingTheKong: false,
      seatWind: 'flipped',
      winFromDiscard: false,
      winFromWall: true,
      winningTile: 'bamboo-9',
    },
  },
  {
    name: 'Test 8',
    expected: 8,
    state: {
      concealedTiles: ['circle-8', 'circle-8', 'circle-8', 'dragon-red'],
      declaredSets: [
        ['circle-5', 'circle-6', 'circle-7'],
        ['dragon-white', 'dragon-white', 'dragon-white'],
        ['bamboo-8', 'bamboo-8', 'bamboo-8', 'bamboo-8'],
      ],
      lastTileInGame: false,
      lastTileOfKind: false,
      prevalentWind: 'flipped',
      replacementTile: false,
      robbingTheKong: false,
      seatWind: 'flipped',
      winFromDiscard: false,
      winFromWall: true,
      winningTile: 'dragon-red',
    },
  },
  {
    name: 'Test 9',
    expected: 13,
    state: {
      concealedTiles: [
        'wind-east',
        'wind-east',
        'wind-east',
        'dragon-white',
        'dragon-white',
        'wan-2',
        'wan-3',
        'wan-4',
        'wan-8',
        'wan-8',
      ],
      declaredSets: [['flipped', 'bamboo-3', 'bamboo-3', 'flipped']],
      lastTileInGame: false,
      lastTileOfKind: false,
      prevalentWind: 'wind-east',
      replacementTile: false,
      robbingTheKong: false,
      seatWind: 'wind-east',
      winFromDiscard: true,
      winFromWall: false,
      winningTile: 'dragon-white',
    },
  },
  {
    name: 'Test 10',
    expected: 11,
    state: {
      concealedTiles: ['circle-1', 'circle-3', 'bamboo-4', 'bamboo-4'],
      declaredSets: [
        ['bamboo-1', 'bamboo-2', 'bamboo-3'],
        ['bamboo-6', 'bamboo-7', 'bamboo-8'],
        ['bamboo-2', 'bamboo-2', 'bamboo-2'],
      ],
      lastTileInGame: false,
      lastTileOfKind: true,
      prevalentWind: 'flipped',
      replacementTile: false,
      robbingTheKong: false,
      seatWind: 'flipped',
      winFromDiscard: false,
      winFromWall: true,
      winningTile: 'circle-2',
    },
  },
  {
    name: 'Test 11',
    expected: 20,
    state: {
      concealedTiles: ['bamboo-2', 'bamboo-3', 'bamboo-4', 'wan-7', 'wan-7', 'wan-3', 'wan-3'],
      declaredSets: [
        ['wan-6', 'wan-6', 'wan-6', 'wan-6'],
        ['flipped', 'circle-7', 'circle-7', 'flipped'],
      ],
      lastTileInGame: false,
      lastTileOfKind: false,
      prevalentWind: 'flipped',
      replacementTile: true,
      robbingTheKong: false,
      seatWind: 'flipped',
      winFromDiscard: false,
      winFromWall: true,
      winningTile: 'wan-7',
    },
  },
  {
    name: 'Test 12',
    expected: 18,
    state: {
      concealedTiles: ['wan-7', 'wan-8', 'wan-7', 'wan-8', 'wan-9', 'circle-6', 'circle-6'],
      declaredSets: [
        ['wan-6', 'wan-7', 'wan-8'],
        ['circle-6', 'circle-7', 'circle-8'],
      ],
      lastTileInGame: false,
      lastTileOfKind: false,
      prevalentWind: 'flipped',
      replacementTile: false,
      robbingTheKong: false,
      seatWind: 'flipped',
      winFromDiscard: false,
      winFromWall: true,
      winningTile: 'wan-6',
    },
  },
  {
    name: 'Test 13',
    expected: 24,
    state: {
      concealedTiles: [
        'bamboo-3',
        'bamboo-3',
        'bamboo-3',
        'wan-9',
        'wan-9',
        'wan-9',
        'bamboo-6',
        'bamboo-6',
        'bamboo-6',
        'bamboo-2',
      ],
      declaredSets: [['circle-7', 'circle-7', 'circle-7']],
      lastTileInGame: false,
      lastTileOfKind: false,
      prevalentWind: 'flipped',
      replacementTile: false,
      robbingTheKong: false,
      seatWind: 'flipped',
      winFromDiscard: true,
      winFromWall: false,
      winningTile: 'bamboo-2',
    },
  },
  {
    name: 'Test 14',
    expected: 14,
    state: {
      concealedTiles: ['wan-8', 'wan-9', 'wan-8', 'wan-8'],
      declaredSets: [
        ['circle-1', 'circle-2', 'circle-3'],
        ['flipped', 'bamboo-8', 'bamboo-8', 'flipped'],
        ['flipped', 'wind-west', 'wind-west', 'flipped'],
      ],
      lastTileInGame: false,
      lastTileOfKind: true,
      prevalentWind: 'wind-north',
      replacementTile: false,
      robbingTheKong: false,
      seatWind: 'wind-east',
      winFromDiscard: false,
      winFromWall: true,
      winningTile: 'wan-7',
    },
  },
  {
    name: 'Test 15',
    expected: 29,
    state: {
      concealedTiles: [
        'bamboo-1',
        'bamboo-1',
        'circle-3',
        'circle-3',
        'bamboo-8',
        'bamboo-8',
        'wan-7',
        'wan-7',
        'bamboo-7',
        'bamboo-5',
        'bamboo-5',
        'wan-8',
        'wan-8',
      ],
      declaredSets: [],
      lastTileInGame: false,
      lastTileOfKind: false,
      prevalentWind: 'flipped',
      replacementTile: false,
      robbingTheKong: false,
      seatWind: 'flipped',
      winFromDiscard: false,
      winFromWall: true,
      winningTile: 'bamboo-7',
    },
  },
  {
    name: 'Test 16',
    expected: 9,
    state: {
      concealedTiles: ['wan-6', 'wan-7', 'wan-8', 'circle-1', 'circle-2', 'circle-3', 'circle-3'],
      declaredSets: [
        ['circle-1', 'circle-2', 'circle-3'],
        ['circle-4', 'circle-5', 'circle-6'],
      ],
      lastTileInGame: false,
      lastTileOfKind: false,
      prevalentWind: 'flipped',
      replacementTile: false,
      robbingTheKong: false,
      seatWind: 'flipped',
      winFromDiscard: false,
      winFromWall: true,
      winningTile: 'circle-3',
    },
  },
  {
    name: 'Test 17',
    expected: 9,
    state: {
      concealedTiles: [
        'wan-4',
        'wan-5',
        'circle-2',
        'circle-2',
        'circle-2',
        'circle-6',
        'circle-6',
        'circle-6',
        'wan-5',
        'wan-6',
        'wan-7',
        'wan-5',
        'wan-5',
      ],
      declaredSets: [],
      lastTileInGame: false,
      lastTileOfKind: false,
      prevalentWind: 'flipped',
      replacementTile: false,
      robbingTheKong: false,
      seatWind: 'flipped',
      winFromDiscard: true,
      winFromWall: false,
      winningTile: 'wan-6',
    },
  },
  {
    name: 'Test 18',
    expected: 25,
    state: {
      concealedTiles: [
        'circle-5',
        'circle-6',
        'circle-7',
        'bamboo-2',
        'bamboo-2',
        'bamboo-2',
        'circle-5',
        'circle-5',
        'circle-5',
        'circle-7',
        'circle-7',
        'circle-4',
        'circle-4',
      ],
      declaredSets: [],
      lastTileInGame: false,
      lastTileOfKind: false,
      prevalentWind: 'flipped',
      replacementTile: false,
      robbingTheKong: false,
      seatWind: 'flipped',
      winFromDiscard: true,
      winFromWall: false,
      winningTile: 'circle-7',
    },
  },
  {
    name: 'Test 19',
    expected: 3,
    state: {
      concealedTiles: ['bamboo-6', 'bamboo-6', 'bamboo-6', 'bamboo-3', 'bamboo-4', 'bamboo-5', 'bamboo-9'],
      declaredSets: [
        ['bamboo-2', 'bamboo-3', 'bamboo-4'],
        ['wan-5', 'wan-6', 'wan-7'],
      ],
      lastTileInGame: false,
      lastTileOfKind: false,
      prevalentWind: 'flipped',
      replacementTile: false,
      robbingTheKong: false,
      seatWind: 'flipped',
      winFromDiscard: true,
      winFromWall: false,
      winningTile: 'bamboo-9',
    },
  },
  {
    name: 'Test 20',
    expected: 31,
    state: {
      concealedTiles: ['bamboo-2', 'bamboo-4', 'wind-east', 'wind-east'],
      declaredSets: [
        ['bamboo-1', 'bamboo-2', 'bamboo-3'],
        ['bamboo-3', 'bamboo-4', 'bamboo-5'],
        ['bamboo-7', 'bamboo-7', 'bamboo-7'],
      ],
      lastTileInGame: true,
      lastTileOfKind: false,
      prevalentWind: 'flipped',
      replacementTile: false,
      robbingTheKong: false,
      seatWind: 'flipped',
      winFromDiscard: true,
      winFromWall: false,
      winningTile: 'bamboo-3',
    },
  },
  {
    name: 'Test 21',
    expected: 3,
    state: {
      concealedTiles: ['bamboo-8', 'bamboo-9', 'wind-south', 'wind-south'],
      declaredSets: [
        ['bamboo-1', 'bamboo-1', 'bamboo-1'],
        ['wan-3', 'wan-3', 'wan-3'],
        ['wan-8', 'wan-8', 'wan-8'],
      ],
      lastTileInGame: false,
      lastTileOfKind: false,
      prevalentWind: 'flipped',
      replacementTile: false,
      robbingTheKong: false,
      seatWind: 'flipped',
      winFromDiscard: true,
      winFromWall: false,
      winningTile: 'bamboo-7',
    },
  },
  {
    name: 'Test 22',
    expected: 2,
    state: {
      concealedTiles: [
        'wan-2',
        'wan-3',
        'wan-4',
        'circle-4',
        'circle-5',
        'circle-6',
        'bamboo-6',
        'bamboo-6',
        'wind-east',
        'wind-east',
      ],
      declaredSets: [['bamboo-5', 'bamboo-6', 'bamboo-7']],
      lastTileInGame: false,
      lastTileOfKind: false,
      prevalentWind: 'flipped',
      replacementTile: false,
      robbingTheKong: false,
      seatWind: 'flipped',
      winFromDiscard: true,
      winFromWall: false,
      winningTile: 'bamboo-6',
    },
  },
  {
    name: 'Test 23',
    expected: 9,
    state: {
      concealedTiles: [
        'circle-1',
        'circle-1',
        'circle-1',
        'circle-1',
        'circle-2',
        'bamboo-2',
        'bamboo-2',
        'bamboo-2',
        'bamboo-1',
        'bamboo-1',
      ],
      declaredSets: [['circle-3', 'circle-4', 'circle-5']],
      lastTileInGame: false,
      lastTileOfKind: false,
      prevalentWind: 'flipped',
      replacementTile: false,
      robbingTheKong: false,
      seatWind: 'flipped',
      winFromDiscard: false,
      winFromWall: true,
      winningTile: 'circle-3',
    },
  },
];

const filter: string[] =
  // ['Test 23'];
  [];

describe('calculateMahjongScore (cases)', () => {
  cases
    .filter(({ name }) => filter.length === 0 || filter.includes(name))
    .forEach(({ name, state, expected }) => {
      it(`returns ${expected} for ${name}`, () => {
        const result = calculateMahjongScore(state);
        if (result.score !== expected) {
          console.log('Matched rules:', result.matched);
        }
        expect(result.score).toBe(expected);
      });
    });
});
