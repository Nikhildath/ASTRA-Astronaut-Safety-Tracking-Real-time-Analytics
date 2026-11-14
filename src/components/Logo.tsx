import { cx } from '../lib/cx'

// A chunky pixel asterisk drawn on a 10x10 grid: the tube's mark.
const PATTERN = [
  '....##....',
  '.#..##..#.',
  '.##.##.##.',
  '..######..',
  '##########',
  '##########',
  '..######..',
  '.##.##.##.',
  '.#..##..#.',
  '....##....',
]

export function Logo({ className, title = 'Phosphor' }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 10 10"
      shapeRendering="crispEdges"
      role="img"
      aria-label={title}
      className={cx('fill-current text-ph [filter:drop-shadow(0_0_4px_var(--ph-glow))]', className)}
    >
      {PATTERN.flatMap((row, y) =>
        [...row].map((c, x) => (c === '#' ? <rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} /> : null)),
      )}
    </svg>
  )
}
