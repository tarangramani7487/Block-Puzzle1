import type { Coord, ShapeDef } from './types';

/**
 * Builds a shape from an ASCII pattern, where `#` marks a filled cell.
 * Rows are separated by `/`, e.g. '##/#.' is a small L.
 */
function shape(id: string, pattern: string, weight: number): ShapeDef {
  const rows = pattern.split('/');
  const cells: Coord[] = [];
  rows.forEach((line, r) => {
    [...line].forEach((ch, c) => {
      if (ch === '#') cells.push([r, c]);
    });
  });
  return {
    id,
    cells,
    rows: rows.length,
    cols: Math.max(...rows.map((line) => line.length)),
    weight,
  };
}

export const SHAPES: readonly ShapeDef[] = [
  // Singles and dominoes
  shape('dot', '#', 3),
  shape('i2h', '##', 4),
  shape('i2v', '#/#', 4),
  // Straight lines
  shape('i3h', '###', 5),
  shape('i3v', '#/#/#', 5),
  shape('i4h', '####', 3),
  shape('i4v', '#/#/#/#', 3),
  shape('i5h', '#####', 2),
  shape('i5v', '#/#/#/#/#', 2),
  // Squares
  shape('o2', '##/##', 6),
  shape('o3', '###/###/###', 2),
  // Small corners
  shape('v3a', '##/#.', 3),
  shape('v3b', '##/.#', 3),
  shape('v3c', '#./##', 3),
  shape('v3d', '.#/##', 3),
  // L-shapes
  shape('l1', '#./#./##', 2),
  shape('l2', '###/#..', 2),
  shape('l3', '##/.#/.#', 2),
  shape('l4', '..#/###', 2),
  shape('j1', '.#/.#/##', 2),
  shape('j2', '#../###', 2),
  shape('j3', '##/#./#.', 2),
  shape('j4', '###/..#', 2),
  // T-shapes
  shape('t1', '###/.#.', 3),
  shape('t2', '.#./###', 3),
  shape('t3', '#./##/#.', 3),
  shape('t4', '.#/##/.#', 3),
  // Zigzags
  shape('s1', '.##/##.', 2),
  shape('s2', '#./##/.#', 2),
  shape('z1', '##./.##', 2),
  shape('z2', '.#/##/#.', 2),
  // Large corners
  shape('v5a', '###/#../#..', 1),
  shape('v5b', '###/..#/..#', 1),
  shape('v5c', '#../#../###', 1),
  shape('v5d', '..#/..#/###', 1),
];

const SHAPE_MAP: ReadonlyMap<string, ShapeDef> = new Map(SHAPES.map((s) => [s.id, s]));

export function getShape(id: string): ShapeDef {
  const s = SHAPE_MAP.get(id);
  if (!s) throw new Error(`Unknown shape: ${id}`);
  return s;
}

export function isKnownShape(id: string): boolean {
  return SHAPE_MAP.has(id);
}

/** Shapes with this many cells or more count as "large" for tray balancing. */
export const LARGE_SHAPE_CELLS = 5;
