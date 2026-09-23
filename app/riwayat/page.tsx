'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useReports } from '@/context/ReportContext';

export default function RiwayatLaporanPage() {
  const { reports } = useReports();
  const [activeTab, setActiveTab] = useState<'Semua' | 'Menunggu' | 'Armada Dikirim' | 'Selesai/Dibersihkan'>('Semua');

  const filteredReports = reports.filter((r) => {
    if (activeTab === 'Semua') return true;
    return r.status === activeTab;
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <main className="pt-20 px-4 max-w-lg mx-auto">
        <div className="mb-5">
          <h1 className="text-xl font-bold text-on-surface">Riwayat Laporan Saya</h1>
          <p className="text-xs text-on-surface-variant">
            Daftar seluruh laporan sampah yang Anda kirimkan ke DLH Samarinda
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none">
          {(['Semua', 'Menunggu', 'Armada Dikirim', 'Selesai/Dibersihkan'] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-primary text-on-primary shadow-xs font-bold'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Reports List */}
        {filteredReports.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl p-8 text-center border border-outline-variant/30 my-8">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">
              inbox
            </span>
            <p className="text-sm font-bold text-on-surface">Tidak Ada Laporan</p>
            <p className="text-xs text-on-surface-variant mt-1 mb-4">
              Belum ada laporan dengan kategori status &quot;{activeTab}&quot;.
            </p>
            <Link
              href="/lapor"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary text-xs font-bold rounded-xl shadow-xs"
            >
              <span className="material-symbols-outlined text-sm">add_a_photo</span>
              Buat Laporan Baru
            </Link>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredReports.map((report) => {
              const formattedDate = new Date(report.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });

              return (
                <Link
                  key={report.id}
                  href={`/laporan/${report.id}`}
                  className="block bg-surface-container-lowest rounded-2xl p-3.5 shadow-sm border border-outline-variant/30 hover:border-primary/40 transition-all hover:shadow-md group"
                >
                  <div className="flex gap-3">
                    <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-surface-container-low relative">
                      <img
                        src={report.foto_url}
                        alt={report.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span
                        className={`absolute top-1 left-1 text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                          report.urgensi === 'Kritis'
                            ? 'bg-error text-on-error'
                            : report.urgensi === 'Sedang'
                            ? 'bg-tertiary-container text-on-tertiary-container'
                            : 'bg-primary text-on-primary'
                        }`}
                      >
                        {report.urgensi}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[11px] font-medium text-on-surface-variant">
                            {formattedDate}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              report.status === 'Selesai/Dibersihkan'
                                ? 'bg-primary-container text-on-primary-container'
                                : report.status === 'Armada Dikirim'
                                ? 'bg-secondary-container text-on-secondary-container'
                                : 'bg-error-container text-on-error-container'
                            }`}
                          >
                            {report.status}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-on-surface line-clamp-1 group-hover:text-primary transition-colors">
                          {report.title}
                        </h3>
                        <p className="text-xs text-on-surface-variant line-clamp-2 mt-0.5">
                          {report.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-on-surface-variant font-medium mt-2 pt-2 border-t border-outline-variant/20">
                        <span className="material-symbols-outlined text-[14px] text-primary">
                          location_on
                        </span>
                        <span className="truncate">{report.kecamatan}, Samarinda</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
