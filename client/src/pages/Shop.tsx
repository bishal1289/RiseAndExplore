import { createElement } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight } from 'lucide-react';
import { Seo } from '../components/Seo';
import { PageHeader } from '../components/PageHeader';
import { Img } from '../components/ui/Img';
import { Reveal } from '../components/ui/Reveal';
import { Skeleton } from '../components/ui/Skeleton';
import { useSettings } from '../hooks/usePublic';
import { useGivebutter } from '../hooks/useGivebutter';

export default function Shop() {
  const { t } = useTranslation();
  const { data: settings, isLoading } = useSettings();
  const gb = settings?.givebutter;
  const accountId = gb?.accountId || import.meta.env.VITE_GIVEBUTTER_ACCOUNT_ID;
  const ready = useGivebutter(accountId || undefined);
  const products = gb?.featuredProducts ?? [];
  const configured = Boolean(accountId && gb?.shopWidgetId);

  return (
    <>
      <Seo title={t('meta.shop')} description={`${t('shop.title')} — ${t('shop.subtitle')}`} />
      <PageHeader eyebrow={t('nav.shop')} title={t('shop.title')} intro={t('shop.subtitle')} />

      {products.length > 0 && (
        <section aria-labelledby="featured" className="container-rise pb-section-sm">
          <h2 id="featured" className="label mb-6 text-primary">
            {t('shop.featured')}
          </h2>
          <ul className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {products.map((p, i) => {
              const href = p.url || gb?.storeUrl || '#store';
              return (
                <Reveal as="li" key={`${p.title}-${i}`} delay={i * 0.05}>
                  <a
                    href={href}
                    {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="group block rounded-card bg-card p-3 transition-colors hover:bg-[#DCEAF7]"
                  >
                    <Img src={p.image} alt={p.title} width={600} ratio={1} className="aspect-square w-full rounded-[18px]" />
                    <div className="flex items-center justify-between gap-3 p-3 pt-4">
                      <div>
                        <h3 className="font-serif text-xl">{p.title}</h3>
                        {p.price && <p className="text-muted">{p.price}</p>}
                      </div>
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                        {t('shop.view')}
                        <ArrowUpRight className="h-4 w-4" aria-hidden />
                      </span>
                    </div>
                  </a>
                </Reveal>
              );
            })}
          </ul>
        </section>
      )}

      <section id="store" aria-label={t('shop.storeTitle')} className="mx-auto max-w-[1180px] px-4 pb-section-sm sm:px-6 md:pb-section">
        <div className="min-h-[400px] rounded-section bg-white p-4 shadow-soft ring-1 ring-navy/5 sm:p-8">
          {isLoading ? (
            <Skeleton className="h-[400px]" />
          ) : configured ? (
            <>
              {!ready && <Skeleton className="h-[400px]" />}
              {createElement('givebutter-widget', { id: gb!.shopWidgetId })}
            </>
          ) : (
            <p className="grid min-h-[360px] place-items-center text-center text-muted">{t('shop.notConfigured')}</p>
          )}
        </div>
      </section>
    </>
  );
}
