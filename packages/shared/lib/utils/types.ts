import type { COLORS } from './const.js';
import type { TupleToUnion } from 'type-fest';

export type * from 'type-fest';
export type ColorType = 'success' | 'info' | 'error' | 'warning' | keyof typeof COLORS;
export type ExcludeValuesFromBaseArrayType<B extends string[], E extends (string | number)[]> = Exclude<
  TupleToUnion<B>,
  TupleToUnion<E>
>[];
export type ManifestType = chrome.runtime.ManifestV3;

export type TileType = 'circle' | 'bamboo' | 'wan' | 'wind' | 'dragon' | 'flower' | 'season' | 'blank';
export type MahjongTile = { type: TileType; value: number | string };
