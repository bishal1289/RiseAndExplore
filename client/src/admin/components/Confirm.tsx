import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';

interface ConfirmOptions {
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
}

const ConfirmContext = createContext<(o: ConfirmOptions) => Promise<boolean>>(async () => false);

/** `const confirm = useConfirm(); if (await confirm({...})) …` */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<(v: boolean) => void>();

  const confirm = useCallback(
    (o: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        resolver.current = resolve;
        setOpts(o);
      }),
    [],
  );

  const close = (v: boolean) => {
    resolver.current?.(v);
    setOpts(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal open={!!opts} onClose={() => close(false)} title={opts?.title ?? ''} size="sm">
        <div className="px-5 pb-5">
          {opts?.message && <div className="text-muted">{opts.message}</div>}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline-navy" onClick={() => close(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => close(true)}
              className={opts?.danger ? '!bg-red-600 hover:!bg-red-700' : undefined}
            >
              {opts?.confirmLabel ?? 'Yes, continue'}
            </Button>
          </div>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmContext);
