'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, Scale, FileText, AlertCircle, Home } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Início', icon: Home },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/issues', label: 'Fórum', icon: AlertCircle },
  { href: '/reports', label: 'Relatos', icon: FileText },
  { href: '/legislacao', label: 'Leis', icon: Scale },
];

export default function MobileNav() {
  const pathname = usePathname();

  // Hide on chat page - it has its own full-screen layout with input at bottom
  if (pathname === '/chat') return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-neutral-950 border-t border-neutral-800/60 safe-area-bottom">
      <div className="flex items-center justify-around h-14 px-1">
        {NAV_ITEMS.map(item => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[48px] min-h-[44px] rounded-lg transition ${
                isActive
                  ? 'text-blue-400'
                  : 'text-neutral-500 active:text-neutral-300'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
