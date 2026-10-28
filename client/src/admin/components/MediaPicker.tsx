import { useMemo, useState } from 'react';
import { Check, Link2, Search } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useAdminMutation, useAdminQuery, adminApi } from '../lib/hooks';
import type { MediaAsset } from '../lib/types';
import type { UploadFolder } from '../lib/upload';
import { Uploader } from './Uploader';
import { MediaThumb } from './MediaThumb';
import { Tabs } from './ui';
import { cn } from '../../lib/utils';

interface MediaPickerProps {
  open: boolean;
  onClose: () => void;
  onPick: (assets: MediaAsset[]) => void;
  type?: 'image' | 'video' | 'all';
  multiple?: boolean;
  folder?: UploadFolder;
  eventRef?: string | null;
  title?: string;
}

/** Choose from the Media Library, upload new files, or paste a YouTube/Vimeo link. */
export function MediaPicker({ open, onClose, onPick, type = 'image', multiple, folder, eventRef, title }: MediaPickerProps) {
  const [tab, setTab] = useState<'library' | 'upload' | 'link'>('library');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [link, setLink] = useState('');
  const query = type === 'all' ? '' : `type=${type}`;
  const { data: items = [], isLoading } = useAdminQuery<MediaAsset[]>(`/media?${query}`, { enabled: open });

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? items.filter((m) => `${m.caption.en} ${m.caption.es} ${m.tags.join(' ')}`.toLowerCase().includes(s)) : items;
  }, [items, q]);

  const embed = useAdminMutation((url: string) => adminApi.post<MediaAsset>('/media/embed', { url, caption: { en: '', es: '' }, eventRef }), {
    invalidate: [['admin']],
    success: 'Video link added',
    onSuccess: (asset) => finish([asset]),
  });

  const finish = (assets: MediaAsset[]) => {
    if (!assets.length) return;
    onPick(multiple ? assets : assets.slice(0, 1));
    setSelected([]);
    setLink('');
    onClose();
  };

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : multiple ? [...s, id] : [id]));

  const tabs = [
    { value: 'library' as const, label: 'Media Library' },
    { value: 'upload' as const, label: 'Upload new' },
    ...(type !== 'image' ? [{ value: 'link' as const, label: 'YouTube / Vimeo link' }] : []),
  ];

  return (
    <Modal open={open} onClose={onClose} title={title ?? (type === 'video' ? 'Choose a video' : multiple ? 'Choose photos' : 'Choose a photo')} size="lg">
      <div className="px-5 pb-5">
        <Tabs tabs={tabs} value={tab} onChange={setTab} label="How to add media" />

        {tab === 'library' && (
          <>
            <div className="relative mb-4">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
              <input className="input pl-11" placeholder="Search by caption or tag" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search media" />
            </div>
            {isLoading ? (
              <p className="py-10 text-center text-muted">Loading…</p>
            ) : filtered.length === 0 ? (
              <p className="py-10 text-center text-muted">Nothing here yet. Use “Upload new” to add files.</p>
            ) : (
              <ul className="grid max-h-[50vh] grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4 md:grid-cols-5">
                {filtered.map((m) => {
                  const isSel = selected.includes(m._id);
                  return (
                    <li key={m._id}>
                      <button
                        type="button"
                        onClick={() => toggle(m._id)}
                        aria-pressed={isSel}
                        aria-label={m.caption.en || m.alt.en || `${m.type} ${m.format}`}
                        className={cn('relative block w-full rounded-2xl ring-offset-2', isSel && 'ring-[3px] ring-primary')}
                      >
                        <MediaThumb asset={m} />
                        {isSel && (
                          <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-primary text-white">
                            <Check className="h-4 w-4" aria-hidden />
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="mt-5 flex items-center justify-between gap-3">
              <span className="text-sm text-muted">{selected.length ? `${selected.length} selected` : multiple ? 'Tap to select one or more' : 'Tap to select'}</span>
              <Button disabled={!selected.length} onClick={() => finish(items.filter((m) => selected.includes(m._id)))}>
                {multiple ? `Add ${selected.length || ''}` : 'Use this'}
              </Button>
            </div>
          </>
        )}

        {tab === 'upload' && (
          <Uploader
            folder={folder}
            eventRef={eventRef}
            accept={type === 'all' ? 'all' : type}
            onBatchDone={(assets) => finish(assets)}
          />
        )}

        {tab === 'link' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (link.trim()) embed.mutate(link.trim());
            }}
            className="space-y-4"
          >
            <label className="block">
              <span className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-navy">
                <Link2 className="h-4 w-4" aria-hidden /> Paste a YouTube or Vimeo link
              </span>
              <input className="input" type="url" placeholder="https://www.youtube.com/watch?v=…" value={link} onChange={(e) => setLink(e.target.value)} />
            </label>
            <Button type="submit" disabled={!link.trim() || embed.isPending}>
              {embed.isPending ? 'Adding…' : 'Add video link'}
            </Button>
          </form>
        )}
      </div>
    </Modal>
  );
}

/** Small "image field" used in forms: preview + Change / Remove. */
export function ImageField({
  label,
  url,
  onChange,
  folder,
  hint,
}: {
  label: string;
  url: string;
  onChange: (asset: MediaAsset | null) => void;
  folder?: UploadFolder;
  hint?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <span className="text-sm font-semibold text-navy">{label}</span>
      {hint && <p className="text-xs text-muted">{hint}</p>}
      <div className="mt-2 flex items-center gap-4">
        <div className="h-24 w-32 shrink-0 overflow-hidden rounded-2xl bg-card">
          {url && <img src={url.includes('cloudinary') ? url.replace('/upload/', '/upload/f_auto,q_auto,w_300/') : url} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button size="sm" variant="outline-navy" onClick={() => setOpen(true)}>
            {url ? 'Change' : 'Choose photo'}
          </Button>
          {url && (
            <Button size="sm" variant="ghost" onClick={() => onChange(null)}>
              Remove
            </Button>
          )}
        </div>
      </div>
      <MediaPicker open={open} onClose={() => setOpen(false)} onPick={(a) => onChange(a[0])} folder={folder} />
    </div>
  );
}

/** Video field: preview poster + Change / Remove, accepts uploads or links. */
export function VideoField({
  label,
  value,
  onChange,
  folder,
  hint,
}: {
  label: string;
  value: { url: string; poster: string; duration?: number };
  onChange: (asset: MediaAsset | null) => void;
  folder?: UploadFolder;
  hint?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <span className="text-sm font-semibold text-navy">{label}</span>
      {hint && <p className="text-xs text-muted">{hint}</p>}
      <div className="mt-2 flex items-center gap-4">
        <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-2xl bg-navy">
          {value.poster && <img src={value.poster} alt="" className="h-full w-full object-cover opacity-80" />}
          {!value.url && <span className="absolute inset-0 grid place-items-center text-xs text-white/70">No video</span>}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button size="sm" variant="outline-navy" onClick={() => setOpen(true)}>
            {value.url ? 'Change video' : 'Choose video'}
          </Button>
          {value.url && (
            <Button size="sm" variant="ghost" onClick={() => onChange(null)}>
              Remove
            </Button>
          )}
        </div>
      </div>
      <MediaPicker open={open} onClose={() => setOpen(false)} onPick={(a) => onChange(a[0])} type="video" folder={folder} />
    </div>
  );
}
