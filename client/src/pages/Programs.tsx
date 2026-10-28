import { useTranslation } from 'react-i18next';
import { Seo } from '../components/Seo';
import { PageHeader } from '../components/PageHeader';
import { Img } from '../components/ui/Img';
import { Reveal } from '../components/ui/Reveal';
import { LinkButton } from '../components/ui/Button';
import { ErrorState, Skeleton } from '../components/ui/Skeleton';
import { usePrograms } from '../hooks/usePublic';
import { cn } from '../lib/utils';

const NUMBER_SHADES = ['bg-[#5FA3E0]', 'bg-[#2F86D6]', 'bg-primary', 'bg-[#0D4F8C]'];

export default function Programs() {
  const { t } = useTranslation();
  const { data: programs, isLoading, isError, refetch } = usePrograms();

  return (
    <>
      <Seo title={t('meta.programs')} description={t('programs.intro')} />
      <PageHeader eyebrow={t('nav.programs')} title={t('programs.title')} intro={t('programs.intro')} />
      <div className="container-rise space-y-6 pb-section-sm md:pb-section">
        {isLoading && [0, 1].map((i) => <Skeleton key={i} className="h-96" />)}
        {isError && <ErrorState message={t('common.error')} onRetry={() => refetch()} retryLabel={t('common.retry')} />}
        {programs?.map((p, i) => (
          <Reveal key={p._id}>
            <section
              id={p.slug}
              aria-labelledby={`${p.slug}-title`}
              className="grid scroll-mt-28 gap-8 rounded-section bg-card p-6 md:grid-cols-2 md:items-center md:gap-12 md:p-10"
            >
              <Img
                src={p.image}
                alt={p.imageAlt || p.title}
                width={800}
                ratio={0.8}
                className={cn('aspect-[5/4] w-full rounded-card', i % 2 === 1 && 'md:order-2')}
              />
              <div>
                <span
                  aria-hidden
                  className={cn(
                    'grid h-12 w-12 place-items-center rounded-full font-serif text-xl font-black text-white',
                    NUMBER_SHADES[i % NUMBER_SHADES.length],
                  )}
                >
                  {p.number}
                </span>
                <h2 id={`${p.slug}-title`} className="h2 mt-6">
                  {p.title}
                </h2>
                <p className="mt-4 text-lg font-semibold text-navy">{p.shortText}</p>
                <div className="prose-rise mt-4 text-muted" dangerouslySetInnerHTML={{ __html: p.body }} />
                <LinkButton to="/get-involved" variant="outline-navy" className="mt-8">
                  {t('programs.getInvolved')}
                </LinkButton>
              </div>
            </section>
          </Reveal>
        ))}
      </div>
    </>
  );
}
