import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { getShape } from '../game/shapes';
import type { Piece } from '../game/types';
import type { DragShared } from '../hooks/useDragDrop';
import { BlockShape } from './BlockShape';

interface Props {
  piece: Piece | null;
  pitch: number;
  drag: DragShared;
  /** Over the board at a position where the piece can't go. */
  invalid?: boolean;
}

/**
 * The piece under the player's finger. Rendered at board scale, lifted above
 * the finger so it stays visible, and positioned entirely on the UI thread.
 */
export const DragLayer = memo(function DragLayer({ piece, pitch, drag, invalid }: Props) {
  const shape = piece ? getShape(piece.shapeId) : null;
  const w = shape ? shape.cols * pitch : 0;
  const h = shape ? shape.rows * pitch : 0;
  const { fingerX, fingerY, scale, lift } = drag;

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: fingerX.value - w / 2 },
      { translateY: fingerY.value - h - lift.value },
      { scale: scale.value },
    ],
  }));

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {piece && (
        <Animated.View style={[styles.piece, { width: w, height: h, opacity: invalid ? 0.45 : 1 }, style]}>
          <BlockShape shapeId={piece.shapeId} level={piece.level} pitch={pitch} glow={!invalid} />
        </Animated.View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  piece: { position: 'absolute', left: 0, top: 0 },
});
