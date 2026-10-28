import { useTranslation } from 'react-i18next';
import { cn, embedUrl, videoUrl } from '../lib/utils';

interface Props {
  url: string;
  poster?: string;
  title: string;
  autoPlay?: boolean;
  vertical?: boolean;
  className?: string;
}

/** Plays a Cloudinary/MP4 file with native controls, or a YouTube/Vimeo embed. */
export function VideoPlayer({ url, poster, title, autoPlay = true, vertical, className }: Props) {
  const { t } = useTranslation();
  const embed = embedUrl(url, autoPlay);
  const frame = cn(
    'w-full bg-black',
    vertical ? 'mx-auto aspect-[9/16] max-h-[80vh] w-auto' : 'aspect-video',
    className,
  );
  if (embed) {
    return (
      <iframe
        src={embed}
        title={title}
        className={frame}
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
        allowFullScreen
      />
    );
  }
  return (
    <video
      src={videoUrl(url)}
      poster={poster}
      controls
      autoPlay={autoPlay}
      playsInline
      preload="metadata"
      aria-label={title}
      className={cn(frame, 'object-contain')}
    >
      {t('video.noSupport')}
    </video>
  );
}
