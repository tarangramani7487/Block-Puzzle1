import { memo } from 'react';
import { View } from 'react-native';

import { getShape } from '../game/shapes';
import { CELL_GAP_RATIO } from '../theme/spacing';
import { GameBlock } from './GameBlock';

interface Props {
  shapeId: string;
  level: number;
  /** Distance between neighbouring cell origins, in px. */
  pitch: number;
  glow?: boolean;
}

/** Renders a piece using the same block style and spacing as the board. */
export const BlockShape = memo(function BlockShape({ shapeId, level, pitch, glow }: Props) {
  const shape = getShape(shapeId);
  const cell = pitch * (1 - CELL_GAP_RATIO);
  const inset = (pitch - cell) / 2;
  return (
    <View style={{ width: shape.cols * pitch, height: shape.rows * pitch }}>
      {shape.cells.map(([r, c]) => (
        <View key={`${r}-${c}`} style={{ position: 'absolute', left: c * pitch + inset, top: r * pitch + inset }}>
          <GameBlock size={cell} level={level} glow={glow} />
        </View>
      ))}
    </View>
  );
});

export function shapeSize(shapeId: string, pitch: number) {
  const shape = getShape(shapeId);
  return { width: shape.cols * pitch, height: shape.rows * pitch };
}
