export const NAV_ITEMS = [
  { to: '/about', key: 'nav.about' },
  { to: '/programs', key: 'nav.programs' },
  { to: '/events', key: 'nav.events' },
  { to: '/gallery', key: 'nav.gallery' },
  { to: '/get-involved', key: 'nav.getInvolved' },
  { to: '/shop', key: 'nav.shop' },
] as const;

export const FOOTER_EXPLORE = [...NAV_ITEMS, { to: '/contact', key: 'nav.contact' }, { to: '/donate', key: 'nav.donate' }] as const;
