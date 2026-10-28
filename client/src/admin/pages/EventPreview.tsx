import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { useAdminQuery } from '../lib/hooks';
import type { AdminEvent } from '../lib/types';
import type { EventDetail } from '../../lib/types';
import { localizeDeep } from '../lib/localize';
import { EventDetailView } from '../../pages/EventDetail';
import { DonateProvider } from '../../components/donate/DonateProvider';
import { Header } from '../../layout/Header';
import { Footer } from '../../layout/Footer';
import { ListSkeleton } from '../components/ui';

/** Shows the event exactly as visitors will see it, even while it's a draft. */
export default function EventPreview() {
  const { id } = useParams();
  const [lang, setLang] = useState<'en' | 'es'>('en');
  const { data, isLoading } = useAdminQuery<AdminEvent>(`/events/${id}`);

  if (isLoading || !data) return <ListSkeleton rows={4} />;
  const event = { ...localizeDeep<EventDetail>(data, lang), spotsLeft: null };

  return (
    <DonateProvider>
      <div className="sticky top-0 z-[60] flex flex-wrap items-center gap-3 bg-gold px-4 py-2 text-sm font-semibold text-navy">
        <Eye className="h-4 w-4" aria-hidden />
        Preview — {data.status === 'published' ? 'this event is live' : 'visitors can’t see this yet'}
        <span className="ml-auto inline-flex rounded-full bg-white/60 p-0.5">
          {(['en', 'es'] as const).map((l) => (
            <button key={l} type="button" onClick={() => setLang(l)} aria-pressed={lang === l} className={`rounded-full px-3 py-1 uppercase ${lang === l ? 'bg-navy text-white' : ''}`}>
              {l}
            </button>
          ))}
        </span>
        <Link to={`/admin/events/${id}`} className="underline">
          Back to editing
        </Link>
      </div>
      <Header />
      <main>
        <EventDetailView event={event} />
      </main>
      <Footer />
    </DonateProvider>
  );
}
