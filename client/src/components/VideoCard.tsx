import { useState } from 'react';
import { Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Img } from './ui/Img';
import { Modal } from './ui/Modal';
import { VideoPlayer } from './VideoPlayer';
import { cn, formatDuration } from '../lib/utils';

interface VideoCardProps {
  url: string;
  poster?: string;
  caption: string;
  duration?: number;
  vertical?: boolean;
  className?: string;
  /** Rounded size of the card. */
  rounded?: string;
}

/** Poster card with a centered play button; opens the full video in an accessible modal. */
export function VideoCard({ url, poster, caption, duration, vertical = true, className, rounded = 'rounded-card' }: VideoCardProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const time = formatDuration(duration);
  return (
    <>
      <button
        type="button"
        onClick={() => url && setOpen(true)}
        disabled={!url}
        aria-label={t('common.play', { title: caption })}
        className={cn(
          'group relative block w-full overflow-hidden bg-navy text-left',
          vertical ? 'aspect-[9/16]' : 'aspect-video',
          rounded,
          className,
        )}
      >
        <Img src={poster} alt="" width={700} ratio={vertical ? 16 / 9 : 9 / 16} className="absolute inset-0 h-full w-full transition-transform duration-700 group-hover:scale-[1.03]" />
        <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/10 to-transparent" />
        {url && (
          <span
            aria-hidden
            className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-primary text-white shadow-float transition-transform duration-200 group-hover:scale-110"
          >
            <Play className="ml-1 h-7 w-7" fill="currentColor" />
          </span>
        )}
        <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 text-white">
          <span className="font-serif text-lg font-bold leading-tight">{caption}</span>
          {time && <span className="shrink-0 text-sm font-semibold text-white/85">{time}</span>}
        </span>
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={caption} hideTitle size={vertical ? 'sm' : 'video'} dark>
        {open && <VideoPlayer url={url} poster={poster} title={caption} vertical={vertical} />}
      </Modal>
    </>
  );
}
