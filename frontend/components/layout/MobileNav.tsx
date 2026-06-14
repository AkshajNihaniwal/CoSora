'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CheckSquare, Bell, MessageSquarePlus, ClipboardList } from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';
import { cn } from '@/lib/utils';

const adminItems = [
  { href: '/new-task', label: 'New Task', icon: MessageSquarePlus },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/hitl', label: 'HITL', icon: CheckSquare },
  { href: '/notifications', label: 'Alerts', icon: Bell },
];

const editorItems = [
  { href: '/new-task', label: 'New Task', icon: MessageSquarePlus },
  { href: '/tasks', label: 'Tasks', icon: ClipboardList },
];

export function MobileNav() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  if (user?.role === 'REVIEWER') return null;

  const items = user?.role === 'EDITOR' ? editorItems : adminItems;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-cosora-charcoal border-t border-cosora-smoke flex justify-around py-2 z-50">
      {items.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'flex flex-col items-center gap-0.5 text-xs px-3 py-1',
            pathname.startsWith(href) ? 'text-cosora-orange' : 'text-cosora-mid'
          )}
        >
          <Icon size={20} />
          {label}
        </Link>
      ))}
    </nav>
  );
}
