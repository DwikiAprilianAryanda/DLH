'use client';

import Link from 'next/link';
import Header from '@/components/layout/Header';

export default function ProfilPage() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <main className="pt-20 px-4 max-w-lg mx-auto space-y-4">
        {/* User Card */}
        <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/30 text-center relative overflow-hidden">
          <div className="w-20 h-20 rounded-full bg-primary text-on-primary mx-auto flex items-center justify-center font-bold text-2xl shadow-md mb-3 border-4 border-surface">
            BS
          </div>
          <h1 className="text-base font-bold text-on-surface">Budi Santoso</h1>
          <p className="text-xs text-on-surface-variant">Warga Peduli Samarinda</p>
          <span className="inline-block mt-2 text-[10px] px-3 py-1 bg-primary-container text-on-primary-container font-bold rounded-full">
            Lencana: Pejuang Kebersihan 🌿
          </span>

          <Link
            href="/profil/edit"
            className="absolute top-4 right-4 text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
            Edit
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface-container-lowest p-3.5 rounded-2xl shadow-sm border border-outline-variant/30 text-center">
            <p className="text-xs font-semibold text-on-surface-variant">Laporan</p>
            <p className="text-lg font-bold text-on-surface mt-0.5">12</p>
          </div>
          <div className="bg-surface-container-lowest p-3.5 rounded-2xl shadow-sm border border-outline-variant/30 text-center">
            <p className="text-xs font-semibold text-on-surface-variant">Dibersihkan</p>
            <p className="text-lg font-bold text-primary mt-0.5">9</p>
          </div>
          <div className="bg-surface-container-lowest p-3.5 rounded-2xl shadow-sm border border-outline-variant/30 text-center">
            <p className="text-xs font-semibold text-on-surface-variant">Poin Eco</p>
            <p className="text-lg font-bold text-tertiary mt-0.5">450</p>
          </div>
        </div>

        {/* Menu Links */}
        <div className="bg-surface-container-lowest rounded-2xl p-2 shadow-sm border border-outline-variant/30 divide-y divide-outline-variant/20">
          <Link
            href="/riwayat"
            className="flex items-center justify-between p-3 hover:bg-surface-container-low rounded-xl transition-colors text-xs font-semibold text-on-surface"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-primary text-[20px]">
                analytics
              </span>
              Riwayat Laporan Saya
            </div>
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </Link>
          <Link
            href="/kontak"
            className="flex items-center justify-between p-3 hover:bg-surface-container-low rounded-xl transition-colors text-xs font-semibold text-on-surface"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-primary text-[20px]">
                phone_in_talk
              </span>
              Kontak Petugas DLH
            </div>
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </Link>
          <Link
            href="/admin/login"
            className="flex items-center justify-between p-3 hover:bg-surface-container-low rounded-xl transition-colors text-xs font-semibold text-primary"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[20px]">
                admin_panel_settings
              </span>
              Portal Staf Admin DLH
            </div>
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
