import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Visually hide the title (it stays available to screen readers). */
  hideTitle?: boolean;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'video';
  dark?: boolean;
  className?: string;
}

const sizes = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  video: 'max-w-5xl',
};

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, iframe, video[controls], [tabindex]:not([tabindex="-1"])';

/** Accessible modal: focus trap, Esc to close, restores focus, locks body scroll. */
export function Modal({ open, onClose, title, hideTitle, children, size = 'md', dark, className }: ModalProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => {
      const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? panelRef.current)?.focus();
    }, 30);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
      }
      if (e.key === 'Tab' && panelRef.current) {
        const nodes = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
          (n) => n.offsetParent !== null,
        );
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [open]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-navy/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.18 }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className={cn(
              'relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-card shadow-float sm:rounded-card',
              dark ? 'bg-black text-white' : 'bg-white',
              sizes[size],
              className,
            )}
            initial={reduce ? false : { y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduce ? undefined : { y: 24, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <div
              className={cn(
                'flex items-center justify-between gap-4 px-5 py-3',
                hideTitle && 'absolute inset-x-0 top-0 z-10',
              )}
            >
              <h2 id={titleId} className={cn('font-serif text-xl', hideTitle && 'sr-only', dark && 'text-white')}>
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label={t('common.close')}
                className={cn(
                  'ml-auto grid h-10 w-10 place-items-center rounded-full transition-colors',
                  dark || hideTitle ? 'bg-black/50 text-white hover:bg-black/70' : 'bg-card text-navy hover:bg-navy/10',
                )}
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <div className="overflow-y-auto">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
