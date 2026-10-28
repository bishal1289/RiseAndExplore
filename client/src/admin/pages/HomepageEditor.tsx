import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Eye, Plus, Pencil, Trash2, X, Eye as EyeIcon, EyeOff } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { adminApi, useAdminMutation, useAdminQuery } from '../lib/hooks';
import type { AdminHomepage, AdminImpactCard, AdminProgram, L, MediaAsset, SectionKey } from '../lib/types';
import type { HomeData } from '../../lib/types';
import { BilingualField, Card, ListSkeleton, PageTitle, SaveBar, TextInput } from '../components/ui';
import { ImageField, VideoField } from '../components/MediaPicker';
import { Sortable } from '../components/Sortable';
import { useConfirm } from '../components/Confirm';
import { isSame, useUnsavedChanges } from '../components/useUnsavedChanges';
import { localizeDeep } from '../lib/localize';
import { api } from '../../lib/api';
import { HomeView } from '../../components/home/HomeView';
import { DonateProvider } from '../../components/donate/DonateProvider';
import { cn, formatDuration, imageUrl } from '../../lib/utils';

const SECTION_NAMES: Record<SectionKey, string> = {
  hero: 'Hero (top banner + donate card)',
  summer: '“This summer” events',
  impact: '“Where your donation goes”',
  testimonials: 'Partner testimonials',
  whatWeDo: '“What we do”',
  community: '“Community in action” photos',
  cta: 'Blue call-to-action banner',
};

const videoFromAsset = (a: MediaAsset | null, label: L) =>
  a ? { url: a.url, poster: a.posterUrl, duration: a.duration, label } : { url: '', poster: '', duration: 0, label };

function ImpactCardForm({ card, onClose }: { card: AdminImpactCard; onClose: () => void }) {
  const [form, setForm] = useState(card);
  const save = useAdminMutation(
    () => {
      const { _id, ...body } = form as AdminImpactCard & Record<string, unknown>;
      delete body.createdAt;
      delete body.updatedAt;
      delete body.deletedAt;
      delete body.__v;
      return _id ? adminApi.put(`/impact-cards/${_id}`, body) : adminApi.post('/impact-cards', body);
    },
    { success: 'Card saved', invalidate: ['/impact-cards'], onSuccess: onClose },
  );
  return (
    <div className="space-y-4 px-5 pb-5">
      <ImageField label="Photo" url={form.image} folder="rise/homepage" onChange={(a) => setForm({ ...form, image: a?.url ?? '', imageAlt: a?.alt ?? form.imageAlt })} />
      <BilingualField label="Photo alt text" value={form.imageAlt} onChange={(imageAlt) => setForm({ ...form, imageAlt })} />
      <BilingualField label="Date label" hint="Small dark chip on the photo, e.g. “July 20”" value={form.dateLabel} onChange={(dateLabel) => setForm({ ...form, dateLabel })} />
      <BilingualField label="Title" required value={form.title} onChange={(title) => setForm({ ...form, title })} />
      <BilingualField label="Description" multiline rows={2} value={form.description} onChange={(description) => setForm({ ...form, description })} />
      <Button fullWidth onClick={() => save.mutate(undefined)} disabled={!form.title.en.trim() || save.isPending}>
        {save.isPending ? 'Saving…' : 'Save card'}
      </Button>
    </div>
  );
}

function ProgramCardsEditor({ programs }: { programs: AdminProgram[] }) {
  const [drafts, setDrafts] = useState<Record<string, AdminProgram>>({});
  useEffect(() => setDrafts(Object.fromEntries(programs.map((p) => [p._id!, p]))), [programs]);
  const save = useAdminMutation((p: AdminProgram) => {
    const { _id, ...rest } = p as AdminProgram & Record<string, unknown>;
    delete rest.createdAt;
    delete rest.updatedAt;
    delete rest.deletedAt;
    delete rest.__v;
    return adminApi.put(`/programs/${_id}`, rest);
  }, { success: 'Card saved', invalidate: ['/programs'] });
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {programs.map((p) => {
        const d = drafts[p._id!] ?? p;
        const changed = !isSame(d, p);
        return (
          <li key={p._id} className="space-y-3 rounded-2xl bg-card p-4">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-primary font-serif font-black text-white">{p.number}</span>
            <BilingualField label="Title" value={d.title} onChange={(title) => setDrafts({ ...drafts, [p._id!]: { ...d, title } })} />
            <BilingualField label="Short text" multiline rows={2} value={d.shortText} onChange={(shortText) => setDrafts({ ...drafts, [p._id!]: { ...d, shortText } })} />
            <Button size="sm" disabled={!changed || save.isPending} onClick={() => save.mutate(d)}>
              Save card
            </Button>
          </li>
        );
      })}
    </ul>
  );
}

function Section({ title, children, id }: { title: string; children: ReactNode; id: string }) {
  return (
    <Card title={title} id={id} className="scroll-mt-24">
      <div className="space-y-4">{children}</div>
    </Card>
  );
}

export default function HomepageEditor() {
  const confirm = useConfirm();
  const { data, isLoading } = useAdminQuery<AdminHomepage>('/homepage');
  const { data: cards = [] } = useAdminQuery<AdminImpactCard[]>('/impact-cards');
  const { data: programs = [] } = useAdminQuery<AdminProgram[]>('/programs');
  const [form, setForm] = useState<AdminHomepage | null>(null);
  const [initial, setInitial] = useState<AdminHomepage | null>(null);
  const [cardEditing, setCardEditing] = useState<AdminImpactCard | null>(null);
  const [cardOrder, setCardOrder] = useState<AdminImpactCard[]>([]);
  const [preview, setPreview] = useState<'en' | 'es' | null>(null);

  useEffect(() => {
    if (data) {
      const clean = { sections: data.sections, hero: data.hero, donation: data.donation, summer: data.summer, impact: data.impact, whatWeDo: data.whatWeDo, community: data.community, cta: data.cta };
      setForm(clean);
      setInitial(clean);
    }
  }, [data]);
  useEffect(() => setCardOrder(cards), [cards]);
  useEffect(() => {
    if (!preview) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPreview(null);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [preview]);

  const dirty = !!form && !!initial && !isSame(form, initial);
  useUnsavedChanges(dirty);

  const save = useAdminMutation((h: AdminHomepage) => adminApi.put<AdminHomepage>('/homepage', h), {
    success: 'Homepage saved',
    invalidate: ['/homepage'],
    onSuccess: () => setInitial(form),
  });
  const reorderCards = useAdminMutation((ids: string[]) => adminApi.post('/impact-cards/reorder', { ids }), { success: 'Order saved', invalidate: ['/impact-cards'] });
  const deleteCard = useAdminMutation((id: string) => adminApi.del(`/impact-cards/${id}`), { success: 'Card deleted', invalidate: ['/impact-cards'] });

  // Live data (events, testimonials, gallery) for the preview.
  const { data: live } = useQuery({
    queryKey: ['public', '/home', preview],
    queryFn: () => api<HomeData>(`/home?lang=${preview}`),
    enabled: !!preview,
  });

  if (isLoading || !form) return <ListSkeleton rows={6} />;

  const set = <K extends keyof AdminHomepage>(k: K, v: AdminHomepage[K]) => setForm({ ...form, [k]: v });

  const onSave = () => {
    const { amounts, defaultAmount } = form.donation;
    if (amounts.some((a) => !a || a < 1)) return void toast.error('Each donation amount must be at least $1.');
    if (!amounts.includes(defaultAmount)) return void toast.error('The default amount must be one of the four buttons.');
    save.mutate(form);
  };

  return (
    <>
      <PageTitle
        title="Homepage"
        intro="Change the words, videos and photos on the homepage. Use “Preview changes” to see it before saving."
        actions={
          <>
            <Button variant="outline-navy" onClick={() => setPreview('en')}>
              <Eye className="h-5 w-5" aria-hidden /> Preview changes
            </Button>
          </>
        }
      />

      <div className="space-y-5">
        <Section title="Sections — order and visibility" id="sections">
          <p className="text-sm text-muted">Drag to change the order. Use the eye button to hide a section.</p>
          <Sortable
            layout="list"
            className="space-y-2"
            items={form.sections}
            getId={(s) => s.key}
            onReorder={(sections) => set('sections', sections)}
            renderItem={(s) => (
              <div className={cn('flex items-center gap-3 rounded-2xl bg-card py-3 pl-12 pr-3', !s.visible && 'opacity-60')}>
                <a href={`#sec-${s.key}`} className="flex-1 font-semibold text-navy hover:text-primary">
                  {SECTION_NAMES[s.key]}
                </a>
                <button
                  type="button"
                  onClick={() => set('sections', form.sections.map((x) => (x.key === s.key ? { ...x, visible: !x.visible } : x)))}
                  aria-pressed={s.visible}
                  aria-label={s.visible ? `Hide ${SECTION_NAMES[s.key]}` : `Show ${SECTION_NAMES[s.key]}`}
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-3 text-sm font-semibold text-navy"
                >
                  {s.visible ? <EyeIcon className="h-4 w-4" aria-hidden /> : <EyeOff className="h-4 w-4" aria-hidden />}
                  {s.visible ? 'Shown' : 'Hidden'}
                </button>
              </div>
            )}
          />
        </Section>

        <Section title="Hero" id="sec-hero">
          <BilingualField label="Headline" value={form.hero.headline} onChange={(headline) => set('hero', { ...form.hero, headline })} />
          <BilingualField label="Text under the headline" multiline value={form.hero.text} onChange={(text) => set('hero', { ...form.hero, text })} />
          <div className="grid gap-5 md:grid-cols-2">
            <VideoField
              label="Background video"
              hint="Plays silently on a loop. Keep it short (10–30 seconds)."
              value={form.hero.backgroundVideo}
              folder="rise/homepage"
              onChange={(a) => set('hero', { ...form.hero, backgroundVideo: a ? { url: a.url, poster: a.posterUrl } : { url: '', poster: form.hero.backgroundVideo.poster } })}
            />
            <ImageField
              label="Background photo"
              hint="Shown while the video loads, and to visitors who prefer less motion."
              url={form.hero.backgroundVideo.poster}
              folder="rise/homepage"
              onChange={(a) => set('hero', { ...form.hero, backgroundVideo: { ...form.hero.backgroundVideo, poster: a?.url ?? '' } })}
            />
          </div>
          <div className="rounded-2xl bg-card p-4">
            <h3 className="mb-3 font-semibold text-navy">“Watch” button video</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <VideoField
                label="Full video"
                value={form.hero.watchVideo}
                folder="rise/homepage"
                onChange={(a) => set('hero', { ...form.hero, watchVideo: videoFromAsset(a, form.hero.watchVideo.label) })}
              />
              <div className="space-y-3">
                <BilingualField label="Button label" hint={`Length is added automatically (${formatDuration(form.hero.watchVideo.duration) || 'e.g. 1:37'})`} value={form.hero.watchVideo.label} onChange={(label) => set('hero', { ...form.hero, watchVideo: { ...form.hero.watchVideo, label } })} />
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-card p-4">
            <h3 className="font-semibold text-navy">Donation amount buttons</h3>
            <p className="mb-3 text-sm text-muted">The four amounts in the “Donate today” card, and which one is selected first.</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {form.donation.amounts.map((amt, i) => (
                <div key={i}>
                  <TextInput
                    label={`Amount ${i + 1} ($)`}
                    type="number"
                    min={1}
                    value={amt}
                    onChange={(e) => {
                      const amounts = form.donation.amounts.map((a, j) => (j === i ? Math.round(Number(e.target.value)) : a));
                      const defaultAmount = form.donation.defaultAmount === amt ? amounts[i] : form.donation.defaultAmount;
                      set('donation', { amounts, defaultAmount });
                    }}
                  />
                  <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-sm text-navy">
                    <input type="radio" name="default-amount" className="h-4 w-4 accent-primary" checked={form.donation.defaultAmount === amt} onChange={() => set('donation', { ...form.donation, defaultAmount: amt })} />
                    Selected first
                  </label>
                </div>
              ))}
            </div>
          </div>
        </Section>

        <Section title="“This summer” events" id="sec-summer">
          <p className="text-sm text-muted">
            The two event rows come from events with <b>Feature on homepage</b> turned on.{' '}
            <Link to="/admin/events" className="font-semibold text-primary">
              Manage events
            </Link>
          </p>
          <BilingualField label="Small label" value={form.summer.chip} onChange={(chip) => set('summer', { ...form.summer, chip })} />
          <BilingualField label="Heading" value={form.summer.heading} onChange={(heading) => set('summer', { ...form.summer, heading })} />
          <BilingualField label="Text" multiline value={form.summer.text} onChange={(text) => set('summer', { ...form.summer, text })} />
          <div className="grid gap-4 md:grid-cols-2">
            <VideoField label="Vertical video (9:16)" value={form.summer.video} folder="rise/homepage" onChange={(a) => set('summer', { ...form.summer, video: videoFromAsset(a, form.summer.video.label) })} />
            <BilingualField label="Video caption" value={form.summer.video.label} onChange={(label) => set('summer', { ...form.summer, video: { ...form.summer.video, label } })} />
          </div>
        </Section>

        <Section title="“Where your donation goes”" id="sec-impact">
          <BilingualField label="Heading" value={form.impact.heading} onChange={(heading) => set('impact', { ...form.impact, heading })} />
          <div className="grid gap-4 md:grid-cols-2">
            <BilingualField label="Link text" value={form.impact.linkLabel} onChange={(linkLabel) => set('impact', { ...form.impact, linkLabel })} />
            <TextInput label="Link goes to" hint="e.g. /events/pantry-fill" value={form.impact.linkUrl} onChange={(e) => set('impact', { ...form.impact, linkUrl: e.target.value })} />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold text-navy">Cards (first 3 are shown)</h3>
              <Button size="sm" variant="outline-navy" onClick={() => setCardEditing({ title: { en: '', es: '' }, description: { en: '', es: '' }, image: '', imageAlt: { en: '', es: '' }, dateLabel: { en: '', es: '' }, order: cards.length })}>
                <Plus className="h-4 w-4" aria-hidden /> Add card
              </Button>
            </div>
            <Sortable
              className="grid gap-3 sm:grid-cols-3"
              items={cardOrder}
              getId={(c) => c._id!}
              onReorder={(next) => {
                setCardOrder(next);
                reorderCards.mutate(next.map((c) => c._id!));
              }}
              renderItem={(c, i) => (
                <div className={cn('overflow-hidden rounded-2xl bg-card', i >= 3 && 'opacity-50')}>
                  <img src={imageUrl(c.image, 400, 500)} alt="" className="aspect-[4/5] w-full object-cover" />
                  <div className="flex items-center gap-1 p-3">
                    <span className="min-w-0 flex-1 truncate font-semibold text-navy">{c.title.en}</span>
                    <button type="button" onClick={() => setCardEditing(c)} aria-label={`Edit ${c.title.en}`} className="grid h-9 w-9 place-items-center rounded-full hover:bg-white">
                      <Pencil className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={async () => (await confirm({ title: 'Delete this card?', danger: true, confirmLabel: 'Delete', message: 'It goes to the Trash for 30 days.' })) && deleteCard.mutate(c._id!)}
                      aria-label={`Delete ${c.title.en}`}
                      className="grid h-9 w-9 place-items-center rounded-full text-red-700 hover:bg-white"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </div>
              )}
            />
          </div>
        </Section>

        <Section title="Partner testimonials" id="sec-testimonials">
          <p className="text-muted">
            Testimonials have their own page.{' '}
            <Link to="/admin/testimonials" className="font-semibold text-primary">
              Edit testimonials →
            </Link>
          </p>
        </Section>

        <Section title="“What we do”" id="sec-whatWeDo">
          <BilingualField label="Heading" value={form.whatWeDo.heading} onChange={(heading) => set('whatWeDo', { heading })} />
          <ProgramCardsEditor programs={programs} />
        </Section>

        <Section title="“Community in action”" id="sec-community">
          <BilingualField label="Heading" value={form.community.heading} onChange={(heading) => set('community', { ...form.community, heading })} />
          <BilingualField label="Button text" value={form.community.buttonLabel} onChange={(buttonLabel) => set('community', { ...form.community, buttonLabel })} />
          <p className="text-sm text-muted">
            Choose the four photos in{' '}
            <Link to="/admin/gallery" className="font-semibold text-primary">
              Gallery → Homepage row
            </Link>
            .
          </p>
        </Section>

        <Section title="Blue call-to-action banner" id="sec-cta">
          <BilingualField label="Heading" multiline rows={2} value={form.cta.heading} onChange={(heading) => set('cta', { heading })} />
        </Section>
      </div>

      <SaveBar dirty={dirty} saving={save.isPending} onSave={onSave} label="Save homepage" extra={<Button variant="ghost" size="sm" onClick={() => setPreview('en')}>Preview</Button>} />

      <Modal open={!!cardEditing} onClose={() => setCardEditing(null)} title={cardEditing?._id ? 'Edit card' : 'New card'}>
        {cardEditing && <ImpactCardForm card={cardEditing} onClose={() => setCardEditing(null)} />}
      </Modal>

      {preview &&
        createPortal(
          <div className="fixed inset-0 z-[80] overflow-y-auto bg-bg" role="dialog" aria-modal="true" aria-label="Homepage preview">
            <div className="sticky top-0 z-[90] flex items-center gap-3 bg-gold px-4 py-2 text-sm font-semibold text-navy">
              <Eye className="h-4 w-4" aria-hidden /> Preview — {dirty ? 'unsaved changes' : 'saved version'}
              <span className="ml-auto inline-flex rounded-full bg-white/60 p-0.5">
                {(['en', 'es'] as const).map((l) => (
                  <button key={l} type="button" onClick={() => setPreview(l)} aria-pressed={preview === l} className={cn('rounded-full px-3 py-1 uppercase', preview === l && 'bg-navy text-white')}>
                    {l}
                  </button>
                ))}
              </span>
              <button type="button" onClick={() => setPreview(null)} className="inline-flex items-center gap-1 rounded-full bg-navy px-3 py-1 text-white">
                <X className="h-4 w-4" aria-hidden /> Close
              </button>
            </div>
            {live ? (
              <DonateProvider>
                <div className="pointer-events-auto">
                  <HomeView
                    data={{
                      ...live,
                      homepage: localizeDeep(form, preview),
                      impactCards: localizeDeep(cardOrder.slice(0, 3), preview),
                    }}
                  />
                </div>
              </DonateProvider>
            ) : (
              <div className="p-10">
                <ListSkeleton rows={4} />
              </div>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
