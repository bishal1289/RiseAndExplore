import { useTranslation } from 'react-i18next';
import { Button, LinkButton } from '../ui/Button';
import { useDonate } from '../donate/DonateProvider';
import { Reveal } from '../ui/Reveal';

export function CtaBanner({ heading }: { heading: string }) {
  const { t } = useTranslation();
  const { openDonate } = useDonate();
  return (
    <section aria-labelledby="cta-title" className="mx-auto max-w-[1180px] px-4 pb-section-sm sm:px-6 md:pb-section">
      <Reveal>
        <div className="flex flex-col gap-8 rounded-section bg-primary px-6 py-12 sm:px-10 md:flex-row md:items-center md:justify-between md:px-14 md:py-16">
          <h2 id="cta-title" className="h2 max-w-xl text-white">
            {heading}
          </h2>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Button variant="white" onClick={() => openDonate()}>
              {t('common.donate')}
            </Button>
            <LinkButton to="/get-involved" variant="outline-white">
              {t('common.volunteer')}
            </LinkButton>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
