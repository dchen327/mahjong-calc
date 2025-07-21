import type { MahjongTile, TileType } from './types.js';

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
