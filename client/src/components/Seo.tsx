import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../hooks/usePublic';

const SITE_URL = (import.meta.env.VITE_SITE_URL ?? window.location.origin).replace(/\/$/, '');
const DEFAULT_OG =
  'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&h=630&q=70';

interface SeoProps {
  title?: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
  jsonLd?: Record<string, unknown>;
}

export function Seo({ title, description, image, type = 'website', noindex, jsonLd }: SeoProps) {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();
  const siteName = t('meta.siteName');
  const fullTitle = title ? `${title} | RISE` : siteName;
  const desc = description || t('meta.defaultDescription');
  const url = `${SITE_URL}${pathname}`;
  const lang = (i18n.resolvedLanguage ?? 'en').startsWith('es') ? 'es' : 'en';
  return (
    <Helmet>
      <html lang={lang} />
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={url} />
      <link rel="alternate" hrefLang="en" href={`${url}?lang=en`} />
      <link rel="alternate" hrefLang="es" href={`${url}?lang=es`} />
      <link rel="alternate" hrefLang="x-default" href={url} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      <meta property="og:site_name" content="RISE" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image || DEFAULT_OG} />
      <meta property="og:locale" content={lang === 'es' ? 'es_US' : 'en_US'} />
      <meta name="twitter:card" content="summary_large_image" />
      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  );
}

/** Site-wide NonprofitOrganization schema — rendered once in the layout. */
export function OrganizationJsonLd() {
  const { data: s } = useSettings();
  const { t } = useTranslation();
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'NGO',
    additionalType: 'https://schema.org/NonprofitOrganization',
    name: s?.orgName || 'Resourceful Impact in Scholastic Education',
    alternateName: 'RISE',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.svg`,
    description: t('footer.mission'),
    nonprofitStatus: 'Nonprofit501c3',
    telephone: s?.phone || undefined,
    email: s?.email || undefined,
    address: s?.address
      ? {
          '@type': 'PostalAddress',
          streetAddress: s.address,
          addressLocality: s.city,
          addressRegion: s.state,
          postalCode: s.zip,
          addressCountry: 'US',
        }
      : undefined,
    sameAs: s ? Object.values(s.social).filter(Boolean) : undefined,
  };
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}
