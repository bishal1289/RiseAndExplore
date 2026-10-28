import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { adminApi, useAdminMutation, useAdminQuery } from '../lib/hooks';
import type { AdminSettings } from '../lib/types';
import { stripMeta } from '../lib/strip';
import { BilingualField, Card, ListSkeleton, PageTitle, SaveBar, TextInput } from '../components/ui';
import { ImageField } from '../components/MediaPicker';
import { isSame, useUnsavedChanges } from '../components/useUnsavedChanges';

export default function SettingsPage() {
  const { data, isLoading } = useAdminQuery<AdminSettings>('/settings');
  const [form, setForm] = useState<AdminSettings | null>(null);
  const [initial, setInitial] = useState<AdminSettings | null>(null);

  useEffect(() => {
    if (data) {
      const clean = stripMeta(data) as AdminSettings;
      setForm(clean);
      setInitial(clean);
    }
  }, [data]);

  const dirty = !!form && !!initial && !isSame(form, initial);
  useUnsavedChanges(dirty);
  const save = useAdminMutation((s: AdminSettings) => adminApi.put('/settings', s), {
    success: 'Settings saved',
    invalidate: ['/settings'],
    onSuccess: () => setInitial(form),
  });

  if (isLoading || !form) return <ListSkeleton rows={5} />;
  const set = <K extends keyof AdminSettings>(k: K, v: AdminSettings[K]) => setForm({ ...form, [k]: v });
  const gb = form.givebutter;
  const setGb = (patch: Partial<AdminSettings['givebutter']>) => set('givebutter', { ...gb, ...patch });

  return (
    <>
      <PageTitle title="Settings" intro="Contact details, social links, payments and notifications. Only owners can change these." />
      <div className="space-y-5">
        <Card title="Organization">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput className="sm:col-span-2" label="Organization name" value={form.orgName} onChange={(e) => set('orgName', e.target.value)} />
            <TextInput label="Phone" type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            <TextInput label="Public email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            <TextInput className="sm:col-span-2" label="Street address" value={form.address} onChange={(e) => set('address', e.target.value)} />
            <TextInput label="City" value={form.city} onChange={(e) => set('city', e.target.value)} />
            <div className="grid grid-cols-2 gap-4">
              <TextInput label="State" value={form.state} onChange={(e) => set('state', e.target.value)} />
              <TextInput label="ZIP" value={form.zip} onChange={(e) => set('zip', e.target.value)} />
            </div>
            <TextInput
              className="sm:col-span-2"
              label="Map embed link (Contact page)"
              hint="In Google Maps: Share → Embed a map → copy only the link inside src=&quot;…&quot;"
              value={form.mapEmbedUrl}
              onChange={(e) => set('mapEmbedUrl', e.target.value)}
            />
          </div>
          <div className="mt-4">
            <BilingualField label="Footer text" multiline rows={3} value={form.footerText} onChange={(v) => set('footerText', v)} />
          </div>
        </Card>

        <Card title="Social links" description="Leave empty to hide an icon in the footer.">
          <div className="grid gap-4 sm:grid-cols-2">
            {(['facebook', 'instagram', 'tiktok', 'youtube', 'linkedin'] as const).map((n) => (
              <TextInput key={n} label={n[0].toUpperCase() + n.slice(1)} type="url" placeholder="https://" value={form.social[n]} onChange={(e) => set('social', { ...form.social, [n]: e.target.value })} />
            ))}
          </div>
        </Card>

        <Card title="Donations (Zeffy)" description="All donations are processed by Zeffy. RISE never handles card details.">
          <TextInput
            label="Zeffy donation form link"
            hint="In Zeffy: your form → Share → Embed → copy the link that starts with https://www.zeffy.com/embed/…"
            type="url"
            placeholder="https://www.zeffy.com/embed/donation-form/…"
            value={form.zeffyFormUrl}
            onChange={(e) => set('zeffyFormUrl', e.target.value.trim())}
          />
        </Card>

        <Card title="Shop (Givebutter)" description="The Shop page shows your Givebutter store widget.">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput label="Givebutter account ID" hint="Found in Givebutter → Settings → Widgets" value={gb.accountId} onChange={(e) => setGb({ accountId: e.target.value.trim() })} />
            <TextInput label="Store widget ID" hint="The id in <givebutter-widget id=&quot;…&quot;>" value={gb.shopWidgetId} onChange={(e) => setGb({ shopWidgetId: e.target.value.trim() })} />
            <TextInput className="sm:col-span-2" label="Store page link" type="url" value={gb.storeUrl} onChange={(e) => setGb({ storeUrl: e.target.value })} />
          </div>
          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-navy">Featured products (shown above the store)</h3>
              <Button size="sm" variant="outline-navy" disabled={gb.featuredProducts.length >= 6} onClick={() => setGb({ featuredProducts: [...gb.featuredProducts, { title: { en: '', es: '' }, price: '', image: '', url: '' }] })}>
                <Plus className="h-4 w-4" aria-hidden /> Add product
              </Button>
            </div>
            <ul className="space-y-3">
              {gb.featuredProducts.map((p, i) => {
                const update = (patch: Partial<typeof p>) => setGb({ featuredProducts: gb.featuredProducts.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
                return (
                  <li key={i} className="grid gap-3 rounded-2xl bg-card p-4 md:grid-cols-[auto_1fr]">
                    <ImageField label="Photo" url={p.image} onChange={(a) => update({ image: a?.url ?? '' })} />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <BilingualField label="Product name" value={p.title} onChange={(title) => update({ title })} />
                      </div>
                      <TextInput label="Price" placeholder="$25" value={p.price} onChange={(e) => update({ price: e.target.value })} />
                      <TextInput label="Link to product" type="url" value={p.url} onChange={(e) => update({ url: e.target.value })} />
                      <Button size="sm" variant="ghost" className="justify-self-start !text-red-700" onClick={() => setGb({ featuredProducts: gb.featuredProducts.filter((_, j) => j !== i) })}>
                        <Trash2 className="h-4 w-4" aria-hidden /> Remove
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </Card>

        <Card title="Notifications">
          <TextInput
            label="Send form notifications to"
            hint="Volunteer sign-ups and contact messages are emailed here."
            type="email"
            value={form.notificationEmail}
            onChange={(e) => set('notificationEmail', e.target.value)}
          />
        </Card>
      </div>
      <SaveBar dirty={dirty} saving={save.isPending} onSave={() => save.mutate(form)} label="Save settings" />
    </>
  );
}
