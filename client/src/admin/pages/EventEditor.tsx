import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Copy, Eye, ImagePlus, Film, Trash2, ExternalLink, Star, LayoutTemplate, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { adminApi, useAdminMutation, useAdminQuery } from '../lib/hooks';
import type { AdminEvent, AdminPhoto, AdminVideo, MediaAsset, EventStatus } from '../lib/types';
import { BilingualField, Card, ListSkeleton, PageTitle, SaveBar, TextInput, Toggle, StatusChip } from '../components/ui';
import { RichText } from '../components/RichText';
import { ImageField, MediaPicker } from '../components/MediaPicker';
import { Sortable } from '../components/Sortable';
import { useConfirm } from '../components/Confirm';
import { isSame, useUnsavedChanges } from '../components/useUnsavedChanges';
import { cn, formatDuration, imageUrl } from '../../lib/utils';

const EMPTY: AdminEvent = {
  title: { en: '', es: '' },
  slug: '',
  date: new Date().toISOString().slice(0, 10),
  startTime: '',
  endTime: '',
  locationName: '',
  address: '',
  city: '',
  eventType: 'community-meal',
  summary: { en: '', es: '' },
  body: { en: '', es: '' },
  coverImage: { url: '', alt: { en: '', es: '' } },
  gallery: [],
  videos: [],
  featured: false,
  status: 'draft',
  publishAt: null,
  volunteerSignup: { enabled: false, capacity: 0 },
};

const toSlug = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const photoFrom = (a: MediaAsset): AdminPhoto => ({ url: a.url, media: a._id, alt: a.alt, caption: a.caption, width: a.width, height: a.height });
const videoFrom = (a: MediaAsset, isMain: boolean): AdminVideo => ({
  url: a.url,
  media: a._id,
  kind: a.type === 'embed' ? 'embed' : 'file',
  caption: a.caption,
  duration: a.duration,
  poster: a.posterUrl,
  orientation: a.orientation,
  isMain,
});

/** Normalizes a loaded event for the form (date → YYYY-MM-DD, etc.). */
const fromServer = (e: AdminEvent): AdminEvent => ({
  ...EMPTY,
  ...e,
  date: e.date.slice(0, 10),
  publishAt: e.publishAt ? e.publishAt.slice(0, 16) : null,
  coverImage: { ...EMPTY.coverImage, ...e.coverImage },
});

const toServer = (e: AdminEvent) => {
  const { mapsUrl: _m, photoCount: _p, _id: _i, ...rest } = e;
  return {
    ...rest,
    date: `${e.date}T12:00:00`,
    publishAt: e.status === 'scheduled' && e.publishAt ? new Date(e.publishAt).toISOString() : null,
    coverImage: { ...e.coverImage, media: e.coverImage.media || null },
  };
};

function Step({ n, title, children, description }: { n: number; title: string; description?: string; children: ReactNode }) {
  return (
    <Card>
      <div className="mb-5 flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary font-serif font-black text-white">{n}</span>
        <div>
          <h2 className="font-serif text-xl">{title}</h2>
          {description && <p className="text-sm text-muted">{description}</p>}
        </div>
      </div>
      {children}
    </Card>
  );
}

export default function EventEditor() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { data: loaded, isLoading } = useAdminQuery<AdminEvent>(`/events/${id}`, { enabled: !isNew });
  const [form, setForm] = useState<AdminEvent>(EMPTY);
  const [initial, setInitial] = useState<AdminEvent>(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [picker, setPicker] = useState<'photos' | 'videos' | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<number | null>(null);

  useEffect(() => {
    if (loaded) {
      const f = fromServer(loaded);
      setForm(f);
      setInitial(f);
      setSlugTouched(true);
    }
  }, [loaded]);

  const dirty = !isSame(form, initial);
  const allowNavigation = useUnsavedChanges(dirty);

  const set = <K extends keyof AdminEvent>(k: K, v: AdminEvent[K]) => setForm((f) => ({ ...f, [k]: v }));

  const save = useAdminMutation(
    (data: AdminEvent) =>
      isNew
        ? adminApi.post<{ event: AdminEvent; unfeatured: string[] }>('/events', toServer(data))
        : adminApi.put<{ event: AdminEvent; unfeatured: string[] }>(`/events/${id}`, toServer(data)),
    {
      invalidate: [['admin']],
      success: (r) => (r.event.status === 'published' ? 'Event saved and published' : 'Event saved'),
      onSuccess: (r) => {
        if (r.unfeatured.length) {
          toast(`Only 2 events can be featured. “${r.unfeatured.join('”, “')}” was removed from the homepage.`, { icon: '⭐', duration: 6000 });
        }
        const f = fromServer(r.event);
        setForm(f);
        setInitial(f);
        if (isNew) {
          allowNavigation();
          navigate(`/admin/events/${r.event._id}`, { replace: true });
        }
      },
    },
  );

  const duplicate = useAdminMutation(() => adminApi.post<AdminEvent>(`/events/${id}/duplicate`), {
    invalidate: [['admin']],
    success: 'Copy created as a draft',
    onSuccess: (copy) => {
      allowNavigation();
      navigate(`/admin/events/${copy._id}`);
    },
  });
  const remove = useAdminMutation(() => adminApi.del(`/events/${id}`), {
    invalidate: [['admin']],
    success: 'Event moved to Trash',
    onSuccess: () => {
      allowNavigation();
      navigate('/admin/events');
    },
  });
  const addHomepageCard = useAdminMutation(
    (p: AdminPhoto) =>
      adminApi.post('/impact-cards', {
        title: p.caption.en ? p.caption : form.title,
        description: { en: '', es: '' },
        image: p.url,
        imageAlt: p.alt,
        dateLabel: {
          en: new Date(`${form.date}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
          es: new Date(`${form.date}T12:00:00`).toLocaleDateString('es-US', { month: 'long', day: 'numeric' }),
        },
        eventRef: id,
        order: 99,
      }),
    { success: 'Added to “Where your donation goes”. Edit its text in Homepage.', invalidate: [['admin']] },
  );

  const validate = () => {
    if (!form.title.en.trim()) return 'Please add a title in English (step 1)';
    if (!form.date) return 'Please choose a date (step 1)';
    if (form.status === 'scheduled' && !form.publishAt) return 'Please choose when to publish (step 6)';
    const missingAlt = form.gallery.findIndex((p) => !p.alt.en.trim());
    if (form.status !== 'draft' && missingAlt >= 0) return `Photo ${missingAlt + 1} needs alt text before publishing (step 4)`;
    return null;
  };

  const onSave = () => {
    const err = validate();
    if (err) return toast.error(err);
    save.mutate(form);
  };

  const onPreview = async () => {
    if (isNew || dirty) {
      const err = validate();
      if (err) return toast.error(err);
      toast('Saving first so the preview is up to date…');
      const r = await save.mutateAsync(form);
      window.open(`/admin/events/${r.event._id}/preview`, '_blank', 'noopener');
      return;
    }
    window.open(`/admin/events/${id}/preview`, '_blank', 'noopener');
  };

  const mapsUrl = useMemo(() => {
    const q = [form.locationName, form.address, form.city].filter(Boolean).join(', ');
    return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : '';
  }, [form.locationName, form.address, form.city]);

  if (!isNew && isLoading) return <ListSkeleton rows={5} />;

  const photo = editingPhoto != null ? form.gallery[editingPhoto] : null;
  const isPast = new Date(`${form.date}T23:59:59`) < new Date();

  return (
    <>
      <PageTitle
        title={isNew ? 'New event' : form.title.en || 'Edit event'}
        intro={isNew ? 'Fill in the steps below. You can save as a draft at any time.' : undefined}
        actions={
          <>
            <Button variant="outline-navy" size="sm" className="h-11" onClick={onPreview}>
              <Eye className="h-4 w-4" aria-hidden /> Preview
            </Button>
            {!isNew && (
              <>
                <Button variant="outline-navy" size="sm" className="h-11" onClick={() => duplicate.mutate(undefined)}>
                  <Copy className="h-4 w-4" aria-hidden /> Duplicate
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-11 !text-red-700"
                  onClick={async () => {
                    if (await confirm({ title: 'Delete this event?', message: 'It will be removed from the website and kept in the Trash for 30 days.', danger: true, confirmLabel: 'Move to Trash' })) {
                      remove.mutate(undefined);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" aria-hidden /> Delete
                </Button>
              </>
            )}
          </>
        }
      />

      <div className="space-y-5">
        <Step n={1} title="Basics">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <BilingualField
                label="Event title"
                required
                value={form.title}
                onChange={(title) => setForm((f) => ({ ...f, title, slug: slugTouched ? f.slug : toSlug(title.en) }))}
                placeholder="Community meal"
              />
            </div>
            <TextInput label="Date" type="date" required value={form.date} onChange={(e) => set('date', e.target.value)} />
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-navy" htmlFor="event-type">
                Type of event
              </label>
              <select id="event-type" className="input" value={form.eventType} onChange={(e) => set('eventType', e.target.value as AdminEvent['eventType'])}>
                <option value="community-meal">Community meal</option>
                <option value="pantry-fill">Pantry fill</option>
                <option value="clothing-drive">Clothing drive</option>
                <option value="other">Other</option>
              </select>
            </div>
            <TextInput label="Start time" type="time" value={form.startTime} onChange={(e) => set('startTime', e.target.value)} />
            <TextInput label="End time" type="time" value={form.endTime} onChange={(e) => set('endTime', e.target.value)} />
            <TextInput label="Place name" placeholder="Catfish King" value={form.locationName} onChange={(e) => set('locationName', e.target.value)} />
            <TextInput label="Street address" placeholder="1401 S Jefferson Ave" value={form.address} onChange={(e) => set('address', e.target.value)} />
            <TextInput label="City" placeholder="Mount Pleasant TX" value={form.city} onChange={(e) => set('city', e.target.value)} />
            <div className="flex items-end">
              {mapsUrl && (
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center gap-2 font-semibold text-primary">
                  Check on Google Maps <ExternalLink className="h-4 w-4" aria-hidden />
                </a>
              )}
            </div>
            <div className="sm:col-span-2">
              <TextInput
                label="Web address"
                hint="Made automatically from the title. Only change it if you need to."
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set('slug', toSlug(e.target.value));
                }}
              />
              <p className="mt-1 text-xs text-muted">riseorg.org/events/{form.slug || '…'}</p>
            </div>
          </div>
        </Step>

        <Step n={2} title="Description">
          <div className="space-y-5">
            <BilingualField label="Short summary" hint="One or two sentences shown on event cards." multiline rows={2} maxLength={600} value={form.summary} onChange={(v) => set('summary', v)} />
            <RichText label="Full description" value={form.body} onChange={(v) => set('body', v)} />
          </div>
        </Step>

        <Step n={3} title="Cover image" description="The big photo at the top of the event page and on cards.">
          <ImageField
            label="Cover photo"
            url={form.coverImage.url}
            folder="rise/events"
            onChange={(a) => set('coverImage', a ? { url: a.url, media: a._id, alt: a.alt, width: a.width, height: a.height } : { url: '', alt: { en: '', es: '' } })}
          />
          {form.coverImage.url && (
            <div className="mt-4">
              <BilingualField label="Cover photo alt text" hint="Describe the photo for screen readers." value={form.coverImage.alt} onChange={(alt) => set('coverImage', { ...form.coverImage, alt })} />
            </div>
          )}
        </Step>

        <Step n={4} title="Photos" description="Add as many as you like. Drag to reorder. Tap a photo to add a caption.">
          <Button variant="outline-navy" onClick={() => setPicker('photos')}>
            <ImagePlus className="h-5 w-5" aria-hidden /> Add photos
          </Button>
          {form.gallery.length > 0 && (
            <Sortable
              className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
              items={form.gallery}
              getId={(p) => p._id ?? p.url}
              onReorder={(gallery) => set('gallery', gallery)}
              renderItem={(p, i) => (
                <div className="overflow-hidden rounded-2xl bg-card">
                  <button type="button" onClick={() => setEditingPhoto(i)} className="block w-full" aria-label={`Edit photo ${i + 1}`}>
                    <img src={imageUrl(p.url, 400, 300)} alt={p.alt.en} className="aspect-[4/3] w-full object-cover" loading="lazy" />
                  </button>
                  <div className="flex items-center gap-1 p-2">
                    <span className={cn('min-w-0 flex-1 truncate text-xs', p.alt.en ? 'text-muted' : 'font-semibold text-amber-700')}>
                      {p.caption.en || (p.alt.en ? p.alt.en : 'Needs alt text')}
                    </span>
                    <button
                      type="button"
                      onClick={() => addHomepageCard.mutate(p)}
                      disabled={isNew}
                      title={isNew ? 'Save the event first' : 'Use on homepage “Where your donation goes”'}
                      aria-label="Use on homepage card"
                      className="grid h-8 w-8 place-items-center rounded-full text-primary hover:bg-white disabled:opacity-40"
                    >
                      <LayoutTemplate className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => set('gallery', form.gallery.filter((_, j) => j !== i))}
                      aria-label={`Remove photo ${i + 1}`}
                      className="grid h-8 w-8 place-items-center rounded-full text-red-700 hover:bg-white"
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </div>
              )}
            />
          )}
          <p className="mt-3 text-xs text-muted">
            <LayoutTemplate className="mr-1 inline h-3.5 w-3.5" aria-hidden />
            Tap this icon on a photo to show it on the homepage “Where your donation goes” cards.
          </p>
        </Step>

        <Step n={5} title="Videos" description="Upload a video, pick one from the library, or paste a YouTube/Vimeo link.">
          <Button variant="outline-navy" onClick={() => setPicker('videos')}>
            <Film className="h-5 w-5" aria-hidden /> Add video
          </Button>
          {form.videos.length > 0 && (
            <ul className="mt-5 space-y-3">
              {form.videos.map((v, i) => (
                <li key={v._id ?? v.url} className="flex flex-col gap-3 rounded-2xl bg-card p-3 sm:flex-row sm:items-center">
                  <div className="relative h-20 w-full shrink-0 overflow-hidden rounded-xl bg-navy sm:w-32">
                    {v.poster && <img src={v.poster} alt="" className="h-full w-full object-cover" />}
                    <span className="absolute bottom-1 right-1 rounded bg-navy/80 px-1.5 text-[11px] font-bold text-white">
                      {formatDuration(v.duration) || (v.kind === 'embed' ? 'Link' : '')}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <BilingualField
                      label="Caption"
                      value={v.caption}
                      onChange={(caption) => set('videos', form.videos.map((x, j) => (j === i ? { ...x, caption } : x)))}
                    />
                  </div>
                  <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                    <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-navy">
                      <input
                        type="radio"
                        name="main-video"
                        checked={v.isMain}
                        onChange={() => set('videos', form.videos.map((x, j) => ({ ...x, isMain: j === i })))}
                        className="h-4 w-4 accent-primary"
                      />
                      Main video
                    </label>
                    <button
                      type="button"
                      onClick={() => set('videos', form.videos.filter((_, j) => j !== i))}
                      className="ml-auto inline-flex h-9 items-center gap-1 rounded-full px-3 text-sm font-semibold text-red-700 hover:bg-white"
                    >
                      <X className="h-4 w-4" aria-hidden /> Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Step>

        <Step n={6} title="Visibility">
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-navy">Who can see this event?</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {(
                [
                  ['draft', 'Draft', 'Only admins can see it'],
                  ['published', 'Published', 'Live on the website now'],
                  ['scheduled', 'Scheduled', 'Goes live at a set time'],
                ] as [EventStatus, string, string][]
              ).map(([value, label, desc]) => (
                <label
                  key={value}
                  className={cn(
                    'cursor-pointer rounded-2xl p-4 ring-1 transition-colors has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-primary',
                    form.status === value ? 'bg-card ring-2 ring-navy' : 'ring-navy/15 hover:ring-navy/40',
                  )}
                >
                  <input type="radio" name="status" value={value} checked={form.status === value} onChange={() => set('status', value)} className="sr-only" />
                  <StatusChip status={value} label={label} />
                  <span className="mt-2 block text-sm text-muted">{desc}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {form.status === 'scheduled' && (
            <TextInput
              className="mt-4 max-w-xs"
              label="Publish on"
              type="datetime-local"
              value={form.publishAt ?? ''}
              onChange={(e) => set('publishAt', e.target.value)}
            />
          )}
          <div className="mt-6 space-y-5 border-t border-navy/10 pt-5">
            <Toggle
              label="Feature on homepage"
              description="Featured events appear in the “This summer” section. Up to 2 at a time — featuring a third removes the oldest."
              checked={form.featured}
              onChange={(v) => set('featured', v)}
            />
            <Toggle
              label="Volunteer sign-up"
              description={isPast ? 'This event is in the past, so sign-up won’t show.' : 'Shows a “Volunteer at this event” button on the event page.'}
              checked={form.volunteerSignup.enabled}
              onChange={(enabled) => set('volunteerSignup', { ...form.volunteerSignup, enabled })}
            />
            {form.volunteerSignup.enabled && (
              <TextInput
                className="max-w-xs"
                label="How many volunteers?"
                hint="0 means no limit"
                type="number"
                min={0}
                value={form.volunteerSignup.capacity}
                onChange={(e) => set('volunteerSignup', { ...form.volunteerSignup, capacity: Math.max(0, Number(e.target.value)) })}
              />
            )}
          </div>
        </Step>
      </div>

      <SaveBar
        dirty={dirty || isNew}
        saving={save.isPending}
        onSave={onSave}
        label={form.status === 'published' ? 'Save & publish' : form.status === 'scheduled' ? 'Save & schedule' : 'Save draft'}
        extra={form.featured ? <Star className="h-5 w-5 fill-gold text-gold" aria-label="Featured" /> : undefined}
      />

      <MediaPicker
        open={picker === 'photos'}
        onClose={() => setPicker(null)}
        multiple
        type="image"
        folder="rise/events"
        eventRef={id}
        title="Add photos to this event"
        onPick={(assets) => {
          const existing = new Set(form.gallery.map((g) => g.url));
          set('gallery', [...form.gallery, ...assets.filter((a) => !existing.has(a.url)).map(photoFrom)]);
        }}
      />
      <MediaPicker
        open={picker === 'videos'}
        onClose={() => setPicker(null)}
        type="video"
        folder="rise/events"
        eventRef={id}
        title="Add a video"
        onPick={(assets) => set('videos', [...form.videos, ...assets.map((a, i) => videoFrom(a, form.videos.length === 0 && i === 0))])}
      />

      {photo && editingPhoto != null && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-navy/60 sm:place-items-center" role="dialog" aria-modal="true" aria-label="Photo details">
          <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-card bg-white p-5 sm:max-w-lg sm:rounded-card">
            <img src={imageUrl(photo.url, 800)} alt="" className="max-h-64 w-full rounded-2xl object-cover" />
            <div className="mt-4 space-y-4">
              <BilingualField
                label="Caption"
                value={photo.caption}
                onChange={(caption) => set('gallery', form.gallery.map((g, j) => (j === editingPhoto ? { ...g, caption } : g)))}
              />
              <BilingualField
                label="Alt text"
                required
                hint="Describe what’s in the photo."
                value={photo.alt}
                onChange={(alt) => set('gallery', form.gallery.map((g, j) => (j === editingPhoto ? { ...g, alt } : g)))}
              />
            </div>
            <Button fullWidth className="mt-5" onClick={() => setEditingPhoto(null)}>
              Done
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
