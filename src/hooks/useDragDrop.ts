import { useCallback, useMemo, useRef, useState, type RefObject } from 'react';
import type { View } from 'react-native';
import { useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { TRAY_SIZE } from '../game/constants';
import { useLatest } from './useLatest';

/** Sentinel for "the dragged piece is not over the board". */
export const NO_TARGET = -1;

/** Packs a (possibly negative) grid position into one number for worklets. */
export function encodeTarget(row: number, col: number): number {
  'worklet';
  return (row + 50) * 1000 + (col + 50);
}

export function decodeTarget(t: number): { row: number; col: number } {
  return { row: Math.floor(t / 1000) - 50, col: (t % 1000) - 50 };
}

/** Values shared between the tray gestures (UI thread) and React (JS thread). */
export interface DragShared {
  /** Tray slot currently being dragged (or returning), -1 when idle. */
  activeSlot: SharedValue<number>;
  /** 1 when new drags may start. */
  enabled: SharedValue<number>;
  /** Finger position in overlay (screen root) coordinates. */
  fingerX: SharedValue<number>;
  fingerY: SharedValue<number>;
  /** Floating piece scale relative to board size. */
  scale: SharedValue<number>;
  target: SharedValue<number>;
  /** Window positions: [overlayX, overlayY, gridX, gridY]. */
  frames: SharedValue<number[]>;
  /** Window rects of tray slots: [x, y, w, h] × TRAY_SIZE. */
  slots: SharedValue<number[]>;
  pitch: SharedValue<number>;
  lift: SharedValue<number>;
}

export interface DragHandlers {
  onPickup: (slot: number) => void;
  onTarget: (target: number) => void;
  onDrop: (slot: number, target: number) => void;
}

interface Options {
  overlayRef: RefObject<View | null>;
  gridRef: RefObject<View | null>;
  slotRefs: RefObject<(View | null)[]>;
  /** Called on drop with a board target. Return true if the move was applied. */
  tryPlace: (slot: number, row: number, col: number) => boolean;
  onPickup?: (slot: number) => void;
  onTargetChange?: (slot: number, target: number) => void;
  /** Piece released somewhere it can't go (target is NO_TARGET if off-board). */
  onRejected?: (slot: number, target: number) => void;
  /** Tray-piece scale relative to board size, per slot. */
  trayScale: (slot: number) => number;
  /** Floating piece height in px at board size, per slot. */
  pieceHeight: (slot: number) => number;
}

export function useDragDrop(opts: Options) {
  const activeSlot = useSharedValue(-1);
  const enabled = useSharedValue(1);
  const fingerX = useSharedValue(0);
  const fingerY = useSharedValue(0);
  const scale = useSharedValue(1);
  const target = useSharedValue(NO_TARGET);
  const frames = useSharedValue([0, 0, 0, 0]);
  const slots = useSharedValue(Array<number>(TRAY_SIZE * 4).fill(0));
  const pitch = useSharedValue(30);
  const lift = useSharedValue(40);

  const [dragSlot, setDragSlot] = useState<number | null>(null);
  const optsRef = useLatest(opts);

  // JS-side copies are the source of truth: shared-value writes from JS are
  // applied asynchronously, so read-modify-write on them would drop updates
  // when several measure callbacks land together.
  const framesJs = useRef([0, 0, 0, 0]);
  const slotsJs = useRef(Array<number>(TRAY_SIZE * 4).fill(0));

  /** Re-reads every window position; all values share one coordinate space. */
  const measure = useCallback(() => {
    const { overlayRef, gridRef, slotRefs } = optsRef.current;
    overlayRef.current?.measureInWindow((x, y) => {
      framesJs.current.splice(0, 2, x, y);
      frames.set(framesJs.current.slice());
    });
    gridRef.current?.measureInWindow((x, y) => {
      framesJs.current.splice(2, 2, x, y);
      frames.set(framesJs.current.slice());
    });
    slotRefs.current?.forEach((ref, i) =>
      ref?.measureInWindow((x, y, w, h) => {
        slotsJs.current.splice(i * 4, 4, x, y, w, h);
        slots.set(slotsJs.current.slice());
      }),
    );
  }, [frames, slots, optsRef]);

  const finish = useCallback(() => {
    activeSlot.set(-1);
    target.set(NO_TARGET);
    setDragSlot(null);
  }, [activeSlot, target]);

  /** Animates the floating piece back to the centre of its tray slot. */
  const returnToTray = useCallback(
    (slot: number) => {
      const s = slotsJs.current;
      const f = framesJs.current;
      const cx = s[slot * 4] + s[slot * 4 + 2] / 2 - f[0];
      const cy = s[slot * 4 + 1] + s[slot * 4 + 3] / 2 - f[1];
      const h = optsRef.current.pieceHeight(slot);
      const cfg = { duration: 220 };
      fingerX.set(withTiming(cx, cfg));
      fingerY.set(withTiming(cy + h / 2 + lift.get(), cfg));
      // Finish even if interrupted, so the drag state can never get stuck.
      scale.set(
        withTiming(optsRef.current.trayScale(slot), cfg, () => {
          'worklet';
          scheduleOnRN(finish);
        }),
      );
    },
    [fingerX, fingerY, scale, lift, finish, optsRef],
  );

  const handlers: DragHandlers = useMemo(
    () => ({
      onPickup: (slot) => {
        setDragSlot(slot);
        measure();
        optsRef.current.onPickup?.(slot);
      },
      onTarget: (t) => {
        const slot = activeSlot.get();
        if (slot >= 0) optsRef.current.onTargetChange?.(slot, t);
      },
      onDrop: (slot, t) => {
        optsRef.current.onTargetChange?.(slot, NO_TARGET);
        if (t !== NO_TARGET) {
          const { row, col } = decodeTarget(t);
          if (optsRef.current.tryPlace(slot, row, col)) {
            finish();
            return;
          }
        }
        optsRef.current.onRejected?.(slot, t);
        returnToTray(slot);
      },
    }),
    [measure, finish, returnToTray, activeSlot, optsRef],
  );

  const shared: DragShared = useMemo(
    () => ({ activeSlot, enabled, fingerX, fingerY, scale, target, frames, slots, pitch, lift }),
    [activeSlot, enabled, fingerX, fingerY, scale, target, frames, slots, pitch, lift],
  );

  return { shared, handlers, dragSlot, measure };
}
