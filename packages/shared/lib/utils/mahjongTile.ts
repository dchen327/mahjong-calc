import type { ChowGroup, KongGroup, MahjongTile, PungGroup, TileType } from './types.js';

const tileTypeOrder: TileType[] = ['bamboo', 'wan', 'circle', 'wind', 'dragon', 'flower', 'season'];

// Tile related functions
export const parseTile = (raw: string): MahjongTile => {
  const [type, val] = raw.split('-');
  return {
    type: type as TileType,
    value: isNaN(Number(val)) ? val : Number(val),
  };
};

export const toString = (tile: MahjongTile): string => `${tile.type}-${tile.value}`;

export const toStringList = (tiles: MahjongTile[]): string[] => tiles.map(toString);

export const isHonor = (tile: MahjongTile): boolean => tile.type === 'wind' || tile.type === 'dragon';

export const isWind = (tile: MahjongTile): boolean => tile.type === 'wind';

export const isDragon = (tile: MahjongTile): boolean => tile.type === 'dragon';

export const isSimple = (tile: MahjongTile): boolean =>
  (tile.type === 'circle' || tile.type === 'bamboo' || tile.type === 'wan') &&
  typeof tile.value === 'number' &&
  tile.value > 1 &&
  tile.value < 9;

export const isTerminal = (tile: MahjongTile): boolean =>
  (tile.type === 'circle' || tile.type === 'bamboo' || tile.type === 'wan') && (tile.value === 1 || tile.value === 9);

export const compareTiles = (a: MahjongTile, b: MahjongTile): number => {
  const typeDiff = tileTypeOrder.indexOf(a.type) - tileTypeOrder.indexOf(b.type);
  if (typeDiff !== 0) return typeDiff;
  if (typeof a.value === 'number' && typeof b.value === 'number') {
    return a.value - b.value;
  }

  return a.value.toString().localeCompare(b.value.toString());
};

export const isSameTile = (tiles: MahjongTile[]): boolean =>
  tiles.length > 0 && tiles.every(t => t.type === tiles[0].type && t.value === tiles[0].value);

export const isSequential = (tiles: MahjongTile[]): boolean => {
  if (tiles.length !== 3) return false;
  if (tiles.some(isHonor)) return false;
  const [a, b, c] = tiles;
  if (a.type !== b.type || b.type !== c.type) return false;
  if (typeof a.value !== 'number' || typeof b.value !== 'number' || typeof c.value !== 'number') return false;
  const values = [a.value, b.value, c.value].sort((x, y) => x - y);
  return values[1] === values[0] + 1 && values[2] === values[1] + 1;
};

// Group related functions
export const sortChows = (chows: ChowGroup[]): ChowGroup[] =>
  chows.slice().sort((a, b) => {
    if (a.tile.type < b.tile.type) return -1;
    if (a.tile.type > b.tile.type) return 1;
    return Number(a.tile.value) - Number(b.tile.value);
  });

export const isSameChow = (a: ChowGroup, b: ChowGroup): boolean =>
  a.tile.type === b.tile.type && a.tile.value === b.tile.value;

export const isMixedChow = (a: ChowGroup, b: ChowGroup): boolean =>
  a.tile.value === b.tile.value && a.tile.type !== b.tile.type;

export const isShortStraight = (a: ChowGroup, b: ChowGroup): boolean => {
  if (a.tile.type !== b.tile.type) return false;
  if (typeof a.tile.value !== 'number' || typeof b.tile.value !== 'number') return false;
  return Math.abs(a.tile.value - b.tile.value) === 3;
};

export const isTerminalOrHonorPung = (
  group: PungGroup | KongGroup,
  seatWind?: string | null,
  prevalentWind?: string | null,
): boolean => {
  const tile = group.tile;
  if (isWind(tile)) {
    // Exclude seat/prevalent wind
    return tile.value !== seatWind && tile.value !== prevalentWind;
  }
  return isTerminal(tile);
};
