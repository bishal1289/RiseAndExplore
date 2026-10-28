import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  Images,
  GalleryHorizontalEnd,
  Home,
  Layers,
  Quote,
  HandHeart,
  Mail,
  Settings,
  Users,
  Trash2,
  BookOpen,
  ExternalLink,
  LogOut,
  MoreHorizontal,
  ChevronDown,
  X,
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useAdminQuery } from '../lib/hooks';
import { cn } from '../../lib/utils';

interface NavItem {
  to: string;
  label: string;
  icon: typeof Home;
  badge?: 'volunteers' | 'messages';
  owner?: boolean;
  end?: boolean;
}

const NAV: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/events', label: 'Events', icon: CalendarDays },
  { to: '/admin/media', label: 'Media Library', icon: Images },
  { to: '/admin/gallery', label: 'Gallery', icon: GalleryHorizontalEnd },
  { to: '/admin/homepage', label: 'Homepage', icon: Home },
  { to: '/admin/programs', label: 'Programs', icon: Layers },
  { to: '/admin/testimonials', label: 'Testimonials', icon: Quote },
  { to: '/admin/volunteers', label: 'Volunteers', icon: HandHeart, badge: 'volunteers' },
  { to: '/admin/messages', label: 'Messages', icon: Mail, badge: 'messages' },
  { to: '/admin/settings', label: 'Settings', icon: Settings, owner: true },
  { to: '/admin/users', label: 'Users', icon: Users, owner: true },
];

const SECONDARY: NavItem[] = [
  { to: '/admin/trash', label: 'Trash', icon: Trash2 },
  { to: '/admin/guide', label: 'Admin guide', icon: BookOpen },
];

const MOBILE_TABS = ['/admin', '/admin/events', '/admin/media', '/admin/messages'];

function Badge({ n }: { n?: number }) {
  if (!n) return null;
  return (
    <span className="ml-auto min-w-[22px] rounded-full bg-primary px-1.5 text-center text-xs font-bold leading-[22px] text-white" aria-label={`${n} new`}>
      {n > 99 ? '99+' : n}
    </span>
  );
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isOwner, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { data: badges } = useAdminQuery<{ volunteers: number; messages: number }>('/dashboard/badges', { refetchInterval: 60_000 });

  const items = NAV.filter((n) => !n.owner || isOwner);
  const all = [...items, ...SECONDARY];

  useEffect(() => {
    setMoreOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => !menuRef.current?.contains(e.target as Node) && setMenuOpen(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [menuOpen]);

  const doLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const link = (n: NavItem) => (
    <NavLink
      key={n.to}
      to={n.to}
      end={n.end}
      className={({ isActive }) =>
        cn(
          'flex h-11 items-center gap-3 rounded-2xl px-3 text-[15px] font-semibold transition-colors',
          isActive ? 'bg-navy text-white' : 'text-navy hover:bg-card',
        )
      }
    >
      <n.icon className="h-5 w-5 shrink-0" aria-hidden />
      {n.label}
      {n.badge && <Badge n={badges?.[n.badge]} />}
    </NavLink>
  );

  return (
    <div className="min-h-screen bg-bg">
      <a href="#admin-main" className="sr-only z-50 rounded-full bg-navy px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-3">
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-navy/5 bg-white px-4 py-5 lg:flex">
        <Link to="/admin" className="mb-6 flex items-center gap-2 px-2">
          <img src="/logo.svg" alt="RISE" className="h-8 w-auto" />
          <span className="rounded-full bg-card px-2 py-0.5 text-xs font-bold text-primary">Admin</span>
        </Link>
        <nav aria-label="Admin" className="flex-1 space-y-1 overflow-y-auto">
          {items.map(link)}
          <div className="my-3 border-t border-navy/10" />
          {SECONDARY.map(link)}
        </nav>
      </aside>

      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-navy/5 bg-white/90 px-4 backdrop-blur sm:px-6">
          <Link to="/admin" className="lg:hidden">
            <img src="/logo.svg" alt="RISE admin" className="h-7 w-auto" />
          </Link>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold text-primary ring-1 ring-primary/30 hover:bg-card"
          >
            View site <ExternalLink className="h-4 w-4" aria-hidden />
          </a>
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              className="flex h-10 items-center gap-2 rounded-full bg-card pl-1 pr-3 text-sm font-semibold text-navy"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-navy text-white" aria-hidden>
                {(user?.name || user?.email || '?')[0].toUpperCase()}
              </span>
              <span className="hidden max-w-[140px] truncate sm:inline">{user?.name || user?.email}</span>
              <ChevronDown className="h-4 w-4" aria-hidden />
            </button>
            {menuOpen && (
              <div role="menu" className="absolute right-0 mt-2 w-64 rounded-card bg-white p-2 shadow-float ring-1 ring-navy/10">
                <div className="px-3 py-2">
                  <div className="truncate font-semibold text-navy">{user?.name || 'Signed in'}</div>
                  <div className="truncate text-sm text-muted">{user?.email}</div>
                  <div className="mt-1 text-xs font-bold uppercase tracking-wider text-primary">{user?.role}</div>
                </div>
                <Link role="menuitem" to="/admin/guide" className="flex h-11 items-center gap-3 rounded-2xl px-3 font-semibold text-navy hover:bg-card">
                  <BookOpen className="h-5 w-5" aria-hidden /> Admin guide
                </Link>
                <button role="menuitem" type="button" onClick={doLogout} className="flex h-11 w-full items-center gap-3 rounded-2xl px-3 font-semibold text-navy hover:bg-card">
                  <LogOut className="h-5 w-5" aria-hidden /> Log out
                </button>
              </div>
            )}
          </div>
        </header>

        <main id="admin-main" className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:pb-12">
          {children}
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav aria-label="Admin" className="fixed inset-x-0 bottom-0 z-30 border-t border-navy/10 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
        <ul className="grid grid-cols-5">
          {MOBILE_TABS.map((to) => {
            const n = NAV.find((x) => x.to === to)!;
            return (
              <li key={to}>
                <NavLink
                  to={to}
                  end={n.end}
                  className={({ isActive }) =>
                    cn('relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold', isActive ? 'text-primary' : 'text-navy/70')
                  }
                >
                  <n.icon className="h-6 w-6" aria-hidden />
                  {n.label === 'Media Library' ? 'Media' : n.label}
                  {n.badge && !!badges?.[n.badge] && <span className="absolute right-[28%] top-2 h-2.5 w-2.5 rounded-full bg-primary" aria-label="New" />}
                </NavLink>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-expanded={moreOpen}
              className="flex h-16 w-full flex-col items-center justify-center gap-1 text-[11px] font-semibold text-navy/70"
            >
              <MoreHorizontal className="h-6 w-6" aria-hidden />
              More
            </button>
          </li>
        </ul>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="More admin pages">
          <div className="absolute inset-0 bg-navy/50" onClick={() => setMoreOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-section bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <div className="mb-2 flex items-center justify-between px-2">
              <span className="font-serif text-xl font-bold text-navy">All pages</span>
              <button type="button" onClick={() => setMoreOpen(false)} aria-label="Close" className="grid h-10 w-10 place-items-center rounded-full bg-card">
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <div className="space-y-1">{all.map(link)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
