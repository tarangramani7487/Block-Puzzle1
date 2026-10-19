import { memo } from 'react';
import { View } from 'react-native';

import type { Board } from '../game/types';
import { useTheme } from '../theme/ThemeContext';
import { GameBlock } from './GameBlock';

/** Small static board preview. */
export const MiniBoard = memo(function MiniBoard({ board, size }: { board: Board; size: number }) {
  const theme = useTheme();
  const n = board.length;
  const pitch = (size - 4) / n;
  return (
    <View style={{ width: size, height: size, borderRadius: 4, borderWidth: 2, borderColor: theme.boardBorder, backgroundColor: theme.board }}>
      {board.flatMap((row, r) =>
        row.map((level, c) =>
          level === 0 ? null : (
            <View key={r * n + c} style={{ position: 'absolute', left: c * pitch + 0.5, top: r * pitch + 0.5 }}>
              <GameBlock size={pitch - 1} level={level} />
            </View>
          ),
        ),
      )}
    </View>
  );
});
