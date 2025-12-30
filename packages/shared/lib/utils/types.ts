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

export type TileType = 'circle' | 'bamboo' | 'wan' | 'wind' | 'dragon' | 'flower' | 'season' | 'flipped';
export type MahjongTile = { type: TileType; value: number | string };

// Types for mahjong tile groups
export interface BaseGroup {
  kind: string;
  tile?: MahjongTile;
  concealed?: boolean;
  declaredInGame?: boolean; // true means cannot contain the winning tile (was declared before winning)
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

// Knitted group: 147, 258, 369, store first tile in sequence
export interface KnittedGroup extends BaseGroup {
  kind: 'knitted';
  tile: MahjongTile;
}

// Special, for storing entire hand of knitted tiles and unpaired honors
export interface KnittedTilesAndUnpairedHonorsGroup extends BaseGroup {
  kind: 'knitted-and-honors';
  tile: MahjongTile;
  tiles: MahjongTile[];
}

export interface ThirteenOrphansGroup extends BaseGroup {
  kind: 'thirteen-orphans';
  tile: MahjongTile;
  tiles: MahjongTile[];
  concealed: boolean;
}

// Union type for all groups
export type MahjongGroup =
  | ChowGroup
  | PungGroup
  | KongGroup
  | PairGroup
  | KnittedGroup
  | KnittedTilesAndUnpairedHonorsGroup
  | ThirteenOrphansGroup;

export interface MahjongScoringRule {
  name: string;
  points: number;
  evaluate: (grouping: MahjongGroup[], gameState: MahjongGameState) => number;
  excludes?: string[];
  // Returns groups used by each instance of this rule (for enforcing group usage constraints)
  // Returns array of group-index arrays, one per scoring instance
  // e.g., [[0, 2], [1, 3]] means 2 instances, first uses groups 0,2, second uses groups 1,3
  // If not provided, the rule doesn't use specific groups (e.g., "All Chows", "All Pungs")
  getUsedGroupsPerInstance?: (grouping: MahjongGroup[], gameState: MahjongGameState) => number[][];
}
