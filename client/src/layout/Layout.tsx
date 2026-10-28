import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { BackToTop } from './BackToTop';
import { OrganizationJsonLd } from '../components/Seo';
import { DonateProvider } from '../components/donate/DonateProvider';
import { Skeleton } from '../components/ui/Skeleton';

function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      // Wait for lazy content before jumping to an anchor like /programs#food-pantry.
      const id = decodeURIComponent(hash.slice(1));
      let tries = 0;
      const timer = window.setInterval(() => {
        const el = document.getElementById(id);
        if (el || tries++ > 20) {
          window.clearInterval(timer);
          el?.scrollIntoView();
        }
      }, 50);
      return () => window.clearInterval(timer);
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export function PageFallback() {
  return (
    <div className="container-rise section space-y-6" aria-busy="true">
      <Skeleton className="h-14 w-2/3" />
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-80 w-full" />
    </div>
  );
}

export function Layout() {
  return (
    <DonateProvider>
      <ScrollManager />
      <OrganizationJsonLd />
      <Header />
      <main id="main" tabIndex={-1} className="focus:outline-none">
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <BackToTop />
    </DonateProvider>
  );
}
