import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

const tones = {
  light: 'bg-card text-primary-dark',
  dark: 'bg-navy/85 text-white backdrop-blur',
  glass: 'bg-white/15 text-white backdrop-blur-md ring-1 ring-white/25',
  outline: 'ring-1 ring-navy/15 text-navy',
  white: 'bg-white text-navy',
};

export function Chip({
  children,
  tone = 'light',
  className,
}: {
  children: ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-semibold leading-5',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
