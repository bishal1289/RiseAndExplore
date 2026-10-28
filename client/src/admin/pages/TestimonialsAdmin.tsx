import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Quote } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { adminApi, useAdminMutation, useAdminQuery } from '../lib/hooks';
import type { AdminTestimonial } from '../lib/types';
import { stripMeta } from '../lib/strip';
import { BilingualField, EmptyState, ListSkeleton, PageTitle, TextInput, Toggle, StatusChip } from '../components/ui';
import { ImageField, VideoField } from '../components/MediaPicker';
import { Sortable } from '../components/Sortable';
import { useConfirm } from '../components/Confirm';

const EMPTY: AdminTestimonial = {
  quote: { en: '', es: '' },
  name: '',
  organization: { en: '', es: '' },
  videoUrl: '',
  poster: '',
  duration: 0,
  videoCaption: { en: '', es: '' },
  published: true,
  order: 0,
};

function TestimonialForm({ item, onClose }: { item: AdminTestimonial; onClose: () => void }) {
  const [form, setForm] = useState(item);
  const save = useAdminMutation(
    () => (form._id ? adminApi.put(`/testimonials/${form._id}`, stripMeta(form)) : adminApi.post('/testimonials', stripMeta(form))),
    { success: 'Testimonial saved', invalidate: ['/testimonials'], onSuccess: onClose },
  );
  return (
    <div className="space-y-4 px-5 pb-5">
      <BilingualField label="Quote" required multiline rows={3} value={form.quote} onChange={(quote) => setForm({ ...form, quote })} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput label="Person’s name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <BilingualField label="Organization" value={form.organization} onChange={(organization) => setForm({ ...form, organization })} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <VideoField
          label="Video (optional)"
          value={{ url: form.videoUrl, poster: form.poster }}
          folder="rise/testimonials"
          onChange={(a) => setForm({ ...form, videoUrl: a?.url ?? '', poster: a?.posterUrl || form.poster, duration: a?.duration ?? 0 })}
        />
        <ImageField label="Poster photo" hint="Shown before the video plays (or alone if there’s no video)." url={form.poster} folder="rise/testimonials" onChange={(a) => setForm({ ...form, poster: a?.url ?? '' })} />
      </div>
      {form.videoUrl && <BilingualField label="Video caption" hint="e.g. “A thank-you from CIS Greater Tarrant County”" value={form.videoCaption} onChange={(videoCaption) => setForm({ ...form, videoCaption })} />}
      <Toggle label="Show on website" checked={form.published} onChange={(published) => setForm({ ...form, published })} />
      <Button fullWidth onClick={() => save.mutate(undefined)} disabled={!form.quote.en.trim() || !form.name.trim() || save.isPending}>
        {save.isPending ? 'Saving…' : 'Save testimonial'}
      </Button>
    </div>
  );
}

export default function TestimonialsAdmin() {
  const confirm = useConfirm();
  const { data: items = [], isLoading } = useAdminQuery<AdminTestimonial[]>('/testimonials');
  const [order, setOrder] = useState<AdminTestimonial[]>([]);
  const [editing, setEditing] = useState<AdminTestimonial | null>(null);
  useEffect(() => setOrder(items), [items]);
  const remove = useAdminMutation((id: string) => adminApi.del(`/testimonials/${id}`), { success: 'Testimonial moved to Trash', invalidate: ['/testimonials'] });
  const reorder = useAdminMutation((ids: string[]) => adminApi.post('/testimonials/reorder', { ids }), { success: 'Order saved', invalidate: ['/testimonials'] });

  return (
    <>
      <PageTitle
        title="Testimonials"
        intro="Quotes from partners. If there’s more than one, the homepage shows them as a slideshow."
        actions={
          <Button onClick={() => setEditing({ ...EMPTY, order: items.length })}>
            <Plus className="h-5 w-5" aria-hidden /> New testimonial
          </Button>
        }
      />
      {isLoading ? (
        <ListSkeleton />
      ) : items.length === 0 ? (
        <EmptyState icon={<Quote className="h-10 w-10" />} title="No testimonials yet" action={<Button onClick={() => setEditing(EMPTY)}>Add a testimonial</Button>} />
      ) : (
        <Sortable
          layout="list"
          className="space-y-3"
          items={order}
          getId={(t) => t._id!}
          onReorder={(next) => {
            setOrder(next);
            reorder.mutate(next.map((t) => t._id!));
          }}
          renderItem={(t) => (
            <div className="flex items-center gap-4 rounded-card bg-white py-4 pl-12 pr-4 shadow-soft ring-1 ring-navy/5">
              {t.poster && <img src={t.poster} alt="" className="hidden h-16 w-12 shrink-0 rounded-xl object-cover sm:block" />}
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 font-serif font-bold text-navy">“{t.quote.en}”</p>
                <p className="mt-1 text-sm text-muted">
                  {t.name} · {t.organization.en}
                </p>
              </div>
              {!t.published && <StatusChip status="draft" label="Hidden" />}
              <button type="button" onClick={() => setEditing(t)} aria-label={`Edit testimonial from ${t.name}`} className="grid h-10 w-10 place-items-center rounded-full hover:bg-card">
                <Pencil className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={async () => (await confirm({ title: 'Delete this testimonial?', danger: true, confirmLabel: 'Move to Trash' })) && remove.mutate(t._id!)}
                aria-label={`Delete testimonial from ${t.name}`}
                className="grid h-10 w-10 place-items-center rounded-full text-red-700 hover:bg-card"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
          )}
        />
      )}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?._id ? 'Edit testimonial' : 'New testimonial'} size="lg">
        {editing && <TestimonialForm item={editing} onClose={() => setEditing(null)} />}
      </Modal>
    </>
  );
}
