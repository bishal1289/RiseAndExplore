import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Download, Search, Trash2, X, Tag, CalendarPlus, GalleryHorizontalEnd, Replace, Link2, Upload } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { VideoPlayer } from '../../components/VideoPlayer';
import { adminApi, useAdminMutation, useAdminQuery } from '../lib/hooks';
import type { AdminEvent, MediaAsset, L } from '../lib/types';
import { Uploader } from '../components/Uploader';
import { MediaThumb } from '../components/MediaThumb';
import { BilingualField, EmptyState, ListSkeleton, PageTitle, Tabs } from '../components/ui';
import { useConfirm } from '../components/Confirm';
import { formatBytes, kindOf, uploadToCloudinary, prepareImage } from '../lib/upload';
import { cn, formatDuration, imageUrl } from '../../lib/utils';
import toast from 'react-hot-toast';

type Filter = 'all' | 'image' | 'video' | 'unused';

function DetailPanel({ id, onClose, events }: { id: string; onClose: () => void; events: AdminEvent[] }) {
  const confirm = useConfirm();
  const { data: asset } = useAdminQuery<MediaAsset>(`/media/${id}`);
  const [caption, setCaption] = useState<L>({ en: '', es: '' });
  const [alt, setAlt] = useState<L>({ en: '', es: '' });
  const [tags, setTags] = useState('');
  const [eventRef, setEventRef] = useState('');
  const [replacing, setReplacing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!asset) return;
    setCaption(asset.caption);
    setAlt(asset.alt);
    setTags(asset.tags.join(', '));
    setEventRef(asset.eventRef ?? '');
  }, [asset]);

  const save = useAdminMutation(
    () =>
      adminApi.put(`/media/${id}`, {
        caption,
        alt,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        eventRef: eventRef || null,
      }),
    { success: 'Details saved', invalidate: [['admin']] },
  );
  const remove = useAdminMutation(() => adminApi.del(`/media/${id}`), {
    success: 'Moved to Trash',
    invalidate: [['admin']],
    onSuccess: onClose,
  });

  if (!asset) {
    return (
      <div className="p-5">
        <ListSkeleton rows={3} />
      </div>
    );
  }

  const onDelete = async () => {
    const usage = asset.usage ?? [];
    const ok = await confirm({
      title: 'Delete this file?',
      danger: true,
      confirmLabel: 'Move to Trash',
      message: usage.length ? (
        <>
          <p className="font-semibold text-red-700">This file is still being used:</p>
          <ul className="mt-2 list-disc pl-5">
            {usage.map((u, i) => (
              <li key={i}>
                {u.type}: {u.label}
              </li>
            ))}
          </ul>
          <p className="mt-2">Those places will show a blank image. You can restore it from the Trash for 30 days.</p>
        </>
      ) : (
        'It will stay in the Trash for 30 days in case you change your mind.'
      ),
    });
    if (ok) remove.mutate(undefined);
  };

  const onReplace = async (file: File) => {
    const kind = kindOf(file);
    if (!kind || kind !== (asset.type === 'embed' ? 'video' : asset.type)) {
      toast.error(`Please choose a ${asset.type === 'image' ? 'photo' : 'video'}`);
      return;
    }
    setReplacing(true);
    try {
      const prepared = kind === 'image' ? await prepareImage(file) : file;
      const r = await uploadToCloudinary(prepared, kind, (asset.folder as 'rise/media') || 'rise/media', new AbortController().signal, () => undefined);
      await adminApi.put(`/media/${id}`, {
        publicId: r.public_id,
        url: r.secure_url,
        width: r.width,
        height: r.height,
        duration: r.duration ?? 0,
        bytes: r.bytes,
        format: r.format,
      });
      toast.success('File replaced everywhere it’s used');
      save.reset();
      window.dispatchEvent(new Event('rise-media-refresh'));
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setReplacing(false);
    }
  };

  return (
    <div className="space-y-5 p-5">
      <div className="overflow-hidden rounded-card bg-navy">
        {asset.type === 'image' ? (
          <img src={imageUrl(asset.url, 900)} alt={asset.alt.en} className="max-h-[50vh] w-full object-contain" />
        ) : (
          <VideoPlayer url={asset.url} poster={asset.posterUrl} title={asset.caption.en || 'Video'} autoPlay={false} vertical={asset.orientation === 'vertical'} />
        )}
      </div>
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-muted">Type</dt>
          <dd className="font-semibold capitalize text-navy">{asset.type === 'embed' ? `${asset.provider} link` : asset.type}</dd>
        </div>
        <div>
          <dt className="text-muted">Size</dt>
          <dd className="font-semibold text-navy">
            {asset.width ? `${asset.width}×${asset.height}` : '—'} · {formatBytes(asset.bytes)}
          </dd>
        </div>
        {asset.type !== 'image' && (
          <div>
            <dt className="text-muted">Length</dt>
            <dd className="font-semibold text-navy">
              {formatDuration(asset.duration) || '—'} · {asset.orientation === 'vertical' ? 'Vertical 9:16' : 'Horizontal'}
            </dd>
          </div>
        )}
        <div>
          <dt className="text-muted">Uploaded</dt>
          <dd className="font-semibold text-navy">{new Date(asset.createdAt).toLocaleDateString()}</dd>
        </div>
      </dl>
      {asset.status === 'processing' && (
        <p className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-800">This video is still processing. It will be ready to play on the site in a few minutes.</p>
      )}

      <BilingualField label="Caption" value={caption} onChange={setCaption} />
      {asset.type === 'image' && (
        <BilingualField label="Alt text" required hint="Describe the photo for people who can’t see it, e.g. “Volunteers stacking canned food”." value={alt} onChange={setAlt} />
      )}
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-navy" htmlFor="media-tags">
          Tags <span className="font-normal text-muted">(separate with commas)</span>
        </label>
        <input id="media-tags" className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="pantry, july 2025" />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-navy" htmlFor="media-event">
          Event
        </label>
        <select id="media-event" className="input" value={eventRef} onChange={(e) => setEventRef(e.target.value)}>
          <option value="">Not linked to an event</option>
          {events.map((e) => (
            <option key={e._id} value={e._id}>
              {e.title.en}
            </option>
          ))}
        </select>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-navy">Used in</h3>
        {asset.usage?.length ? (
          <ul className="mt-1 space-y-1 text-sm">
            {asset.usage.map((u, i) => (
              <li key={i} className="rounded-xl bg-card px-3 py-2">
                <b>{u.type}:</b> {u.label}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-muted">Not used anywhere yet.</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-navy/10 pt-5">
        <Button onClick={() => (asset.type === 'image' && !alt.en.trim() ? toast.error('Please add alt text in English') : save.mutate(undefined))} disabled={save.isPending}>
          {save.isPending ? 'Saving…' : 'Save details'}
        </Button>
        {asset.type !== 'embed' && (
          <>
            <Button variant="outline-navy" size="sm" className="h-12" disabled={replacing} onClick={() => fileRef.current?.click()}>
              <Replace className="h-4 w-4" aria-hidden /> {replacing ? 'Replacing…' : 'Replace file'}
            </Button>
            <input ref={fileRef} type="file" className="sr-only" accept={asset.type === 'image' ? 'image/*,.heic' : 'video/*,.mov'} onChange={(e) => e.target.files?.[0] && onReplace(e.target.files[0])} aria-label="Choose replacement file" />
            <a
              href={asset.url.replace('/upload/', '/upload/fl_attachment/')}
              className="inline-flex h-12 items-center gap-2 rounded-full px-5 font-serif font-bold text-navy ring-[1.5px] ring-navy hover:bg-navy/5"
            >
              <Download className="h-4 w-4" aria-hidden /> Download
            </a>
          </>
        )}
        {asset.type === 'embed' && (
          <a href={asset.url} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center gap-2 rounded-full px-5 font-semibold text-primary">
            <Link2 className="h-4 w-4" aria-hidden /> Open link
          </a>
        )}
        <Button variant="ghost" className="ml-auto !text-red-700" onClick={onDelete}>
          <Trash2 className="h-4 w-4" aria-hidden /> Delete
        </Button>
      </div>
    </div>
  );
}

export default function MediaLibrary() {
  const confirm = useConfirm();
  const [filter, setFilter] = useState<Filter>('all');
  const [eventFilter, setEventFilter] = useState('');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [selected, setSelected] = useState<string[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [bulkModal, setBulkModal] = useState<'tag' | 'event' | null>(null);
  const [bulkValue, setBulkValue] = useState('');

  const params = new URLSearchParams();
  if (filter === 'image' || filter === 'video') params.set('type', filter);
  if (filter === 'unused') params.set('unused', 'true');
  if (eventFilter) params.set('event', eventFilter);
  params.set('sort', sort);
  const { data: items = [], isLoading, refetch } = useAdminQuery<MediaAsset[]>(`/media?${params}`);
  const { data: events = [] } = useAdminQuery<AdminEvent[]>('/events');

  useEffect(() => {
    const h = () => refetch();
    window.addEventListener('rise-media-refresh', h);
    return () => window.removeEventListener('rise-media-refresh', h);
  }, [refetch]);

  // Poll while videos are processing so "Processing…" clears on its own.
  const hasProcessing = items.some((m) => m.status === 'processing');
  useEffect(() => {
    if (!hasProcessing) return;
    const t = window.setInterval(() => refetch(), 15_000);
    return () => window.clearInterval(t);
  }, [hasProcessing, refetch]);

  const visible = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? items.filter((m) => `${m.caption.en} ${m.caption.es} ${m.tags.join(' ')}`.toLowerCase().includes(s)) : items;
  }, [items, q]);

  const bulk = useAdminMutation((body: Record<string, unknown>) => adminApi.post<{ count: number }>('/media/bulk', { ids: selected, ...body }), {
    invalidate: [['admin']],
    success: (r) => `Done — ${r.count} item${r.count === 1 ? '' : 's'} updated`,
    onSuccess: () => {
      setSelected([]);
      setBulkModal(null);
      setBulkValue('');
    },
  });

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <>
      <PageTitle
        title="Media Library"
        intro="All your photos and videos in one place. Upload here, then use them in events, the gallery and the homepage."
        actions={
          <Button onClick={() => setShowUpload((s) => !s)}>
            <Upload className="h-5 w-5" aria-hidden /> {showUpload ? 'Hide uploader' : 'Upload'}
          </Button>
        }
      />

      {(showUpload || (!isLoading && items.length === 0 && filter === 'all' && !eventFilter)) && (
        <div className="mb-6">
          <Uploader eventRef={eventFilter || null} />
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
        <Tabs
          label="Filter media"
          value={filter}
          onChange={setFilter}
          tabs={[
            { value: 'all', label: 'All' },
            { value: 'image', label: 'Photos' },
            { value: 'video', label: 'Videos' },
            { value: 'unused', label: 'Unused' },
          ]}
        />
        <div className="flex flex-1 flex-wrap gap-2 md:mb-5 md:justify-end">
          <select className="input h-10 w-auto min-w-[160px] flex-1 md:flex-none" value={eventFilter} onChange={(e) => setEventFilter(e.target.value)} aria-label="Filter by event">
            <option value="">All events</option>
            {events.map((e) => (
              <option key={e._id} value={e._id}>
                {e.title.en}
              </option>
            ))}
          </select>
          <select className="input h-10 w-auto" value={sort} onChange={(e) => setSort(e.target.value as 'newest' | 'oldest')} aria-label="Sort">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
          <div className="relative w-full md:w-56">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
            <input className="input h-10 pl-10" placeholder="Search captions" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search by caption" />
          </div>
        </div>
      </div>

      {selected.length > 0 && (
        <div className="sticky top-16 z-10 mb-4 flex flex-wrap items-center gap-2 rounded-card bg-navy p-3 text-white shadow-float">
          <span className="mr-auto pl-2 font-semibold">{selected.length} selected</span>
          <button type="button" onClick={() => setBulkModal('event')} className="inline-flex h-10 items-center gap-2 rounded-full bg-white/10 px-4 text-sm font-semibold hover:bg-white/20">
            <CalendarPlus className="h-4 w-4" aria-hidden /> Add to event
          </button>
          <button type="button" onClick={() => bulk.mutate({ action: 'addToGallery' })} className="inline-flex h-10 items-center gap-2 rounded-full bg-white/10 px-4 text-sm font-semibold hover:bg-white/20">
            <GalleryHorizontalEnd className="h-4 w-4" aria-hidden /> Add to gallery
          </button>
          <button type="button" onClick={() => setBulkModal('tag')} className="inline-flex h-10 items-center gap-2 rounded-full bg-white/10 px-4 text-sm font-semibold hover:bg-white/20">
            <Tag className="h-4 w-4" aria-hidden /> Tag
          </button>
          <button
            type="button"
            onClick={async () => {
              if (await confirm({ title: `Delete ${selected.length} items?`, message: 'They’ll stay in the Trash for 30 days.', danger: true, confirmLabel: 'Move to Trash' })) {
                bulk.mutate({ action: 'delete' });
              }
            }}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-red-600 px-4 text-sm font-semibold hover:bg-red-700"
          >
            <Trash2 className="h-4 w-4" aria-hidden /> Delete
          </button>
          <button type="button" onClick={() => setSelected([])} aria-label="Clear selection" className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/10">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
      )}

      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : visible.length === 0 ? (
        <EmptyState title={items.length ? 'No matches' : 'No photos or videos yet'} text={items.length ? 'Try a different filter or search.' : 'Upload your first photos and videos using the box above.'} />
      ) : (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-6">
          {visible.map((m) => {
            const isSel = selected.includes(m._id);
            return (
              <li key={m._id} className="group relative">
                <button type="button" onClick={() => setOpenId(m._id)} className="block w-full text-left" aria-label={`Open ${m.caption.en || m.type}`}>
                  <MediaThumb asset={m} className={cn(isSel && 'ring-[3px] ring-primary ring-offset-2')} />
                </button>
                <button
                  type="button"
                  onClick={() => toggle(m._id)}
                  aria-pressed={isSel}
                  aria-label={isSel ? 'Unselect' : 'Select'}
                  className={cn(
                    'absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full border-2 transition-opacity',
                    isSel ? 'border-primary bg-primary text-white' : 'border-white bg-navy/30 text-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100',
                    selected.length > 0 && 'opacity-100',
                  )}
                >
                  <Check className="h-4 w-4" aria-hidden />
                </button>
                {(m.caption.en || (m.type === 'image' && !m.alt.en)) && (
                  <p className={cn('mt-1 truncate text-xs', m.type === 'image' && !m.alt.en ? 'font-semibold text-amber-700' : 'text-muted')}>
                    {m.type === 'image' && !m.alt.en ? 'Needs alt text' : m.caption.en}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Modal open={!!openId} onClose={() => setOpenId(null)} title="Photo or video details" size="md">
        {openId && <DetailPanel id={openId} onClose={() => setOpenId(null)} events={events} />}
      </Modal>

      <Modal open={bulkModal !== null} onClose={() => setBulkModal(null)} title={bulkModal === 'tag' ? 'Add tags' : 'Add to an event'} size="sm">
        <form
          className="space-y-4 px-5 pb-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (bulkModal === 'tag') bulk.mutate({ action: 'tag', tags: bulkValue.split(',').map((t) => t.trim()).filter(Boolean) });
            else bulk.mutate({ action: 'addToEvent', eventId: bulkValue });
          }}
        >
          {bulkModal === 'tag' ? (
            <input className="input" autoFocus placeholder="pantry, volunteers" value={bulkValue} onChange={(e) => setBulkValue(e.target.value)} aria-label="Tags, separated by commas" />
          ) : (
            <select className="input" value={bulkValue} onChange={(e) => setBulkValue(e.target.value)} aria-label="Event" required>
              <option value="">Choose an event…</option>
              {events.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.title.en}
                </option>
              ))}
            </select>
          )}
          <Button type="submit" fullWidth disabled={!bulkValue || bulk.isPending}>
            {bulk.isPending ? 'Working…' : 'Apply'}
          </Button>
        </form>
      </Modal>
    </>
  );
}
