import { forwardRef, useId, useState, type KeyboardEvent } from 'react'

import { prompt } from '../content'
import { cx } from '../lib/cx'
import { Button, type ForceState } from './Button'

type Props = {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void
  busy?: boolean
  disabled?: boolean
  error?: string
  force?: ForceState
  className?: string
}

/** "YOU >" command line with a dotted baseline and a SEND key. */
export const PromptInput = forwardRef<HTMLInputElement, Props>(function PromptInput(
  { value, onChange, onSubmit, onKeyDown, busy, disabled, error, force, className },
  ref,
) {
  const id = useId()
  const [focused, setFocused] = useState(false)
  return (
    <form
      role="search"
      aria-label="Phosphor prompt"
      className={cx('flex flex-col gap-1', className)}
      onSubmit={(e) => {
        e.preventDefault()
        if (!busy && !disabled) onSubmit()
      }}
    >
      <div className="flex items-center gap-3">
        <label htmlFor={id} className="shrink-0 text-lead">
          {prompt.label} <span aria-hidden="true">{'›'}</span>
        </label>
        <div
          className={cx(
            'relative flex min-h-11 min-w-0 flex-1 items-center border-b-[3px] border-dotted',
            error ? 'border-ph' : focused || force === 'focus' ? 'border-ph-dim' : 'border-ph-faint',
          )}
        >
          {!value && !focused && force !== 'focus' && <span className="cursor-block pointer-events-none absolute left-1" aria-hidden="true" />}
          <input
            ref={ref}
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            disabled={disabled}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="send"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-err` : undefined}
            placeholder={prompt.placeholder}
            data-force={force}
            className={cx(
              'h-11 w-full min-w-0 bg-transparent pl-[1.1em] text-lead text-ph caret-[var(--ph)] placeholder:text-ph-dim',
              'focus:pl-1 data-[force=focus]:pl-1 disabled:cursor-not-allowed disabled:opacity-50',
            )}
          />
        </div>
        <Button type="submit" variant="fill" size="sm" loading={busy} disabled={disabled} force={force === 'focus' ? undefined : force} className="shrink-0 px-4">
          {prompt.send} <span aria-hidden="true">{'↵'}</span>
        </Button>
      </div>
      {error && (
        <p id={`${id}-err`} role="alert" className="m-0 pl-[4.2em] text-body">
          ! {error}
        </p>
      )}
    </form>
  )
})
