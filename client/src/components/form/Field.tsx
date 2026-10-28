import { cloneElement, useId, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: ReactElement;
}

/** Label + control + error message, wired with ids and aria attributes. */
export function Field({ label, error, hint, required, className, children }: FieldProps) {
  const { t } = useTranslation();
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-semibold text-navy">
        {label}
        {required ? (
          <span className="text-primary" aria-hidden>
            {' '}
            *
          </span>
        ) : (
          <span className="font-normal text-muted"> ({t('common.optional')})</span>
        )}
      </label>
      {cloneElement(children, {
        id,
        required,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy,
      })}
      {hint && (
        <p id={hintId} className="text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm font-semibold text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

/** Hidden honeypot field to trap form bots. */
export function Honeypot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label>
        Website
        <input tabIndex={-1} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} />
      </label>
    </div>
  );
}
