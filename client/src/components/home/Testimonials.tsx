import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Testimonial } from '../../lib/types';
import { VideoCard } from '../VideoCard';
import { Img } from '../ui/Img';
import { Reveal } from '../ui/Reveal';
import { cn } from '../../lib/utils';

export function Testimonials({ items }: { items: Testimonial[] }) {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  if (!items.length) return null;
  const current = items[Math.min(index, items.length - 1)];
  const go = (d: number) => setIndex((i) => (i + d + items.length) % items.length);
  const multiple = items.length > 1;

  return (
    <section aria-labelledby="testimonial-label" className="mx-auto max-w-[1180px] px-4 sm:px-6">
      <Reveal>
        <div
          className="rounded-section bg-card px-6 py-10 sm:px-10 md:px-14 md:py-14"
          {...(multiple ? { role: 'region', 'aria-roledescription': 'carousel', 'aria-label': t('home.carousel') } : {})}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={current._id}
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="grid gap-10 md:grid-cols-[minmax(0,280px)_1fr] md:items-center md:gap-14"
              {...(multiple
                ? { role: 'group', 'aria-roledescription': 'slide', 'aria-label': t('home.slide', { n: index + 1, total: items.length }) }
                : {})}
            >
              <div className="mx-auto w-full max-w-[280px]">
                {current.videoUrl ? (
                  <VideoCard
                    url={current.videoUrl}
                    poster={current.poster}
                    caption={current.videoCaption || current.organization}
                    duration={current.duration}
                  />
                ) : (
                  <Img src={current.poster} alt="" width={560} ratio={16 / 9} className="aspect-[9/16] w-full rounded-card" />
                )}
              </div>
              <figure>
                <div id="testimonial-label" className="label text-primary">
                  {t('home.testimonialLabel')}
                </div>
                <blockquote className="mt-5 font-serif text-[28px] font-black leading-[1.15] tracking-[-0.01em] text-navy md:text-[38px]">
                  “{current.quote}”
                </blockquote>
                <figcaption className="mt-6">
                  <div className="font-semibold text-navy">{current.name}</div>
                  <div className="text-muted">{current.organization}</div>
                </figcaption>
              </figure>
            </motion.div>
          </AnimatePresence>

          {multiple && (
            <div className="mt-8 flex items-center justify-center gap-3 md:justify-end">
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label={t('common.previous')}
                className="grid h-11 w-11 place-items-center rounded-full bg-white text-navy hover:bg-navy hover:text-white"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden />
              </button>
              <div className="flex gap-2">
                {items.map((item, i) => (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={t('home.goToSlide', { n: i + 1 })}
                    aria-current={i === index}
                    className={cn('h-2.5 rounded-full transition-all', i === index ? 'w-7 bg-navy' : 'w-2.5 bg-navy/25')}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label={t('common.next')}
                className="grid h-11 w-11 place-items-center rounded-full bg-white text-navy hover:bg-navy hover:text-white"
              >
                <ChevronRight className="h-5 w-5" aria-hidden />
              </button>
            </div>
          )}
        </div>
      </Reveal>
    </section>
  );
}
