/**
 * Sample content shown on first run. Images are Unsplash placeholders and the videos are
 * Cloudinary demo clips — replace them from the admin Media Library with real RISE footage.
 */
export const img = (id: string, w = 1400) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=70`;

export const PHOTOS = {
  meal: img('1488521787991-ed7bbaae773c'),
  volunteers: img('1593113598332-cd288d649433'),
  hands: img('1469571486292-0ba58a3f068b'),
  foodBox: img('1532629345422-7515f3d16bb6'),
  pantry: img('1584263347416-85a696b4eda7'),
  hygiene: img('1556228578-8c89e6adf883'),
  shoes: img('1460353581641-37baddab0fa2'),
  kids: img('1509099836639-18ba1795216d'),
  school: img('1497486751825-1233686d5d80'),
  group: img('1559027615-cd4628902d4a'),
  serving: img('1542810634-71277d95dcbb'),
  community: img('1529390079861-591de354faf5'),
  students: img('1523240795612-9a054b0db644'),
  clothing: img('1489987707025-afc232f7ea0f'),
};

export const VIDEOS = {
  hero: 'https://res.cloudinary.com/demo/video/upload/q_auto,f_auto/elephants.mp4',
  watch: 'https://res.cloudinary.com/demo/video/upload/q_auto,f_auto/elephants.mp4',
  summer: 'https://res.cloudinary.com/demo/video/upload/q_auto,f_auto/dog.mp4',
  testimonial: 'https://res.cloudinary.com/demo/video/upload/q_auto,f_auto/dog.mp4',
};

export const settings = {
  orgName: 'Resourceful Impact in Scholastic Education',
  phone: '(903) 555-0142',
  email: 'hello@riseorg.org',
  address: '210 N Jefferson Ave',
  city: 'Mount Pleasant',
  state: 'TX',
  zip: '75455',
  mapEmbedUrl:
    'https://www.google.com/maps?q=210+N+Jefferson+Ave,+Mount+Pleasant,+TX+75455&output=embed',
  social: {
    facebook: 'https://facebook.com/',
    instagram: 'https://instagram.com/',
    tiktok: '',
    youtube: '',
    linkedin: '',
  },
  zeffyFormUrl: '',
  givebutter: {
    accountId: '',
    shopWidgetId: '',
    storeUrl: 'https://givebutter.com/',
    featuredProducts: [
      { title: { en: 'RISE Together tee', es: 'Camiseta RISE Together' }, price: '$25', image: img('1521572163474-6864f9cf17ab', 800), url: '' },
      { title: { en: 'Volunteer hoodie', es: 'Sudadera de voluntario' }, price: '$45', image: img('1556821840-3a63f95609a7', 800), url: '' },
      { title: { en: 'Canvas tote', es: 'Bolsa de lona' }, price: '$18', image: img('1544816155-12df9643f363', 800), url: '' },
    ],
  },
  notificationEmail: '',
  footerText: {
    en: 'RISE uplifts individuals in need through empowerment, education, and community service for a brighter future. Let’s rise together.',
    es: 'RISE eleva a las personas necesitadas a través del empoderamiento, la educación y el servicio comunitario para un futuro mejor. Levantémonos juntos.',
  },
};

export const homepage = {
  sections: ['hero', 'summer', 'impact', 'testimonials', 'whatWeDo', 'community', 'cta'].map((key) => ({ key, visible: true })),
  hero: {
    headline: { en: 'Together, we rise.', es: 'Juntos, nos levantamos.' },
    text: {
      en: 'RISE serves free meals, keeps students in school and stocks the pantries our partner schools rely on, across North Texas.',
      es: 'RISE sirve comidas gratuitas, mantiene a los estudiantes en la escuela y abastece las despensas de las que dependen nuestras escuelas aliadas en el norte de Texas.',
    },
    backgroundVideo: { url: VIDEOS.hero, poster: PHOTOS.meal },
    watchVideo: {
      url: VIDEOS.watch,
      poster: PHOTOS.meal,
      duration: 97,
      label: { en: 'Watch: what RISE does', es: 'Mira: lo que hace RISE' },
    },
  },
  donation: { amounts: [25, 50, 100, 250], defaultAmount: 50 },
  summer: {
    chip: { en: 'This summer', es: 'Este verano' },
    heading: {
      en: 'Two events, two opportunities to make a real difference.',
      es: 'Dos eventos, dos oportunidades de marcar una verdadera diferencia.',
    },
    text: {
      en: 'This is not just a meal. This is about people coming together, sharing conversations and knowing they are not forgotten.',
      es: 'No es solo una comida. Se trata de personas que se reúnen, comparten conversaciones y saben que no están olvidadas.',
    },
    video: {
      url: VIDEOS.summer,
      poster: PHOTOS.serving,
      duration: 72,
      label: { en: 'Two events, one community', es: 'Dos eventos, una comunidad' },
    },
  },
  impact: {
    heading: { en: 'Where your donation goes', es: 'A dónde va tu donación' },
    linkLabel: { en: 'See the July 20 pantry fill', es: 'Ver el surtido de despensa del 20 de julio' },
    linkUrl: '/events/pantry-fill-cis-greater-tarrant-county',
  },
  whatWeDo: { heading: { en: 'What we do', es: 'Lo que hacemos' } },
  community: {
    heading: { en: 'Community in action', es: 'Comunidad en acción' },
    buttonLabel: { en: 'Open the gallery', es: 'Abrir la galería' },
  },
  cta: {
    heading: {
      en: 'Something small to us can mean everything to someone else.',
      es: 'Algo pequeño para nosotros puede significarlo todo para alguien más.',
    },
  },
};

const thisYear = new Date().getFullYear();
// Events in July of the current year, or next year once July has passed.
const summerYear = new Date() > new Date(thisYear, 6, 21) ? thisYear + 1 : thisYear;

export const events = [
  {
    title: { en: 'Community meal', es: 'Comida comunitaria' },
    slug: 'community-meal-catfish-king',
    date: new Date(summerYear, 6, 6, 12),
    startTime: '11:30',
    endTime: '14:00',
    locationName: 'Catfish King',
    address: '1401 S Jefferson Ave',
    city: 'Mount Pleasant TX',
    eventType: 'community-meal',
    summary: {
      en: 'A free hot meal where neighbors sit down together — everyone is welcome.',
      es: 'Una comida caliente gratuita donde los vecinos se sientan juntos — todos son bienvenidos.',
    },
    body: {
      en: '<p>Join us at Catfish King for a free sit-down meal. Volunteers serve plates, families share a table, and nobody leaves hungry.</p><p>Bring a friend, bring your family, or come help us serve.</p>',
      es: '<p>Acompáñanos en Catfish King para una comida gratuita. Los voluntarios sirven los platos, las familias comparten la mesa y nadie se va con hambre.</p><p>Trae a un amigo, a tu familia o ven a ayudarnos a servir.</p>',
    },
    coverImage: { url: PHOTOS.meal, alt: { en: 'Volunteers serving food at a community meal', es: 'Voluntarios sirviendo comida en una comida comunitaria' } },
    gallery: [PHOTOS.meal, PHOTOS.serving, PHOTOS.community, PHOTOS.group].map((url, i) => ({
      url,
      caption: { en: `Community meal moment ${i + 1}`, es: `Momento de la comida comunitaria ${i + 1}` },
      alt: { en: 'Neighbors sharing a meal', es: 'Vecinos compartiendo una comida' },
    })),
    videos: [
      { kind: 'file', url: VIDEOS.summer, poster: PHOTOS.serving, duration: 72, orientation: 'vertical', isMain: true, caption: { en: 'Highlights from the meal', es: 'Lo mejor de la comida' } },
    ],
    featured: true,
    featuredAt: new Date(),
    status: 'published',
    volunteerSignup: { enabled: true, capacity: 40 },
  },
  {
    title: { en: 'Pantry fill', es: 'Surtido de despensa' },
    slug: 'pantry-fill-cis-greater-tarrant-county',
    date: new Date(summerYear, 6, 20, 12),
    startTime: '09:00',
    endTime: '12:00',
    locationName: 'CIS Greater Tarrant County',
    address: '1600 Circle Dr',
    city: 'Fort Worth TX',
    eventType: 'pantry-fill',
    summary: {
      en: 'Stocking CIS pantries with food, hygiene kits, shoes and clothing for the school year.',
      es: 'Abastecemos las despensas de CIS con comida, kits de higiene, zapatos y ropa para el año escolar.',
    },
    body: {
      en: '<p>We are filling the shelves at Communities In Schools of Greater Tarrant County so students across about 70 schools start the year ready.</p><ul><li>Canned goods and weekend food bags</li><li>Hygiene kits</li><li>New shoes and clothing</li></ul>',
      es: '<p>Estamos llenando los estantes de Communities In Schools of Greater Tarrant County para que los estudiantes de unas 70 escuelas empiecen el año preparados.</p><ul><li>Enlatados y bolsas de comida para el fin de semana</li><li>Kits de higiene</li><li>Zapatos y ropa nueva</li></ul>',
    },
    coverImage: { url: PHOTOS.pantry, alt: { en: 'Pantry shelves stocked with food', es: 'Estantes de despensa llenos de comida' } },
    gallery: [PHOTOS.pantry, PHOTOS.foodBox, PHOTOS.hygiene, PHOTOS.shoes, PHOTOS.volunteers].map((url, i) => ({
      url,
      caption: { en: `Pantry fill photo ${i + 1}`, es: `Foto del surtido de despensa ${i + 1}` },
      alt: { en: 'Volunteers stocking the CIS pantry', es: 'Voluntarios abasteciendo la despensa de CIS' },
    })),
    videos: [],
    featured: true,
    featuredAt: new Date(Date.now() + 1000),
    status: 'published',
    volunteerSignup: { enabled: true, capacity: 25 },
  },
  {
    title: { en: 'Back-to-school clothing drive', es: 'Colecta de ropa para el regreso a clases' },
    slug: 'back-to-school-clothing-drive',
    date: new Date(thisYear - 1, 7, 10, 12),
    startTime: '10:00',
    endTime: '13:00',
    locationName: 'Mount Pleasant ISD',
    address: '2230 N Edwards Ave',
    city: 'Mount Pleasant TX',
    eventType: 'clothing-drive',
    summary: {
      en: 'Families picked out new clothes and shoes before the first day of school.',
      es: 'Las familias eligieron ropa y zapatos nuevos antes del primer día de clases.',
    },
    body: {
      en: '<p>Thanks to our donors, more than 300 students walked into the new school year with new shoes and clothes.</p>',
      es: '<p>Gracias a nuestros donantes, más de 300 estudiantes comenzaron el año escolar con zapatos y ropa nuevos.</p>',
    },
    coverImage: { url: PHOTOS.clothing, alt: { en: 'Racks of donated clothing', es: 'Percheros con ropa donada' } },
    gallery: [PHOTOS.clothing, PHOTOS.kids, PHOTOS.students].map((url, i) => ({
      url,
      caption: { en: `Clothing drive photo ${i + 1}`, es: `Foto de la colecta de ropa ${i + 1}` },
      alt: { en: 'Students at the clothing drive', es: 'Estudiantes en la colecta de ropa' },
    })),
    videos: [],
    featured: false,
    status: 'published',
    volunteerSignup: { enabled: false, capacity: 0 },
  },
];

export const impactCards = [
  {
    title: { en: 'Food on pantry shelves', es: 'Comida en los estantes' },
    description: {
      en: 'Canned goods, peanut butter and weekend food bags for CIS families.',
      es: 'Enlatados, crema de cacahuate y bolsas de comida de fin de semana para las familias de CIS.',
    },
    image: PHOTOS.pantry,
    imageAlt: { en: 'Pantry shelves stocked with canned goods', es: 'Estantes con productos enlatados' },
    dateLabel: { en: 'July 20', es: '20 de julio' },
  },
  {
    title: { en: 'Hygiene kits', es: 'Kits de higiene' },
    description: {
      en: 'Soap, shampoo, toothpaste and personal care items, sorted for students.',
      es: 'Jabón, champú, pasta de dientes y artículos de cuidado personal, organizados para los estudiantes.',
    },
    image: PHOTOS.hygiene,
    imageAlt: { en: 'Hygiene supplies sorted into kits', es: 'Artículos de higiene organizados en kits' },
    dateLabel: { en: 'July 20', es: '20 de julio' },
  },
  {
    title: { en: 'New shoes & clothing', es: 'Zapatos y ropa nueva' },
    description: {
      en: 'A stocked clothing closet for students across about 70 CIS schools.',
      es: 'Un ropero bien surtido para estudiantes de unas 70 escuelas de CIS.',
    },
    image: PHOTOS.shoes,
    imageAlt: { en: 'New shoes lined up for students', es: 'Zapatos nuevos alineados para los estudiantes' },
    dateLabel: { en: 'July 20', es: '20 de julio' },
  },
];

export const testimonials = [
  {
    quote: {
      en: 'We’re going to be able to serve more families and more kids in our schools this school year than we ever have before.',
      es: 'Este año escolar vamos a poder atender a más familias y más niños en nuestras escuelas que nunca antes.',
    },
    name: 'Jennifer Murphy',
    organization: {
      en: 'Communities In Schools of Greater Tarrant County',
      es: 'Communities In Schools of Greater Tarrant County',
    },
    videoUrl: VIDEOS.testimonial,
    poster: PHOTOS.volunteers,
    duration: 37,
    videoCaption: {
      en: 'A thank-you from CIS Greater Tarrant County',
      es: 'Un agradecimiento de CIS Greater Tarrant County',
    },
  },
  {
    quote: {
      en: 'Our students noticed. New shoes on the first day of school changes how a kid walks into the building.',
      es: 'Nuestros estudiantes lo notaron. Unos zapatos nuevos el primer día de clases cambian la forma en que un niño entra a la escuela.',
    },
    name: 'Marcus Reed',
    organization: { en: 'Partner school counselor', es: 'Consejero de escuela aliada' },
    videoUrl: '',
    poster: PHOTOS.students,
    duration: 0,
    videoCaption: { en: '', es: '' },
  },
];

export const programs = [
  {
    number: 1,
    slug: 'community-feeding',
    title: { en: 'Community feeding', es: 'Alimentación comunitaria' },
    shortText: {
      en: 'Free hot meals where neighbors sit down together.',
      es: 'Comidas calientes gratuitas donde los vecinos se sientan juntos.',
    },
    body: {
      en: '<p>Our community meals are free, sit-down and open to everyone. Volunteers cook, serve and share the table — because a meal is also a conversation.</p>',
      es: '<p>Nuestras comidas comunitarias son gratuitas, en mesa y abiertas a todos. Los voluntarios cocinan, sirven y comparten la mesa, porque una comida también es una conversación.</p>',
    },
    image: PHOTOS.meal,
  },
  {
    number: 2,
    slug: 'talent-pipeline',
    title: { en: 'Talent pipeline', es: 'Cantera de talento' },
    shortText: {
      en: 'Middle school to high school, high school to college, college to careers.',
      es: 'De la secundaria a la preparatoria, de la preparatoria a la universidad, de la universidad a la carrera.',
    },
    body: {
      en: '<p>Mentoring, tutoring and college-readiness support that keeps students in school and moving forward at every transition.</p>',
      es: '<p>Mentoría, tutoría y apoyo para la universidad que mantienen a los estudiantes en la escuela y avanzando en cada transición.</p>',
    },
    image: PHOTOS.students,
  },
  {
    number: 3,
    slug: 'food-pantry',
    title: { en: 'Food pantry', es: 'Despensa de alimentos' },
    shortText: {
      en: 'Keeping partner pantries like CIS stocked through the school year.',
      es: 'Mantenemos abastecidas las despensas aliadas como CIS durante todo el año escolar.',
    },
    body: {
      en: '<p>We stock school-based pantries with shelf-stable food and weekend bags so kids don’t go hungry when school is out.</p>',
      es: '<p>Abastecemos las despensas escolares con alimentos no perecederos y bolsas de fin de semana para que los niños no pasen hambre fuera de la escuela.</p>',
    },
    image: PHOTOS.foodBox,
  },
  {
    number: 4,
    slug: 'clothing-drives',
    title: { en: 'Clothing drives', es: 'Colectas de ropa' },
    shortText: {
      en: 'Clothing and shoes for students and their families.',
      es: 'Ropa y zapatos para los estudiantes y sus familias.',
    },
    body: {
      en: '<p>New shoes, uniforms and seasonal clothing so every student can walk into class with confidence.</p>',
      es: '<p>Zapatos nuevos, uniformes y ropa de temporada para que cada estudiante entre a clase con confianza.</p>',
    },
    image: PHOTOS.clothing,
  },
];

export const galleryPhotos = [
  { url: PHOTOS.community, en: 'Neighbors sharing a table', es: 'Vecinos compartiendo la mesa', event: 0 },
  { url: PHOTOS.serving, en: 'Volunteers serving plates', es: 'Voluntarios sirviendo platos', event: 0 },
  { url: PHOTOS.volunteers, en: 'Packing pantry boxes', es: 'Empacando cajas para la despensa', event: 1 },
  { url: PHOTOS.kids, en: 'Students at the clothing drive', es: 'Estudiantes en la colecta de ropa', event: 2 },
  { url: PHOTOS.group, en: 'Our volunteer team', es: 'Nuestro equipo de voluntarios', event: 0 },
  { url: PHOTOS.foodBox, en: 'Weekend food bags', es: 'Bolsas de comida de fin de semana', event: 1 },
  { url: PHOTOS.hands, en: 'Hands together', es: 'Manos juntas', event: null },
  { url: PHOTOS.school, en: 'Back to school', es: 'Regreso a clases', event: 2 },
];
