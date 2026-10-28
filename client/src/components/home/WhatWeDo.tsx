import type { Program } from '../../lib/types';
import { ProgramCard } from '../ProgramCard';
import { Reveal } from '../ui/Reveal';

export function WhatWeDo({ heading, programs }: { heading: string; programs: Program[] }) {
  if (!programs.length) return null;
  return (
    <section aria-labelledby="whatwedo-title" className="container-rise section">
      <h2 id="whatwedo-title" className="h2 mb-8 md:mb-10">
        {heading}
      </h2>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {programs.map((p, i) => (
          <Reveal as="li" key={p._id} delay={i * 0.05}>
            <ProgramCard program={p} index={i} />
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
