'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const MENU = [
  { href: '/pengawas', label: 'Dashboard', icon: 'dashboard' },
  { href: '/pengawas/lapor', label: 'Lapor TPS', icon: 'photo_camera' },
];

export default function PengawasLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== 'pengawas') {
      router.replace('/login');
    }
  }, [loading, user, router]);

  if (loading || !user || user.role !== 'pengawas') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="material-symbols-outlined text-primary text-4xl animate-spin">
          progress_activity
        </span>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 inset-x-0 z-40 bg-surface-container-lowest/95 backdrop-blur border-b border-outline-variant/30 shadow-2xs">
        <div className="max-w-5xl mx-auto h-14 px-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">fact_check</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-on-surface leading-tight truncate">Panel Pengawas</p>
              <p className="text-[11px] text-on-surface-variant leading-tight truncate">
                {user.kecamatan ? `Kecamatan ${user.kecamatan}` : 'Kecamatan belum diatur'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors"
              title="Buka Portal Warga"
            >
              <span className="material-symbols-outlined text-[17px]">home</span>
              <span className="hidden sm:inline">Portal Warga</span>
            </Link>
            <button
              onClick={handleLogout}
              className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
              aria-label="Keluar"
              title="Keluar"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </div>

        <nav className="max-w-5xl mx-auto px-4 flex items-center gap-1" aria-label="Menu pengawas">
          {MENU.map((m) => {
            const aktif = m.href === '/pengawas' ? pathname === '/pengawas' : pathname.startsWith(m.href);
            return (
              <Link
                key={m.href}
                href={m.href}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-colors ${
                  aktif
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{m.icon}</span>
                {m.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="pt-28 pb-10 px-4 max-w-5xl mx-auto">{children}</main>
    </div>
  );
}
