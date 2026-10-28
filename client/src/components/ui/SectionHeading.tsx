import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface Props {
  title: ReactNode;
  eyebrow?: ReactNode;
  intro?: ReactNode;
  action?: ReactNode;
  as?: 'h1' | 'h2';
  id?: string;
  className?: string;
  light?: boolean;
}

export function SectionHeading({ title, eyebrow, intro, action, as = 'h2', id, className, light }: Props) {
  const Heading = as;
  return (
    <div className={cn('mb-8 flex flex-col gap-4 md:mb-10 md:flex-row md:items-end md:justify-between', className)}>
      <div className="max-w-2xl">
        {eyebrow && <div className={cn('label mb-3', light ? 'text-white/70' : 'text-primary')}>{eyebrow}</div>}
        <Heading id={id} className={cn(as === 'h1' ? 'h1' : 'h2', light && 'text-white')}>
          {title}
        </Heading>
        {intro && <p className={cn('mt-4 text-lg', light ? 'text-white/80' : 'text-muted')}>{intro}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
