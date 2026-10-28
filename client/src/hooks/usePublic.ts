import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api, withLang } from '../lib/api';
import type { EventDetail, EventSummary, GalleryItem, HomeData, Program, SiteSettings, Album } from '../lib/types';

export const useLang = () => {
  const { i18n } = useTranslation();
  return (i18n.resolvedLanguage ?? 'en').startsWith('es') ? 'es' : 'en';
};

/** Public GET with the current language as part of the cache key. */
export function usePublic<T>(path: string, enabled = true) {
  const lang = useLang();
  return useQuery({
    queryKey: ['public', path, lang],
    queryFn: ({ signal }) => api<T>(withLang(path, lang), { signal }),
    enabled,
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });
}

export const useSettings = () => usePublic<SiteSettings>('/settings');
export const useHome = () => usePublic<HomeData>('/home');
export const usePrograms = () => usePublic<Program[]>('/programs');
export const useEvents = (when: 'upcoming' | 'past') => usePublic<EventSummary[]>(`/events?when=${when}`);
export const useEvent = (slug?: string) => usePublic<EventDetail>(`/events/${slug}`, Boolean(slug));
export const useAlbums = () => usePublic<Album[]>('/albums');
export const useGallery = (params: Record<string, string | undefined> = {}) => {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString();
  return usePublic<GalleryItem[]>(`/gallery${qs ? `?${qs}` : ''}`);
};
