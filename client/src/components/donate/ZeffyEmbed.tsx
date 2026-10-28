import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '../ui/Skeleton';
import { cn } from '../../lib/utils';

/**
 * Embeds the Zeffy donation form. Card details are entered on Zeffy's secure page,
 * never on our site. Zeffy's embed doesn't document amount/frequency prefill params,
 * so the RISE amount picker is a visual nudge only.
 */
export function ZeffyEmbed({ url, className, minHeight = 1000 }: { url?: string; className?: string; minHeight?: number }) {
  const { t } = useTranslation();
  const [loaded, setLoaded] = useState(false);
  if (!url) {
    return <p className="rounded-card bg-card p-8 text-center text-muted">{t('donate.notConfigured')}</p>;
  }
  return (
    <div className={cn('relative w-full', className)} style={{ minHeight }}>
      {!loaded && <Skeleton className="absolute inset-0" />}
      <iframe
        src={url}
        title={t('donate.formTitle')}
        // allowpaymentrequest is legacy but still honored by some browsers for Apple/Google Pay.
        {...{ allowpaymentrequest: 'true' }}
        allow="payment"
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className="relative h-full w-full border-0"
        style={{ minHeight }}
      />
    </div>
  );
}
