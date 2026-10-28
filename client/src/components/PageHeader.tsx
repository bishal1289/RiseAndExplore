import type { ReactNode } from 'react';
import { Reveal } from './ui/Reveal';

export function PageHeader({ eyebrow, title, intro, children }: { eyebrow?: string; title: string; intro?: string; children?: ReactNode }) {
  return (
    <header className="container-rise pb-10 pt-14 md:pb-14 md:pt-20">
      <Reveal>
        {eyebrow && <div className="label mb-4 text-primary">{eyebrow}</div>}
        <h1 className="h1 max-w-3xl">{title}</h1>
        {intro && <p className="mt-5 max-w-2xl text-lg text-muted md:text-xl">{intro}</p>}
        {children}
      </Reveal>
    </header>
  );
}
