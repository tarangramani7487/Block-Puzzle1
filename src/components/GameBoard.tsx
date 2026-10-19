import { memo, type ReactNode, type Ref } from 'react';
import { StyleSheet, View } from 'react-native';

import { BOARD_SIZE } from '../game/constants';
import type { Board } from '../game/types';
import { useTheme } from '../theme/ThemeContext';
import { CELL_GAP_RATIO } from '../theme/spacing';
import { BoardCell } from './BoardCell';

export interface BoardGeometry {
  /** Outer frame size. */
  size: number;
  /** Frame padding around the grid. */
  pad: number;
  /** Distance between neighbouring cell origins. */
  pitch: number;
  /** Visible block size. */
  cell: number;
  /** Offset of a block inside its pitch square. */
  inset: number;
}

export function boardGeometry(size: number): BoardGeometry {
  const pad = 2; // the frame border; cells start right inside it
  const pitch = (size - pad * 2) / BOARD_SIZE;
  const cell = pitch * (1 - CELL_GAP_RATIO);
  return { size, pad, pitch, cell, inset: (pitch - cell) / 2 };
}

/** Neon grid lines between cells (the outer edge is drawn by the frame). */
const GridLines = memo(function GridLines({ geo }: { geo: BoardGeometry }) {
  const span = geo.pitch * BOARD_SIZE;
  const { gridLine } = useTheme();
  const lines = [];
  for (let i = 1; i < BOARD_SIZE; i++) {
    const at = Math.round(i * geo.pitch) - 0.5;
    lines.push(<View key={`h${i}`} style={[styles.line, { top: at, left: 0, width: span, height: 1, backgroundColor: gridLine }]} />);
    lines.push(<View key={`v${i}`} style={[styles.line, { left: at, top: 0, height: span, width: 1, backgroundColor: gridLine }]} />);
  }
  return <>{lines}</>;
});

/** Re-renders only when the board or geometry changes, never during drags. */
const BoardCells = memo(function BoardCells({ board, geo, epoch }: { board: Board; geo: BoardGeometry; epoch: number }) {
  return (
    <>
      {board.map((row, r) =>
        row.map((level, c) => (
          <BoardCell
            key={r * BOARD_SIZE + c}
            level={level}
            size={geo.cell}
            left={c * geo.pitch + geo.inset}
            top={r * geo.pitch + geo.inset}
            epoch={epoch}
          />
        )),
      )}
    </>
  );
});

interface Props {
  board: Board;
  geo: BoardGeometry;
  epoch: number;
  /** Ref to the grid's origin view (cell 0,0 top-left), used for drag maths. */
  gridRef?: Ref<View>;
  onGridLayout?: () => void;
  /** Overlays drawn in grid coordinates (previews, effects). */
  children?: ReactNode;
}

export const GameBoard = memo(function GameBoard({ board, geo, epoch, gridRef, onGridLayout, children }: Props) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.frame,
        {
          width: geo.size,
          height: geo.size,
          backgroundColor: theme.board,
          borderColor: theme.boardBorder,
          boxShadow: `0 0 18px 2px ${theme.gridLine}`,
        },
      ]}
    >
      <View
        ref={gridRef}
        onLayout={onGridLayout}
        collapsable={false}
        style={{
          position: 'absolute',
          left: 0, // absolute children start inside the frame border (geo.pad)
          top: 0,
          width: geo.pitch * BOARD_SIZE,
          height: geo.pitch * BOARD_SIZE,
        }}
      >
        <GridLines geo={geo} />
        <BoardCells board={board} geo={geo} epoch={epoch} />
        {children}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  frame: { borderRadius: 4, borderWidth: 2 },
  line: { position: 'absolute' },
});
