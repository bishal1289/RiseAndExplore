import { ArrowUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useScrolledPast } from '../hooks/useScrollY';
import { cn, prefersReducedMotion } from '../lib/utils';

export function BackToTop() {
  const { t } = useTranslation();
  const visible = useScrolledPast(600);
  return (
    <button
      type="button"
      aria-label={t('nav.backToTop')}
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      onClick={() => window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })}
      className={cn(
        'fixed bottom-5 right-5 z-40 grid h-12 w-12 place-items-center rounded-full bg-navy text-white shadow-float transition-all duration-300 hover:bg-primary md:bottom-8 md:right-8',
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0',
      )}
    >
      <ArrowUp className="h-5 w-5" aria-hidden />
    </button>
  );
}
