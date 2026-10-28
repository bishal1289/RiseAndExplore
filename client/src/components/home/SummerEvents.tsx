import type { EventSummary, HomepageContent } from '../../lib/types';
import { Chip } from '../ui/Chip';
import { Reveal } from '../ui/Reveal';
import { VideoCard } from '../VideoCard';
import { EventRow } from '../EventRow';

export function SummerEvents({ summer, events }: { summer: HomepageContent['summer']; events: EventSummary[] }) {
  return (
    <section aria-labelledby="summer-title" className="container-rise section">
      <div className="grid gap-10 md:grid-cols-[minmax(0,320px)_1fr] md:items-center md:gap-14">
        <Reveal className="mx-auto w-full max-w-[320px]">
          <VideoCard url={summer.video.url} poster={summer.video.poster} caption={summer.video.label} duration={summer.video.duration} />
        </Reveal>
        <Reveal delay={0.08}>
          {summer.chip && <Chip>{summer.chip}</Chip>}
          <h2 id="summer-title" className="h2 mt-4">
            {summer.heading}
          </h2>
          <p className="mt-4 text-lg text-muted">{summer.text}</p>
          {events.length > 0 && (
            <ul className="mt-8 space-y-3">
              {events.map((e) => (
                <li key={e._id}>
                  <EventRow event={e} />
                </li>
              ))}
            </ul>
          )}
        </Reveal>
      </div>
    </section>
  );
}
