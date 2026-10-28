import { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Lock } from 'lucide-react';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { useDonate } from './DonateProvider';
import { cn } from '../../lib/utils';

interface Props {
  amounts?: number[];
  defaultAmount?: number;
  className?: string;
}

export function DonateCard({ amounts = [25, 50, 100, 250], defaultAmount = 50, className }: Props) {
  const { t } = useTranslation();
  const { openDonate } = useDonate();
  const [amount, setAmount] = useState(defaultAmount);
  const [frequency, setFrequency] = useState<'once' | 'monthly'>('once');
  const titleId = useId();

  // Keep the selection valid when the admin edits the amounts.
  useEffect(() => {
    if (!amounts.includes(amount)) setAmount(amounts.includes(defaultAmount) ? defaultAmount : amounts[0]);
  }, [amounts, amount, defaultAmount]);

  return (
    <section
      aria-labelledby={titleId}
      className={cn('w-full rounded-card bg-white/95 p-6 shadow-float backdrop-blur sm:p-7', className)}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id={titleId} className="font-serif text-2xl">
          {t('donate.today')}
        </h2>
        <Chip tone="light">{t('donate.taxChip')}</Chip>
      </div>

      <fieldset className="mt-5">
        <legend className="sr-only">{t('donate.amount')}</legend>
        <div className="grid grid-cols-2 gap-3">
          {amounts.map((a) => {
            const selected = a === amount;
            return (
              <label
                key={a}
                className={cn(
                  'relative flex h-12 cursor-pointer items-center justify-center rounded-full border-[1.5px] font-serif text-lg font-bold transition-colors has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-primary has-[:focus-visible]:ring-offset-2',
                  selected ? 'border-navy bg-card text-navy' : 'border-navy/15 text-navy/80 hover:border-navy/40',
                )}
              >
                <input
                  type="radio"
                  name="donation-amount"
                  value={a}
                  checked={selected}
                  onChange={() => setAmount(a)}
                  className="sr-only"
                />
                ${a.toLocaleString()}
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="mt-4">
        <legend className="sr-only">{t('donate.frequency')}</legend>
        <div className="grid grid-cols-2 rounded-full bg-card p-1">
          {(['once', 'monthly'] as const).map((f) => (
            <label
              key={f}
              className={cn(
                'flex h-10 cursor-pointer items-center justify-center rounded-full text-sm font-semibold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary',
                frequency === f ? 'bg-white text-navy shadow-soft' : 'text-muted hover:text-navy',
              )}
            >
              <input
                type="radio"
                name="donation-frequency"
                value={f}
                checked={frequency === f}
                onChange={() => setFrequency(f)}
                className="sr-only"
              />
              {f === 'once' ? t('donate.oneTime') : t('donate.monthly')}
            </label>
          ))}
        </div>
      </fieldset>

      <Button fullWidth className="mt-5" onClick={() => openDonate({ amount, frequency })}>
        {frequency === 'monthly' ? t('donate.ctaMonthly', { amount }) : t('donate.cta', { amount })}
      </Button>
      <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        {t('donate.secure')}
      </p>
    </section>
  );
}
