'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LogOut, Menu, Settings, Shield, User, X } from 'lucide-react';

type CurrentUser = {
  id: string;
  display_name?: string;
  displayName?: string;
  reputation_points?: number;
} | null;

const navItems = [
  { href: '/', label: 'Início' },
  { href: '/chat', label: 'Chat' },
  { href: '/sugestao', label: 'Sugestão' },
  { href: '/papo-de-corredor', label: 'Corredor' },
  { href: '/issues', label: 'Tópicos' },
  { href: '/legislacao', label: 'Legislação' },
  { href: '/reports', label: 'Relatórios' },
  { href: '/dashboard', label: 'Painel' },
] as const;

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser>(null);

  const shouldHide = pathname.startsWith('/admin');

  useEffect(() => {
    if (shouldHide) return;

    const syncAuth = () => {
      fetch('/api/auth/me')
        .then((response) => response.json())
        .then((data) => setCurrentUser(data.user || null))
        .catch(() => setCurrentUser(null));
    };

    syncAuth();
    window.addEventListener('852-auth-changed', syncAuth);
    return () => window.removeEventListener('852-auth-changed', syncAuth);
  }, [shouldHide]);

  if (shouldHide) return null;

  const displayName = currentUser?.display_name || currentUser?.displayName || 'Conta protegida';

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setCurrentUser(null);
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('852-auth-changed'));
    router.refresh();
    if (pathname === '/conta') router.push('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.05] bg-neutral-950/70 backdrop-blur-md transition-all duration-300">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <Image
            src="/brand/logo-852.png"
            alt="Tira-Voz"
            width={40}
            height={40}
            className="h-10 w-10 rounded-xl border border-white/[0.08] object-contain bg-neutral-900/50 p-1 shadow-sm transition-transform duration-300 group-hover:scale-105"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">Tira-Voz</p>
            <p className="hidden truncate text-[11px] text-neutral-500 sm:block">Escuta protegida da base policial</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-white/[0.08] bg-neutral-900/40 p-1 shadow-inner md:flex backdrop-blur-sm">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2 text-sm transition ${active ? 'bg-neutral-100 text-neutral-950' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          {currentUser ? (
            <>
              <div className="flex items-center gap-2 rounded-full border border-emerald-900/40 bg-emerald-950/30 px-3 py-2 text-xs text-emerald-300">
                <Shield className="h-3.5 w-3.5" />
                <span className="max-w-[180px] truncate">{displayName}</span>
                {typeof currentUser.reputation_points === 'number' && currentUser.reputation_points > 0 ? (
                  <span className="rounded-full bg-neutral-950 px-2 py-0.5 text-[10px] text-neutral-300">{currentUser.reputation_points} pts</span>
                ) : null}
              </div>
              <Link
                href="/conta"
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${isActive(pathname, '/conta') ? 'bg-neutral-100 text-neutral-950' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'}`}
              >
                <Settings className="h-4 w-4" />
                Minha Conta
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-full border border-white/[0.08] px-4 py-2 text-sm text-neutral-400 transition-all hover:border-neutral-700 hover:bg-white/[0.02] hover:text-white active:scale-95"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </>
          ) : (
            <>
              <Link
                href="/conta?auth=login"
                className="rounded-full px-4 py-2 text-sm text-neutral-400 transition-all hover:bg-white/[0.05] hover:text-white active:scale-95"
              >
                Entrar
              </Link>
              <Link
                href="/conta?auth=register"
                className="rounded-full bg-amber-500/90 px-4 py-2 text-sm font-medium text-black shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all hover:bg-amber-400 hover:shadow-[0_0_25px_rgba(245,158,11,0.5)] active:scale-95"
              >
                Criar conta
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setMobileOpen((current) => !current)}
          className="ml-auto rounded-xl border border-neutral-800 p-2 text-neutral-300 transition hover:bg-neutral-900 md:hidden"
          aria-label={mobileOpen ? 'Fechar navegação' : 'Abrir navegação'}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-neutral-800 bg-neutral-950/95 px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-xl px-4 py-3 text-sm transition ${active ? 'bg-neutral-100 text-neutral-950' : 'bg-neutral-900 text-neutral-300'}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 flex flex-col gap-2 border-t border-neutral-800 pt-4">
            {currentUser ? (
              <>
                <div className="flex items-center gap-2 rounded-xl border border-emerald-900/40 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-300">
                  <User className="h-4 w-4" />
                  <span className="truncate">{displayName}</span>
                </div>
                <Link href="/conta" onClick={() => setMobileOpen(false)} className="rounded-xl bg-neutral-900 px-4 py-3 text-sm text-neutral-300">
                  Minha Conta
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 rounded-xl border border-neutral-800 px-4 py-3 text-sm text-neutral-300"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </button>
              </>
            ) : (
              <>
                <Link href="/conta?auth=login" onClick={() => setMobileOpen(false)} className="rounded-xl bg-neutral-900 px-4 py-3 text-sm text-neutral-300">
                  Entrar
                </Link>
                <Link href="/conta?auth=register" onClick={() => setMobileOpen(false)} className="rounded-xl bg-amber-500 px-4 py-3 text-sm font-medium text-black">
                  Criar conta
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
