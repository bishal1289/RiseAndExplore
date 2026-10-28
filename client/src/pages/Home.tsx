import { useTranslation } from 'react-i18next';
import { Seo } from '../components/Seo';
import { HomeView } from '../components/home/HomeView';
import { ErrorState, Skeleton } from '../components/ui/Skeleton';
import { useHome } from '../hooks/usePublic';

export default function Home() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useHome();

  return (
    <>
      <Seo title={t('meta.home')} image={data?.homepage.hero.backgroundVideo.poster} />
      {isLoading && (
        <div className="mx-auto max-w-[1180px] space-y-10 px-4 pt-6 sm:px-6" aria-busy="true">
          <Skeleton className="h-[560px] rounded-section lg:h-[480px]" />
          <div className="container-rise grid gap-8 md:grid-cols-[320px_1fr]">
            <Skeleton className="aspect-[9/16]" />
            <div className="space-y-4">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
      )}
      {isError && (
        <div className="container-rise section">
          <ErrorState message={t('common.error')} onRetry={() => refetch()} retryLabel={t('common.retry')} />
        </div>
      )}
      {data && <HomeView data={data} />}
    </>
  );
}
