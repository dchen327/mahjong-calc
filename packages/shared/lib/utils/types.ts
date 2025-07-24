import type { COLORS } from './const.js';
import type { MahjongGameState } from '@extension/storage/lib/base/types.js';
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

// Types for mahjong tile groups
export interface BaseGroup {
  kind: string;
  tile: MahjongTile;
}

// Chow group, store first tile in sequence
export interface ChowGroup extends BaseGroup {
  kind: 'chow';
  tile: MahjongTile;
  concealed: boolean;
}

// Pung group
export interface PungGroup extends BaseGroup {
  kind: 'pung';
  tile: MahjongTile;
  concealed: boolean;
}

// Kong group
export interface KongGroup extends BaseGroup {
  kind: 'kong';
  tile: MahjongTile;
  concealed: boolean;
}

// Pair group
export interface PairGroup extends BaseGroup {
  kind: 'pair';
  tile: MahjongTile;
}

// Union type for all groups
export type MahjongGroup = ChowGroup | PungGroup | KongGroup | PairGroup;

export interface MahjongScoringRule {
  name: string;
  points: number;
  evaluate: (grouping: MahjongGroup[], gameState: MahjongGameState) => number;
  excludes?: string[];
}
