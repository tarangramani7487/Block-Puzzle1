# Block Fusion

An original block-placement puzzle game with a fusion twist, built with Expo (SDK 57),
React Native 0.86, TypeScript, Reanimated 4 and Gesture Handler. Fully offline.

## Run it

```bash
npm install
npx expo start          # press "a" for an Android emulator, or scan the QR code with Expo Go
npm test                # engine + persistence unit tests (Jest)
npm run typecheck       # tsc --noEmit
npm run lint            # expo lint
```

Every native module used (gesture-handler, reanimated, svg, audio, haptics, async-storage,
linear-gradient) ships in Expo Go, so no development build is needed for testing.

## Build an installable Android APK (EAS)

```bash
npx eas-cli@latest login
npx eas-cli@latest build:configure          # first time only; links the project to your Expo account
npx eas-cli@latest build -p android --profile preview
```

The `preview` profile in `eas.json` produces an `.apk` you can download from the build page and
sideload. `production` produces an `.aab` for Google Play. To build locally instead (requires the
Android SDK + JDK 17): `npx eas-cli@latest build -p android --profile preview --local`.

## Rules

- **Board** 10×10. Drag pieces from the 3-piece tray onto the board. The tray refills once all
  three are placed.
- **Clear**: every full row and column clears at once. Line points for *n* lines in one move:
  `50 × n × (n+1)` → 100, 300, 600, 1000… multiplied by the current combo.
- **Combo**: each move that clears ≥ 1 line increments the combo; three consecutive moves without
  a clear reset it to 0.
- **Placement**: 1 point per placed cell. **Perfect clear** (board emptied): +300.
- **Game over**: only when none of the remaining tray pieces fits anywhere.
- **Undo**: 3 per game, one step deep. The RNG state is restored too, so undo cannot re-roll pieces.

### Fusion (exact resolution order)

Blocks have a level 1–6 (colour + dice pips). Pieces spawn at levels 1–3.
Each move resolves in this fixed order on one authoritative board (`src/game/gameEngine.ts`):

1. Place the piece.
2. Detect and clear **all** full rows and columns simultaneously.
3. Fusion, seeded by the placed cells that survived step 2, visited top-to-bottom, left-to-right:
   - Take the seed's connected group of same-level blocks (up/down/left/right only).
   - It **fuses** if it has ≥ 4 cells **and** contains at least one block that was already on the
     board (a piece never fuses with itself).
   - Fusing raises every cell in the group by one level (chain step 1).
   - **Chain**: if the upgraded group now touches other blocks of its new level, the merged group
     upgrades again (step 2, 3, …).
   - **Supernova**: a level-6 group that would fuse bursts instead and is removed from the board.
4. Fusion never fills cells, so lines are not re-checked afterwards.

Fusion points per step: `cells × newLevel × 5 × chainIndex`; a burst scores `cells × 30 × chainIndex`.
The rules are covered by `src/game/__tests__/fusion.test.ts`.

### Daily challenges and rewards

Rules live in `src/game/daily.ts` (tested in `src/game/__tests__/daily.test.ts`). Everything is
seeded by the local date, so every player gets the same challenges on the same day.

- **Daily goals**: 3 goals per day (e.g. "Clear 15 lines", "Reach a ×4 combo") drawn from 7 kinds.
  Progress counts in both classic games and the daily puzzle; each pays coins once when claimed.
- **Daily puzzle**: a pre-filled board and tray for the day with a target score (1,200–2,000).
  Reaching it pays 150 coins once; it can be retried and replayed.
- **Login streak**: claiming on consecutive days walks a 7-day ladder (20 → 150 coins); missing a
  day resets it.
- **Themes**: coins unlock block/board colour themes (`src/theme/themes.ts`), applied app-wide
  through `ThemeContext`.

## Architecture

```
src/
  app/            Expo Router routes (thin wrappers): _layout, index (home), game
  screens/        HomeScreen, GameScreen
  components/     GameBoard, BoardCell, GameBlock, BlockShape, BlockTray, DragLayer,
                  PlacementPreview, EffectsLayer, ScoreHeader, SettingsModal, GameOverModal, …
  game/           Pure, deterministic engine — no React:
                  types, constants, shapes, random (seeded PRNG), shapeGenerator, placement,
                  lineClearing, fusion, scoring, gameOver, gameEngine
  hooks/          useGame (controller), GameProvider (context), useGamePersistence,
                  useDragDrop (UI-thread drag state), useFeedback (sound + haptics), …
  theme/          colors, spacing, typography
  utils/          storage (validated AsyncStorage I/O), haptics
scripts/generate-sounds.js   synthesizes the WAV sound effects in assets/sounds
```

**Drag and drop.** Each tray slot has a `Gesture.Pan`. The finger position, floating piece and
target cell are computed in worklets on the UI thread from window-space measurements of the
screen, grid and slots. React only re-renders when the target cell changes (for the preview) and
on drop. Drops are validated synchronously against a ref holding the authoritative game state, and
the piece id is checked, so a duplicated or stale drop can't apply twice. Only one drag can be
active at a time.

**Rendering.** Board cells are memoised on primitive props, so a move re-renders only the cells
that changed, and a drag never re-renders the cell grid. Effects (line bursts, particles, toasts)
live in a separate decorative layer driven by the move result and never touch game state.

**Persistence.** Best score, settings and the current game (board, tray, score, combo, RNG state,
undo snapshot) go to AsyncStorage after every change. Saved data is fully validated on load;
corrupt or unknown data falls back to defaults.
# Block-Puzzle
