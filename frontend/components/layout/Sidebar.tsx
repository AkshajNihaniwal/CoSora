'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  Mail,
  Shield,
  Settings,
  ClipboardList,
  Eye,
  MessageSquarePlus,
} from 'lucide-react';
import { CoSoraLogo } from './CoSoraLogo';
import { useAuthStore } from '@/lib/store/authStore';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

type NavItem = { href: string; label: string; icon: LucideIcon; highlight?: boolean };

const adminNav: NavItem[] = [
  { href: '/new-task', label: 'New Task', icon: MessageSquarePlus, highlight: true },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/hitl', label: 'HITL Queue', icon: CheckSquare },
  { href: '/audit', label: 'Audit Log', icon: Shield },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/email', label: 'Email Monitor', icon: Mail },
  { href: '/override', label: 'Override', icon: Settings },
];

const editorNav: NavItem[] = [
  { href: '/new-task', label: 'New Task', icon: MessageSquarePlus, highlight: true },
  { href: '/tasks', label: 'My Tasks', icon: ClipboardList },
];

const reviewerNav: NavItem[] = [
  { href: '/review', label: 'Review Queue', icon: Eye },
];

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  const nav =
    user?.role === 'ADMIN' ? adminNav : user?.role === 'EDITOR' ? editorNav : reviewerNav;

  return (
    <aside className="hidden md:flex flex-col w-64 bg-cosora-charcoal border-r border-cosora-smoke min-h-screen">
      <div className="p-5 border-b border-cosora-smoke bg-cosora-charcoal">
        <CoSoraLogo variant="sidebar" />
        <p className="text-cosora-mid text-sm mt-3">Legal AI Platform</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {nav.map(({ href, label, icon: Icon, highlight }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors',
              pathname.startsWith(href)
                ? 'bg-cosora-smoke text-cosora-orange border-l-2 border-cosora-orange'
                : highlight
                  ? 'text-cosora-orange bg-cosora-orange/10 hover:bg-cosora-orange/20 font-medium'
                  : 'text-cosora-mid hover:text-cosora-light hover:bg-cosora-smoke/50'
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>
      {user && (
        <div className="p-4 border-t border-cosora-smoke">
          <p className="text-cosora-light text-sm font-medium truncate">{user.name}</p>
          <p className="text-cosora-mid text-xs tracking-wide">{user.userId}</p>
          <span
            className={`inline-block mt-2 px-2 py-0.5 text-xs rounded ${
              user.role === 'REVIEWER'
                ? 'bg-cosora-gold/20 text-cosora-gold'
                : 'bg-cosora-orange/20 text-cosora-orange'
            }`}
          >
            {user.role}
            {user.role === 'REVIEWER' ? ' · Read-only' : ''}
          </span>
        </div>
      )}
    </aside>
  );
}
