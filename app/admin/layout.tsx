'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { useAuth } from '@/context/AuthContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (loading) return;
    if (isLoginPage) return;
    if (!user || user.role !== 'admin') {
      router.replace('/admin/login');
    }
  }, [loading, user, isLoginPage, router]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="material-symbols-outlined text-primary text-4xl animate-spin">
          progress_activity
        </span>
      </div>
    );
  }

  const getPageTitle = () => {
    if (pathname === '/admin') return 'Dashboard Analitik DLH Kota Samarinda';
    if (pathname === '/admin/laporan') return 'Manajemen Laporan & Disposisi Pengaduan';
    if (pathname === '/admin/tps') return 'Kelola Data & Titik Lokasi TPS';
    if (pathname === '/admin/armada') return 'Monitoring Armada Sampah (Cartrack IoT)';
    return 'Panel Staf Admin DLH Samarinda';
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar (Desktop Persistent & Mobile Drawer) */}
      <AdminSidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Responsive Header */}
        <header className="h-16 bg-surface-container-lowest border-b border-outline-variant/30 px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-2xs sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger Button for Mobile */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors shrink-0"
              aria-label="Buka Menu Navigasi"
            >
              <span className="material-symbols-outlined text-[20px]">menu</span>
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <span className="material-symbols-outlined text-primary text-xl hidden sm:inline-block">
                shield_person
              </span>
              <span className="font-bold text-xs sm:text-sm text-on-surface truncate">
                {getPageTitle()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-container text-on-primary-container text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
              Sistem Aktif Realtime
            </span>
            <span className="sm:hidden inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-container text-on-primary-container text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              Aktif
            </span>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1">{children}</main>
      </div>
    </div>
  );
}
