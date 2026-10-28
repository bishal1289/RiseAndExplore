import { useEffect, useState } from 'react';
import { Download, Mail, Phone, Trash2, Inbox as InboxIcon } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { adminApi, useAdminMutation, useAdminQuery } from '../lib/hooks';
import type { InboxStatus, MessageRecord, VolunteerRecord } from '../lib/types';
import { EmptyState, ListSkeleton, PageTitle, StatusChip, Tabs } from '../components/ui';
import { useConfirm } from '../components/Confirm';
import { cn } from '../../lib/utils';

type Kind = 'volunteers' | 'messages';
type Rec = VolunteerRecord | MessageRecord;
const isVolunteer = (r: Rec): r is VolunteerRecord => 'interests' in r;

const INTEREST_LABELS: Record<string, string> = {
  meals: 'Community meals',
  pantry: 'School pantries',
  clothing: 'Clothing drives',
  mentoring: 'Mentoring',
  events: 'Event setup & photos',
  other: 'Other',
};

function toCsv(rows: Rec[]) {
  const headers = rows.length && isVolunteer(rows[0])
    ? ['Date', 'Name', 'Email', 'Phone', 'Interests', 'Availability', 'Event', 'Message', 'Status', 'Notes']
    : ['Date', 'Name', 'Email', 'Phone', 'Subject', 'Message', 'Status', 'Notes'];
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = rows.map((r) =>
    (isVolunteer(r)
      ? [r.createdAt, r.name, r.email, r.phone, r.interests.map((i) => INTEREST_LABELS[i] ?? i).join('; '), r.availability, r.eventRef?.title.en ?? '', r.message, r.status, r.notes]
      : [r.createdAt, r.name, r.email, r.phone, r.subject, r.message, r.status, r.notes]
    )
      .map(esc)
      .join(','),
  );
  return [headers.map(esc).join(','), ...lines].join('\r\n');
}

// Byte-order mark so Excel opens UTF-8 CSVs (accents) correctly.
const BOM = String.fromCharCode(0xfeff);

function download(name: string, content: string) {
  const blob = new Blob([`${BOM}${content}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function Detail({ rec, kind, onClose }: { rec: Rec; kind: Kind; onClose: () => void }) {
  const confirm = useConfirm();
  const [notes, setNotes] = useState(rec.notes);
  useEffect(() => setNotes(rec.notes), [rec]);
  const update = useAdminMutation((body: { status?: InboxStatus; notes?: string }) => adminApi.put(`/${kind}/${rec._id}`, body), {
    invalidate: [`/${kind}?status=${'all'}`, ['admin']],
    success: 'Saved',
  });
  const remove = useAdminMutation(() => adminApi.del(`/${kind}/${rec._id}`), { invalidate: [['admin']], success: 'Moved to Trash', onSuccess: onClose });
  const subject = isVolunteer(rec) ? 'Thanks for volunteering with RISE' : `Re: ${rec.subject || 'your message to RISE'}`;

  return (
    <div className="space-y-5 px-5 pb-5">
      <div className="flex flex-wrap items-center gap-2">
        <StatusChip status={rec.status} />
        <span className="text-sm text-muted">{new Date(rec.createdAt).toLocaleString()}</span>
        {rec.language === 'es' && <span className="rounded-full bg-card px-2 py-0.5 text-xs font-bold text-navy">Spanish speaker</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        <a
          href={`mailto:${rec.email}?subject=${encodeURIComponent(subject)}`}
          onClick={() => rec.status === 'new' && update.mutate({ status: 'contacted' })}
          className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 font-serif font-bold text-white hover:bg-primary-dark"
        >
          <Mail className="h-5 w-5" aria-hidden /> Email {rec.name.split(' ')[0]}
        </a>
        {rec.phone && (
          <a href={`tel:${rec.phone}`} className="inline-flex h-12 items-center gap-2 rounded-full px-6 font-serif font-bold text-navy ring-[1.5px] ring-navy">
            <Phone className="h-5 w-5" aria-hidden /> Call
          </a>
        )}
      </div>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted">Email</dt>
          <dd className="break-all font-semibold text-navy">{rec.email}</dd>
        </div>
        <div>
          <dt className="text-muted">Phone</dt>
          <dd className="font-semibold text-navy">{rec.phone || '—'}</dd>
        </div>
        {isVolunteer(rec) ? (
          <>
            <div>
              <dt className="text-muted">Interested in</dt>
              <dd className="font-semibold text-navy">{rec.interests.map((i) => INTEREST_LABELS[i] ?? i).join(', ') || '—'}</dd>
            </div>
            <div>
              <dt className="text-muted">Availability</dt>
              <dd className="font-semibold text-navy">{rec.availability || '—'}</dd>
            </div>
            {rec.eventRef && (
              <div className="sm:col-span-2">
                <dt className="text-muted">Event</dt>
                <dd className="font-semibold text-navy">{rec.eventRef.title.en}</dd>
              </div>
            )}
          </>
        ) : (
          <div className="sm:col-span-2">
            <dt className="text-muted">Subject</dt>
            <dd className="font-semibold text-navy">{rec.subject || '—'}</dd>
          </div>
        )}
      </dl>
      {rec.message && <p className="whitespace-pre-wrap rounded-2xl bg-card p-4 text-navy">{rec.message}</p>}
      <div>
        <label htmlFor="notes" className="mb-1.5 block text-sm font-semibold text-navy">
          Notes (only admins see these)
        </label>
        <textarea id="notes" className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => notes !== rec.notes && update.mutate({ notes })} />
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-navy">Status</legend>
        <div className="flex flex-wrap gap-2">
          {(['new', 'contacted', 'archived'] as InboxStatus[]).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={rec.status === s}
              onClick={() => update.mutate({ status: s })}
              className={cn('h-10 rounded-full px-4 text-sm font-semibold capitalize ring-1', rec.status === s ? 'bg-navy text-white ring-navy' : 'text-navy ring-navy/20 hover:ring-navy/50')}
            >
              {s}
            </button>
          ))}
        </div>
      </fieldset>
      <Button
        variant="ghost"
        className="!text-red-700"
        onClick={async () => (await confirm({ title: 'Delete this entry?', danger: true, confirmLabel: 'Move to Trash' })) && remove.mutate(undefined)}
      >
        <Trash2 className="h-4 w-4" aria-hidden /> Delete
      </Button>
    </div>
  );
}

export default function Inbox({ kind }: { kind: Kind }) {
  const [status, setStatus] = useState<'active' | InboxStatus | 'all'>('active');
  const query = status === 'active' ? '' : `?status=${status}`;
  const { data: rows = [], isLoading } = useAdminQuery<Rec[]>(`/${kind}${query}`);
  const [openId, setOpenId] = useState<string | null>(null);
  const open = rows.find((r) => r._id === openId) ?? null;
  const title = kind === 'volunteers' ? 'Volunteers' : 'Messages';

  // Reset selection when switching between Volunteers and Messages.
  useEffect(() => {
    setOpenId(null);
    setStatus('active');
  }, [kind]);

  return (
    <>
      <PageTitle
        title={title}
        intro={kind === 'volunteers' ? 'People who signed up to volunteer on the website.' : 'Messages from the contact form.'}
        actions={
          <Button variant="outline-navy" disabled={!rows.length} onClick={() => download(`rise-${kind}-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows))}>
            <Download className="h-5 w-5" aria-hidden /> Export CSV
          </Button>
        }
      />
      <Tabs
        label={`Filter ${title.toLowerCase()}`}
        value={status}
        onChange={setStatus}
        tabs={[
          { value: 'active', label: 'Inbox' },
          { value: 'new', label: 'New' },
          { value: 'contacted', label: 'Contacted' },
          { value: 'archived', label: 'Archived' },
          { value: 'all', label: 'All' },
        ]}
      />
      {isLoading ? (
        <ListSkeleton />
      ) : rows.length === 0 ? (
        <EmptyState icon={<InboxIcon className="h-10 w-10" />} title={kind === 'volunteers' ? 'No volunteer sign-ups here' : 'No messages here'} text="New ones will appear here and you’ll get an email." />
      ) : (
        <>
          {/* Cards on phones, table on larger screens */}
          <ul className="space-y-2 md:hidden">
            {rows.map((r) => (
              <li key={r._id}>
                <button type="button" onClick={() => setOpenId(r._id)} className="flex w-full items-center gap-3 rounded-card bg-white p-4 text-left shadow-soft ring-1 ring-navy/5">
                  {r.status === 'new' && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary" aria-label="New" />}
                  <span className="min-w-0 flex-1">
                    <span className={cn('block truncate text-navy', r.status === 'new' ? 'font-bold' : 'font-semibold')}>{r.name}</span>
                    <span className="block truncate text-sm text-muted">
                      {isVolunteer(r) ? r.interests.map((i) => INTEREST_LABELS[i] ?? i).join(', ') || r.email : r.subject || r.message}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-muted">{new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-hidden rounded-card bg-white shadow-soft ring-1 ring-navy/5 md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-card text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">{kind === 'volunteers' ? 'Interests' : 'Subject'}</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/5">
                {rows.map((r) => (
                  <tr key={r._id} className="cursor-pointer hover:bg-card/50" onClick={() => setOpenId(r._id)}>
                    <td className="px-4 py-3">
                      <button type="button" className={cn('text-left text-navy hover:text-primary', r.status === 'new' ? 'font-bold' : 'font-semibold')} onClick={() => setOpenId(r._id)}>
                        {r.name}
                      </button>
                      <div className="text-muted">{r.email}</div>
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-muted">
                      {isVolunteer(r) ? r.interests.map((i) => INTEREST_LABELS[i] ?? i).join(', ') : r.subject || r.message}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <StatusChip status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <Modal open={!!open} onClose={() => setOpenId(null)} title={open?.name ?? ''}>
        {open && <Detail rec={open} kind={kind} onClose={() => setOpenId(null)} />}
      </Modal>
    </>
  );
}
