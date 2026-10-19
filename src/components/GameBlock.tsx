import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../theme/ThemeContext';
import { themeLevel } from '../theme/themes';

interface Props {
  size: number;
  level: number;
  /** Kept for callers that render tiny or ghost blocks; jewels have no detail to hide. */
  plain?: boolean;
  /** White outline + halo, used for the piece being dragged and lines about to clear. */
  glow?: boolean;
}

/**
 * A faceted "jewel" block: four bevelled edges (light top/left, dark
 * right/bottom) drawn with per-side border colours around a flat face,
 * plus a soft highlight on the face.
 */
export const GameBlock = memo(function GameBlock({ size, level, glow }: Props) {
  const p = themeLevel(useTheme(), level);
  const bevel = Math.max(2, Math.round(size * 0.17));
  const radius = Math.max(2, size * 0.08);

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: p.base,
          borderWidth: bevel,
          borderTopColor: p.light,
          borderLeftColor: p.light,
          borderRightColor: p.dark,
          borderBottomColor: p.dark,
        },
        glow && styles.glow,
      ]}
    >
      <View style={[styles.face, { borderRadius: radius * 0.5 }]} />
    </View>
  );
});

const styles = StyleSheet.create({
  face: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.35)',
    borderLeftColor: 'rgba(255,255,255,0.2)',
    borderRightColor: 'rgba(0,0,0,0.12)',
    borderBottomColor: 'rgba(0,0,0,0.18)',
  },
  glow: {
    outlineColor: 'rgba(255,255,255,0.95)',
    outlineWidth: 2,
    outlineStyle: 'solid',
    boxShadow: '0 0 10px 2px rgba(255,255,255,0.55)',
  },
});
