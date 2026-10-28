import { useCallback, useEffect, useRef, useState, type DragEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { CheckCircle2, CloudUpload, Film, ImageIcon, RotateCcw, X, AlertCircle } from 'lucide-react';
import { ACCEPT, MAX_FILES, kindOf, uploadMedia, formatBytes, type UploadFolder } from '../lib/upload';
import type { MediaAsset } from '../lib/types';
import { cn } from '../../lib/utils';

type Status = 'queued' | 'working' | 'done' | 'error' | 'cancelled';

interface QueueItem {
  id: string;
  file: File;
  kind: 'image' | 'video' | null;
  status: Status;
  progress: number;
  stage: string;
  error?: string;
  controller?: AbortController;
  preview?: string;
}

const CONCURRENCY = 3;

interface UploaderProps {
  folder?: UploadFolder;
  eventRef?: string | null;
  onUploaded?: (asset: MediaAsset) => void;
  /** Called once every file in a batch has finished. */
  onBatchDone?: (assets: MediaAsset[]) => void;
  accept?: 'all' | 'image' | 'video';
  compact?: boolean;
}

export function Uploader({ folder = 'rise/media', eventRef, onUploaded, onBatchDone, accept = 'all', compact }: UploaderProps) {
  const qc = useQueryClient();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const batchRef = useRef<MediaAsset[]>([]);
  const callbacks = useRef({ onUploaded, onBatchDone });
  callbacks.current = { onUploaded, onBatchDone };

  const update = (id: string, patch: Partial<QueueItem>) =>
    setQueue((q) => q.map((item) => (item.id === id ? { ...item, ...patch } : item)));

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      let list = [...files];
      if (list.length > MAX_FILES) {
        toast.error(`You can upload up to ${MAX_FILES} files at once. The first ${MAX_FILES} were added.`);
        list = list.slice(0, MAX_FILES);
      }
      const items: QueueItem[] = list.map((file) => {
        const kind = kindOf(file);
        const allowed = kind && (accept === 'all' || accept === kind);
        return {
          id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`,
          file,
          kind,
          status: allowed ? 'queued' : 'error',
          progress: 0,
          stage: allowed ? 'Waiting…' : '',
          error: allowed ? undefined : accept === 'image' ? 'Please choose a photo' : accept === 'video' ? 'Please choose a video' : 'This file type isn’t supported',
          preview: kind === 'image' && !/\.(heic|heif)$/i.test(file.name) ? URL.createObjectURL(file) : undefined,
        };
      });
      batchRef.current = [];
      setQueue((q) => [...q.filter((i) => i.status !== 'done'), ...items]);
    },
    [accept],
  );

  // Simple worker pool: keep up to CONCURRENCY uploads running.
  useEffect(() => {
    const working = queue.filter((i) => i.status === 'working').length;
    const next = queue.filter((i) => i.status === 'queued').slice(0, Math.max(0, CONCURRENCY - working));
    for (const item of next) {
      const controller = new AbortController();
      update(item.id, { status: 'working', controller, stage: 'Starting…' });
      uploadMedia(item.file, {
        folder,
        eventRef,
        signal: controller.signal,
        onProgress: (p) => update(item.id, { progress: p }),
        onStage: (stage) => update(item.id, { stage }),
      })
        .then((asset) => {
          update(item.id, { status: 'done', progress: 1, stage: asset.status === 'processing' ? 'Processing video…' : 'Done' });
          batchRef.current.push(asset);
          callbacks.current.onUploaded?.(asset);
        })
        .catch((err: Error) => {
          if (err.name === 'AbortError') update(item.id, { status: 'cancelled', stage: 'Cancelled' });
          else update(item.id, { status: 'error', error: err.message });
        });
    }
    const active = queue.some((i) => i.status === 'working' || i.status === 'queued');
    if (!active && batchRef.current.length) {
      const done = batchRef.current;
      batchRef.current = [];
      qc.invalidateQueries({ queryKey: ['admin'] });
      toast.success(`${done.length} file${done.length > 1 ? 's' : ''} uploaded`);
      callbacks.current.onBatchDone?.(done);
    }
  }, [queue, folder, eventRef, qc]);

  useEffect(() => () => queue.forEach((i) => i.preview && URL.revokeObjectURL(i.preview)), []); // eslint-disable-line react-hooks/exhaustive-deps

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const acceptAttr = accept === 'image' ? 'image/*,.heic,.heif' : accept === 'video' ? 'video/*,.mov' : ACCEPT;
  const what = accept === 'image' ? 'photos' : accept === 'video' ? 'videos' : 'photos & videos';

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'grid place-items-center rounded-card border-2 border-dashed text-center transition-colors',
          compact ? 'px-4 py-6' : 'px-6 py-10 sm:py-14',
          dragging ? 'border-primary bg-card' : 'border-navy/20 bg-white',
        )}
      >
        <CloudUpload className={cn('text-primary', compact ? 'h-8 w-8' : 'h-12 w-12')} aria-hidden />
        <p className="mt-3 font-serif text-xl font-bold text-navy">
          <span className="hidden sm:inline">Drag {what} here, or </span>
          <button type="button" onClick={() => inputRef.current?.click()} className="text-primary underline underline-offset-4">
            <span className="sm:hidden">Tap to choose {what}</span>
            <span className="hidden sm:inline">choose from your computer</span>
          </button>
        </p>
        <p className="mt-2 text-sm text-muted">
          Photos: JPG, PNG, HEIC, WebP · Videos: MP4, MOV, WebM · Up to {MAX_FILES} at once
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={acceptAttr}
          className="sr-only"
          aria-label={`Choose ${what} to upload`}
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {queue.length > 0 && (
        <ul className="mt-4 space-y-2" aria-label="Upload progress">
          {queue.map((item) => (
            <li key={item.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-navy/10">
              <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-card">
                {item.preview ? (
                  <img src={item.preview} alt="" className="h-full w-full object-cover" />
                ) : item.kind === 'video' ? (
                  <Film className="h-5 w-5 text-navy" aria-hidden />
                ) : (
                  <ImageIcon className="h-5 w-5 text-navy" aria-hidden />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate font-semibold text-navy">{item.file.name}</span>
                  <span className="shrink-0 text-muted">{formatBytes(item.file.size)}</span>
                </div>
                {item.status === 'error' ? (
                  <p className="mt-1 flex items-center gap-1 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4" aria-hidden />
                    {item.error}
                  </p>
                ) : (
                  <>
                    <div
                      className="mt-2 h-2 overflow-hidden rounded-full bg-card"
                      role="progressbar"
                      aria-label={`Uploading ${item.file.name}`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(item.progress * 100)}
                    >
                      <div
                        className={cn('h-full rounded-full transition-all', item.status === 'done' ? 'bg-emerald-500' : 'bg-primary')}
                        style={{ width: `${Math.round(item.progress * 100)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {item.stage} {item.status === 'working' && `${Math.round(item.progress * 100)}%`}
                    </p>
                  </>
                )}
              </div>
              {item.status === 'working' || item.status === 'queued' ? (
                <button
                  type="button"
                  onClick={() => (item.controller ? item.controller.abort() : update(item.id, { status: 'cancelled', stage: 'Cancelled' }))}
                  aria-label={`Cancel ${item.file.name}`}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-navy hover:bg-card"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              ) : item.status === 'done' ? (
                <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" aria-label="Uploaded" />
              ) : item.kind ? (
                <button
                  type="button"
                  onClick={() => update(item.id, { status: 'queued', progress: 0, error: undefined, stage: 'Waiting…' })}
                  aria-label={`Retry ${item.file.name}`}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-primary hover:bg-card"
                >
                  <RotateCcw className="h-5 w-5" aria-hidden />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
