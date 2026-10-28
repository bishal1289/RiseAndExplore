import { Link } from 'react-router-dom';
import { CalendarDays, Images, HandHeart, Mail, Plus, Upload, Inbox, Star, Clock } from 'lucide-react';
import { LinkButton } from '../../components/ui/Button';
import { useAdminQuery } from '../lib/hooks';
import type { DashboardData } from '../lib/types';
import { Card, ListSkeleton, PageTitle, StatusChip } from '../components/ui';
import { useAuth } from '../AuthContext';
import { formatBytes } from '../lib/upload';

function StatCard({ icon: Icon, label, value, to }: { icon: typeof Images; label: string; value: number | string; to: string }) {
  return (
    <Link to={to} className="flex items-center gap-4 rounded-card bg-white p-5 shadow-soft ring-1 ring-navy/5 transition-colors hover:bg-card">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-card text-primary">
        <Icon className="h-6 w-6" aria-hidden />
      </span>
      <span>
        <span className="block font-serif text-3xl font-black text-navy">{value}</span>
        <span className="text-sm text-muted">{label}</span>
      </span>
    </Link>
  );
}

const ACTION_VERB: Record<string, string> = {
  created: 'created',
  updated: 'edited',
  published: 'published',
  deleted: 'moved to Trash',
  restored: 'restored',
  uploaded: 'uploaded',
  purged: 'permanently deleted',
};

function timeAgo(date: string) {
  const s = (Date.now() - new Date(date).getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useAdminQuery<DashboardData>('/dashboard');
  const { data: storage } = useAdminQuery<{ available: boolean; usedBytes: number; usedPercent: number | null; plan: string }>('/dashboard/storage');

  return (
    <>
      <PageTitle
        title={`Hi${user?.name ? `, ${user.name.split(' ')[0]}` : ''}!`}
        intro="Here’s what’s happening on the RISE website."
      />

      <div className="mb-6 flex flex-wrap gap-3">
        <LinkButton to="/admin/events/new">
          <Plus className="h-5 w-5" aria-hidden /> New event
        </LinkButton>
        <LinkButton to="/admin/media" variant="outline-navy">
          <Upload className="h-5 w-5" aria-hidden /> Upload photos & videos
        </LinkButton>
        <LinkButton to="/admin/messages" variant="outline-navy">
          <Inbox className="h-5 w-5" aria-hidden /> View messages
        </LinkButton>
      </div>

      {isLoading || !data ? (
        <ListSkeleton rows={4} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={CalendarDays} label="Upcoming events" value={data.upcomingCount} to="/admin/events" />
            <StatCard icon={Images} label={`Photos · ${data.videosThisMonth} videos this month`} value={data.photosThisMonth} to="/admin/media" />
            <StatCard icon={HandHeart} label="New volunteer sign-ups" value={data.newVolunteers} to="/admin/volunteers" />
            <StatCard icon={Mail} label="Unread messages" value={data.unreadMessages} to="/admin/messages" />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <Card title="Coming up">
              {data.upcomingEvents.length === 0 ? (
                <p className="text-muted">
                  No upcoming events yet —{' '}
                  <Link to="/admin/events/new" className="font-semibold text-primary">
                    create your first event
                  </Link>
                  .
                </p>
              ) : (
                <ul className="divide-y divide-navy/5">
                  {data.upcomingEvents.map((e) => (
                    <li key={e._id}>
                      <Link to={`/admin/events/${e._id}`} className="flex items-center gap-3 py-3 hover:text-primary">
                        <span className="w-16 shrink-0 text-sm font-bold text-primary">
                          {new Date(e.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                        <span className="min-w-0 flex-1 truncate font-semibold text-navy">{e.title.en}</span>
                        {e.featured && <Star className="h-4 w-4 shrink-0 fill-gold text-gold" aria-label="Featured on homepage" />}
                        <StatusChip status={e.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card title="Recent activity">
              {data.activity.length === 0 ? (
                <p className="text-muted">Nothing yet.</p>
              ) : (
                <ul className="space-y-3">
                  {data.activity.map((a) => (
                    <li key={a._id} className="flex gap-3 text-sm">
                      <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden />
                      <span className="min-w-0">
                        <b className="text-navy">{a.userName}</b> {ACTION_VERB[a.action] ?? a.action} {a.entityType.toLowerCase()}{' '}
                        {a.label && <span className="font-semibold text-navy">“{a.label}”</span>}
                        <span className="block text-xs text-muted">{timeAgo(a.createdAt)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <Card title="Storage" description="Photos and videos are stored on Cloudinary.">
              {storage?.available ? (
                <>
                  <div
                    className="h-3 overflow-hidden rounded-full bg-card"
                    role="progressbar"
                    aria-label="Storage used"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(storage.usedPercent ?? 0)}
                  >
                    <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, storage.usedPercent ?? 0)}%` }} />
                  </div>
                  <p className="mt-2 text-sm text-muted">
                    {formatBytes(storage.usedBytes)} stored
                    {storage.usedPercent != null && ` · ${storage.usedPercent.toFixed(1)}% of your ${storage.plan || 'plan'} credits used`}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted">Storage details will appear once Cloudinary is connected.</p>
              )}
            </Card>
            <Card title="Donations this month" description="Logged automatically from Zeffy (if the Zapier connection is set up).">
              <p className="font-serif text-3xl font-black text-navy">
                ${data.donationsThisMonth.total.toLocaleString()}
                <span className="ml-2 font-sans text-base font-normal text-muted">from {data.donationsThisMonth.count} gifts</span>
              </p>
            </Card>
          </div>
        </>
      )}
    </>
  );
}
