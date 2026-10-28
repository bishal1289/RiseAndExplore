import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Facebook, Instagram, Linkedin, Youtube, Music2 } from 'lucide-react';
import { FOOTER_EXPLORE } from './nav';
import { usePrograms, useSettings } from '../hooks/usePublic';
import { Button } from '../components/ui/Button';
import { useDonate } from '../components/donate/DonateProvider';

const FALLBACK_PROGRAMS = [
  { slug: 'community-feeding', title: 'Community feeding' },
  { slug: 'talent-pipeline', title: 'Talent pipeline' },
  { slug: 'food-pantry', title: 'Food pantry' },
  { slug: 'clothing-drives', title: 'Clothing drives' },
];

const SOCIAL_ICONS = { facebook: Facebook, instagram: Instagram, linkedin: Linkedin, youtube: Youtube, tiktok: Music2 };

export function Footer() {
  const { t } = useTranslation();
  const { data: settings } = useSettings();
  const { data: programList } = usePrograms();
  const { openDonate } = useDonate();
  const programs = programList?.length ? programList : FALLBACK_PROGRAMS;
  const year = new Date().getFullYear();
  const socials = settings
    ? (Object.entries(settings.social) as [keyof typeof SOCIAL_ICONS, string][]).filter(([, url]) => url)
    : [];

  return (
    <footer className="mt-8 bg-navy text-white/70">
      <div className="mx-auto max-w-[1180px] px-6 pb-10 pt-16 md:pt-20">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <img src="/logo-white.svg" alt="RISE" width={168} height={48} className="h-12 w-auto" />
            <p className="mt-5 max-w-xs text-[15px] leading-relaxed">{settings?.footerText || t('footer.mission')}</p>
            <Button className="mt-6" onClick={() => openDonate()}>
              {t('common.donate')}
            </Button>
            {socials.length > 0 && (
              <ul className="mt-6 flex gap-2">
                {socials.map(([network, url]) => {
                  const Icon = SOCIAL_ICONS[network];
                  return (
                    <li key={network}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={t('footer.social', { network: network[0].toUpperCase() + network.slice(1) })}
                        className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                      >
                        <Icon className="h-4 w-4" aria-hidden />
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <nav aria-labelledby="footer-explore">
            <h2 id="footer-explore" className="font-sans text-sm font-semibold uppercase tracking-[0.12em] text-white">
              {t('footer.explore')}
            </h2>
            <ul className="mt-4 space-y-2.5 text-[15px]">
              {FOOTER_EXPLORE.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="transition-colors hover:text-white">
                    {t(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-programs">
            <h2 id="footer-programs" className="font-sans text-sm font-semibold uppercase tracking-[0.12em] text-white">
              {t('footer.programs')}
            </h2>
            <ul className="mt-4 space-y-2.5 text-[15px]">
              {programs.map((p) => (
                <li key={p.slug}>
                  <Link to={`/programs#${p.slug}`} className="transition-colors hover:text-white">
                    {p.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="font-sans text-sm font-semibold uppercase tracking-[0.12em] text-white">{t('footer.contact')}</h2>
            <address className="mt-4 space-y-2.5 text-[15px] not-italic">
              {settings?.phone && (
                <p>
                  <a href={`tel:${settings.phone.replace(/[^\d+]/g, '')}`} className="hover:text-white">
                    {settings.phone}
                  </a>
                </p>
              )}
              {settings?.email && (
                <p>
                  <a href={`mailto:${settings.email}`} className="hover:text-white">
                    {settings.email}
                  </a>
                </p>
              )}
              {settings?.address && <p>{settings.address}</p>}
              {settings?.city && (
                <p>
                  {settings.city}, {settings.state} {settings.zip}
                </p>
              )}
            </address>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-6 text-[13px] md:flex-row md:justify-between">
          <p>{t('footer.copyright', { year })}</p>
          <p>{t('footer.nonprofit')}</p>
        </div>
      </div>
    </footer>
  );
}
