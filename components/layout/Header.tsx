'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-xl pt-safe shadow-xs border-b border-outline-variant/20">
      <div className="h-16 px-4 max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo & Title */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-on-primary font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[22px]">eco</span>
          </div>
          <div>
            <span className="font-bold text-xl tracking-tight text-on-surface">
              EcoMap
            </span>
            <span className="text-xs text-primary font-semibold block -mt-1">
              Samarinda
            </span>
          </div>
        </Link>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Notifications Link */}
          <Link
            href="/notifikasi"
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors relative"
            aria-label="Notifikasi"
          >
            <span className="material-symbols-outlined text-on-surface-variant">
              notifications
            </span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full animate-ping"></span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full"></span>
          </Link>

          {/* Citizen Profile Link */}
          <Link
            href="/profil"
            className="w-9 h-9 rounded-full bg-primary flex items-center justify-center hover:opacity-85 transition-opacity text-on-primary shadow-xs"
            aria-label="Profil Saya"
          >
            <span className="material-symbols-outlined text-[20px]">person</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
