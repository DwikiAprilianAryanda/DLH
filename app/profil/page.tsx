'use client';

import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useAuth } from '@/context/AuthContext';
import { useReports } from '@/context/ReportContext';

export default function ProfilPage() {
  const { user, loading: authLoading } = useAuth();
  const { reports } = useReports();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <Header />
        <main className="pt-20 px-4 max-w-lg mx-auto">
          <p className="text-xs text-on-surface-variant text-center">Memuat...</p>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <Header />
        <main className="pt-20 px-4 max-w-lg mx-auto">
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/30 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">lock</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-on-surface">Login Diperlukan</h1>
              <p className="text-xs text-on-surface-variant mt-1">
                Login untuk melihat profil kamu.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary text-on-primary text-xs font-bold rounded-xl shadow-xs"
            >
              Login
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const myReports = reports.filter((r) => r.user_id === user.id);
  const totalLaporan = myReports.length;
  const selesaiCount = myReports.filter((r) => r.status === 'Ditangani').length;
  const aktifCount = myReports.filter(
    (r) => r.status === 'Belum Ditangani' || r.status === 'Proses'
  ).length;

  const initials = user.full_name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <main className="pt-20 px-4 max-w-lg mx-auto space-y-4">
        <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/30 text-center relative overflow-hidden">
          <div className="w-20 h-20 rounded-full bg-primary text-on-primary mx-auto flex items-center justify-center font-bold text-2xl shadow-md mb-3 border-4 border-surface">
            {initials}
          </div>
          <h1 className="text-base font-bold text-on-surface">{user.full_name}</h1>
          <p className="text-xs text-on-surface-variant">{user.email}</p>
          {user.kecamatan && (
            <span className="inline-block mt-2 text-[10px] px-3 py-1 bg-primary-container text-on-primary-container font-bold rounded-full">
              {user.kecamatan}
            </span>
          )}

          <Link
            href="/profil/edit"
            className="absolute top-4 right-4 text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
            Edit
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface-container-lowest p-3.5 rounded-2xl shadow-sm border border-outline-variant/30 text-center">
            <p className="text-xs font-semibold text-on-surface-variant">Laporan</p>
            <p className="text-lg font-bold text-on-surface mt-0.5">{totalLaporan}</p>
          </div>
          <div className="bg-surface-container-lowest p-3.5 rounded-2xl shadow-sm border border-outline-variant/30 text-center">
            <p className="text-xs font-semibold text-on-surface-variant">Dibersihkan</p>
            <p className="text-lg font-bold text-primary mt-0.5">{selesaiCount}</p>
          </div>
          <div className="bg-surface-container-lowest p-3.5 rounded-2xl shadow-sm border border-outline-variant/30 text-center">
            <p className="text-xs font-semibold text-on-surface-variant">Aktif</p>
            <p className="text-lg font-bold text-tertiary mt-0.5">{aktifCount}</p>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-2 shadow-sm border border-outline-variant/30 divide-y divide-outline-variant/20">
          <Link
            href="/riwayat"
            className="flex items-center justify-between p-3 hover:bg-surface-container-low rounded-xl transition-colors text-xs font-semibold text-on-surface"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-primary text-[20px]">analytics</span>
              Riwayat Laporan Saya
            </div>
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </Link>
          <Link
            href="/peta"
            className="flex items-center justify-between p-3 hover:bg-surface-container-low rounded-xl transition-colors text-xs font-semibold text-on-surface"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-primary text-[20px]">location_on</span>
              Peta TPS
            </div>
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </Link>
          {user?.role === 'admin' && (
            <Link
              href="/admin"
              className="flex items-center justify-between p-3 hover:bg-surface-container-low rounded-xl transition-colors text-xs font-semibold text-emerald-700 bg-emerald-50"
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
                Dashboard Admin DLH
              </div>
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </Link>
          )}
        </div>

        <div className="space-y-2">
          {/* Link Web Resmi DLH */}
          <a
            href="https://dlh.samarindakota.go.id"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3.5 bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 hover:bg-surface-container-low transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">public</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-on-surface">Website Resmi DLH Kota Samarinda</p>
                <p className="text-[10px] text-on-surface-variant mt-0.5">
                  Portal informasi publik, regulasi, profil dinas, dan layanan lingkungan hidup
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">open_in_new</span>
          </a>

          {/* Link Web Pelacakan Realtime Cartrack */}
          <a
            href="https://fleet.cartrack.co.id"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3.5 bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 hover:bg-surface-container-low transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">local_shipping</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-on-surface">Web Cartrack Armada DLH</p>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-secondary-container text-on-secondary-container">
                    30 Unit Realtime
                  </span>
                </div>
                <p className="text-[10px] text-on-surface-variant mt-0.5">
                  Sistem monitoring GPS pelacakan 30 unit truk sampah & compactor secara langsung
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">open_in_new</span>
          </a>
        </div>
      </main>
    </div>
  );
}