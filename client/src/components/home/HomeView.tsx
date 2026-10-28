import type { ReactNode } from 'react';
import type { HomeData, SectionKey } from '../../lib/types';
import { Hero } from './Hero';
import { SummerEvents } from './SummerEvents';
import { ImpactSection } from './ImpactSection';
import { Testimonials } from './Testimonials';
import { WhatWeDo } from './WhatWeDo';
import { CommunityRow } from './CommunityRow';
import { CtaBanner } from './CtaBanner';

/** Pure rendering of the home page — also used by the admin "Preview changes" view. */
export function HomeView({ data }: { data: HomeData }) {
  const { homepage: h } = data;
  const render: Record<SectionKey, () => ReactNode> = {
    hero: () => <Hero hero={h.hero} donation={h.donation} />,
    summer: () => <SummerEvents summer={h.summer} events={data.featuredEvents} />,
    impact: () => <ImpactSection impact={h.impact} cards={data.impactCards} />,
    testimonials: () => <Testimonials items={data.testimonials} />,
    whatWeDo: () => <WhatWeDo heading={h.whatWeDo.heading} programs={data.programs} />,
    community: () => <CommunityRow community={h.community} items={data.community} />,
    cta: () => <CtaBanner heading={h.cta.heading} />,
  };
  return (
    <>
      {h.sections
        .filter((s) => s.visible)
        .map((s) => (
          <div key={s.key}>{render[s.key]?.()}</div>
        ))}
    </>
  );
}
