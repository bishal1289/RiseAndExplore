import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, Mail, MapPin, Phone } from 'lucide-react';
import { Seo } from '../components/Seo';
import { PageHeader } from '../components/PageHeader';
import { Button } from '../components/ui/Button';
import { Field, Honeypot } from '../components/form/Field';
import { useLang, useSettings } from '../hooks/usePublic';
import { api } from '../lib/api';

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Contact() {
  const { t } = useTranslation();
  const lang = useLang();
  const { data: s } = useSettings();
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '', website: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const submit = useMutation({ mutationFn: () => api('/contact', { method: 'POST', body: { ...form, language: lang } }) });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (form.name.trim().length < 2) errs.name = t('form.errorRequired');
    if (!EMAIL_RX.test(form.email)) errs.email = t('form.errorEmail');
    if (form.message.trim().length < 5) errs.message = t('form.errorRequired');
    setErrors(errs);
    if (!Object.keys(errs).length) submit.mutate();
  };

  const fullAddress = s ? [s.address, `${s.city}, ${s.state} ${s.zip}`.trim()].filter((x) => x && x !== ',').join(', ') : '';

  return (
    <>
      <Seo title={t('meta.contact')} description={t('contact.intro')} />
      <PageHeader eyebrow={t('nav.contact')} title={t('contact.title')} intro={t('contact.intro')} />

      <div className="mx-auto grid max-w-[1180px] gap-6 px-4 pb-section-sm sm:px-6 md:pb-section lg:grid-cols-[1fr_380px]">
        <section aria-labelledby="form-title" className="rounded-section bg-white p-6 shadow-soft ring-1 ring-navy/5 sm:p-10">
          <h2 id="form-title" className="font-serif text-3xl">
            {t('contact.formTitle')}
          </h2>
          {submit.isSuccess ? (
            <div role="status" className="mt-6 flex items-start gap-3 rounded-card bg-card p-6 text-navy">
              <CheckCircle2 className="h-6 w-6 shrink-0 text-primary" aria-hidden />
              <p className="font-semibold">{t('contact.success')}</p>
            </div>
          ) : (
            <form noValidate onSubmit={onSubmit} className="relative mt-6 grid gap-5 sm:grid-cols-2">
              <Honeypot value={form.website} onChange={set('website')} />
              <Field label={t('involved.name')} required error={errors.name}>
                <input className="input" autoComplete="name" value={form.name} onChange={(e) => set('name')(e.target.value)} />
              </Field>
              <Field label={t('involved.email')} required error={errors.email}>
                <input className="input" type="email" autoComplete="email" value={form.email} onChange={(e) => set('email')(e.target.value)} />
              </Field>
              <Field label={t('involved.phone')}>
                <input className="input" type="tel" autoComplete="tel" value={form.phone} onChange={(e) => set('phone')(e.target.value)} />
              </Field>
              <Field label={t('contact.subject')}>
                <input className="input" value={form.subject} onChange={(e) => set('subject')(e.target.value)} />
              </Field>
              <Field label={t('contact.message')} required error={errors.message} className="sm:col-span-2">
                <textarea className="input" rows={6} value={form.message} onChange={(e) => set('message')(e.target.value)} />
              </Field>
              {submit.isError && (
                <p role="alert" className="text-sm font-semibold text-red-700 sm:col-span-2">
                  {(submit.error as Error).message || t('form.errorGeneric')}
                </p>
              )}
              <div className="sm:col-span-2">
                <Button type="submit" disabled={submit.isPending}>
                  {submit.isPending ? t('common.sending') : t('common.send')}
                </Button>
              </div>
            </form>
          )}
        </section>

        <aside className="space-y-6">
          <section aria-labelledby="info-title" className="rounded-card bg-card p-6">
            <h2 id="info-title" className="font-serif text-2xl">
              {t('contact.infoTitle')}
            </h2>
            <ul className="mt-5 space-y-4">
              {s?.phone && (
                <li className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-5 w-5 text-primary" aria-hidden />
                  <div>
                    <div className="text-sm text-muted">{t('contact.phone')}</div>
                    <a href={`tel:${s.phone.replace(/[^\d+]/g, '')}`} className="font-semibold text-navy hover:text-primary">
                      {s.phone}
                    </a>
                  </div>
                </li>
              )}
              {s?.email && (
                <li className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-5 w-5 text-primary" aria-hidden />
                  <div>
                    <div className="text-sm text-muted">{t('contact.email')}</div>
                    <a href={`mailto:${s.email}`} className="break-all font-semibold text-navy hover:text-primary">
                      {s.email}
                    </a>
                  </div>
                </li>
              )}
              {fullAddress && (
                <li className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 text-primary" aria-hidden />
                  <div>
                    <div className="text-sm text-muted">{t('contact.address')}</div>
                    <address className="font-semibold not-italic text-navy">{fullAddress}</address>
                  </div>
                </li>
              )}
            </ul>
          </section>
          {s?.mapEmbedUrl && (
            <iframe
              src={s.mapEmbedUrl}
              title={t('contact.map')}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-72 w-full rounded-card border-0 bg-card"
            />
          )}
        </aside>
      </div>
    </>
  );
}
