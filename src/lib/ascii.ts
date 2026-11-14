// Tiny raster for the ASCII illustrations: each art is a stack of shapes on a
// character grid. A shape fills its inside with one character and its edge
// (cells with an outside neighbour) with another. Cells are about twice as tall
// as they are wide, so circles squash x by half.

export const ART_COLS = 46
export const ART_ROWS = 19

type Pred = (x: number, y: number) => boolean
type Layer = { inside: Pred; fill: string; edge?: string }

export const circle =
  (cx: number, cy: number, r: number): Pred =>
  (x, y) =>
    ((x - cx) * 0.5) ** 2 + (y - cy) ** 2 <= r * r

export const ring =
  (cx: number, cy: number, r: number, inner: number): Pred =>
  (x, y) => {
    const d = ((x - cx) * 0.5) ** 2 + (y - cy) ** 2
    return d <= r * r && d >= inner * inner
  }

export const rect =
  (x0: number, y0: number, x1: number, y1: number): Pred =>
  (x, y) =>
    x >= x0 && x <= x1 && y >= y0 && y <= y1

export const union =
  (...preds: Pred[]): Pred =>
  (x, y) =>
    preds.some((p) => p(x, y))

export const rows =
  (x0: number, x1: number, ys: number[]): Pred =>
  (x, y) =>
    x >= x0 && x <= x1 && ys.includes(y)

export function raster(layers: Layer[]): string[] {
  const grid: string[][] = Array.from({ length: ART_ROWS }, () => Array(ART_COLS).fill(' '))
  for (const layer of layers) {
    for (let y = 0; y < ART_ROWS; y++) {
      for (let x = 0; x < ART_COLS; x++) {
        if (!layer.inside(x, y)) continue
        const isEdge =
          !layer.inside(x - 1, y) || !layer.inside(x + 1, y) || !layer.inside(x, y - 1) || !layer.inside(x, y + 1)
        grid[y][x] = isEdge && layer.edge !== undefined ? layer.edge : layer.fill
      }
    }
  }
  return grid.map((r) => r.join(''))
}

// Straight run of cells from a to b, used for the travelling signal packet.
export function line(a: [number, number], b: [number, number]): [number, number][] {
  const steps = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]))
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = steps === 0 ? 0 : i / steps
    return [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t)] as [number, number]
  })
}

export type Art = { rows: string[]; path: [number, number][] }

const cloud = union(circle(23, 4, 3.2), circle(16, 6.5, 2.8), circle(30, 6.5, 2.8), rect(14, 6, 32, 9))

export const ARTS: Record<string, Art> = {
  cloud: {
    rows: raster([
      { inside: cloud, fill: '+', edge: '#' },
      { inside: rows(17, 29, [8]), fill: '=' },
      { inside: rect(3, 10, 10, 18), fill: '+', edge: '#' },
      { inside: rect(5, 12, 8, 15), fill: ' ' },
      { inside: rect(6, 17, 7, 17), fill: 'o' },
      { inside: rect(25, 12, 38, 16), fill: ' ', edge: '#' },
      { inside: rows(27, 33, [13, 15]), fill: '-' },
      { inside: rect(22, 17, 41, 18), fill: '#', edge: '=' },
    ]),
    path: [...line([7, 9], [16, 10]), ...line([17, 10], [30, 10]), ...line([31, 10], [33, 11])],
  },
  together: {
    rows: raster([
      { inside: rect(1, 1, 24, 12), fill: ' ', edge: '#' },
      { inside: rect(1, 1, 24, 2), fill: '=' },
      { inside: rows(4, 16, [5]), fill: '+' },
      { inside: rows(6, 20, [7]), fill: '+' },
      { inside: rows(4, 12, [9]), fill: '+' },
      { inside: rect(19, 6, 43, 17), fill: ' ', edge: '#' },
      { inside: rect(19, 6, 43, 7), fill: '=' },
      { inside: rows(22, 36, [10]), fill: '%' },
      { inside: rows(25, 40, [12]), fill: '%' },
      { inside: rows(22, 30, [14]), fill: '%' },
      { inside: rect(31, 14, 31, 14), fill: '_' },
    ]),
    path: [...line([13, 9], [13, 11]), ...line([14, 11], [24, 14]), ...line([25, 14], [30, 14])],
  },
  apps: {
    rows: raster([
      { inside: rect(3, 0, 42, 18), fill: ' ', edge: '#' },
      { inside: rect(3, 0, 42, 2), fill: '=', edge: '#' },
      { inside: union(rect(5, 1, 5, 1), rect(7, 1, 7, 1), rect(9, 1, 9, 1)), fill: 'o' },
      { inside: rect(13, 1, 38, 1), fill: ':' },
      { inside: rect(6, 4, 26, 9), fill: '+', edge: '#' },
      { inside: rect(29, 4, 39, 15), fill: '%', edge: '#' },
      { inside: rows(6, 24, [11, 13]), fill: '-' },
      { inside: rows(6, 18, [15]), fill: '-' },
    ]),
    path: line([6, 17], [39, 17]),
  },
  key: {
    rows: raster([
      { inside: ring(11, 9, 6.2, 3.4), fill: '+', edge: '#' },
      { inside: rect(21, 8, 42, 10), fill: '+', edge: '#' },
      { inside: rect(31, 11, 33, 14), fill: '+', edge: '#' },
      { inside: rect(37, 11, 39, 15), fill: '+', edge: '#' },
      { inside: rows(9, 13, [9]), fill: '$' },
    ]),
    path: line([21, 9], [42, 9]),
  },
  display: {
    rows: raster([
      { inside: rect(4, 0, 34, 14), fill: '+', edge: '#' },
      { inside: rect(7, 2, 31, 12), fill: ' ', edge: '%' },
      { inside: rows(9, 29, [4, 6, 8, 10]), fill: '-' },
      { inside: ring(39, 4, 2.2, 0), fill: 'o', edge: '#' },
      { inside: ring(39, 10, 2.2, 0), fill: 'o', edge: '#' },
      { inside: rect(15, 15, 23, 16), fill: '+', edge: '#' },
      { inside: rect(9, 17, 29, 18), fill: '#', edge: '=' },
    ]),
    path: line([9, 3], [29, 11]),
  },
}
