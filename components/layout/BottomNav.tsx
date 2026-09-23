'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();

  // Hide BottomNav on admin pages
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const navItems = [
    { href: '/', label: 'Beranda', icon: 'map' },
    { href: '/riwayat', label: 'Laporan', icon: 'analytics' },
    { href: '/lapor', label: 'Lapor', icon: 'add_a_photo', isFab: true },
    { href: '/kontak', label: 'Kontak', icon: 'phone_in_talk' },
    { href: '/profil', label: 'Profil', icon: 'account_circle' },
  ];

  return (
    <nav className="fixed bottom-0 w-full z-50 bg-surface/90 backdrop-blur-xl pb-safe border-t border-outline-variant/20 shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto relative px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          if (item.isFab) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-6"
              >
                <div className="w-14 h-14 rounded-full bg-primary text-on-primary shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center border-4 border-surface">
                  <span className="material-symbols-outlined text-[28px]">
                    {item.icon}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-primary mt-0.5">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center min-w-[56px] py-1 transition-colors ${
                isActive
                  ? 'text-primary font-bold'
                  : 'text-on-surface-variant hover:text-primary font-medium'
              }`}
            >
              <span
                className="material-symbols-outlined text-[22px]"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {item.icon}
              </span>
              <span className="text-[11px] mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
