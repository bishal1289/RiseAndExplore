import { useId, useState, type ReactNode, type InputHTMLAttributes } from 'react';
import type { L } from '../lib/types';
import { cn } from '../../lib/utils';
import { Skeleton } from '../../components/ui/Skeleton';

export function PageTitle({ title, intro, actions }: { title: string; intro?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-serif text-3xl md:text-4xl">{title}</h1>
        {intro && <p className="mt-2 max-w-2xl text-muted">{intro}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className, title, description, id }: { children: ReactNode; className?: string; title?: string; description?: string; id?: string }) {
  return (
    <section id={id} className={cn('rounded-card bg-white p-5 shadow-soft ring-1 ring-navy/5 sm:p-6', className)}>
      {title && <h2 className="font-serif text-xl">{title}</h2>}
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      <div className={title || description ? 'mt-5' : undefined}>{children}</div>
    </section>
  );
}

export function EmptyState({ icon, title, text, action }: { icon?: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="grid place-items-center rounded-card border-2 border-dashed border-navy/15 bg-white px-6 py-14 text-center">
      {icon && <div className="mb-4 text-primary">{icon}</div>}
      <h2 className="font-serif text-2xl">{title}</h2>
      {text && <p className="mt-2 max-w-md text-muted">{text}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-20" />
      ))}
    </div>
  );
}

export function Label({ children, htmlFor, hint }: { children: ReactNode; htmlFor?: string; hint?: string }) {
  return (
    <div className="mb-1.5">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-navy">
        {children}
      </label>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function TextInput({ label, hint, className, ...rest }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const id = useId();
  return (
    <div className={className}>
      <Label htmlFor={id} hint={hint}>
        {label}
      </Label>
      <input id={id} className="input" {...rest} />
    </div>
  );
}

/** One field, two languages: EN / ES tabs above a single input or textarea. */
export function BilingualField({
  label,
  value,
  onChange,
  multiline,
  rows = 3,
  hint,
  required,
  placeholder,
  maxLength,
}: {
  label: string;
  value: L;
  onChange: (v: L) => void;
  multiline?: boolean;
  rows?: number;
  hint?: string;
  required?: boolean;
  placeholder?: string;
  maxLength?: number;
}) {
  const [lang, setLang] = useState<'en' | 'es'>('en');
  const id = useId();
  const v = value ?? { en: '', es: '' };
  const props = {
    id,
    className: 'input',
    value: v[lang] ?? '',
    lang,
    maxLength,
    placeholder: lang === 'es' && v.en ? `Spanish for: ${v.en.slice(0, 60)}` : placeholder,
    required: required && lang === 'en',
    onChange: (e: { target: { value: string } }) => onChange({ ...v, [lang]: e.target.value }),
  };
  return (
    <div>
      <div className="mb-1.5 flex items-end justify-between gap-3">
        <div>
          <label htmlFor={id} className="text-sm font-semibold text-navy">
            {label}
            {required && <span className="text-primary"> *</span>}
          </label>
          {hint && <p className="text-xs text-muted">{hint}</p>}
        </div>
        <LangTabs lang={lang} setLang={setLang} value={v} />
      </div>
      {multiline ? <textarea rows={rows} {...props} /> : <input {...props} />}
    </div>
  );
}

export function LangTabs({ lang, setLang, value }: { lang: 'en' | 'es'; setLang: (l: 'en' | 'es') => void; value?: L }) {
  return (
    <div role="tablist" aria-label="Language" className="inline-flex shrink-0 rounded-full bg-card p-0.5 text-xs font-bold">
      {(['en', 'es'] as const).map((l) => (
        <button
          key={l}
          type="button"
          role="tab"
          aria-selected={lang === l}
          onClick={() => setLang(l)}
          className={cn(
            'relative h-7 rounded-full px-3 uppercase transition-colors',
            lang === l ? 'bg-navy text-white' : 'text-navy/70 hover:text-navy',
          )}
        >
          {l === 'en' ? 'English' : 'Español'}
          {l === 'es' && value && value.en && !value.es && (
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-gold" title="Spanish missing" />
          )}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <label htmlFor={id} className="font-semibold text-navy">
          {label}
        </label>
        {description && <p className="text-sm text-muted">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn('relative h-8 w-14 shrink-0 rounded-full transition-colors', checked ? 'bg-primary' : 'bg-navy/20')}
      >
        <span className={cn('absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all', checked ? 'left-7' : 'left-1')} />
      </button>
    </div>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange, label }: { tabs: { value: T; label: string; count?: number }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="scrollbar-none -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      {tabs.map((t) => (
        <button
          key={t.value}
          type="button"
          role="tab"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={cn(
            'h-10 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors',
            value === t.value ? 'bg-navy text-white' : 'bg-white text-navy ring-1 ring-navy/15 hover:ring-navy/40',
          )}
        >
          {t.label}
          {t.count != null && <span className="ml-1.5 opacity-70">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-navy/10 text-navy',
  published: 'bg-emerald-100 text-emerald-800',
  scheduled: 'bg-amber-100 text-amber-800',
  past: 'bg-slate-200 text-slate-700',
  new: 'bg-primary text-white',
  contacted: 'bg-emerald-100 text-emerald-800',
  archived: 'bg-slate-200 text-slate-700',
  processing: 'bg-amber-100 text-amber-800',
};

export function StatusChip({ status, label }: { status: string; label?: string }) {
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold capitalize', STATUS_STYLES[status] ?? 'bg-card text-navy')}>
      {label ?? status}
    </span>
  );
}

export function SaveBar({ dirty, saving, onSave, label = 'Save', extra }: { dirty: boolean; saving: boolean; onSave: () => void; label?: string; extra?: ReactNode }) {
  return (
    <div className="sticky bottom-20 z-30 mt-6 flex flex-wrap items-center justify-end gap-3 rounded-full bg-white/95 p-2 pl-5 shadow-float ring-1 ring-navy/10 backdrop-blur lg:bottom-4">
      <span className="mr-auto text-sm text-muted" aria-live="polite">
        {saving ? 'Saving…' : dirty ? 'You have unsaved changes' : 'All changes saved'}
      </span>
      {extra}
      <button
        type="button"
        onClick={onSave}
        disabled={saving || !dirty}
        className="h-12 rounded-full bg-primary px-7 font-serif font-bold text-white hover:bg-primary-dark disabled:opacity-50"
      >
        {saving ? 'Saving…' : label}
      </button>
    </div>
  );
}
