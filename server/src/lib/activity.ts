import type { Request } from 'express';
import { ActivityLog } from '../models/Logs.js';

type Action = 'created' | 'updated' | 'published' | 'deleted' | 'restored' | 'uploaded' | 'purged';

export async function logActivity(
  req: Request | null,
  action: Action,
  entityType: string,
  entityId: unknown,
  label = '',
) {
  try {
    await ActivityLog.create({
      user: req?.user?._id,
      userName: req?.user?.name || req?.user?.email || 'System',
      action,
      entityType,
      entityId: String(entityId ?? ''),
      label,
    });
  } catch (err) {
    console.error('[activity] failed', err);
  }
}
