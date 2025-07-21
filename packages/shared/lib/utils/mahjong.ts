import { parseTile, toStringList } from './mahjongTile.js';
import type { MahjongGameState } from '@extension/storage/lib/base/types.js';
import type { MahjongTile } from 'index.mjs';

const getAllGroups = (gameState: MahjongGameState): MahjongTile[][] => {
  const groups: MahjongTile[][] = [];
  const { declaredSets, concealedTiles } = gameState;
  // Add parsed declared sets to groups
  declaredSets.forEach(set => {
    const group: MahjongTile[] = set.map(tile => parseTile(tile));
    groups.push(group);
  });

  // non declared is concealedTiles + winningTile
  const nonDeclaredTiles = [...concealedTiles, gameState.winningTile];
  console.log(toStringList(groups[1]));
  console.log('Non-declared tiles:', nonDeclaredTiles);

  return groups;
};

export const calculateMahjongScore = (gameState: MahjongGameState): number => {
  getAllGroups(gameState);
  return Math.floor(Math.random() * 10) + 1;
};
