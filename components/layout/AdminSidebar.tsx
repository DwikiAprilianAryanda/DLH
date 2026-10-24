'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function AdminSidebar({ isOpen = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: 'dashboard' },
    { href: '/admin/laporan', label: 'Laporan Pengaduan', icon: 'assignment' },
    { href: '/admin/tps', label: 'Kelola TPS', icon: 'schedule' },
    { href: '/admin/armada', label: 'Armada Sampah', icon: 'local_shipping' },
    { href: '/', label: 'Portal Warga', icon: 'map' },
  ];

  const handleLogout = async () => {
    await logout();
    window.location.href = '/admin/login';
  };

  const getInitials = (name?: string) => {
    if (!name) return 'AD';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const sidebarContent = (
    <>
      {/* Brand Header */}
      <div className="p-5 flex items-center justify-between border-b border-outline-variant/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center font-bold text-xl shadow-sm">
            <span className="material-symbols-outlined text-[24px]">eco</span>
          </div>
          <div>
            <span className="font-bold text-lg text-primary tracking-tight block">
              DLH Admin
            </span>
            <span className="text-[11px] font-semibold text-on-surface-variant block -mt-1">
              TROPIS Kota Samarinda
            </span>
          </div>
        </div>

        {/* Mobile close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
            aria-label="Tutup Menu"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onClose?.()}
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
          <div className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs shrink-0">
            {getInitials(user?.full_name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-on-surface truncate">
              {user?.full_name || 'Admin DLH'}
            </p>
            <p className="text-[10px] text-on-surface-variant truncate font-medium">
              {user?.email || 'admin@dlh.samarindakota.go.id'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-on-surface-variant hover:text-error transition-colors p-1.5 rounded-lg hover:bg-surface-container-high shrink-0"
            title="Keluar"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex sticky top-0 h-screen w-[260px] shrink-0 bg-surface-container-low z-40 flex-col border-r border-outline-variant/30 shadow-sm">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          {/* Off-canvas panel */}
          <aside className="fixed top-0 bottom-0 left-0 w-[275px] max-w-[85vw] bg-surface-container-low z-50 flex flex-col border-r border-outline-variant/30 shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
