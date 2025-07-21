import type { MahjongGameState } from '@extension/storage/lib/base/types.js';

export const calculateMahjongScore = (gameState: MahjongGameState): number => {
  console.log('Calculating Mahjong score for game state:', gameState);
  return Math.floor(Math.random() * 10) + 1;
};
