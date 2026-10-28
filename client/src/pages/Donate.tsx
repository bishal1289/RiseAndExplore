import { useTranslation } from 'react-i18next';
import { ChevronDown, ShieldCheck } from 'lucide-react';
import { Seo } from '../components/Seo';
import { PageHeader } from '../components/PageHeader';
import { ZeffyEmbed } from '../components/donate/ZeffyEmbed';
import { Reveal } from '../components/ui/Reveal';
import { Chip } from '../components/ui/Chip';
import { useSettings } from '../hooks/usePublic';

export default function Donate() {
  const { t } = useTranslation();
  const { data: settings } = useSettings();
  const faq = t('donatePage.faq', { returnObjects: true }) as { q: string; a: string }[];
  const impact = [
    { amount: 25, text: t('donatePage.impact25') },
    { amount: 50, text: t('donatePage.impact50') },
    { amount: 100, text: t('donatePage.impact100') },
    { amount: 250, text: t('donatePage.impact250') },
  ];

  return (
    <>
      <Seo title={t('meta.donate')} description={t('donatePage.intro')} />
      <PageHeader eyebrow={t('nav.donate')} title={t('donatePage.title')} intro={t('donatePage.intro')}>
        <div className="mt-6 flex flex-wrap gap-2">
          <Chip>
            <ShieldCheck className="h-4 w-4" aria-hidden />
            {t('donate.taxChip')}
          </Chip>
          <Chip tone="outline">{t('donate.secure')}</Chip>
        </div>
      </PageHeader>

      <div className="mx-auto grid max-w-[1180px] gap-10 px-4 pb-section-sm sm:px-6 md:pb-section lg:grid-cols-[1fr_380px]">
        <section aria-label={t('donate.formTitle')} className="overflow-hidden rounded-section bg-white p-2 shadow-soft ring-1 ring-navy/5 sm:p-4">
          <ZeffyEmbed url={settings?.zeffyFormUrl} />
        </section>

        <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
          <Reveal>
            <section aria-labelledby="impact-title" className="rounded-card bg-card p-6">
              <h2 id="impact-title" className="font-serif text-2xl">
                {t('donatePage.impactTitle')}
              </h2>
              <ul className="mt-5 space-y-4">
                {impact.map((i) => (
                  <li key={i.amount} className="flex items-start gap-4">
                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary font-serif text-lg font-black text-white">
                      ${i.amount}
                    </span>
                    <p className="pt-1 text-navy">{i.text}</p>
                  </li>
                ))}
              </ul>
            </section>
          </Reveal>
        </aside>
      </div>

      <section aria-labelledby="faq-title" className="container-rise pb-section-sm md:pb-section">
        <h2 id="faq-title" className="h2 mb-8">
          {t('donatePage.faqTitle')}
        </h2>
        <div className="space-y-3">
          {faq.map((item) => (
            <details key={item.q} className="group rounded-row bg-card p-5 open:bg-[#DCEAF7]">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-serif text-lg font-bold text-navy [&::-webkit-details-marker]:hidden">
                {item.q}
                <ChevronDown className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <p className="mt-3 text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
