import type { ImpactCardData } from '../lib/types';
import { Chip } from './ui/Chip';
import { Img } from './ui/Img';

export function ImpactCard({ card }: { card: ImpactCardData }) {
  return (
    <article>
      <div className="relative overflow-hidden rounded-card">
        <Img
          src={card.image}
          alt={card.imageAlt || card.title}
          width={640}
          ratio={5 / 4}
          className="aspect-[4/5] w-full"
          sizesHint="(min-width: 768px) 320px, 100vw"
        />
        {card.dateLabel && (
          <Chip tone="dark" className="absolute left-4 top-4">
            {card.dateLabel}
          </Chip>
        )}
      </div>
      <h3 className="mt-5 font-serif text-2xl">{card.title}</h3>
      <p className="mt-2 text-muted">{card.description}</p>
    </article>
  );
}
