/**
 * Small deterministic PRNG (mulberry32). The state is a plain 32-bit integer
 * so it can be persisted with the game and restored exactly.
 */
export function nextRandom(state: number): [value: number, nextState: number] {
  const next = (state + 0x6d2b79f5) | 0;
  let t = next;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return [value, next];
}

/** Mutable wrapper used inside a single pure computation. */
export class Rng {
  constructor(public state: number) {}

  next(): number {
    const [value, nextState] = nextRandom(this.state);
    this.state = nextState;
    return value;
  }

  /** Picks an item using relative weights. */
  weighted<T>(items: readonly T[], weightOf: (item: T) => number): T {
    const total = items.reduce((sum, item) => sum + weightOf(item), 0);
    let roll = this.next() * total;
    for (const item of items) {
      roll -= weightOf(item);
      if (roll < 0) return item;
    }
    return items[items.length - 1];
  }
}

export function randomSeed(): number {
  return (Math.random() * 0xffffffff) | 0;
}
