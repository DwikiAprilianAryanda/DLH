'use client';

import dynamic from 'next/dynamic';
import Header from '@/components/layout/Header';
import { useReports } from '@/context/ReportContext';
import Link from 'next/link';

// Dynamically import EcoMap client side only
const EcoMap = dynamic(() => import('@/components/map/EcoMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[500px] bg-surface-container-low flex flex-col items-center justify-center gap-3 animate-pulse rounded-xl">
      <span className="material-symbols-outlined text-4xl text-primary animate-spin">
        progress_activity
      </span>
      <p className="text-sm font-medium text-on-surface-variant">
        Memuat Peta Samarinda...
      </p>
    </div>
  ),
});

export default function Home() {
  const { reports } = useReports();

  const activeReportsCount = reports.filter(
    (r) => r.status === 'Menunggu' || r.status === 'Armada Dikirim'
  ).length;

  const cleanedTodayCount = reports.filter(
    (r) => r.status === 'Selesai/Dibersihkan'
  ).length;

  return (
    <div className="relative min-h-screen bg-background pb-20">
      <Header />

      <main className="relative pt-16 h-[calc(100vh-4rem)]">
        {/* Map Container */}
        <div className="absolute inset-0 pt-16">
          <EcoMap reports={reports} />
        </div>

        {/* Top Header Overlay Cards */}
        <div className="absolute top-20 left-4 right-4 z-[400] max-w-md mx-auto flex gap-3 pointer-events-none">
          {/* Active Reports Card */}
          <div className="flex-1 bg-surface-container-lowest/95 backdrop-blur-md rounded-2xl p-3.5 shadow-md pointer-events-auto border border-outline-variant/30 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-error-container text-on-error-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">warning</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-on-surface-variant truncate">
                Laporan Aktif
              </p>
              <p className="text-xl font-bold text-on-surface leading-tight">
                {activeReportsCount}
              </p>
            </div>
          </div>

          {/* Cleaned Today Card */}
          <div className="flex-1 bg-surface-container-lowest/95 backdrop-blur-md rounded-2xl p-3.5 shadow-md pointer-events-auto border border-outline-variant/30 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">eco</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-on-surface-variant truncate">
                Dibersihkan Hari Ini
              </p>
              <p className="text-xl font-bold text-on-surface leading-tight">
                {cleanedTodayCount}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Report Floating Action Bar */}
        <div className="absolute bottom-24 left-4 right-4 z-[400] max-w-md mx-auto flex items-center justify-between bg-surface-container-lowest/95 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-outline-variant/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">
                location_on
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface">Lihat Sampah?</p>
              <p className="text-[11px] text-on-surface-variant">
                Laporkan titik lokasi presisi Samarinda
              </p>
            </div>
          </div>
          <Link
            href="/lapor"
            className="px-4 py-2 bg-primary text-on-primary text-xs font-bold rounded-xl shadow-md hover:bg-primary/90 transition-all flex items-center gap-1.5 shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">
              add_a_photo
            </span>
            Lapor Sampah
          </Link>
        </div>

        {/* Status Legend Bottom Bar */}
        <div className="absolute bottom-16 left-0 right-0 z-[300] bg-surface-container-lowest/90 backdrop-blur-md border-t border-outline-variant/20 py-2 px-4">
          <div className="max-w-md mx-auto flex justify-around items-center">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-error"></span>
              <span className="text-[11px] font-semibold text-on-surface-variant">
                Kritis (Urgent)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-tertiary-container"></span>
              <span className="text-[11px] font-semibold text-on-surface-variant">
                Sedang (Pending)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
              <span className="text-[11px] font-semibold text-on-surface-variant">
                Selesai (Resolved)
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
