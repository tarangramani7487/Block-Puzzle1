import AsyncStorage from '@react-native-async-storage/async-storage';

import { buyTheme, claimLogin, createDailyPuzzle, createRewards } from '../../game/daily';
import { applyMove, createInitialState } from '../../game/gameEngine';
import {
  DEFAULT_SETTINGS,
  STORAGE_KEYS,
  clearSavedGame,
  loadAll,
  parseBest,
  parseDailyGame,
  parseRewards,
  saveDailyGame,
  saveRewards,
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

const DAY = '2026-10-15';

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
    await saveSettings({ sound: false, haptics: true, tutorialSeen: true });
    await saveGame(state);
    const loaded = await loadAll(DAY);
    expect(loaded.best).toBe(1234);
    expect(loaded.settings).toEqual({ sound: false, haptics: true, tutorialSeen: true });
    expect(loaded.game).toEqual(state);
    await clearSavedGame();
    expect((await loadAll(DAY)).game).toBeNull();
  });

  it('falls back to defaults when nothing is saved', async () => {
    expect(await loadAll(DAY)).toEqual({
      best: 0,
      settings: DEFAULT_SETTINGS,
      game: null,
      rewards: createRewards(DAY),
      dailyGame: null,
    });
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
    expect(parseSettings('{"sound":"yes","haptics":false}')).toEqual({ sound: true, haptics: false, tutorialSeen: true });
    expect(parseSettings('{"sound":true,"haptics":true,"tutorialSeen":false}').tutorialSeen).toBe(false);
    expect(parseSettings(null).tutorialSeen).toBe(false);
    expect(parseSettings('{{')).toEqual(DEFAULT_SETTINGS);
    expect(parseBest('abc')).toBe(0);
    expect(parseBest('-3')).toBe(0);
    expect(parseBest('512')).toBe(512);
  });

  it('survives a corrupt stored value', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.game, '{"version":1,"board":"x"}');
    expect((await loadAll(DAY)).game).toBeNull();
  });

  it('round-trips rewards and the daily puzzle game', async () => {
    const rewards = buyTheme({ ...claimLogin(createRewards(DAY), DAY), coins: 400 }, 'candy');
    const puzzle = createDailyPuzzle(DAY).state;
    const out = applyMove(puzzle, 0, 0, 0);
    const daily = out.ok ? out.state : puzzle;
    await saveRewards(rewards);
    await saveDailyGame(DAY, daily);
    const loaded = await loadAll(DAY);
    expect(loaded.rewards).toEqual(rewards);
    expect(loaded.dailyGame).toEqual({ day: DAY, game: daily });
  });

  it('repairs corrupt rewards without losing valid fields', () => {
    const good = JSON.parse(JSON.stringify({ ...createRewards(DAY), coins: 77, ownedThemes: ['jewel', 'neon'] }));
    expect(parseRewards('nope', DAY)).toEqual(createRewards(DAY));
    const r = parseRewards(JSON.stringify({ ...good, activeTheme: 'missing', ownedThemes: ['neon', 'fake'], streak: -1 }), DAY);
    expect(r.coins).toBe(77);
    expect(r.ownedThemes).toEqual(['jewel', 'neon']);
    expect(r.activeTheme).toBe('jewel');
    expect(r.streak).toBe(0);
    // Tampered goals are replaced by the real set for the day.
    const tampered = structuredClone(good);
    tampered.daily.goals[0].target = 1;
    expect(parseRewards(JSON.stringify(tampered), DAY).daily).toEqual(createRewards(DAY).daily);
    expect(parseDailyGame('{"day":"x","game":{}}')).toBeNull();
  });
});
