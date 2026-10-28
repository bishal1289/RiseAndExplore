import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Lightbox from 'yet-another-react-lightbox';
import Captions from 'yet-another-react-lightbox/plugins/captions';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/captions.css';
import { Img } from './ui/Img';
import { imageUrl } from '../lib/utils';

export interface GridPhoto {
  id: string;
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
}

/** Masonry photo grid with an accessible lightbox. */
export function PhotoGrid({ photos }: { photos: GridPhoto[] }) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(-1);
  return (
    <>
      <ul className="columns-2 gap-3 sm:gap-4 md:columns-3">
        {photos.map((p, i) => (
          <li key={p.id} className="mb-3 break-inside-avoid sm:mb-4">
            <button
              type="button"
              onClick={() => setIndex(i)}
              aria-label={t('gallery.open', { caption: p.caption || p.alt })}
              className="group block w-full overflow-hidden rounded-card"
            >
              <Img
                src={p.src}
                alt={p.alt}
                width={600}
                className="h-auto w-full transition-transform duration-500 group-hover:scale-[1.03]"
                style={p.width && p.height ? { aspectRatio: `${p.width} / ${p.height}` } : undefined}
                sizesHint="(min-width: 768px) 320px, 50vw"
              />
            </button>
          </li>
        ))}
      </ul>
      <Lightbox
        open={index >= 0}
        index={index}
        close={() => setIndex(-1)}
        plugins={[Captions]}
        slides={photos.map((p) => ({
          src: imageUrl(p.src, 2000),
          alt: p.alt,
          description: p.caption,
          width: p.width || undefined,
          height: p.height || undefined,
        }))}
        labels={{ Close: t('common.close'), Previous: t('common.previous'), Next: t('common.next') }}
      />
    </>
  );
}
