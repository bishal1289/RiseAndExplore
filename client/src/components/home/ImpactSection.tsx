import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { HomepageContent, ImpactCardData } from '../../lib/types';
import { ImpactCard } from '../ImpactCard';
import { Reveal } from '../ui/Reveal';

export function ImpactSection({ impact, cards }: { impact: HomepageContent['impact']; cards: ImpactCardData[] }) {
  if (!cards.length) return null;
  return (
    <section aria-labelledby="impact-title" className="container-rise section pt-0 md:pt-0">
      <div className="mb-8 flex flex-col gap-3 md:mb-10 md:flex-row md:items-end md:justify-between">
        <h2 id="impact-title" className="h2">
          {impact.heading}
        </h2>
        {impact.linkUrl && impact.linkLabel && (
          <Link to={impact.linkUrl} className="group inline-flex items-center gap-1.5 font-semibold text-primary hover:text-primary-dark">
            {impact.linkLabel}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        )}
      </div>
      <ul className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
        {cards.map((card, i) => (
          <Reveal as="li" key={card._id} delay={i * 0.06}>
            <ImpactCard card={card} />
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
