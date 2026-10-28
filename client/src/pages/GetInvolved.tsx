import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, HandHeart, Building2, HeartHandshake, Check } from 'lucide-react';
import { Seo } from '../components/Seo';
import { PageHeader } from '../components/PageHeader';
import { Button, LinkButton } from '../components/ui/Button';
import { Reveal } from '../components/ui/Reveal';
import { Field, Honeypot } from '../components/form/Field';
import { useDonate } from '../components/donate/DonateProvider';
import { useEvents, useLang } from '../hooks/usePublic';
import { api } from '../lib/api';
import { formatDate } from '../lib/utils';

const INTERESTS = ['meals', 'pantry', 'clothing', 'mentoring', 'events', 'other'] as const;
const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function GetInvolved() {
  const { t } = useTranslation();
  const lang = useLang();
  const { openDonate } = useDonate();
  const [params] = useSearchParams();
  const { data: events } = useEvents('upcoming');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    interests: [] as string[],
    availability: '',
    message: '',
    eventRef: params.get('event') ?? '',
    website: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = useMutation({
    mutationFn: () => api('/volunteers', { method: 'POST', body: { ...form, language: lang, eventRef: form.eventRef || null } }),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (form.name.trim().length < 2) errs.name = t('form.errorRequired');
    if (!EMAIL_RX.test(form.email)) errs.email = t('form.errorEmail');
    setErrors(errs);
    if (Object.keys(errs).length) {
      document.getElementById(`vol-${Object.keys(errs)[0]}`)?.querySelector('input')?.focus();
      return;
    }
    submit.mutate();
  };

  const ways = [
    { icon: HandHeart, title: t('involved.ways.volunteer'), text: t('involved.ways.volunteerText'), href: '#volunteer' },
    { icon: HeartHandshake, title: t('involved.ways.donate'), text: t('involved.ways.donateText'), onClick: () => openDonate() },
    { icon: Building2, title: t('involved.ways.partner'), text: t('involved.ways.partnerText'), href: '#partners' },
  ];
  const corporateList = t('involved.corporateList', { returnObjects: true }) as string[];

  return (
    <>
      <Seo title={t('meta.getInvolved')} description={t('involved.intro')} />
      <PageHeader eyebrow={t('nav.getInvolved')} title={t('involved.title')} intro={t('involved.intro')} />

      <section className="container-rise pb-section-sm md:pb-section">
        <ul className="grid gap-4 md:grid-cols-3">
          {ways.map((w, i) => (
            <Reveal as="li" key={w.title} delay={i * 0.05}>
              {w.href ? (
                <a href={w.href} className="block h-full rounded-card bg-card p-6 transition-colors hover:bg-[#DCEAF7]">
                  <w.icon className="h-8 w-8 text-primary" aria-hidden />
                  <h2 className="mt-5 font-serif text-2xl">{w.title}</h2>
                  <p className="mt-2 text-muted">{w.text}</p>
                </a>
              ) : (
                <button type="button" onClick={w.onClick} className="block h-full w-full rounded-card bg-card p-6 text-left transition-colors hover:bg-[#DCEAF7]">
                  <w.icon className="h-8 w-8 text-primary" aria-hidden />
                  <h2 className="mt-5 font-serif text-2xl">{w.title}</h2>
                  <p className="mt-2 text-muted">{w.text}</p>
                </button>
              )}
            </Reveal>
          ))}
        </ul>
      </section>

      <section id="volunteer" aria-labelledby="vol-title" className="mx-auto max-w-[1180px] scroll-mt-24 px-4 sm:px-6">
        <div className="rounded-section bg-white p-6 shadow-soft ring-1 ring-navy/5 sm:p-10 md:p-14">
          <div className="mx-auto max-w-2xl">
            <h2 id="vol-title" className="h2">
              {t('involved.formTitle')}
            </h2>
            <p className="mt-3 text-muted">{t('involved.formIntro')}</p>

            {submit.isSuccess ? (
              <div role="status" className="mt-8 flex items-start gap-3 rounded-card bg-card p-6 text-navy">
                <CheckCircle2 className="h-6 w-6 shrink-0 text-primary" aria-hidden />
                <p className="font-semibold">{t('involved.success')}</p>
              </div>
            ) : (
              <form noValidate onSubmit={onSubmit} className="relative mt-8 grid gap-5 sm:grid-cols-2">
                <Honeypot value={form.website} onChange={set('website')} />
                <div id="vol-name">
                  <Field label={t('involved.name')} required error={errors.name}>
                    <input className="input" autoComplete="name" value={form.name} onChange={(e) => set('name')(e.target.value)} />
                  </Field>
                </div>
                <div id="vol-email">
                  <Field label={t('involved.email')} required error={errors.email}>
                    <input className="input" type="email" autoComplete="email" value={form.email} onChange={(e) => set('email')(e.target.value)} />
                  </Field>
                </div>
                <Field label={t('involved.phone')}>
                  <input className="input" type="tel" autoComplete="tel" value={form.phone} onChange={(e) => set('phone')(e.target.value)} />
                </Field>
                <Field label={t('involved.event')}>
                  <select className="input" value={form.eventRef} onChange={(e) => set('eventRef')(e.target.value)}>
                    <option value="">{t('involved.anyEvent')}</option>
                    {events?.map((ev) => (
                      <option key={ev._id} value={ev._id}>
                        {ev.title} — {formatDate(ev.date, lang, { month: 'short', day: 'numeric' })}
                      </option>
                    ))}
                  </select>
                </Field>

                <fieldset className="sm:col-span-2">
                  <legend className="mb-3 text-sm font-semibold text-navy">{t('involved.interests')}</legend>
                  <div className="flex flex-wrap gap-2">
                    {INTERESTS.map((key) => {
                      const checked = form.interests.includes(key);
                      return (
                        <label
                          key={key}
                          className={`inline-flex h-11 cursor-pointer items-center gap-2 rounded-full px-4 text-sm font-semibold ring-1 transition-colors has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-primary ${
                            checked ? 'bg-navy text-white ring-navy' : 'bg-white text-navy ring-navy/15 hover:ring-navy/40'
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={checked}
                            onChange={() =>
                              setForm((f) => ({
                                ...f,
                                interests: checked ? f.interests.filter((i) => i !== key) : [...f.interests, key],
                              }))
                            }
                          />
                          {checked && <Check className="h-4 w-4" aria-hidden />}
                          {t(`involved.interestsOptions.${key}`)}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

                <Field label={t('involved.availability')} className="sm:col-span-2">
                  <input
                    className="input"
                    placeholder={t('involved.availabilityPlaceholder')}
                    value={form.availability}
                    onChange={(e) => set('availability')(e.target.value)}
                  />
                </Field>
                <Field label={t('involved.message')} className="sm:col-span-2">
                  <textarea className="input" rows={4} value={form.message} onChange={(e) => set('message')(e.target.value)} />
                </Field>

                {submit.isError && (
                  <p role="alert" className="text-sm font-semibold text-red-700 sm:col-span-2">
                    {(submit.error as Error).message || t('form.errorGeneric')}
                  </p>
                )}
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={submit.isPending}>
                    {submit.isPending ? t('common.sending') : t('involved.submit')}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      <section id="partners" aria-labelledby="corp-title" className="container-rise section scroll-mt-24">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <h2 id="corp-title" className="h2">
              {t('involved.corporateTitle')}
            </h2>
            <p className="mt-4 text-lg text-muted">{t('involved.corporateText')}</p>
            <LinkButton to="/contact" variant="outline-navy" className="mt-8">
              {t('involved.corporateCta')}
            </LinkButton>
          </div>
          <ul className="space-y-3">
            {corporateList.map((item) => (
              <li key={item} className="flex items-center gap-3 rounded-row bg-card p-4 font-semibold text-navy">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-white">
                  <Check className="h-4 w-4" aria-hidden />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
