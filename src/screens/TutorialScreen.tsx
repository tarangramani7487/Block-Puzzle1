import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BlockTray } from '../components/BlockTray';
import { GameButton } from '../components/Buttons';
import { DragLayer } from '../components/DragLayer';
import { EffectsLayer } from '../components/EffectsLayer';
import { boardGeometry, GameBoard } from '../components/GameBoard';
import { PlacementPreview, PreviewLayer, type PreviewLayerHandle, type PreviewState } from '../components/PlacementPreview';
import { TutorialHand } from '../components/TutorialHand';
import { findFullLines } from '../game/lineClearing';
import { canPlace, placeShape } from '../game/placement';
import { getShape } from '../game/shapes';
import { TUTORIAL_SLOT, TUTORIAL_STEPS } from '../game/tutorial';
import { useGame } from '../hooks/GameProvider';
import { decodeTarget, NO_TARGET, useDragDrop } from '../hooks/useDragDrop';
import { useBoardController } from '../hooks/useGame';
import { useLatest } from '../hooks/useLatest';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

const MAX_BOARD = 560;
/** Pause after a move so the clear/fusion effect plays before the next step. */
const NEXT_STEP_MS = 1300;
const RETRY_MS = 900;
const EMPTY_TRAY = [null, null, null];

type Phase = 'play' | 'passed' | 'retry' | 'done';

/** First-launch, hands-on tutorial: the player learns by dragging real pieces. */
export function TutorialScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  const { updateSettings, feedback, classic } = useGame();

  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('play');
  const step = TUTORIAL_STEPS[stepIndex];
  const board = useBoardController(() => TUTORIAL_STEPS[0].state);
  const { game, boardEpoch, lastResult, place, load } = board;

  const [boardArea, setBoardArea] = useState({ width: window.width, height: window.width });
  const sidePad = spacing.lg;
  const boardSize = Math.floor(Math.min(MAX_BOARD, window.width - sidePad * 2, Math.max(200, boardArea.height - spacing.sm)));
  const geo = useMemo(() => boardGeometry(boardSize), [boardSize]);
  const trayHeight = Math.round(Math.min(150, Math.max(92, window.width * 0.3)));
  const slotWidth = Math.min(window.width - insets.left - insets.right - sidePad * 2, MAX_BOARD + 40) / 3;
  const trayPitch = Math.min(geo.pitch * 0.62, slotWidth / 5.4, (trayHeight - 16) / 5.2);

  const overlayRef = useRef<View>(null);
  const gridRef = useRef<View>(null);
  const slotRefs = useRef<(View | null)[]>([null, null, null]);
  const setSlotRef = useCallback((i: number, v: View | null) => {
    slotRefs.current[i] = v;
  }, []);
  const previewRef = useRef<PreviewLayerHandle>(null);
  const [previewInvalid, setPreviewInvalid] = useState(false);
  const setPreview = useCallback((p: PreviewState | null) => {
    previewRef.current?.set(p);
    setPreviewInvalid(p !== null && !p.valid);
  }, []);

  const gameRef = useLatest(game);
  const stepRef = useLatest(step);
  const phaseRef = useLatest(phase);

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
      const { row, col } = decodeTarget(t);
      const b = gameRef.current.board;
      const shape = getShape(piece.shapeId);
      const valid = canPlace(b, shape, row, col);
      const lines = valid ? findFullLines(placeShape(b, shape, row, col, piece.level)) : { rows: [], cols: [] };
      setPreview({ shapeId: piece.shapeId, level: piece.level, row, col, valid, ...lines });
    },
    tryPlace: (slot, row, col) => {
      const piece = gameRef.current.tray[slot];
      if (!piece || phaseRef.current !== 'play') return false;
      const out = place(slot, piece.id, row, col);
      if (!out.ok) return false;
      const passed = stepRef.current.passed(out.result);
      const r = out.result;
      if (r.clearedRows.length + r.clearedCols.length > 0) feedback.play('clear');
      else if (r.fusionSteps.length > 0) feedback.play('fusion');
      else feedback.play('place');
      feedback.vibrate(passed ? 'clear' : 'place');
      setPhase(passed ? 'passed' : 'retry');
      return true;
    },
    onRejected: (_slot, t) => {
      feedback.play(t !== NO_TARGET ? 'invalid' : 'return');
    },
  });
  const { shared, handlers, dragSlot, measure } = drag;

  useEffect(() => {
    shared.pitch.set(geo.pitch);
    shared.lift.set(Math.max(28, geo.pitch * 1.2));
  }, [geo.pitch, shared]);

  useEffect(() => {
    shared.enabled.set(phase === 'play' ? 1 : 0);
  }, [phase, shared]);

  // Advance after a passed step; reset the same step after a wrong move.
  useEffect(() => {
    if (phase !== 'passed' && phase !== 'retry') return;
    const t = setTimeout(
      () => {
        const next = phase === 'passed' ? stepIndex + 1 : stepIndex;
        if (next >= TUTORIAL_STEPS.length) {
          setPhase('done');
          return;
        }
        load(TUTORIAL_STEPS[next].state);
        setStepIndex(next);
        setPhase('play');
      },
      phase === 'passed' ? NEXT_STEP_MS : RETRY_MS,
    );
    return () => clearTimeout(t);
  }, [phase, stepIndex, load]);

  const finish = useCallback(() => {
    updateSettings({ tutorialSeen: true });
    classic.restart();
    router.replace('/game');
  }, [updateSettings, classic, router]);

  // The hint: a ghost of the piece at its target, and a hand dragging it there.
  const piece = game.tray[TUTORIAL_SLOT];
  const showHint = phase === 'play' && dragSlot === null && piece !== null;
  const hint: PreviewState | null = useMemo(() => {
    if (!piece) return null;
    const shape = getShape(piece.shapeId);
    const { row, col } = step.target;
    if (!canPlace(game.board, shape, row, col)) return null;
    const lines = findFullLines(placeShape(game.board, shape, row, col, piece.level));
    return { shapeId: piece.shapeId, level: piece.level, row, col, valid: true, ...lines };
  }, [piece, step, game.board]);
  const pieceShape = piece ? getShape(piece.shapeId) : null;

  const message =
    phase === 'passed'
      ? stepIndex === TUTORIAL_STEPS.length - 1
        ? 'Awesome!'
        : 'Great!'
      : phase === 'retry'
        ? 'Almost! Try again.'
        : phase === 'done'
          ? "You're ready!"
          : step.title;

  return (
    <View ref={overlayRef} collapsable={false} style={styles.root} onLayout={measure}>
      <LinearGradient colors={[colors.bgTop, colors.bgBottom]} style={StyleSheet.absoluteFill} />

      <View style={[styles.header, { paddingTop: insets.top + spacing.sm, paddingLeft: insets.left + sidePad, paddingRight: insets.right + sidePad }]}>
        <View style={styles.dots}>
          {TUTORIAL_STEPS.map((_, i) => (
            <View key={i} style={[styles.dot, (i < stepIndex || phase === 'done' || (i === stepIndex && phase === 'passed')) && styles.dotDone, i === stepIndex && phase !== 'done' && styles.dotCurrent]} />
          ))}
        </View>
        {phase !== 'done' && (
          <Pressable accessibilityRole="button" accessibilityLabel="Skip tutorial" onPress={finish} hitSlop={12}>
            <Text style={styles.skip}>Skip</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.instructions}>
        <Text style={[styles.title, phase === 'retry' && { color: colors.invalid }, (phase === 'passed' || phase === 'done') && { color: colors.gold }]}>
          {message}
        </Text>
        <Text style={styles.hint}>{phase === 'done' ? 'Now try it for real. Keep the board clear as long as you can!' : step.hint}</Text>
      </View>

      <View style={[styles.content, { paddingBottom: insets.bottom + spacing.lg, paddingLeft: insets.left + sidePad, paddingRight: insets.right + sidePad }]}>
        <View
          style={styles.boardArea}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            setBoardArea((a) => (a.width === width && a.height === height ? a : { width, height }));
          }}
        >
          <GameBoard board={game.board} geo={geo} epoch={boardEpoch} gridRef={gridRef} onGridLayout={measure}>
            {showHint && hint && <PlacementPreview preview={hint} geo={geo} />}
            <PreviewLayer ref={previewRef} geo={geo} />
            <EffectsLayer result={lastResult} geo={geo} />
          </GameBoard>
        </View>

        {phase === 'done' ? (
          <View style={[styles.doneBox, { height: trayHeight }]}>
            <GameButton label="Start playing" icon="play" variant="gold" onPress={finish} style={styles.doneBtn} />
          </View>
        ) : (
          <BlockTray
            tray={phase === 'play' ? game.tray : EMPTY_TRAY}
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
        )}
      </View>

      <DragLayer piece={dragSlot !== null ? game.tray[dragSlot] : null} pitch={geo.pitch} drag={shared} invalid={previewInvalid} />

      {showHint && pieceShape && (
        <TutorialHand
          key={stepIndex}
          drag={shared}
          slot={TUTORIAL_SLOT}
          toX={(step.target.col + pieceShape.cols / 2) * geo.pitch}
          toY={(step.target.row + pieceShape.rows / 2) * geo.pitch}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgBottom },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.header,
    paddingBottom: spacing.sm,
  },
  dots: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.2)' },
  dotCurrent: { width: 26, backgroundColor: colors.text },
  dotDone: { backgroundColor: colors.gold },
  skip: { ...typography.label, fontSize: 14, color: colors.textDim },
  instructions: { alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.lg, gap: spacing.xs, minHeight: 92 },
  title: { ...typography.hero, fontSize: 30, color: colors.text, textAlign: 'center' },
  hint: { ...typography.body, color: colors.textDim, textAlign: 'center' },
  content: { flex: 1, alignItems: 'center' },
  boardArea: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
    minHeight: 200,
  },
  doneBox: { width: '100%', maxWidth: 600, justifyContent: 'center', borderRadius: radius.md },
  doneBtn: { alignSelf: 'stretch' },
});
