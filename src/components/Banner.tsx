import { cx } from '../lib/cx'

/** The lit block of text at the top of the tube: dark ink on phosphor. */
export function Banner({ title, right, lines, className }: { title?: string; right?: string; lines: string[]; className?: string }) {
  return (
    <div
      className={cx(
        'relative bg-ph px-4 py-2 text-ph-ink shadow-glow [text-shadow:none]',
        'bg-[repeating-linear-gradient(to_bottom,transparent_0_3px,rgb(0_0_0/0.07)_3px_4px)]',
        className,
      )}
    >
      {(title || right) && (
        <div className="flex justify-between gap-4 text-micro tracking-[0.18em] text-ph-ink/80">
          <span>{title}</span>
          <span className="hidden sm:inline">{right}</span>
        </div>
      )}
      {lines.map((l) => (
        <p key={l} className="m-0 text-body leading-[1.05] sm:text-lead sm:leading-[1.02]">
          {l}
        </p>
      ))}
    </div>
  )
}
