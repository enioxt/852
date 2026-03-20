'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, Scale, FileText, AlertCircle, Home, PenLine, Radio } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Início', icon: Home },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/sugestao', label: 'Sugestão', icon: PenLine },
  { href: '/papo-de-corredor', label: 'Corredor', icon: Radio },
];

export default function MobileNav() {
  const pathname = usePathname();

  // Hide on chat page - it has its own full-screen layout with input at bottom
  if (pathname === '/chat') return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-neutral-950 border-t border-neutral-800/60 safe-area-bottom">
      <div className="grid h-16 grid-cols-4 px-1">
        {NAV_ITEMS.map(item => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-lg transition ${
                isActive
                  ? 'text-blue-400'
                  : 'text-neutral-500 active:text-neutral-300'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[8px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
