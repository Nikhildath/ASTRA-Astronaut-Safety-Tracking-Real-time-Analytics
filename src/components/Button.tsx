import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { cx } from '../lib/cx'
import { Spinner } from './Spinner'

export type ButtonVariant = 'fill' | 'line' | 'ghost'
export type ForceState = 'hover' | 'focus' | 'pressed'

export const buttonClass = (variant: ButtonVariant = 'line', size: 'sm' | 'md' = 'md') =>
  cx(
    'focus-ring group relative inline-flex items-center justify-center gap-2 uppercase leading-none select-none',
    'transition-[background-color,color,box-shadow,transform] duration-[120ms] ease-[var(--ease-crt)]',
    'disabled:cursor-not-allowed disabled:opacity-50',
    size === 'md' ? 'min-h-10 px-3 text-lead' : 'min-h-10 px-2.5 text-body',
    variant === 'fill' &&
      'bg-ph text-ph-ink [text-shadow:none] shadow-glow-sm enabled:hover:shadow-glow data-[force=hover]:shadow-glow enabled:active:translate-y-px enabled:active:brightness-90 data-[force=pressed]:translate-y-px data-[force=pressed]:brightness-90',
    variant === 'line' &&
      'border-2 border-ph text-ph enabled:hover:bg-ph enabled:hover:text-ph-ink enabled:hover:[text-shadow:none] data-[force=hover]:bg-ph data-[force=hover]:text-ph-ink data-[force=hover]:[text-shadow:none] enabled:active:translate-y-px data-[force=pressed]:translate-y-px data-[force=pressed]:bg-ph-dim data-[force=pressed]:text-ph-ink',
    variant === 'ghost' &&
      'text-ph enabled:hover:bg-ph/15 data-[force=hover]:bg-ph/15 enabled:active:bg-ph/25 data-[force=pressed]:bg-ph/25',
  )

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: 'sm' | 'md'
  loading?: boolean
  force?: ForceState
  trailing?: ReactNode
}

export function Button({ variant = 'line', size = 'md', loading, force, trailing, className, children, disabled, type = 'button', ...rest }: Props) {
  return (
    <button
      type={type}
      data-force={force}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cx(buttonClass(variant, size), className)}
      {...rest}
    >
      {loading && <Spinner />}
      <span>{children}</span>
      {trailing}
    </button>
  )
}
