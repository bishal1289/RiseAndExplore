import { useTranslation } from 'react-i18next';
import { Seo } from '../components/Seo';
import { LinkButton } from '../components/ui/Button';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <>
      <Seo title={t('meta.notFound')} noindex />
      <section className="mx-auto max-w-[1180px] px-4 py-10 sm:px-6 md:py-16">
        <div className="relative overflow-hidden rounded-section bg-card px-6 py-16 text-center sm:px-10 md:py-24">
          <svg aria-hidden viewBox="0 0 200 100" className="mx-auto h-24 w-48">
            <path d="M20 90a80 80 0 0 1 160 0" stroke="#F2B233" strokeWidth="14" strokeLinecap="round" fill="none" />
            <path d="M10 96h180" stroke="#0F2238" strokeOpacity=".2" strokeWidth="8" strokeLinecap="round" />
          </svg>
          <p className="mt-6 font-serif text-7xl font-black text-primary">404</p>
          <h1 className="h2 mt-4">{t('notFound.title')}</h1>
          <p className="mx-auto mt-4 max-w-md text-lg text-muted">{t('notFound.text')}</p>
          <LinkButton to="/" className="mt-8">
            {t('notFound.home')}
          </LinkButton>
        </div>
      </section>
    </>
  );
}
