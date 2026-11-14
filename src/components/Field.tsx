import { useId, type InputHTMLAttributes } from 'react'

import { cx } from '../lib/cx'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  help?: string
  error?: string
  force?: 'hover' | 'focus'
}

/** A labelled terminal input: "LABEL >" then a dotted baseline. */
export function Field({ label, help, error, force, className, id, ...rest }: Props) {
  const auto = useId()
  const fid = id ?? auto
  const desc = error ? `${fid}-err` : help ? `${fid}-help` : undefined
  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      <label htmlFor={fid} className="text-body">
        {label} &gt;
      </label>
      <input
        id={fid}
        data-force={force}
        aria-invalid={error ? true : undefined}
        aria-describedby={desc}
        className={cx(
          'focus-ring min-h-11 w-full bg-transparent px-2 text-lead text-ph caret-[var(--ph)] placeholder:text-ph-dim',
          'border-b-[3px] border-dotted',
          error ? 'border-ph bg-ph/10' : 'border-ph-faint hover:border-ph-dim data-[force=hover]:border-ph-dim',
          'disabled:cursor-not-allowed disabled:opacity-50',
        )}
        {...rest}
      />
      {error ? (
        <p id={`${fid}-err`} className="m-0 text-body">
          ! {error}
        </p>
      ) : help ? (
        <p id={`${fid}-help`} className="m-0 text-body text-ph-dim">
          {help}
        </p>
      ) : null}
    </div>
  )
}
