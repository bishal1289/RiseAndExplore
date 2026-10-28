import { useTranslation } from 'react-i18next';
import { LANGS } from '../../i18n';
import { cn } from '../../lib/utils';

export function LanguageToggle({ className, onDark }: { className?: string; onDark?: boolean }) {
  const { i18n, t } = useTranslation();
  const current = (i18n.resolvedLanguage ?? 'en').startsWith('es') ? 'es' : 'en';
  return (
    <div
      role="group"
      aria-label={t('nav.language')}
      className={cn(
        'inline-flex h-10 items-center rounded-full p-1 text-sm font-semibold',
        onDark ? 'bg-white/10 ring-1 ring-white/20' : 'bg-white ring-1 ring-navy/15',
        className,
      )}
    >
      {LANGS.map((lng) => {
        const active = current === lng;
        return (
          <button
            key={lng}
            type="button"
            lang={lng}
            aria-pressed={active}
            aria-label={lng === 'en' ? 'English' : 'Español'}
            onClick={() => i18n.changeLanguage(lng)}
            className={cn(
              'h-8 min-w-[40px] rounded-full px-3 uppercase transition-colors',
              active ? 'bg-navy text-white' : onDark ? 'text-white/80 hover:text-white' : 'text-navy/70 hover:text-navy',
            )}
          >
            {lng}
          </button>
        );
      })}
    </div>
  );
}
