import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useReducedMotion } from 'framer-motion';
import { Play } from 'lucide-react';
import type { HomepageContent } from '../../lib/types';
import { Button, LinkButton } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { VideoPlayer } from '../VideoPlayer';
import { DonateCard } from '../donate/DonateCard';
import { useDonate } from '../donate/DonateProvider';
import { formatDuration, imageUrl, videoUrl } from '../../lib/utils';

export function Hero({ hero, donation }: Pick<HomepageContent, 'hero' | 'donation'>) {
  const { t } = useTranslation();
  const { openDonate } = useDonate();
  const reduce = useReducedMotion();
  const [watchOpen, setWatchOpen] = useState(false);
  const bg = hero.backgroundVideo;
  const watch = hero.watchVideo;
  const watchLabel = [watch.label, formatDuration(watch.duration)].filter(Boolean).join(' ');

  return (
    <section aria-labelledby="hero-title" className="mx-auto max-w-[1180px] px-4 pt-4 sm:px-6 md:pt-6">
      <div className="relative isolate overflow-hidden rounded-section bg-navy">
        {/* Background media */}
        {bg.url && !reduce ? (
          <video
            className="absolute inset-0 -z-10 h-full w-full object-cover"
            src={videoUrl(bg.url)}
            poster={imageUrl(bg.poster, 1600)}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden
            tabIndex={-1}
          />
        ) : (
          <img
            src={imageUrl(bg.poster, 1600)}
            alt=""
            className="absolute inset-0 -z-10 h-full w-full object-cover"
            fetchPriority="high"
          />
        )}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-r from-navy/95 via-navy/75 to-navy/30 max-lg:bg-gradient-to-b max-lg:from-navy/70 max-lg:via-navy/85 max-lg:to-navy"
        />

        <div className="grid gap-10 p-6 sm:p-10 lg:min-h-[480px] lg:grid-cols-[1fr_360px] lg:items-center lg:gap-12 lg:p-12">
          <div className="flex flex-col items-start">
            {watch.url && (
              <button
                type="button"
                onClick={() => setWatchOpen(true)}
                aria-label={`${t('home.openVideo')}: ${watchLabel}`}
                className="inline-flex items-center gap-2 rounded-full bg-white/15 py-1.5 pl-1.5 pr-4 text-sm font-semibold text-white ring-1 ring-white/25 backdrop-blur-md transition-colors hover:bg-white/25"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-navy">
                  <Play className="ml-0.5 h-3.5 w-3.5" fill="currentColor" aria-hidden />
                </span>
                {watchLabel}
              </button>
            )}
            <h1 id="hero-title" className="h1 mt-8 text-white lg:mt-10">
              {hero.headline}
            </h1>
            <p className="mt-5 max-w-lg text-lg text-white/85">{hero.text}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button onClick={() => openDonate()}>{t('common.donate')}</Button>
              <LinkButton to="/get-involved" variant="outline-white">
                {t('common.volunteer')}
              </LinkButton>
            </div>
          </div>
          <DonateCard amounts={donation.amounts} defaultAmount={donation.defaultAmount} className="lg:justify-self-end" />
        </div>
      </div>

      <Modal open={watchOpen} onClose={() => setWatchOpen(false)} title={watchLabel || t('common.watch')} hideTitle size="video" dark>
        {watchOpen && <VideoPlayer url={watch.url} poster={watch.poster} title={watchLabel} />}
      </Modal>
    </section>
  );
}
