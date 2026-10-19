import { useEffect, useRef, useState } from 'react';

/** Tweens a displayed integer toward `value` (ease-out), for score counters. */
export function useAnimatedNumber(value: number, duration = 450): number {
  const [display, setDisplay] = useState(value);
  const from = useRef(value);
  const shown = useRef(value);

  useEffect(() => {
    from.current = shown.current;
    // Snap downwards (restart / undo) instead of counting backwards.
    if (value < from.current) {
      shown.current = value;
      setDisplay(value);
      return;
    }
    const start = Date.now();
    let frame = 0;
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      const next = Math.round(from.current + (value - from.current) * eased);
      shown.current = next;
      setDisplay(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return display;
}
