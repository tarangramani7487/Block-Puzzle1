import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { BOARD_SIZE } from '../game/constants';
import { getShape } from '../game/shapes';
import { colors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { themeLevel } from '../theme/themes';
import type { BoardGeometry } from './GameBoard';

export interface PreviewState {
  shapeId: string;
  level: number;
  row: number;
  col: number;
  valid: boolean;
  /** Rows / columns that would be cleared by this placement. */
  rows: number[];
  cols: number[];
}

interface Props {
  preview: PreviewState;
  geo: BoardGeometry;
}

/**
 * Valid: hollow outlines in the piece colour, plus a glowing white frame
 * around every line the move would complete. Invalid: red outlines.
 */
export const PlacementPreview = memo(function PlacementPreview({ preview, geo }: Props) {
  const shape = getShape(preview.shapeId);
  const palette = themeLevel(useTheme(), preview.level);
  const span = geo.pitch * BOARD_SIZE;
  const outline = preview.valid ? palette.light : colors.invalid;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {preview.valid &&
        preview.rows.map((r) => (
          <Animated.View
            key={`r${r}`}
            entering={FadeIn.duration(120)}
            style={[styles.line, { top: r * geo.pitch, left: 0, width: span, height: geo.pitch }]}
          />
        ))}
      {preview.valid &&
        preview.cols.map((c) => (
          <Animated.View
            key={`c${c}`}
            entering={FadeIn.duration(120)}
            style={[styles.line, { left: c * geo.pitch, top: 0, height: span, width: geo.pitch }]}
          />
        ))}
      {shape.cells.map(([dr, dc]) => {
        const r = preview.row + dr;
        const c = preview.col + dc;
        if (r < 0 || c < 0 || r >= BOARD_SIZE || c >= BOARD_SIZE) return null;
        const inset = geo.inset + geo.cell * 0.08;
        const size = geo.cell * 0.84;
        return (
          <View
            key={`${dr}-${dc}`}
            style={[
              styles.cell,
              {
                left: c * geo.pitch + inset,
                top: r * geo.pitch + inset,
                width: size,
                height: size,
                borderColor: outline,
                backgroundColor: preview.valid ? palette.glow : 'rgba(255,77,109,0.25)',
              },
            ]}
          />
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  line: {
    position: 'absolute',
    borderRadius: 3,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
    backgroundColor: 'rgba(255,255,255,0.12)',
    boxShadow: '0 0 12px 3px rgba(255,255,255,0.45)',
  },
  cell: { position: 'absolute', borderWidth: 2.5, borderRadius: 3 },
});
