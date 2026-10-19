import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BlockTray } from '../components/BlockTray';
import { GameButton, IconButton } from '../components/Buttons';
import { DragLayer } from '../components/DragLayer';
import { EffectsLayer } from '../components/EffectsLayer';
import { boardGeometry, GameBoard } from '../components/GameBoard';
import { GameOverModal } from '../components/GameOverModal';
import { Icon } from '../components/Icon';
import { ModalCard } from '../components/ModalCard';
import { PlacementPreview, type PreviewState } from '../components/PlacementPreview';
import { Sparkles } from '../components/Sparkles';
import { ScoreHeader } from '../components/ScoreHeader';
import { SettingsModal } from '../components/SettingsModal';
import { PUZZLE_REWARD } from '../game/daily';
import { findFullLines } from '../game/lineClearing';
import { canPlace, placeShape } from '../game/placement';
import { getShape } from '../game/shapes';
import { useGame } from '../hooks/GameProvider';
import { useLatest } from '../hooks/useLatest';
import { decodeTarget, NO_TARGET, useDragDrop } from '../hooks/useDragDrop';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type Overlay = null | 'pause' | 'confirm-restart' | 'game-over' | 'solved';

const GAME_OVER_DELAY_MS = 900;
const SOLVED_DELAY_MS = 600;
const MAX_BOARD = 560;
const TICK_MIN_INTERVAL_MS = 45;

export function GameScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  const params = useLocalSearchParams<{ mode?: string }>();
  const isDaily = params.mode === 'daily';
  const ctx = useGame();
  const { best, settings, updateSettings, feedback, rewards, dailyTarget } = ctx;
  const { game, boardEpoch, lastResult, place, restart, undo, canUndo } = isDaily ? ctx.daily : ctx.classic;
  const puzzle = rewards.state.daily;

  const [overlay, setOverlay] = useState<Overlay>(null);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [boardArea, setBoardArea] = useState({ width: window.width, height: window.width });

  // ---------- responsive geometry ----------
  const compact = window.height < 700;
  const sidePad = spacing.lg;
  const boardSize = Math.floor(
    Math.min(MAX_BOARD, window.width - sidePad * 2, Math.max(200, boardArea.height - spacing.sm)),
  );
  const geo = useMemo(() => boardGeometry(boardSize), [boardSize]);
  // Derived from the window (not the board) so layout never feeds back on itself.
  const trayHeight = Math.round(Math.min(compact ? 112 : 150, Math.max(92, window.width * 0.3)));
  const slotWidth = Math.min(window.width - insets.left - insets.right - sidePad * 2, MAX_BOARD + 40) / 3;
  const trayPitch = Math.min(geo.pitch * 0.62, slotWidth / 5.4, (trayHeight - 16) / 5.2);

  // ---------- refs for drag measurement ----------
  const overlayRef = useRef<View>(null);
  const gridRef = useRef<View>(null);
  const slotRefs = useRef<(View | null)[]>([null, null, null]);
  const setSlotRef = useCallback((i: number, v: View | null) => {
    slotRefs.current[i] = v;
  }, []);

  const gameRef = useLatest(game);
  const lastTickAt = useRef(0);

  const drag = useDragDrop({
    overlayRef,
    gridRef,
    slotRefs,
    trayScale: () => trayPitch / geo.pitch,
    pieceHeight: (slot) => {
      const p = gameRef.current.tray[slot];
      return p ? getShape(p.shapeId).rows * geo.pitch : 0;
    },
    onPickup: () => {
      feedback.play('pickup');
      feedback.vibrate('pickup');
    },
    onTargetChange: (slot, t) => {
      const piece = gameRef.current.tray[slot];
      if (!piece || t === NO_TARGET) {
        setPreview(null);
        return;
      }
      // Soft tick as the piece steps from cell to cell, rate-limited for fast swipes.
      const now = Date.now();
      if (now - lastTickAt.current > TICK_MIN_INTERVAL_MS) {
        lastTickAt.current = now;
        feedback.play('tick');
      }
      const { row, col } = decodeTarget(t);
      const board = gameRef.current.board;
      const shape = getShape(piece.shapeId);
      const valid = canPlace(board, shape, row, col);
      const lines = valid ? findFullLines(placeShape(board, shape, row, col, piece.level)) : { rows: [], cols: [] };
      setPreview({ shapeId: piece.shapeId, level: piece.level, row, col, valid, ...lines });
    },
    tryPlace: (slot, row, col) => {
      const piece = gameRef.current.tray[slot];
      if (!piece) return false;
      const out = place(slot, piece.id, row, col);
      if (!out.ok) return false;
      const r = out.result;
      const lines = r.clearedRows.length + r.clearedCols.length;
      if (lines > 0) {
        feedback.play(r.combo >= 2 || lines >= 2 ? 'combo' : 'clear');
        feedback.vibrate('clear');
      } else if (r.fusionSteps.length > 0) {
        feedback.play('fusion');
        feedback.vibrate('fusion');
      } else {
        feedback.play('place');
        feedback.vibrate('place');
      }
      if (lines > 0 && r.fusionSteps.length > 0) setTimeout(() => feedback.play('fusion'), 180);
      return true;
    },
    onRejected: (_slot, t) => {
      // Only complain when the player actually tried to drop on the board.
      if (t !== NO_TARGET) {
        feedback.play('invalid');
        feedback.vibrate('invalid');
      } else {
        feedback.play('return');
      }
    },
  });
  const { shared, handlers, dragSlot, measure } = drag;

  useEffect(() => {
    shared.pitch.set(geo.pitch);
    shared.lift.set(Math.max(28, geo.pitch * 1.2));
  }, [geo.pitch, shared]);

  // Drags are only allowed while playing with no overlay open.
  useEffect(() => {
    shared.enabled.set(overlay === null && !game.gameOver ? 1 : 0);
  }, [overlay, game.gameOver, shared]);

  // ---------- game over ----------
  useEffect(() => {
    if (!game.gameOver) return;
    const t = setTimeout(() => {
      // A just-solved puzzle shows its reward first; game over follows after claiming.
      setOverlay((o) => (o === 'solved' ? o : 'game-over'));
      feedback.play('gameover');
      feedback.vibrate('gameover');
    }, GAME_OVER_DELAY_MS);
    return () => clearTimeout(t);
    // feedback identity changes with settings; only react to game over itself
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.gameOver]);

  // ---------- daily puzzle solved ----------
  const solvedPending = isDaily && puzzle.puzzleSolved && !puzzle.puzzleClaimed;
  useEffect(() => {
    if (!solvedPending) return;
    const t = setTimeout(() => {
      setOverlay('solved');
      feedback.play('combo');
      feedback.vibrate('clear');
    }, SOLVED_DELAY_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solvedPending]);

  const claimSolved = useCallback(() => {
    rewards.claimPuzzle();
    setOverlay(game.gameOver ? 'game-over' : null);
  }, [rewards, game.gameOver]);

  const doRestart = useCallback(() => {
    restart();
    setPreview(null);
    setOverlay(null);
  }, [restart]);

  const goHome = useCallback(() => {
    setOverlay(null);
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, [router]);

  const onBoardAreaLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBoardArea((a) => (a.width === width && a.height === height ? a : { width, height }));
  }, []);

  const draggedPiece = dragSlot !== null ? game.tray[dragSlot] : null;

  return (
    <View ref={overlayRef} collapsable={false} style={styles.root} onLayout={measure}>
      <LinearGradient colors={[colors.bgTop, colors.bgBottom]} style={StyleSheet.absoluteFill} />

      <Sparkles />

      <View style={[styles.header, { paddingTop: insets.top + spacing.sm, paddingLeft: insets.left + sidePad, paddingRight: insets.right + sidePad }]}>
        <View style={styles.headerInner}>
          <ScoreHeader
            score={game.score}
            best={best}
            combo={game.combo}
            compact={compact}
            target={isDaily ? dailyTarget : undefined}
            right={<IconButton icon="pause" label="Pause and settings" size={40} plain onPress={() => setOverlay('pause')} />}
          />
        </View>
      </View>

      <View style={[styles.content, { paddingBottom: insets.bottom + spacing.sm, paddingLeft: insets.left + sidePad, paddingRight: insets.right + sidePad }]}>
        <View style={styles.boardArea} onLayout={onBoardAreaLayout}>
          <GameBoard board={game.board} geo={geo} epoch={boardEpoch} gridRef={gridRef} onGridLayout={measure}>
            {preview && <PlacementPreview preview={preview} geo={geo} />}
            <EffectsLayer result={lastResult} geo={geo} />
          </GameBoard>
        </View>

        <BlockTray
          tray={game.tray}
          board={game.board}
          dragSlot={dragSlot}
          trayPitch={trayPitch}
          boardPitch={geo.pitch}
          height={trayHeight}
          drag={shared}
          handlers={handlers}
          setSlotRef={setSlotRef}
          onSlotLayout={measure}
        />

        <View style={styles.controls}>
          <IconButton icon="undo" label="Undo last move" size={40} badge={game.undosLeft} disabled={!canUndo || dragSlot !== null} onPress={undo} />
          <IconButton
            icon={settings.sound ? 'sound-on' : 'sound-off'}
            label={settings.sound ? 'Mute sound' : 'Unmute sound'}
            size={40}
            active={settings.sound}
            onPress={() => updateSettings({ sound: !settings.sound })}
          />
          <IconButton icon="restart" label="New game" size={40} onPress={() => setOverlay('confirm-restart')} />
        </View>
      </View>

      <DragLayer piece={draggedPiece} pitch={geo.pitch} drag={shared} invalid={preview !== null && !preview.valid} />

      {overlay === 'pause' && (
        <SettingsModal
          mode="pause"
          settings={settings}
          onChangeSettings={updateSettings}
          onClose={() => setOverlay(null)}
          onRestart={doRestart}
          onHome={goHome}
        />
      )}
      {overlay === 'confirm-restart' && (
        <SettingsModal
          mode="pause"
          initialView="confirm"
          settings={settings}
          onChangeSettings={updateSettings}
          onClose={() => setOverlay(null)}
          onRestart={doRestart}
        />
      )}
      {overlay === 'solved' && (
        <ModalCard title="Puzzle solved!">
          <View style={styles.solvedBox}>
            <Icon name="coin" size={44} color={colors.gold} />
            <Text style={styles.solvedReward}>+{PUZZLE_REWARD}</Text>
            <Text style={styles.solvedHint}>Come back tomorrow for a new puzzle.</Text>
          </View>
          <GameButton label="Claim" icon="coin" variant="gold" onPress={claimSolved} />
        </ModalCard>
      )}
      {overlay === 'game-over' && game.gameOver && (
        <GameOverModal
          score={game.score}
          best={isDaily ? dailyTarget : best}
          bestLabel={isDaily ? 'TARGET' : 'BEST'}
          replayLabel={isDaily ? 'Try again' : 'Play again'}
          isNewBest={!isDaily && game.score > 0 && game.score >= best}
          onReplay={doRestart}
          onHome={() => {
            doRestart();
            goHome();
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgBottom },
  header: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: colors.header,
    paddingBottom: spacing.xs,
  },
  headerInner: { width: '100%', maxWidth: MAX_BOARD + 40 },
  content: { flex: 1, alignItems: 'center' },
  boardArea: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
    minHeight: 200,
  },
  solvedBox: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 16,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  solvedReward: { ...typography.score, fontSize: 44, color: colors.gold },
  solvedHint: { ...typography.body, fontSize: 14, color: colors.textDim, textAlign: 'center' },
  controls: {
    width: '100%',
    maxWidth: MAX_BOARD + 40,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: spacing.sm,
  },
});
