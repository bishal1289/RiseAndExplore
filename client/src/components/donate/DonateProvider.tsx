import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../ui/Modal';
import { ZeffyEmbed } from './ZeffyEmbed';
import { useSettings } from '../../hooks/usePublic';

type Frequency = 'once' | 'monthly';
interface DonateChoice {
  amount?: number;
  frequency?: Frequency;
}

const DonateContext = createContext<{ openDonate: (choice?: DonateChoice) => void } | null>(null);

/** Provides `openDonate()` so every Donate button opens the same Zeffy modal. */
export function DonateProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { data: settings } = useSettings();
  const [choice, setChoice] = useState<DonateChoice | null>(null);

  const openDonate = useCallback((c: DonateChoice = {}) => setChoice(c), []);
  const value = useMemo(() => ({ openDonate }), [openDonate]);

  return (
    <DonateContext.Provider value={value}>
      {children}
      <Modal open={choice !== null} onClose={() => setChoice(null)} title={t('donate.modalTitle')} size="md">
        {choice?.amount && (
          <p className="mx-5 mb-2 rounded-2xl bg-card px-4 py-3 text-sm text-navy">
            {t('donate.chosen', {
              amount: choice.amount,
              frequency: choice.frequency === 'monthly' ? t('donate.monthly') : t('donate.oneTime'),
            })}
          </p>
        )}
        <div className="px-2 pb-2 sm:px-4 sm:pb-4">
          <ZeffyEmbed url={settings?.zeffyFormUrl} minHeight={720} />
        </div>
      </Modal>
    </DonateContext.Provider>
  );
}

export function useDonate() {
  const ctx = useContext(DonateContext);
  if (!ctx) throw new Error('useDonate must be used inside <DonateProvider>');
  return ctx;
}
