import { Film, Play, Youtube } from 'lucide-react';
import type { MediaAsset } from '../lib/types';
import { cn, formatDuration, imageUrl } from '../../lib/utils';

export function MediaThumb({ asset, className }: { asset: MediaAsset; className?: string }) {
  const src = asset.type === 'image' ? asset.url : asset.posterUrl;
  return (
    <div className={cn('relative aspect-square overflow-hidden rounded-2xl bg-card', className)}>
      {src ? (
        <img src={imageUrl(src, 400, 400)} alt={asset.alt?.en || asset.caption?.en || ''} loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full place-items-center text-navy/40">
          <Film className="h-8 w-8" aria-hidden />
        </div>
      )}
      {asset.type !== 'image' && (
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-navy/80 to-transparent p-2 text-xs font-semibold text-white">
          <span className="flex items-center gap-1">
            {asset.type === 'embed' ? <Youtube className="h-3.5 w-3.5" aria-hidden /> : <Play className="h-3.5 w-3.5" fill="currentColor" aria-hidden />}
            {asset.orientation === 'vertical' ? '9:16' : asset.type === 'embed' ? asset.provider : 'Video'}
          </span>
          <span>{formatDuration(asset.duration)}</span>
        </div>
      )}
      {asset.status === 'processing' && (
        <span className="absolute left-2 top-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">Processing…</span>
      )}
    </div>
  );
}
