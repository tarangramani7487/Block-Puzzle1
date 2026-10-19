import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { withSpring } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { BOARD_SIZE } from '../game/constants';
import { fitsAnywhere } from '../game/placement';
import { getShape } from '../game/shapes';
import type { Board, Piece, Tray } from '../game/types';
import { encodeTarget, NO_TARGET, type DragHandlers, type DragShared } from '../hooks/useDragDrop';
import { colors } from '../theme/colors';
import { radius } from '../theme/spacing';
import { BlockShape } from './BlockShape';

interface SlotProps {
  index: number;
  piece: Piece | null;
  fits: boolean;
  hidden: boolean;
  trayPitch: number;
  boardPitch: number;
  drag: DragShared;
  handlers: DragHandlers;
  setRef: (index: number, view: View | null) => void;
  onLayout: () => void;
}

const TraySlot = memo(function TraySlot({
  index,
  piece,
  fits,
  hidden,
  trayPitch,
  boardPitch,
  drag,
  handlers,
  setRef,
  onLayout,
}: SlotProps) {
  const gesture = useMemo(() => {
    const shape = piece ? getShape(piece.shapeId) : null;
    const w = shape ? shape.cols * boardPitch : 0;
    const h = shape ? shape.rows * boardPitch : 0;
    const startScale = trayPitch / boardPitch;
    const { onPickup, onTarget, onDrop } = handlers;
    const { activeSlot, enabled, fingerX, fingerY, scale, target, frames, slots, pitch, lift } = drag;

    return Gesture.Pan()
      .enabled(piece !== null)
      .maxPointers(1)
      .minDistance(0)
      .shouldCancelWhenOutside(false)
      .onBegin((e) => {
        if (enabled.value !== 1 || activeSlot.value !== -1) return;
        activeSlot.value = index;
        const f = frames.value;
        const s = slots.value;
        fingerX.value = s[index * 4] + e.x - f[0];
        fingerY.value = s[index * 4 + 1] + e.y - f[1];
        scale.value = startScale;
        scale.value = withSpring(1, { damping: 16, stiffness: 320 });
        target.value = NO_TARGET;
        scheduleOnRN(onPickup, index);
      })
      .onUpdate((e) => {
        if (activeSlot.value !== index) return;
        const f = frames.value;
        const s = slots.value;
        fingerX.value = s[index * 4] + e.x - f[0];
        fingerY.value = s[index * 4 + 1] + e.y - f[1];

        // Floating piece top-left relative to the grid origin.
        const p = pitch.value;
        const left = fingerX.value - w / 2 - (f[2] - f[0]);
        const top = fingerY.value - h - lift.value - (f[3] - f[1]);
        const centerCol = (left + w / 2) / p;
        const centerRow = (top + h / 2) / p;
        // Only target the board when the piece's centre is over it (with a small margin).
        const near = centerCol > -0.5 && centerCol < BOARD_SIZE + 0.5 && centerRow > -0.5 && centerRow < BOARD_SIZE + 0.5;
        const t = near ? encodeTarget(Math.round(top / p), Math.round(left / p)) : NO_TARGET;
        if (t !== target.value) {
          target.value = t;
          scheduleOnRN(onTarget, t);
        }
      })
      .onFinalize(() => {
        if (activeSlot.value !== index) return;
        scheduleOnRN(onDrop, index, target.value);
      });
  }, [piece, index, trayPitch, boardPitch, handlers, drag]);

  return (
    <GestureDetector gesture={gesture}>
      <View ref={(v) => setRef(index, v)} onLayout={onLayout} collapsable={false} style={styles.slot}>
        {piece && (
          <View key={piece.id} style={[!fits && styles.noFit, hidden && styles.hidden]}>
            <BlockShape shapeId={piece.shapeId} level={piece.level} pitch={trayPitch} />
          </View>
        )}
      </View>
    </GestureDetector>
  );
});

interface Props {
  tray: Tray;
  board: Board;
  dragSlot: number | null;
  trayPitch: number;
  boardPitch: number;
  height: number;
  drag: DragShared;
  handlers: DragHandlers;
  setSlotRef: (index: number, view: View | null) => void;
  onSlotLayout: () => void;
}

export const BlockTray = memo(function BlockTray({
  tray,
  board,
  dragSlot,
  trayPitch,
  boardPitch,
  height,
  drag,
  handlers,
  setSlotRef,
  onSlotLayout,
}: Props) {
  const fits = useMemo(() => tray.map((p) => (p ? fitsAnywhere(board, p.shapeId) : true)), [tray, board]);
  return (
    <View style={[styles.tray, { height }]}>
      {tray.map((piece, i) => (
        <TraySlot
          key={i}
          index={i}
          piece={piece}
          fits={fits[i]}
          hidden={dragSlot === i}
          trayPitch={trayPitch}
          boardPitch={boardPitch}
          drag={drag}
          handlers={handlers}
          setRef={setSlotRef}
          onLayout={onSlotLayout}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  tray: {
    width: '100%',
    maxWidth: 600,
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.tray,
    borderRadius: radius.md,
  },
  slot: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  noFit: { opacity: 0.35 },
  hidden: { opacity: 0 },
});
