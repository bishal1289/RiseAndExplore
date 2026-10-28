import { RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { adminApi, useAdminMutation, useAdminQuery } from '../lib/hooks';
import type { TrashEntry } from '../lib/types';
import { EmptyState, ListSkeleton, PageTitle } from '../components/ui';
import { useConfirm } from '../components/Confirm';
import { imageUrl } from '../../lib/utils';

export default function Trash() {
  const confirm = useConfirm();
  const { data: items = [], isLoading } = useAdminQuery<TrashEntry[]>('/trash');
  const restore = useAdminMutation((e: TrashEntry) => adminApi.post(`/trash/${e.type}/${e.id}/restore`), {
    success: 'Restored',
    invalidate: [['admin']],
  });
  const purge = useAdminMutation((e: TrashEntry) => adminApi.del(`/trash/${e.type}/${e.id}`), {
    success: 'Permanently deleted',
    invalidate: ['/trash'],
  });

  return (
    <>
      <PageTitle title="Trash" intro="Deleted items stay here for 30 days. After that they’re removed for good (including the photo or video file)." />
      {isLoading ? (
        <ListSkeleton />
      ) : items.length === 0 ? (
        <EmptyState icon={<Trash2 className="h-10 w-10" />} title="The Trash is empty" />
      ) : (
        <ul className="space-y-2">
          {items.map((e) => {
            const days = Math.max(0, Math.ceil((new Date(e.purgeAt).getTime() - Date.now()) / 86400000));
            return (
              <li key={`${e.type}-${e.id}`} className="flex flex-col gap-3 rounded-card bg-white p-3 shadow-soft ring-1 ring-navy/5 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-card">{e.thumb && <img src={imageUrl(e.thumb, 120, 120)} alt="" className="h-full w-full object-cover" />}</div>
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-navy">{e.label}</div>
                    <div className="text-sm text-muted">
                      {e.typeName} · deleted {new Date(e.deletedAt).toLocaleDateString()} · removed in {days} day{days === 1 ? '' : 's'}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline-navy" onClick={() => restore.mutate(e)}>
                    <RotateCcw className="h-4 w-4" aria-hidden /> Restore
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="!text-red-700"
                    onClick={async () =>
                      (await confirm({ title: 'Delete forever?', message: 'This can’t be undone.', danger: true, confirmLabel: 'Delete forever' })) && purge.mutate(e)
                    }
                  >
                    Delete forever
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
