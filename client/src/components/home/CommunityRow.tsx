import type { GalleryItem, HomepageContent } from '../../lib/types';
import { LinkButton } from '../ui/Button';
import { Img } from '../ui/Img';
import { Reveal } from '../ui/Reveal';
import { cn } from '../../lib/utils';

export function CommunityRow({ community, items }: { community: HomepageContent['community']; items: GalleryItem[] }) {
  if (!items.length) return null;
  return (
    <section aria-labelledby="community-title" className="section pt-0 md:pt-0">
      <div className="container-rise mb-8 flex flex-col gap-4 md:mb-10 md:flex-row md:items-end md:justify-between">
        <h2 id="community-title" className="h2">
          {community.heading}
        </h2>
        <LinkButton to="/gallery" variant="outline-navy" className="self-start md:self-auto">
          {community.buttonLabel}
        </LinkButton>
      </div>
      <Reveal className="container-rise !px-0 lg:!px-0">
        <ul className="scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 md:grid md:grid-cols-4 md:overflow-visible md:px-0 lg:px-0">
          {items.slice(0, 4).map((item, i) => (
            <li key={item._id} className="w-[72%] shrink-0 snap-start sm:w-[44%] md:w-auto">
              <Img
                src={item.image}
                alt={item.alt || item.caption}
                width={500}
                ratio={4 / 3}
                className={cn(
                  'aspect-[3/4] w-full',
                  i === 0 ? 'rounded-[999px_999px_24px_24px]' : 'rounded-card',
                )}
                sizesHint="(min-width: 768px) 240px, 72vw"
              />
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
