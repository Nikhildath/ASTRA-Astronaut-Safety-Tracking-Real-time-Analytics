import type { ButtonHTMLAttributes } from 'react'
import { NavLink } from 'react-router'

import { cx } from '../lib/cx'
import type { ForceState } from './Button'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  index?: number | string
  label: string
  selected?: boolean
  force?: ForceState
}

/** A numbered row in a terminal menu. The selected row is a lit bar. */
export const menuItemClass = (selected?: boolean) =>
  cx(
    'focus-ring flex min-h-10 w-full items-center gap-3 px-2 text-left text-lead uppercase leading-none',
    'transition-[background-color,color] duration-[120ms]',
    selected
      ? 'bg-ph text-ph-ink [text-shadow:none] shadow-glow-sm'
      : 'text-ph hover:bg-ph/15 data-[force=hover]:bg-ph/15 active:bg-ph/25 data-[force=pressed]:bg-ph/25',
    'disabled:cursor-not-allowed disabled:opacity-50',
  )

/** The same row as a route link; lit while its route is active. */
export function MenuLink({ to, index, label, end, className }: { to: string; index?: number | string; label: string; end?: boolean; className?: string }) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => cx(menuItemClass(isActive), className)}>
      {index !== undefined && <span className="w-[1.5ch] shrink-0 text-right">{index}</span>}
      <span>{label}</span>
    </NavLink>
  )
}

export function MenuItem({ index, label, selected, force, className, ...rest }: Props) {
  return (
    <button
      type="button"
      data-force={force}
      aria-pressed={selected}
      className={cx(menuItemClass(selected), className)}
      {...rest}
    >
      {index !== undefined && <span className="w-[1.5ch] shrink-0 text-right">{index}</span>}
      <span>{label}</span>
    </button>
  )
}
