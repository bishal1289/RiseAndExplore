import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';

/** GET /api/admin/<path> */
export function useAdminQuery<T>(path: string, opts: { enabled?: boolean; refetchInterval?: number } = {}) {
  return useQuery({
    queryKey: ['admin', path],
    queryFn: ({ signal }) => api<T>(`/admin${path}`, { signal }),
    ...opts,
  });
}

interface MutationOpts<TData> {
  /** Toast shown on success, e.g. "Event saved". */
  success?: string | ((data: TData) => string);
  /** Query keys (admin paths or full keys) to refresh afterwards. */
  invalidate?: (string | QueryKey)[];
  onSuccess?: (data: TData) => void;
}

export function useAdminMutation<TData = unknown, TVars = unknown>(
  fn: (vars: TVars) => Promise<TData>,
  { success, invalidate = [], onSuccess }: MutationOpts<TData> = {},
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (data) => {
      for (const key of invalidate) {
        qc.invalidateQueries({ queryKey: typeof key === 'string' ? ['admin', key] : key });
      }
      // Public pages cache content too.
      qc.invalidateQueries({ queryKey: ['public'] });
      if (success) toast.success(typeof success === 'function' ? success(data) : success);
      onSuccess?.(data);
    },
    onError: (err: Error) => toast.error(err.message || 'Something went wrong'),
  });
}

export const adminApi = {
  get: <T>(path: string) => api<T>(`/admin${path}`),
  post: <T>(path: string, body?: unknown) => api<T>(`/admin${path}`, { method: 'POST', body }),
  put: <T>(path: string, body?: unknown) => api<T>(`/admin${path}`, { method: 'PUT', body }),
  del: <T>(path: string) => api<T>(`/admin${path}`, { method: 'DELETE' }),
};
