'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminSidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/admin', label: 'Ringkasan Analitik', icon: 'dashboard' },
    { href: '/admin/laporan', label: 'Manajemen Laporan', icon: 'assignment' },
    { href: '/', label: 'Portal Warga (Peta)', icon: 'map' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-[260px] bg-surface-container-low z-50 flex flex-col border-r border-outline-variant/30 shadow-sm">
      {/* Brand Header */}
      <div className="p-5 flex items-center gap-3 border-b border-outline-variant/30">
        <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center font-bold text-xl shadow-sm">
          <span className="material-symbols-outlined text-[24px]">eco</span>
        </div>
        <div>
          <span className="font-bold text-lg text-primary tracking-tight block">
            DLH Admin
          </span>
          <span className="text-[11px] font-semibold text-on-surface-variant block -mt-1">
            EcoMap Samarinda
          </span>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-secondary-container text-on-secondary-container shadow-xs border-l-4 border-primary'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Admin Officer Profile Card */}
      <div className="p-4 border-t border-outline-variant/30 bg-surface-container-lowest/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs">
            AD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-on-surface truncate">
              Admin DLH Sektor Central
            </p>
            <p className="text-[11px] text-on-surface-variant truncate">
              DLH Samarinda
            </p>
          </div>
          <Link
            href="/admin/login"
            className="text-on-surface-variant hover:text-error transition-colors p-1"
            title="Keluar"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
