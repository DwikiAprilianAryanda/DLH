'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Header() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleConfirmLogout = async () => {
    await logout();
    setShowLogoutConfirm(false);
    router.push('/');
  };

  return (
    <>
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

            {!loading && !user && (
              <Link
                href="/login"
                className="px-3.5 py-2 rounded-full bg-primary text-on-primary text-xs font-bold shadow-xs hover:bg-primary/90 transition-colors"
              >
                Login
              </Link>
            )}

            {!loading && user && (
              <>
                <Link
                  href="/profil"
                  className="w-9 h-9 rounded-full bg-primary flex items-center justify-center hover:opacity-85 transition-opacity text-on-primary shadow-xs"
                  aria-label="Profil Saya"
                  title={user.full_name}
                >
                  <span className="material-symbols-outlined text-[20px]">person</span>
                </Link>

                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-high transition-colors text-on-surface-variant"
                  aria-label="Logout"
                  title="Logout"
                >
                  <span className="material-symbols-outlined text-[20px]">logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[500] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-surface-container-lowest rounded-3xl p-6 shadow-2xl border border-outline-variant/30 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-error-container text-on-error-container mx-auto flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">logout</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-on-surface">Logout dari EcoMap?</h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Anda perlu login kembali untuk mengakses fitur pelaporan sampah.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 bg-surface-container text-on-surface-variant font-bold text-xs rounded-xl hover:bg-surface-container-high transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmLogout}
                className="flex-1 py-2.5 bg-error text-on-error font-bold text-xs rounded-xl hover:opacity-90 transition-opacity shadow-sm"
              >
                Ya, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}