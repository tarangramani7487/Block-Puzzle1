import { memo, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { BOARD_SIZE } from '../game/constants';
import type { MoveResult } from '../game/types';
import { colors, levelColor } from '../theme/colors';
import { typography } from '../theme/typography';
import type { BoardGeometry } from './GameBoard';
import { GameBlock } from './GameBlock';

const EFFECT_LIFETIME_MS = 1400;
const MAX_PARTICLE_CELLS = 10;

/** Deterministic pseudo-random in [0,1) so effects never depend on Math.random. */
const hash = (n: number) => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

// ---------- cleared block ----------

const ClearedBlock = memo(function ClearedBlock({
  left,
  top,
  size,
  level,
  delay,
}: {
  left: number;
  top: number;
  size: number;
  level: number;
  delay: number;
}) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(delay, withTiming(1, { duration: 380, easing: Easing.out(Easing.quad) }));
  }, [t, delay]);
  const style = useAnimatedStyle(() => ({
    opacity: 1 - t.value,
    transform: [{ scale: t.value < 0.25 ? 1 + t.value * 0.8 : 1.2 - (t.value - 0.25) * 1.6 }],
  }));
  const flash = useAnimatedStyle(() => ({ opacity: t.value < 0.3 ? t.value / 0.3 : 1 - (t.value - 0.3) / 0.7 }));
  return (
    <Animated.View style={[styles.abs, { left, top }, style]}>
      <GameBlock size={size} level={level} plain />
      <Animated.View style={[styles.flash, { borderRadius: size * 0.08 }, flash]} />
    </Animated.View>
  );
});

const LineFlash = memo(function LineFlash({ vertical, index, geo }: { vertical: boolean; index: number; geo: BoardGeometry }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) });
  }, [t]);
  const span = geo.pitch * BOARD_SIZE;
  const style = useAnimatedStyle(() => ({
    opacity: 0.85 * (1 - t.value),
    transform: vertical ? [{ scaleX: 0.4 + t.value * 1.2 }] : [{ scaleY: 0.4 + t.value * 1.2 }],
  }));
  const pos = vertical
    ? { left: index * geo.pitch, top: 0, width: geo.pitch, height: span }
    : { top: index * geo.pitch, left: 0, height: geo.pitch, width: span };
  return <Animated.View style={[styles.abs, styles.lineFlash, pos, style]} />;
});

// ---------- particles ----------

const Particle = memo(function Particle({
  progress,
  x,
  y,
  dx,
  dy,
  size,
  color,
}: {
  progress: SharedValue<number>;
  x: number;
  y: number;
  dx: number;
  dy: number;
  size: number;
  color: string;
}) {
  const style = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [
      { translateX: dx * progress.value },
      { translateY: dy * progress.value + 18 * progress.value * progress.value },
      { scale: 1 - progress.value * 0.6 },
      { rotate: `${progress.value * 180}deg` },
    ],
  }));
  return (
    <Animated.View
      style={[styles.abs, { left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: size * 0.3, backgroundColor: color }, style]}
    />
  );
});

const ParticleBurst = memo(function ParticleBurst({
  cells,
  level,
  big,
  geo,
  seed,
  delay,
}: {
  cells: readonly (readonly [number, number])[];
  level: number;
  big: boolean;
  geo: BoardGeometry;
  seed: number;
  delay: number;
}) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withDelay(delay, withTiming(1, { duration: big ? 800 : 620, easing: Easing.out(Easing.quad) }));
  }, [progress, big, delay]);
  const palette = levelColor(level);
  const perCell = big ? 5 : 3;
  const particles = [];
  const chosen = cells.slice(0, MAX_PARTICLE_CELLS);
  for (let i = 0; i < chosen.length; i++) {
    const [r, c] = chosen[i];
    for (let k = 0; k < perCell; k++) {
      const n = seed * 131 + i * 17 + k;
      const angle = hash(n) * Math.PI * 2;
      const dist = geo.pitch * (big ? 1.2 + hash(n + 1) * 1.6 : 0.6 + hash(n + 1) * 0.9);
      particles.push(
        <Particle
          key={`${i}-${k}`}
          progress={progress}
          x={(c + 0.5) * geo.pitch}
          y={(r + 0.5) * geo.pitch}
          dx={Math.cos(angle) * dist}
          dy={Math.sin(angle) * dist}
          size={geo.pitch * (big ? 0.26 : 0.18) * (0.7 + hash(n + 2) * 0.6)}
          color={k % 2 ? palette.light : '#FFFFFF'}
        />,
      );
    }
  }
  return <>{particles}</>;
});

// ---------- floating text ----------

const FloatingScore = memo(function FloatingScore({ x, y, points, span }: { x: number; y: number; points: number; span: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) });
  }, [t]);
  const style = useAnimatedStyle(() => ({
    opacity: t.value < 0.7 ? 1 : 1 - (t.value - 0.7) / 0.3,
    transform: [{ translateY: -46 * t.value }, { scale: t.value < 0.15 ? 0.6 + t.value * 2.7 : 1 }],
  }));
  return (
    <Animated.View style={[styles.abs, { left: Math.min(Math.max(x - 60, 0), span - 120), top: Math.max(y - 18, 0), width: 120 }, style]}>
      <Text style={styles.floatText}>+{points}</Text>
    </Animated.View>
  );
});

const Toast = memo(function Toast({ title, subtitle, color, geo }: { title: string; subtitle?: string; color: string; geo: BoardGeometry }) {
  const t = useSharedValue(0);
  const fade = useSharedValue(1);
  useEffect(() => {
    t.value = withSpring(1, { damping: 9, stiffness: 180 });
    fade.value = withDelay(850, withTiming(0, { duration: 320 }));
  }, [t, fade]);
  const style = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [{ scale: 0.5 + t.value * 0.5 }, { translateY: (1 - fade.value) * -20 }],
  }));
  const span = geo.pitch * BOARD_SIZE;
  return (
    <Animated.View style={[styles.abs, styles.toastWrap, { width: span, top: span * 0.36 }, style]}>
      <Text style={[styles.toastTitle, { color, textShadowColor: color }]}>{title}</Text>
      {subtitle ? <Text style={styles.toastSub}>{subtitle}</Text> : null}
    </Animated.View>
  );
});

/** Picks a single headline per move so feedback never piles up. */
function headline(result: MoveResult): { title: string; subtitle?: string; color: string } | null {
  const lines = result.clearedRows.length + result.clearedCols.length;
  const chain = result.fusionSteps.reduce((m, s) => Math.max(m, s.chainIndex), 0);
  const burst = result.fusionSteps.some((s) => s.toLevel === null);
  if (result.perfectClear) return { title: 'PERFECT!', subtitle: 'Board cleared', color: colors.gold };
  if (result.combo >= 2 && lines > 0) return { title: `COMBO ×${result.combo}`, subtitle: lines > 1 ? `${lines} lines` : undefined, color: colors.gold };
  if (lines >= 2) return { title: ['', '', 'DOUBLE!', 'TRIPLE!', 'QUAD!'][lines] ?? 'MEGA!', color: '#7CF3FF' };
  if (burst) return { title: 'SUPERNOVA!', subtitle: 'Max fusion burst', color: '#E8B0FF' };
  if (chain >= 2) return { title: `FUSION ×${chain}`, color: levelColor(result.fusionSteps[result.fusionSteps.length - 1].toLevel ?? 6).light };
  return null;
}

// ---------- layer ----------

const MoveEffects = memo(function MoveEffects({ result, geo }: { result: MoveResult; geo: BoardGeometry }) {
  const cx = result.placedCells.reduce((s, [, c]) => s + c, 0) / result.placedCells.length;
  const cy = result.placedCells.reduce((s, [r]) => s + r, 0) / result.placedCells.length;
  const msg = headline(result);
  const lineTotal = result.score.lines + result.score.fusion + result.score.perfectClear;

  return (
    <>
      {result.clearedRows.map((r) => (
        <LineFlash key={`fr${r}`} vertical={false} index={r} geo={geo} />
      ))}
      {result.clearedCols.map((c) => (
        <LineFlash key={`fc${c}`} vertical index={c} geo={geo} />
      ))}
      {result.clearedCells.map(({ row, col, level }) => (
        <ClearedBlock
          key={`c${row}-${col}`}
          left={col * geo.pitch + geo.inset}
          top={row * geo.pitch + geo.inset}
          size={geo.cell}
          level={level}
          delay={Math.min(220, Math.hypot(row - cy, col - cx) * 24)}
        />
      ))}
      {result.fusionSteps.map((step, i) => (
        <ParticleBurst
          key={`f${i}`}
          cells={step.cells}
          level={step.toLevel ?? step.fromLevel}
          big={step.toLevel === null}
          geo={geo}
          seed={result.moveId * 7 + i}
          delay={i * 140}
        />
      ))}
      {lineTotal > 0 && <FloatingScore x={(cx + 0.5) * geo.pitch} y={(cy + 0.5) * geo.pitch} points={result.score.total} span={geo.pitch * BOARD_SIZE} />}
      {msg && <Toast {...msg} geo={geo} />}
    </>
  );
});

/**
 * Purely decorative layer driven by move results. It never touches game
 * state, so animations cannot desync the board or score.
 */
export const EffectsLayer = memo(function EffectsLayer({ result, geo }: { result: MoveResult | null; geo: BoardGeometry }) {
  const [active, setActive] = useState<{ key: number; result: MoveResult }[]>([]);
  const counter = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (!result) {
      setActive([]);
      return;
    }
    const key = ++counter.current;
    setActive((list) => [...list.slice(-2), { key, result }]);
    timers.current.push(
      setTimeout(() => setActive((list) => list.filter((e) => e.key !== key)), EFFECT_LIFETIME_MS),
    );
  }, [result]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {active.map((e) => (
        <MoveEffects key={e.key} result={e.result} geo={geo} />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
  flash: { ...StyleSheet.absoluteFill, backgroundColor: '#FFFFFF' },
  lineFlash: { backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 8 },
  floatText: {
    ...typography.title,
    fontSize: 22,
    color: colors.gold,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 2 },
  },
  toastWrap: { left: 0, alignItems: 'center' },
  toastTitle: {
    ...typography.hero,
    fontSize: 38,
    textShadowRadius: 18,
    textShadowOffset: { width: 0, height: 0 },
  },
  toastSub: { ...typography.label, color: colors.text, marginTop: 2, opacity: 0.9 },
});
