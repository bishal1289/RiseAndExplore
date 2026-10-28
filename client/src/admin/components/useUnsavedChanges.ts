import { useCallback, useEffect, useRef } from 'react';
import { useBlocker } from 'react-router-dom';
import { useConfirm } from './Confirm';

/**
 * Warns before leaving a form with unsaved changes (in-app navigation and tab close).
 * Returns `allowNavigation()` to call right before a programmatic navigate after saving/deleting.
 */
export function useUnsavedChanges(dirty: boolean) {
  const confirm = useConfirm();
  const bypass = useRef(false);
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => !bypass.current && dirty && currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    confirm({
      title: 'Leave without saving?',
      message: 'You have changes that haven’t been saved yet. If you leave now, they will be lost.',
      confirmLabel: 'Leave page',
      danger: true,
    }).then((ok) => (ok ? blocker.proceed() : blocker.reset()));
  }, [blocker, confirm]);

  useEffect(() => {
    if (!dirty) {
      bypass.current = false;
      return;
    }
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  return useCallback(() => {
    bypass.current = true;
  }, []);
}

/** Simple deep-equality via JSON for "dirty" detection on form state. */
export const isSame = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
