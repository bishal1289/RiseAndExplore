import { useTranslation } from 'react-i18next';
import { HeartHandshake, GraduationCap, Users } from 'lucide-react';
import { Seo } from '../components/Seo';
import { PageHeader } from '../components/PageHeader';
import { Img } from '../components/ui/Img';
import { Reveal } from '../components/ui/Reveal';
import { CtaBanner } from '../components/home/CtaBanner';
import { useHome } from '../hooks/usePublic';

const TEAM = [
  { name: 'Danielle Brooks', role: { en: 'Founder & Executive Director', es: 'Fundadora y directora ejecutiva' }, photo: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=600&q=70' },
  { name: 'Luis Hernández', role: { en: 'Programs Director', es: 'Director de programas' }, photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=70' },
  { name: 'Aisha Carter', role: { en: 'Volunteer Coordinator', es: 'Coordinadora de voluntarios' }, photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=70' },
  { name: 'Tom Nguyen', role: { en: 'School Partnerships', es: 'Alianzas escolares' }, photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=70' },
];

const PARTNERS = [
  'Communities In Schools',
  'Catfish King',
  'Mount Pleasant ISD',
  'North Texas Food Bank',
  'Fort Worth ISD',
  'Titus County',
];

export default function About() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage ?? 'en').startsWith('es') ? 'es' : 'en';
  const { data } = useHome();
  const values = [
    { icon: HeartHandshake, title: t('about.values.dignity'), text: t('about.values.dignityText') },
    { icon: GraduationCap, title: t('about.values.education'), text: t('about.values.educationText') },
    { icon: Users, title: t('about.values.community'), text: t('about.values.communityText') },
  ];
  const stats = [
    { n: '70+', label: t('about.stats.schools') },
    { n: '12,000+', label: t('about.stats.meals') },
    { n: '450+', label: t('about.stats.volunteers') },
  ];

  return (
    <>
      <Seo title={t('meta.about')} description={t('about.intro')} />
      <PageHeader eyebrow={t('nav.about')} title={t('about.title')} intro={t('about.intro')} />

      <section className="container-rise grid gap-10 pb-section-sm md:grid-cols-2 md:items-center md:pb-section" aria-labelledby="story">
        <Reveal>
          <Img
            src="https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1200&q=70"
            alt=""
            width={800}
            ratio={1}
            className="aspect-square w-full rounded-[999px_999px_24px_24px]"
          />
        </Reveal>
        <Reveal delay={0.08}>
          <h2 id="story" className="h2">
            {t('about.storyTitle')}
          </h2>
          <p className="mt-5 text-lg text-muted">{t('about.story1')}</p>
          <p className="mt-4 text-lg text-muted">{t('about.story2')}</p>
          <dl className="mt-8 grid grid-cols-3 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-card bg-card p-4">
                <dt className="sr-only">{s.label}</dt>
                <dd>
                  <span className="block font-serif text-2xl font-black text-navy md:text-3xl">{s.n}</span>
                  <span className="text-sm text-muted">{s.label}</span>
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </section>

      <section className="mx-auto max-w-[1180px] px-4 sm:px-6" aria-labelledby="mission">
        <div className="rounded-section bg-navy px-6 py-12 text-center sm:px-10 md:py-16">
          <div className="label text-white/60">{t('about.missionTitle')}</div>
          <p id="mission" className="mx-auto mt-5 max-w-3xl font-serif text-3xl font-black leading-tight text-white md:text-[42px]">
            {t('about.mission')}
          </p>
        </div>
      </section>

      <section className="container-rise section" aria-labelledby="values">
        <h2 id="values" className="h2 mb-10">
          {t('about.valuesTitle')}
        </h2>
        <ul className="grid gap-4 md:grid-cols-3">
          {values.map((v, i) => (
            <Reveal as="li" key={v.title} delay={i * 0.06} className="rounded-card bg-card p-6">
              <v.icon className="h-8 w-8 text-primary" aria-hidden />
              <h3 className="mt-5 font-serif text-2xl">{v.title}</h3>
              <p className="mt-2 text-muted">{v.text}</p>
            </Reveal>
          ))}
        </ul>
      </section>

      <section className="container-rise pb-section-sm md:pb-section" aria-labelledby="team">
        <h2 id="team" className="h2 mb-10">
          {t('about.teamTitle')}
        </h2>
        <ul className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {TEAM.map((m, i) => (
            <Reveal as="li" key={m.name} delay={i * 0.05}>
              <Img src={m.photo} alt={m.name} width={400} ratio={1.2} className="aspect-[5/6] w-full rounded-card" />
              <h3 className="mt-4 font-serif text-xl">{m.name}</h3>
              <p className="text-sm text-muted">{m.role[lang]}</p>
            </Reveal>
          ))}
        </ul>
      </section>

      <section className="container-rise pb-section-sm md:pb-section" aria-labelledby="partners">
        <h2 id="partners" className="label mb-6 text-center text-muted">
          {t('about.partnersTitle')}
        </h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {PARTNERS.map((p) => (
            <li key={p} className="grid h-20 place-items-center rounded-card bg-white px-3 text-center font-serif text-sm font-bold text-navy/70 ring-1 ring-navy/10">
              {p}
            </li>
          ))}
        </ul>
      </section>

      <CtaBanner heading={data?.homepage.cta.heading ?? t('about.mission')} />
    </>
  );
}
