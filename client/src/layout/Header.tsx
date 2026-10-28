import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu } from 'lucide-react';
import { NAV_ITEMS } from './nav';
import { LanguageToggle } from '../components/ui/LanguageToggle';
import { LinkButton } from '../components/ui/Button';
import { useScrolledPast } from '../hooks/useScrollY';
import { MobileDrawer } from './MobileDrawer';
import { cn } from '../lib/utils';

export function Header() {
  const { t } = useTranslation();
  const scrolled = useScrolledPast(8);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setDrawerOpen(false), [pathname]);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 bg-white/90 backdrop-blur-md transition-shadow duration-300',
        scrolled && 'shadow-[0_6px_24px_-12px_rgba(15,34,56,0.25)]',
      )}
    >
      <a
        href="#main"
        className="sr-only z-[60] rounded-full bg-navy px-4 py-2 text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-3"
      >
        {t('nav.skip')}
      </a>
      <div className="mx-auto flex h-[72px] max-w-[1180px] items-center gap-4 px-6">
        <Link to="/" className="shrink-0" aria-label="RISE — home">
          <img src="/logo.svg" alt="RISE" width={120} height={34} className="h-9 w-auto" />
        </Link>

        <nav aria-label={t('nav.mainNav')} className="ml-auto hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'rounded-full px-3 py-2 text-[15px] font-semibold transition-colors',
                      isActive ? 'text-primary' : 'text-navy hover:text-primary',
                    )
                  }
                >
                  {t(item.key)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-3 lg:ml-4">
          <LanguageToggle className="hidden sm:inline-flex" />
          <LinkButton to="/donate" size="sm" className="h-10 px-5">
            {t('common.donate')}
          </LinkButton>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label={t('nav.menu')}
            aria-expanded={drawerOpen}
            aria-controls="mobile-drawer"
            className="grid h-10 w-10 place-items-center rounded-full text-navy ring-1 ring-navy/15 lg:hidden"
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </header>
  );
}
