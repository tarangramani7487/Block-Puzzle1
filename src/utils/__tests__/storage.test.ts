import AsyncStorage from '@react-native-async-storage/async-storage';

import { applyMove, createInitialState } from '../../game/gameEngine';
import {
  DEFAULT_SETTINGS,
  STORAGE_KEYS,
  clearSavedGame,
  loadAll,
  parseBest,
  parseSavedGame,
  parseSettings,
  saveBest,
  saveGame,
  saveSettings,
  serializeGame,
} from '../storage';

jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

function playedState() {
  const out = applyMove(createInitialState(11), 0, 0, 0);
  if (!out.ok) throw new Error();
  return out.state;
}

describe('save / restore', () => {
  beforeEach(() => AsyncStorage.clear());

  it('round-trips a game state exactly', () => {
    const state = playedState();
    expect(parseSavedGame(serializeGame(state))).toEqual(state);
  });

  it('persists and restores best score, settings and game through AsyncStorage', async () => {
    const state = playedState();
    await saveBest(1234);
    await saveSettings({ sound: false, haptics: true });
    await saveGame(state);
    const loaded = await loadAll();
    expect(loaded.best).toBe(1234);
    expect(loaded.settings).toEqual({ sound: false, haptics: true });
    expect(loaded.game).toEqual(state);
    await clearSavedGame();
    expect((await loadAll()).game).toBeNull();
  });

  it('falls back to defaults when nothing is saved', async () => {
    expect(await loadAll()).toEqual({ best: 0, settings: DEFAULT_SETTINGS, game: null });
  });

  it('rejects corrupt or invalid saved games', () => {
    const good = JSON.parse(serializeGame(playedState()));
    expect(parseSavedGame('not json')).toBeNull();
    expect(parseSavedGame('null')).toBeNull();
    expect(parseSavedGame(JSON.stringify({ ...good, version: 2 }))).toBeNull();
    expect(parseSavedGame(JSON.stringify({ ...good, board: good.board.slice(1) }))).toBeNull();
    const badCell = structuredClone(good);
    badCell.board[0][0] = 99;
    expect(parseSavedGame(JSON.stringify(badCell))).toBeNull();
    const badShape = structuredClone(good);
    badShape.tray[1] = { id: 1, shapeId: 'nope', level: 1 };
    expect(parseSavedGame(JSON.stringify(badShape))).toBeNull();
    expect(parseSavedGame(JSON.stringify({ ...good, tray: [null, null, null] }))).toBeNull();
    expect(parseSavedGame(JSON.stringify({ ...good, score: -5 }))).toBeNull();
  });

  it('drops an invalid undo snapshot but keeps the game', () => {
    const good = JSON.parse(serializeGame(playedState()));
    const restored = parseSavedGame(JSON.stringify({ ...good, previous: { junk: true } }));
    expect(restored).not.toBeNull();
    expect(restored!.previous).toBeNull();
  });

  it('parses settings and best score defensively', () => {
    expect(parseSettings('{"sound":"yes","haptics":false}')).toEqual({ sound: true, haptics: false });
    expect(parseSettings('{{')).toEqual(DEFAULT_SETTINGS);
    expect(parseBest('abc')).toBe(0);
    expect(parseBest('-3')).toBe(0);
    expect(parseBest('512')).toBe(512);
  });

  it('survives a corrupt stored value', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.game, '{"version":1,"board":"x"}');
    expect((await loadAll()).game).toBeNull();
  });
});
