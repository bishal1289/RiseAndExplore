import { cn } from '../../lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('relative overflow-hidden rounded-card bg-card', className)}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>
  );
}

export function ErrorState({ message, onRetry, retryLabel }: { message: string; onRetry?: () => void; retryLabel?: string }) {
  return (
    <div role="alert" className="rounded-card bg-card p-8 text-center text-muted">
      <p>{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-3 font-semibold text-primary underline">
          {retryLabel ?? 'Try again'}
        </button>
      )}
    </div>
  );
}
