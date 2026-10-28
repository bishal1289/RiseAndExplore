import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { NAV_ITEMS } from './nav';
import { LanguageToggle } from '../components/ui/LanguageToggle';
import { Button } from '../components/ui/Button';
import { useDonate } from '../components/donate/DonateProvider';
import { cn } from '../lib/utils';

/** Full-height slide-in navigation for phones and tablets. */
export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const { openDonate } = useDonate();
  const reduce = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current();
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [open]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] lg:hidden">
          <motion.div
            className="absolute inset-0 bg-navy/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            id="mobile-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={t('nav.mainNav')}
            className="absolute inset-y-0 right-0 flex w-[88%] max-w-sm flex-col bg-white px-6 pb-8 pt-5 shadow-float"
            initial={reduce ? { opacity: 0 } : { x: '100%' }}
            animate={reduce ? { opacity: 1 } : { x: 0 }}
            exit={reduce ? { opacity: 0 } : { x: '100%' }}
            transition={{ type: 'tween', duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center justify-between">
              <img src="/logo.svg" alt="RISE" className="h-8 w-auto" />
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label={t('nav.closeMenu')}
                className="grid h-11 w-11 place-items-center rounded-full bg-card text-navy"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <nav className="mt-8 flex-1 overflow-y-auto">
              <ul className="space-y-1">
                {[{ to: '/', key: 'nav.home' } as const, ...NAV_ITEMS, { to: '/contact', key: 'nav.contact' } as const].map(
                  (item) => (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.to === '/'}
                        className={({ isActive }) =>
                          cn(
                            'block rounded-2xl px-4 py-3 font-serif text-2xl font-bold',
                            isActive ? 'bg-card text-primary' : 'text-navy hover:bg-card',
                          )
                        }
                      >
                        {t(item.key)}
                      </NavLink>
                    </li>
                  ),
                )}
              </ul>
            </nav>
            <div className="space-y-4 pt-6">
              <LanguageToggle />
              <Button
                fullWidth
                onClick={() => {
                  onClose();
                  openDonate();
                }}
              >
                {t('common.donate')}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
