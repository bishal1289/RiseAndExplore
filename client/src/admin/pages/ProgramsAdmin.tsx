import { useState } from 'react';
import { Plus, Pencil, Trash2, Layers } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { adminApi, useAdminMutation, useAdminQuery } from '../lib/hooks';
import type { AdminProgram } from '../lib/types';
import { stripMeta } from '../lib/strip';
import { BilingualField, EmptyState, ListSkeleton, PageTitle, TextInput } from '../components/ui';
import { RichText } from '../components/RichText';
import { ImageField } from '../components/MediaPicker';
import { useConfirm } from '../components/Confirm';
import { imageUrl } from '../../lib/utils';

const EMPTY: AdminProgram = {
  title: { en: '', es: '' },
  slug: '',
  number: 1,
  shortText: { en: '', es: '' },
  body: { en: '', es: '' },
  image: '',
  imageAlt: { en: '', es: '' },
  order: 0,
};

function ProgramForm({ program, onClose }: { program: AdminProgram; onClose: () => void }) {
  const [form, setForm] = useState(program);
  const save = useAdminMutation(
    () => (form._id ? adminApi.put(`/programs/${form._id}`, stripMeta(form)) : adminApi.post('/programs', stripMeta(form))),
    { success: 'Program saved', invalidate: ['/programs'], onSuccess: onClose },
  );
  return (
    <div className="space-y-4 px-5 pb-5">
      <div className="grid gap-4 sm:grid-cols-[100px_1fr]">
        <TextInput label="Number" type="number" min={1} value={form.number} onChange={(e) => setForm({ ...form, number: Number(e.target.value) })} />
        <BilingualField label="Program name" required value={form.title} onChange={(title) => setForm({ ...form, title })} />
      </div>
      <BilingualField label="Short text" hint="Shown on the homepage “What we do” card." multiline rows={2} value={form.shortText} onChange={(shortText) => setForm({ ...form, shortText })} />
      <RichText label="Full description" hint="Shown on the Programs page." value={form.body} onChange={(body) => setForm({ ...form, body })} />
      <ImageField label="Photo" url={form.image} folder="rise/programs" onChange={(a) => setForm({ ...form, image: a?.url ?? '', imageAlt: a?.alt ?? form.imageAlt })} />
      <BilingualField label="Photo alt text" value={form.imageAlt} onChange={(imageAlt) => setForm({ ...form, imageAlt })} />
      <TextInput label="Link name" hint="Used in /programs#link-name. Leave empty to make it from the name." value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
      <Button fullWidth onClick={() => save.mutate(undefined)} disabled={!form.title.en.trim() || save.isPending}>
        {save.isPending ? 'Saving…' : 'Save program'}
      </Button>
    </div>
  );
}

export default function ProgramsAdmin() {
  const confirm = useConfirm();
  const { data: programs = [], isLoading } = useAdminQuery<AdminProgram[]>('/programs');
  const [editing, setEditing] = useState<AdminProgram | null>(null);
  const remove = useAdminMutation((id: string) => adminApi.del(`/programs/${id}`), { success: 'Program moved to Trash', invalidate: ['/programs'] });

  return (
    <>
      <PageTitle
        title="Programs"
        intro="The four programs shown on the homepage and the Programs page."
        actions={
          <Button onClick={() => setEditing({ ...EMPTY, number: programs.length + 1 })}>
            <Plus className="h-5 w-5" aria-hidden /> New program
          </Button>
        }
      />
      {isLoading ? (
        <ListSkeleton />
      ) : programs.length === 0 ? (
        <EmptyState icon={<Layers className="h-10 w-10" />} title="No programs yet" action={<Button onClick={() => setEditing(EMPTY)}>Add a program</Button>} />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {programs.map((p) => (
            <li key={p._id} className="flex gap-4 rounded-card bg-white p-4 shadow-soft ring-1 ring-navy/5">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-card">{p.image && <img src={imageUrl(p.image, 200, 200)} alt="" className="h-full w-full object-cover" />}</div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-primary">#{p.number}</span>
                <h2 className="font-serif text-xl font-bold text-navy">{p.title.en}</h2>
                <p className="line-clamp-2 text-sm text-muted">{p.shortText.en}</p>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="outline-navy" onClick={() => setEditing(p)}>
                    <Pencil className="h-4 w-4" aria-hidden /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="!text-red-700"
                    onClick={async () => (await confirm({ title: `Delete “${p.title.en}”?`, danger: true, confirmLabel: 'Move to Trash', message: 'It will disappear from the website. You can restore it from the Trash for 30 days.' })) && remove.mutate(p._id!)}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden /> Delete
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?._id ? 'Edit program' : 'New program'} size="lg">
        {editing && <ProgramForm program={editing} onClose={() => setEditing(null)} />}
      </Modal>
    </>
  );
}
