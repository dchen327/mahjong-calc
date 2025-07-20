import { createStorage, StorageEnum } from '../base/index.js';
import type { MahjongGameState, MahjongGameStorageType } from '../base/index.js';

const defaultMahjongGameState: MahjongGameState = {
  declaredSets: [],
  concealedTiles: [],
  winningTile: 'unknown',
  winFromWall: false,
  winFromDiscard: false,
  roundWind: null,
  seatWind: null,
  lastTileInGame: false,
  lastTileOfKind: false,
  replacementTile: false,
  robbingTheKong: false,
};

const mahjongGameStorage = createStorage<MahjongGameState>('mahjong-game-storage-key', defaultMahjongGameState, {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});

export const mahjongGameStateStorage: MahjongGameStorageType = {
  ...mahjongGameStorage,
  updateGameState: async partialState => {
    await mahjongGameStorage.set(currentState => ({
      ...currentState,
      ...partialState,
    }));
  },
  resetGameState: async () => {
    await mahjongGameStorage.set(() => defaultMahjongGameState);
  },
};
