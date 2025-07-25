import { createStorage, StorageEnum } from '../base/index.js';
import type { MahjongGameState, MahjongGameStorageType } from '../base/index.js';

const defaultMahjongGameState: MahjongGameState = {
  declaredSets: [],
  concealedTiles: [],
  winningTile: 'unknown',
  winFromWall: false,
  winFromDiscard: false,
  prevalentWind: null,
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

// Change handScoreStorage to store both score and matched rules
const _handScoreStorage = createStorage<HandScoreResult>(
  'mahjong-hand-score',
  { score: 0, matched: [] },
  {
    storageEnum: StorageEnum.Local,
    liveUpdate: true,
  },
);

export type HandScoreRuleSummary = {
  name: string;
  points: number;
  quant: number;
};

export type HandScoreResult = {
  score: number;
  matched: HandScoreRuleSummary[];
};

export const mahjongGameStateStorage: MahjongGameStorageType = {
  ...mahjongGameStorage,
  updateGameState: async partialState => {
    await mahjongGameStorage.set(currentState => ({
      ...currentState,
      ...partialState,
    }));
  },
};

export const handScoreStorage = {
  ..._handScoreStorage,
  updateScore: async (result: HandScoreResult) => {
    await _handScoreStorage.set(() => result);
  },
};
