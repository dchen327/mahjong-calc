import { lesserHonorsAndKnittedTiles, knittedStraight, upperFour, lowerFour, bigThreeWinds } from './rules-12pt.js';
import {
  pureStraight,
  threeSuitedTerminalChows,
  pureShiftedChows,
  allFives,
  triplePung,
  threeConcealedPungs,
} from './rules-16pt.js';
import {
  pureDoubleChow,
  mixedDoubleChow,
  shortStraight,
  twoTerminalChows,
  pungOfTerminalsOrHonors,
  meldedKong,
  oneVoidedSuit,
  noHonorTiles,
  selfDrawn,
  edgeWait,
  closedWait,
  pairWait,
} from './rules-1pt.js';
import {
  sevenPairs,
  greaterHonorsAndKnittedTiles,
  allEvenPungs,
  fullFlush,
  pureTripleChow,
  pureShiftedPungs,
  upperTiles,
  middleTiles,
  lowerTiles,
} from './rules-24pt.js';
import {
  dragonPung,
  prevalentWind,
  seatWind,
  concealedHand,
  allChows,
  tileHog,
  doublePung,
  twoConcealedPungs,
  concealedKong,
  allSimples,
} from './rules-2pt.js';
import { fourShiftedChows, threeKongs, allTerminalsAndHonors } from './rules-32pt.js';
import { outsideHand, fullyConcealedHand, twoMeldedKongs, lastOfItsKind } from './rules-4pt.js';
import { allPungs, halfFlush, mixedShiftedChows, allTypes, meldedHand, twoDragonPungs } from './rules-6pt.js';
import {
  mixedStraight,
  reversibleTiles,
  mixedTripleChow,
  mixedShiftedPungs,
  twoConcealedKongs,
  lastTileDraw,
  lastTileClaim,
  outWithReplacementTile,
  robbingTheKong,
} from './rules-8pt.js';

export * from './rules-1pt.js';
export * from './rules-2pt.js';
export * from './rules-4pt.js';
export * from './rules-6pt.js';
export * from './rules-8pt.js';
export * from './rules-12pt.js';
export * from './rules-16pt.js';
export * from './rules-24pt.js';
export * from './rules-32pt.js';

export const mahjongScoringRules = [
  // 1 point
  pureDoubleChow,
  mixedDoubleChow,
  shortStraight,
  twoTerminalChows,
  pungOfTerminalsOrHonors,
  meldedKong,
  oneVoidedSuit,
  noHonorTiles,
  selfDrawn,
  edgeWait,
  closedWait,
  pairWait,
  // 2 points
  dragonPung,
  prevalentWind,
  seatWind,
  concealedHand,
  allChows,
  tileHog,
  doublePung,
  twoConcealedPungs,
  concealedKong,
  allSimples,
  // 4 points
  outsideHand,
  fullyConcealedHand,
  twoMeldedKongs,
  lastOfItsKind,
  // 6 points
  allPungs,
  halfFlush,
  mixedShiftedChows,
  allTypes,
  meldedHand,
  twoDragonPungs,
  // 8 points
  mixedStraight,
  reversibleTiles,
  mixedTripleChow,
  mixedShiftedPungs,
  twoConcealedKongs,
  lastTileDraw,
  lastTileClaim,
  outWithReplacementTile,
  robbingTheKong,
  // 12 points
  lesserHonorsAndKnittedTiles,
  knittedStraight,
  upperFour,
  lowerFour,
  bigThreeWinds,
  // 16 points
  pureStraight,
  threeSuitedTerminalChows,
  pureShiftedChows,
  allFives,
  triplePung,
  threeConcealedPungs,
  // 24 points
  sevenPairs,
  greaterHonorsAndKnittedTiles,
  allEvenPungs,
  fullFlush,
  pureTripleChow,
  pureShiftedPungs,
  upperTiles,
  middleTiles,
  lowerTiles,
  // 32 points
  fourShiftedChows,
  threeKongs,
  allTerminalsAndHonors,
];
