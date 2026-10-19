import { BOARD_SIZE, UNDOS_PER_GAME } from './constants';
import type { Board, GameState, MoveResult } from './types';

export interface TutorialStep {
  title: string;
  hint: string;
  /** Hand-crafted position; the tray holds a single piece in the middle slot. */
  state: GameState;
  /** Where the hand and ghost point. */
  target: { row: number; col: number };
  /** Whether the player's move taught what this step is about. */
  passed: (result: MoveResult) => boolean;
}

/** The middle tray slot, nearest the thumb. */
export const TUTORIAL_SLOT = 1;

function makeState(fill: (board: Board) => void, shapeId: string, level: number): GameState {
  const board: Board = Array.from({ length: BOARD_SIZE }, () => Array<number>(BOARD_SIZE).fill(0));
  fill(board);
  return {
    version: 1,
    board,
    tray: [null, { id: 1, shapeId, level }, null],
    score: 0,
    combo: 0,
    movesSinceClear: 0,
    moveCount: 0,
    nextPieceId: 2,
    rngState: 1,
    gameOver: false,
    undosLeft: UNDOS_PER_GAME,
    previous: null,
  };
}

const clearsLine = (r: MoveResult) => r.clearedRows.length + r.clearedCols.length > 0;

export const TUTORIAL_STEPS: readonly TutorialStep[] = [
  {
    title: 'Drag & drop',
    hint: 'Drag the block onto the board to fill the row.',
    state: makeState((b) => {
      for (let c = 0; c < BOARD_SIZE - 2; c++) b[8][c] = 1 + (c % 3);
    }, 'i2h', 2),
    target: { row: 8, col: BOARD_SIZE - 2 },
    passed: clearsLine,
  },
  {
    title: 'Clear columns too',
    hint: 'A full column clears just like a row.',
    state: makeState((b) => {
      for (let r = 0; r < BOARD_SIZE - 3; r++) b[r][4] = 1 + (r % 3);
    }, 'i3v', 3),
    target: { row: BOARD_SIZE - 3, col: 4 },
    passed: clearsLine,
  },
  {
    title: 'Fuse colours',
    hint: 'Join 4 blocks of the same colour to fuse them into the next colour.',
    state: makeState((b) => {
      b[8][3] = 1;
      b[8][4] = 1;
    }, 'i2h', 1),
    target: { row: 7, col: 3 },
    passed: (r) => r.fusionSteps.length > 0,
  },
];
