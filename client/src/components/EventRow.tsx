import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { EventSummary } from '../lib/types';
import { dateBadge } from '../lib/utils';
import { useLang } from '../hooks/usePublic';

export function DateBadge({ date, size = 'md' }: { date: string; size?: 'md' | 'lg' }) {
  const lang = useLang();
  const { month, day } = dateBadge(date, lang);
  return (
    <span
      className={
        size === 'lg'
          ? 'grid h-20 w-20 shrink-0 place-content-center rounded-full bg-primary text-center text-white'
          : 'grid h-16 w-16 shrink-0 place-content-center rounded-full bg-primary text-center text-white'
      }
    >
      <span className="text-[11px] font-semibold tracking-[0.12em]">{month}</span>
      <span className={size === 'lg' ? 'font-serif text-3xl font-black leading-none' : 'font-serif text-2xl font-black leading-none'}>{day}</span>
    </span>
  );
}

export function EventRow({ event }: { event: EventSummary }) {
  const { t } = useTranslation();
  const place = [event.locationName, event.city].filter(Boolean).join(', ');
  return (
    <article className="group relative flex items-center gap-4 rounded-row bg-card p-4 transition-colors hover:bg-[#DCEAF7] sm:gap-5 sm:p-5">
      <DateBadge date={event.date} />
      <div className="min-w-0 flex-1">
        <h3 className="font-serif text-xl">
          <Link to={`/events/${event.slug}`} className="after:absolute after:inset-0 after:rounded-row focus-visible:outline-none">
            {event.title}
          </Link>
        </h3>
        {place && <p className="mt-1 truncate text-sm text-muted">{place}</p>}
      </div>
      <span className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-primary sm:inline-flex">
        {t('home.photosVideo')}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </span>
      <ArrowRight className="h-5 w-5 shrink-0 text-primary sm:hidden" aria-hidden />
    </article>
  );
}
