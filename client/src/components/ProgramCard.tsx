import { Link } from 'react-router-dom';
import type { Program } from '../lib/types';
import { cn } from '../lib/utils';

/** Number circles get progressively darker blue (1 → 4). */
const NUMBER_SHADES = ['bg-[#5FA3E0]', 'bg-[#2F86D6]', 'bg-primary', 'bg-[#0D4F8C]'];

export function ProgramCard({ program, index }: { program: Program; index: number }) {
  return (
    <article className="group relative flex h-full flex-col rounded-card bg-card p-6 transition-colors hover:bg-[#DCEAF7]">
      <span
        aria-hidden
        className={cn(
          'grid h-11 w-11 place-items-center rounded-full font-serif text-lg font-black text-white',
          NUMBER_SHADES[index % NUMBER_SHADES.length],
        )}
      >
        {program.number}
      </span>
      <h3 className="mt-6 font-serif text-2xl">
        <Link
          to={`/programs#${program.slug}`}
          className="after:absolute after:inset-0 after:rounded-card focus-visible:outline-none"
        >
          {program.title}
        </Link>
      </h3>
      <p className="mt-3 text-muted">{program.shortText}</p>
    </article>
  );
}
