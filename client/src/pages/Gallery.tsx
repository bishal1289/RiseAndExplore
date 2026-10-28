import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Seo } from '../components/Seo';
import { PageHeader } from '../components/PageHeader';
import { PhotoGrid } from '../components/PhotoGrid';
import { ErrorState, Skeleton } from '../components/ui/Skeleton';
import { useAlbums, useGallery, usePrograms } from '../hooks/usePublic';
import { cn } from '../lib/utils';

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'h-10 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors',
        active ? 'bg-navy text-white' : 'bg-white text-navy ring-1 ring-navy/15 hover:ring-navy/40',
      )}
    >
      {children}
    </button>
  );
}

export default function Gallery() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const album = params.get('album') ?? undefined;
  const program = params.get('program') ?? undefined;
  const { data: albums } = useAlbums();
  const { data: programs } = usePrograms();
  const { data: items, isLoading, isError, refetch } = useGallery({ album, program });

  const setFilter = (key?: 'album' | 'program', value?: string) => {
    const next = new URLSearchParams();
    if (key && value) next.set(key, value);
    setParams(next, { replace: true });
  };

  return (
    <>
      <Seo title={t('meta.gallery')} description={t('gallery.intro')} image={items?.[0]?.image} />
      <PageHeader eyebrow={t('nav.gallery')} title={t('gallery.title')} intro={t('gallery.intro')} />
      <div className="container-rise pb-section-sm md:pb-section">
        <div role="group" aria-label={t('gallery.filterBy')} className="mb-8 space-y-3">
          <div className="scrollbar-none -mx-6 flex gap-2 overflow-x-auto px-6 md:mx-0 md:flex-wrap md:px-0">
            <FilterChip active={!album && !program} onClick={() => setFilter()}>
              {t('gallery.all')}
            </FilterChip>
            {albums?.map((a) => (
              <FilterChip key={a._id} active={album === a._id} onClick={() => setFilter('album', a._id)}>
                {a.title}
              </FilterChip>
            ))}
          </div>
          {programs && programs.length > 0 && (
            <div className="scrollbar-none -mx-6 flex items-center gap-2 overflow-x-auto px-6 md:mx-0 md:flex-wrap md:px-0">
              <span className="label shrink-0 text-muted">{t('gallery.byProgram')}</span>
              {programs.map((p) => (
                <FilterChip key={p._id} active={program === p._id} onClick={() => setFilter('program', p._id)}>
                  {p.title}
                </FilterChip>
              ))}
            </div>
          )}
        </div>

        {isLoading && (
          <div className="columns-2 gap-4 md:columns-3">
            {[260, 340, 220, 300, 280, 360].map((height, i) => (
              <div key={i} style={{ height }} className="mb-4 break-inside-avoid">
                <Skeleton className="h-full" />
              </div>
            ))}
          </div>
        )}
        {isError && <ErrorState message={t('common.error')} onRetry={() => refetch()} retryLabel={t('common.retry')} />}
        {items && items.length === 0 && <p className="rounded-card bg-card p-8 text-center text-muted">{t('gallery.empty')}</p>}
        {items && items.length > 0 && (
          <PhotoGrid
            photos={items.map((g) => ({
              id: g._id,
              src: g.image,
              alt: g.alt || g.caption,
              caption: g.caption,
              width: g.width,
              height: g.height,
            }))}
          />
        )}
      </div>
    </>
  );
}
