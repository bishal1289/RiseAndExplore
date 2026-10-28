import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CalendarDays, MapPin, Navigation } from 'lucide-react';
import { Seo } from '../components/Seo';
import { Img } from '../components/ui/Img';
import { Chip } from '../components/ui/Chip';
import { LinkButton } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { VideoCard } from '../components/VideoCard';
import { PhotoGrid } from '../components/PhotoGrid';
import { useEvent, useLang } from '../hooks/usePublic';
import type { EventDetail as EventDetailData } from '../lib/types';
import { formatDate, formatTime } from '../lib/utils';
import NotFound from './NotFound';

/** Pure rendering — also used by the admin preview. */
export function EventDetailView({ event }: { event: EventDetailData }) {
  const { t } = useTranslation();
  const lang = useLang();
  const time = [formatTime(event.startTime, lang), formatTime(event.endTime, lang)].filter(Boolean).join(' – ');
  const mainVideo = event.videos.find((v) => v.isMain) ?? event.videos[0];
  const otherVideos = event.videos.filter((v) => v !== mainVideo);
  const isPast = new Date(event.date) < new Date(new Date().toDateString());
  const canVolunteer = event.volunteerSignup?.enabled && !isPast && event.spotsLeft !== 0;

  return (
    <article>
      <div className="mx-auto max-w-[1180px] px-4 pt-4 sm:px-6 md:pt-6">
        <div className="relative isolate overflow-hidden rounded-section bg-navy">
          <Img
            src={event.coverImage?.url}
            alt=""
            width={1600}
            ratio={0.45}
            priority
            className="absolute inset-0 -z-10 h-full w-full"
          />
          <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-navy via-navy/60 to-navy/20" />
          <div className="flex min-h-[380px] flex-col justify-end p-6 sm:p-10 md:min-h-[440px] md:p-12">
            <Link to="/events" className="mb-auto inline-flex items-center gap-1.5 self-start rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur hover:bg-white/25">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              {t('events.backToEvents')}
            </Link>
            <Chip tone="glass" className="mt-10 self-start">
              {t(`events.type.${event.eventType}`)}
            </Chip>
            <h1 className="h1 mt-4 text-white">{event.title}</h1>
            {event.summary && <p className="mt-4 max-w-2xl text-lg text-white/85">{event.summary}</p>}
          </div>
        </div>
      </div>

      <div className="container-rise grid gap-10 py-section-sm md:grid-cols-[1fr_300px] md:py-section">
        <div className="min-w-0">
          {event.body && <div className="prose-rise text-lg" dangerouslySetInnerHTML={{ __html: event.body }} />}

          {mainVideo && (
            <section aria-labelledby="videos" className="mt-12">
              <h2 id="videos" className="h2 mb-6">
                {t('events.videos')}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {[mainVideo, ...otherVideos].map((v) => (
                  <VideoCard
                    key={v._id ?? v.url}
                    url={v.url}
                    poster={v.poster}
                    caption={v.caption || event.title}
                    duration={v.duration}
                    vertical={v.orientation === 'vertical'}
                    className={v.orientation === 'vertical' ? 'mx-auto max-w-[300px]' : 'sm:col-span-2'}
                  />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-4 md:sticky md:top-28 md:self-start">
          <div className="rounded-card bg-card p-6">
            <h2 className="label text-primary">{t('events.when')}</h2>
            <p className="mt-2 flex items-start gap-2 font-semibold text-navy">
              <CalendarDays className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
              <span>
                {formatDate(event.date, lang, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                {time && <span className="block font-normal text-muted">{time}</span>}
              </span>
            </p>
            {(event.locationName || event.address) && (
              <>
                <h2 className="label mt-6 text-primary">{t('events.where')}</h2>
                <p className="mt-2 flex items-start gap-2 font-semibold text-navy">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
                  <span>
                    {event.locationName}
                    <span className="block font-normal text-muted">{[event.address, event.city].filter(Boolean).join(', ')}</span>
                  </span>
                </p>
                {event.mapsUrl && (
                  <a href={event.mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                    <Navigation className="h-4 w-4" aria-hidden />
                    {t('common.directions')}
                  </a>
                )}
              </>
            )}
          </div>
          {event.volunteerSignup?.enabled && !isPast && (
            <div className="rounded-card bg-navy p-6 text-white">
              {event.spotsLeft != null && (
                <p className="text-sm text-white/80">
                  {event.spotsLeft > 0 ? t('events.spotsLeft', { count: event.spotsLeft }) : t('events.full')}
                </p>
              )}
              {canVolunteer && (
                <LinkButton to={`/get-involved?event=${event._id}#volunteer`} variant="white" fullWidth className="mt-3">
                  {t('events.volunteerHere')}
                </LinkButton>
              )}
            </div>
          )}
        </aside>
      </div>

      {event.gallery.length > 0 && (
        <section aria-labelledby="photos" className="container-rise pb-section-sm md:pb-section">
          <h2 id="photos" className="h2 mb-8">
            {t('events.photos')}
          </h2>
          <PhotoGrid
            photos={event.gallery.map((p, i) => ({
              id: p._id ?? String(i),
              src: p.url,
              alt: p.alt || p.caption || event.title,
              caption: p.caption,
              width: p.width,
              height: p.height,
            }))}
          />
        </section>
      )}
    </article>
  );
}

export default function EventDetail() {
  const { slug } = useParams();
  const { data: event, isLoading, error } = useEvent(slug);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1180px] space-y-8 px-4 pt-6 sm:px-6" aria-busy="true">
        <Skeleton className="h-[440px] rounded-section" />
        <div className="container-rise space-y-4">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-5/6" />
        </div>
      </div>
    );
  }
  if (error || !event) return <NotFound />;

  return (
    <>
      <Seo
        title={event.title}
        description={event.summary}
        image={event.coverImage?.url}
        type="article"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Event',
          name: event.title,
          description: event.summary,
          startDate: event.date,
          image: event.coverImage?.url,
          eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
          location: {
            '@type': 'Place',
            name: event.locationName,
            address: [event.address, event.city].filter(Boolean).join(', '),
          },
          organizer: { '@type': 'NGO', name: 'RISE – Resourceful Impact in Scholastic Education' },
          isAccessibleForFree: true,
        }}
      />
      <EventDetailView event={event} />
    </>
  );
}
