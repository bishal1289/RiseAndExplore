import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin } from 'lucide-react';
import { Seo } from '../components/Seo';
import { PageHeader } from '../components/PageHeader';
import { Img } from '../components/ui/Img';
import { Chip } from '../components/ui/Chip';
import { Reveal } from '../components/ui/Reveal';
import { ErrorState, Skeleton } from '../components/ui/Skeleton';
import { DateBadge, EventRow } from '../components/EventRow';
import { useEvents } from '../hooks/usePublic';
import type { EventSummary } from '../lib/types';

function EventCard({ event }: { event: EventSummary }) {
  const { t } = useTranslation();
  return (
    <article className="group relative">
      <div className="relative overflow-hidden rounded-card">
        <Img
          src={event.coverImage?.url}
          alt={event.coverImage?.alt || event.title}
          width={640}
          ratio={0.75}
          className="aspect-[4/3] w-full transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute left-4 top-4">
          <DateBadge date={event.date} />
        </div>
      </div>
      <Chip className="mt-5">{t(`events.type.${event.eventType}`)}</Chip>
      <h3 className="mt-3 font-serif text-2xl">
        <Link to={`/events/${event.slug}`} className="after:absolute after:inset-0">
          {event.title}
        </Link>
      </h3>
      {(event.locationName || event.city) && (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
          <MapPin className="h-4 w-4" aria-hidden />
          {[event.locationName, event.city].filter(Boolean).join(', ')}
        </p>
      )}
      {event.summary && <p className="mt-2 text-muted">{event.summary}</p>}
    </article>
  );
}

export default function Events() {
  const { t } = useTranslation();
  const upcoming = useEvents('upcoming');
  const past = useEvents('past');

  return (
    <>
      <Seo title={t('meta.events')} description={t('events.intro')} />
      <PageHeader eyebrow={t('nav.events')} title={t('events.upcoming')} intro={t('events.intro')} />

      <section aria-label={t('events.upcoming')} className="container-rise pb-section-sm md:pb-section">
        {upcoming.isLoading && <Skeleton className="h-24" />}
        {upcoming.isError && <ErrorState message={t('common.error')} onRetry={() => upcoming.refetch()} retryLabel={t('common.retry')} />}
        {upcoming.data && upcoming.data.length === 0 && <p className="rounded-card bg-card p-8 text-center text-muted">{t('events.noUpcoming')}</p>}
        {upcoming.data && upcoming.data.length > 0 && (
          <ul className="space-y-3">
            {upcoming.data.map((e) => (
              <Reveal as="li" key={e._id}>
                <EventRow event={e} />
              </Reveal>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="past-title" className="container-rise pb-section-sm md:pb-section">
        <h2 id="past-title" className="h2 mb-10">
          {t('events.past')}
        </h2>
        {past.isLoading && (
          <div className="grid gap-8 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="aspect-[4/3]" />
            ))}
          </div>
        )}
        {past.data && past.data.length === 0 && <p className="text-muted">{t('events.noPast')}</p>}
        {past.data && past.data.length > 0 && (
          <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 md:grid-cols-3">
            {past.data.map((e, i) => (
              <Reveal as="li" key={e._id} delay={(i % 3) * 0.05}>
                <EventCard event={e} />
              </Reveal>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
