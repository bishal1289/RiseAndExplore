import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Plus, Search, Star, MapPin, Images } from 'lucide-react';
import { LinkButton } from '../../components/ui/Button';
import { useAdminQuery } from '../lib/hooks';
import type { AdminEvent } from '../lib/types';
import { EmptyState, ListSkeleton, PageTitle, StatusChip, Tabs } from '../components/ui';
import { imageUrl } from '../../lib/utils';

type Tab = 'upcoming' | 'past' | 'drafts';

export default function EventsList() {
  const [tab, setTab] = useState<Tab>('upcoming');
  const [q, setQ] = useState('');
  const [year, setYear] = useState('');
  const qs = new URLSearchParams({ tab, ...(year ? { year } : {}), ...(q.trim() ? { q: q.trim() } : {}) });
  const { data: events = [], isLoading } = useAdminQuery<AdminEvent[]>(`/events?${qs}`);
  const { data: all = [] } = useAdminQuery<AdminEvent[]>('/events');

  const years = useMemo(() => [...new Set(all.map((e) => new Date(e.date).getFullYear()))].sort((a, b) => b - a), [all]);
  const today = new Date(new Date().toDateString());

  return (
    <>
      <PageTitle
        title="Events"
        intro="Create events, add photos and videos, and choose which ones appear on the homepage."
        actions={
          <LinkButton to="/admin/events/new">
            <Plus className="h-5 w-5" aria-hidden /> New event
          </LinkButton>
        }
      />
      <Tabs
        label="Event lists"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'upcoming', label: 'Upcoming' },
          { value: 'past', label: 'Past' },
          { value: 'drafts', label: 'Drafts' },
        ]}
      />
      <div className="mb-5 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
          <input className="input pl-11" placeholder="Search by title or place" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search events" />
        </div>
        <select className="input sm:w-40" value={year} onChange={(e) => setYear(e.target.value)} aria-label="Filter by year">
          <option value="">All years</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <ListSkeleton />
      ) : events.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-10 w-10" />}
          title={all.length ? 'Nothing in this list' : 'No events yet — create your first event'}
          text={all.length ? 'Try another tab or clear the search.' : 'Add the date, place, a few photos, and publish it to the website.'}
          action={
            <LinkButton to="/admin/events/new">
              <Plus className="h-5 w-5" aria-hidden /> New event
            </LinkButton>
          }
        />
      ) : (
        <ul className="space-y-3">
          {events.map((e) => {
            const isPast = new Date(e.date) < today && e.status !== 'draft';
            return (
              <li key={e._id}>
                <Link
                  to={`/admin/events/${e._id}`}
                  className="flex items-center gap-4 rounded-card bg-white p-3 shadow-soft ring-1 ring-navy/5 transition-colors hover:bg-card sm:p-4"
                >
                  <div className="h-16 w-20 shrink-0 overflow-hidden rounded-2xl bg-card sm:h-20 sm:w-28">
                    {e.coverImage?.url && <img src={imageUrl(e.coverImage.url, 240, 180)} alt="" className="h-full w-full object-cover" loading="lazy" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate font-serif text-lg font-bold text-navy sm:text-xl">{e.title.en}</h2>
                      {e.featured && <Star className="h-4 w-4 shrink-0 fill-gold text-gold" aria-label="Featured on homepage" />}
                    </div>
                    <p className="mt-0.5 text-sm text-muted">
                      {new Date(e.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                      {e.locationName && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" aria-hidden />
                          {e.locationName}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Images className="h-3.5 w-3.5" aria-hidden />
                        {e.photoCount ?? 0} photos
                      </span>
                    </p>
                  </div>
                  <StatusChip status={isPast ? 'past' : e.status} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
