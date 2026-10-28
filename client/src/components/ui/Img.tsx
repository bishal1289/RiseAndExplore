import { useState, type ImgHTMLAttributes } from 'react';
import { cn, imageUrl, srcSet } from '../../lib/utils';

interface ImgProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string;
  /** Rendered width used to pick the Cloudinary/Unsplash size. */
  width?: number;
  /** height / width — crops the source to this ratio. */
  ratio?: number;
  priority?: boolean;
  sizesHint?: string;
}

/** Lazy, responsive image that fades in and falls back to a placeholder on error. */
export function Img({ src, width = 1000, ratio, priority, sizesHint, className, alt = '', ...rest }: ImgProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const finalSrc = failed ? '/placeholder.svg' : imageUrl(src, width, ratio ? Math.round(width * ratio) : undefined);
  return (
    <img
      src={finalSrc}
      srcSet={failed ? undefined : srcSet(src, [400, 700, 1000, 1400].filter((w) => w <= width * 1.5), ratio)}
      sizes={sizesHint}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : undefined}
      onLoad={() => setLoaded(true)}
      onError={() => {
        setFailed(true);
        setLoaded(true);
      }}
      className={cn(
        'bg-card object-cover transition-opacity duration-500 motion-reduce:transition-none',
        loaded ? 'opacity-100' : 'opacity-0',
        className,
      )}
      {...rest}
    />
  );
}
