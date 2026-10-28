import { useEffect, useState } from 'react';
import { ImagePlus, Plus, Trash2, Home, Pencil, X, FolderOpen } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { adminApi, useAdminMutation, useAdminQuery } from '../lib/hooks';
import type { AdminAlbum, AdminEvent, AdminGalleryItem, AdminProgram, L } from '../lib/types';
import { BilingualField, EmptyState, ListSkeleton, PageTitle, Tabs } from '../components/ui';
import { MediaPicker, ImageField } from '../components/MediaPicker';
import { Sortable } from '../components/Sortable';
import { useConfirm } from '../components/Confirm';
import { cn, imageUrl } from '../../lib/utils';

type Tab = 'photos' | 'albums' | 'homepage';

function ItemEditor({ item, albums, events, programs, onClose }: { item: AdminGalleryItem; albums: AdminAlbum[]; events: AdminEvent[]; programs: AdminProgram[]; onClose: () => void }) {
  const [form, setForm] = useState(item);
  const save = useAdminMutation(() => adminApi.put(`/gallery/${item._id}`, { ...form, _id: undefined, createdAt: undefined, updatedAt: undefined, deletedAt: undefined, __v: undefined }), {
    success: 'Photo saved',
    invalidate: ['/gallery'],
    onSuccess: onClose,
  });
  const select = (label: string, value: string | null | undefined, onChange: (v: string | null) => void, options: { _id?: string; title: L }[]) => (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-navy">{label}</span>
      <select className="input" value={value ?? ''} onChange={(e) => onChange(e.target.value || null)}>
        <option value="">None</option>
        {options.map((o) => (
          <option key={o._id} value={o._id}>
            {o.title.en}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <div className="space-y-4 px-5 pb-5">
      <img src={imageUrl(form.image, 800)} alt="" className="max-h-64 w-full rounded-2xl object-cover" />
      <BilingualField label="Caption" value={form.caption} onChange={(caption) => setForm({ ...form, caption })} />
      <BilingualField label="Alt text" required hint="Describe what’s in the photo." value={form.alt} onChange={(alt) => setForm({ ...form, alt })} />
      <div className="grid gap-3 sm:grid-cols-3">
        {select('Album', form.albumRef, (albumRef) => setForm({ ...form, albumRef }), albums)}
        {select('Event', form.eventRef, (eventRef) => setForm({ ...form, eventRef }), events)}
        {select('Program', form.programRef, (programRef) => setForm({ ...form, programRef }), programs)}
      </div>
      <Button fullWidth onClick={() => save.mutate(undefined)} disabled={save.isPending}>
        {save.isPending ? 'Saving…' : 'Save photo'}
      </Button>
    </div>
  );
}

function AlbumForm({ album, events, onClose }: { album: Partial<AdminAlbum> | null; events: AdminEvent[]; onClose: () => void }) {
  const [title, setTitle] = useState<L>(album?.title ?? { en: '', es: '' });
  const [cover, setCover] = useState(album?.cover ?? '');
  const [eventRef, setEventRef] = useState(album?.eventRef ?? '');
  const save = useAdminMutation(
    () => {
      const body = { title, slug: album?.slug ?? '', cover, eventRef: eventRef || null, order: album?.order ?? 0 };
      return album?._id ? adminApi.put(`/albums/${album._id}`, body) : adminApi.post('/albums', body);
    },
    { success: 'Album saved', invalidate: ['/albums'], onSuccess: onClose },
  );
  return (
    <div className="space-y-4 px-5 pb-5">
      <BilingualField label="Album name" required value={title} onChange={setTitle} placeholder="July 20 pantry fill" />
      <ImageField label="Album cover" url={cover} folder="rise/gallery" onChange={(a) => setCover(a?.url ?? '')} />
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-navy">Event (optional)</span>
        <select className="input" value={eventRef} onChange={(e) => setEventRef(e.target.value)}>
          <option value="">None</option>
          {events.map((e) => (
            <option key={e._id} value={e._id}>
              {e.title.en}
            </option>
          ))}
        </select>
      </label>
      <Button fullWidth onClick={() => save.mutate(undefined)} disabled={!title.en.trim() || save.isPending}>
        Save album
      </Button>
    </div>
  );
}

export default function GalleryManager() {
  const confirm = useConfirm();
  const [tab, setTab] = useState<Tab>('photos');
  const [albumFilter, setAlbumFilter] = useState('');
  const [picker, setPicker] = useState<'add' | 'homepage' | null>(null);
  const [editing, setEditing] = useState<AdminGalleryItem | null>(null);
  const [albumEditing, setAlbumEditing] = useState<Partial<AdminAlbum> | null | undefined>(undefined);
  const { data: items = [], isLoading } = useAdminQuery<AdminGalleryItem[]>('/gallery');
  const { data: albums = [] } = useAdminQuery<AdminAlbum[]>('/albums');
  const { data: events = [] } = useAdminQuery<AdminEvent[]>('/events');
  const { data: programs = [] } = useAdminQuery<AdminProgram[]>('/programs');
  const [order, setOrder] = useState<AdminGalleryItem[]>([]);
  const [homeSlots, setHomeSlots] = useState<string[]>([]);

  useEffect(() => {
    setOrder(items);
    setHomeSlots(
      items
        .filter((i) => i.homepageSlot)
        .sort((a, b) => (a.homepageSlot ?? 0) - (b.homepageSlot ?? 0))
        .map((i) => i._id),
    );
  }, [items]);

  const reorder = useAdminMutation((ids: string[]) => adminApi.post('/gallery/reorder', { ids }), { success: 'Order saved', invalidate: ['/gallery'] });
  const addFromMedia = useAdminMutation((mediaIds: string[]) => adminApi.post('/gallery/from-media', { mediaIds, albumRef: albumFilter || null }), {
    success: 'Photos added to the gallery',
    invalidate: ['/gallery'],
  });
  const remove = useAdminMutation((id: string) => adminApi.del(`/gallery/${id}`), { success: 'Photo removed from gallery', invalidate: ['/gallery'] });
  const removeAlbum = useAdminMutation((id: string) => adminApi.del(`/albums/${id}`), { success: 'Album deleted', invalidate: ['/albums'] });
  const saveHome = useAdminMutation((ids: string[]) => adminApi.put('/gallery/homepage', { ids }), { success: 'Homepage photos saved', invalidate: ['/gallery'] });

  const visible = albumFilter ? order.filter((i) => i.albumRef === albumFilter) : order;
  const toggleHome = (id: string) =>
    setHomeSlots((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= 4 ? s : [...s, id]));

  return (
    <>
      <PageTitle
        title="Gallery"
        intro="The photos shown on the public Gallery page. Group them into albums and pick the four that appear on the homepage."
        actions={
          tab === 'albums' ? (
            <Button onClick={() => setAlbumEditing(null)}>
              <Plus className="h-5 w-5" aria-hidden /> New album
            </Button>
          ) : (
            <Button onClick={() => setPicker('add')}>
              <ImagePlus className="h-5 w-5" aria-hidden /> Add photos
            </Button>
          )
        }
      />
      <Tabs
        label="Gallery sections"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'photos', label: 'All photos', count: items.length },
          { value: 'albums', label: 'Albums', count: albums.length },
          { value: 'homepage', label: 'Homepage row' },
        ]}
      />

      {isLoading ? (
        <ListSkeleton />
      ) : tab === 'photos' ? (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <select className="input h-10 w-auto" value={albumFilter} onChange={(e) => setAlbumFilter(e.target.value)} aria-label="Show album">
              <option value="">All albums</option>
              {albums.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.title.en}
                </option>
              ))}
            </select>
            {!albumFilter && order.map((o) => o._id).join() !== items.map((o) => o._id).join() && (
              <Button size="sm" onClick={() => reorder.mutate(order.map((o) => o._id))} disabled={reorder.isPending}>
                Save new order
              </Button>
            )}
          </div>
          {visible.length === 0 ? (
            <EmptyState title="No photos in the gallery yet" text="Add photos from the Media Library or upload new ones." action={<Button onClick={() => setPicker('add')}>Add photos</Button>} />
          ) : albumFilter ? (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {visible.map((item) => (
                <li key={item._id}>
                  <GalleryTile item={item} onEdit={() => setEditing(item)} onDelete={async () => (await confirm({ title: 'Remove this photo from the gallery?', message: 'The file stays in your Media Library.', danger: true, confirmLabel: 'Remove' })) && remove.mutate(item._id)} />
                </li>
              ))}
            </ul>
          ) : (
            <Sortable
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
              items={order}
              getId={(i) => i._id}
              onReorder={setOrder}
              renderItem={(item) => (
                <GalleryTile
                  item={item}
                  onEdit={() => setEditing(item)}
                  onDelete={async () => (await confirm({ title: 'Remove this photo from the gallery?', message: 'The file stays in your Media Library.', danger: true, confirmLabel: 'Remove' })) && remove.mutate(item._id)}
                />
              )}
            />
          )}
        </>
      ) : tab === 'albums' ? (
        albums.length === 0 ? (
          <EmptyState icon={<FolderOpen className="h-10 w-10" />} title="No albums yet" text="Albums group photos — usually one per event." action={<Button onClick={() => setAlbumEditing(null)}>Create an album</Button>} />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {albums.map((a) => (
              <li key={a._id} className="overflow-hidden rounded-card bg-white shadow-soft ring-1 ring-navy/5">
                <div className="aspect-[4/3] bg-card">{a.cover && <img src={imageUrl(a.cover, 500, 375)} alt="" className="h-full w-full object-cover" />}</div>
                <div className="flex items-center gap-2 p-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-serif text-lg font-bold text-navy">{a.title.en}</h2>
                    <p className="text-sm text-muted">{items.filter((i) => i.albumRef === a._id).length} photos</p>
                  </div>
                  <button type="button" onClick={() => setAlbumEditing(a)} aria-label={`Edit ${a.title.en}`} className="grid h-10 w-10 place-items-center rounded-full hover:bg-card">
                    <Pencil className="h-4 w-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={async () => (await confirm({ title: `Delete album “${a.title.en}”?`, message: 'Photos stay in the gallery; they just won’t be grouped.', danger: true, confirmLabel: 'Delete album' })) && removeAlbum.mutate(a._id)}
                    aria-label={`Delete ${a.title.en}`}
                    className="grid h-10 w-10 place-items-center rounded-full text-red-700 hover:bg-card"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : (
        <>
          <p className="mb-4 text-muted">
            Tap photos to choose the <b>4</b> shown in “Community in action” on the homepage, in order. The first one gets the arched top.
          </p>
          <div className="mb-5 grid grid-cols-4 gap-2 rounded-card bg-white p-3 ring-1 ring-navy/5 sm:gap-3">
            {[0, 1, 2, 3].map((i) => {
              const item = items.find((x) => x._id === homeSlots[i]);
              return (
                <div key={i} className={cn('relative aspect-[3/4] overflow-hidden bg-card', i === 0 ? 'rounded-[999px_999px_16px_16px]' : 'rounded-2xl')}>
                  {item ? (
                    <>
                      <img src={imageUrl(item.image, 300, 400)} alt="" className="h-full w-full object-cover" />
                      <button type="button" onClick={() => toggleHome(item._id)} aria-label={`Remove from spot ${i + 1}`} className="absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-navy">
                        <X className="h-4 w-4" aria-hidden />
                      </button>
                    </>
                  ) : (
                    <span className="grid h-full place-items-center text-sm font-bold text-navy/40">{i + 1}</span>
                  )}
                </div>
              );
            })}
          </div>
          <Button className="mb-6" onClick={() => saveHome.mutate(homeSlots)} disabled={saveHome.isPending}>
            <Home className="h-5 w-5" aria-hidden /> Save homepage photos
          </Button>
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {items.map((item) => {
              const pos = homeSlots.indexOf(item._id);
              return (
                <li key={item._id}>
                  <button
                    type="button"
                    onClick={() => toggleHome(item._id)}
                    aria-pressed={pos >= 0}
                    aria-label={pos >= 0 ? `Spot ${pos + 1}: ${item.caption.en}` : `Choose ${item.caption.en || 'photo'}`}
                    disabled={pos < 0 && homeSlots.length >= 4}
                    className={cn('relative block w-full overflow-hidden rounded-2xl disabled:opacity-40', pos >= 0 && 'ring-[3px] ring-primary ring-offset-2')}
                  >
                    <img src={imageUrl(item.image, 300, 300)} alt="" className="aspect-square w-full object-cover" loading="lazy" />
                    {pos >= 0 && <span className="absolute left-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-primary text-sm font-bold text-white">{pos + 1}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <MediaPicker open={picker === 'add'} onClose={() => setPicker(null)} multiple type="image" folder="rise/gallery" onPick={(assets) => addFromMedia.mutate(assets.map((a) => a._id))} title="Add photos to the gallery" />
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit gallery photo">
        {editing && <ItemEditor item={editing} albums={albums} events={events} programs={programs} onClose={() => setEditing(null)} />}
      </Modal>
      <Modal open={albumEditing !== undefined} onClose={() => setAlbumEditing(undefined)} title={albumEditing?._id ? 'Edit album' : 'New album'} size="sm">
        {albumEditing !== undefined && <AlbumForm album={albumEditing} events={events} onClose={() => setAlbumEditing(undefined)} />}
      </Modal>
    </>
  );
}

function GalleryTile({ item, onEdit, onDelete }: { item: AdminGalleryItem; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-navy/5">
      <button type="button" onClick={onEdit} className="block w-full" aria-label={`Edit ${item.caption.en || 'photo'}`}>
        <img src={imageUrl(item.image, 400, 400)} alt={item.alt.en} className="aspect-square w-full object-cover" loading="lazy" />
      </button>
      <div className="flex items-center gap-1 p-2">
        <span className="min-w-0 flex-1 truncate text-xs text-muted">{item.caption.en || 'No caption'}</span>
        {item.homepageSlot && <Home className="h-4 w-4 text-primary" aria-label="On homepage" />}
        <button type="button" onClick={onDelete} aria-label="Remove from gallery" className="grid h-8 w-8 place-items-center rounded-full text-red-700 hover:bg-card">
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
