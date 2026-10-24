'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { KECAMATAN_SAMARINDA } from '@/lib/mock-data';
import { useReports } from '@/context/ReportContext';
import RekapTabs from '@/components/admin/RekapTabs';
import { computeCriticalTps } from '@/components/admin/CriticalTpsList';
import type { SurveiItem } from '@/components/admin/SurveyRecapChart';
import type { TpsItem } from '@/components/map/TpsMap';

const EcoMap = dynamic(() => import('@/components/map/EcoMap'), { ssr: false });

export default function AdminDashboardPage() {
  const { reports, armada } = useReports();
  const [selectedKecamatan, setSelectedKecamatan] = useState('Semua Kecamatan');
  const [surveiList, setSurveiList] = useState<SurveiItem[]>([]);
  const [tpsList, setTpsList] = useState<TpsItem[]>([]);

  useEffect(() => {
    const fetchSurvei = async () => {
      try {
        const res = await fetch('/api/admin/survei');
        if (res.ok) {
          setSurveiList(await res.json());
        }
      } catch (error) {
        console.error('Gagal ambil data survei:', error);
      }
    };

    const fetchTps = async () => {
      try {
        const res = await fetch('/api/tps');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setTpsList(data);
        }
      } catch (error) {
        console.error('Gagal ambil data TPS:', error);
      }
    };

    fetchSurvei();
    fetchTps();
  }, []);

  const filteredReports = reports.filter((r) => {
    if (selectedKecamatan !== 'Semua Kecamatan' && r.kecamatan !== selectedKecamatan) {
      return false;
    }
    return true;
  });

  // Kalkulasi TPS Kritis bulan berjalan (reset otomatis setiap awal bulan)
  const criticalTpsList = useMemo(
    () => computeCriticalTps(reports, tpsList, selectedKecamatan),
    [reports, tpsList, selectedKecamatan]
  );
  const topCritical = criticalTpsList[0];

  return (
    <div className="space-y-6">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Laporan */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/30 hover:-translate-y-0.5 transition-transform">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Total Laporan
            </span>
            <span className="material-symbols-outlined text-primary bg-primary-container/20 p-2 rounded-xl">
              assessment
            </span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold text-on-surface">{reports.length}</span>
            <span className="text-xs font-bold text-primary bg-primary-container/20 px-2 py-0.5 rounded-full">
              Real-time Sync
            </span>
          </div>
        </div>

        {/* TPS Kritis (Sesuai catatan: per bulan direset & dihitung dari TPS terbanyak dilaporkan) */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/30 hover:-translate-y-0.5 transition-transform">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              TPS Kritis
            </span>
            <span className="material-symbols-outlined text-error bg-error-container/20 p-2 rounded-xl">
              warning
            </span>
          </div>
          <div className="flex items-end justify-between">
            <div className="min-w-0 pr-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold text-error">
                  {topCritical ? topCritical.reportCount : 0}
                </span>
                <span className="text-[11px] font-semibold text-on-surface-variant">
                  Laporan Bln Ini
                </span>
              </div>
              <p className="text-xs font-bold text-on-surface truncate mt-0.5" title={topCritical?.tps.nama}>
                {topCritical ? topCritical.tps.nama : 'Semua Terkendali'}
              </p>
            </div>
            <span className="text-[10px] font-bold text-error bg-error-container/20 px-2 py-0.5 rounded-full shrink-0">
              Reset Bulanan
            </span>
          </div>
        </div>

        {/* Armada Aktif */}
        <div className="bg-primary p-5 rounded-2xl shadow-md text-on-primary hover:scale-[1.01] transition-transform">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider opacity-85">
              Armada Kebersihan
            </span>
            <span className="material-symbols-outlined text-on-primary">
              local_shipping
            </span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold">
              {armada.filter((a) => a.status === 'Bertugas').length}/{armada.length}
            </span>
            <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">
              Bertugas
            </span>
          </div>
        </div>

        {/* Waktu Respon */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/30 hover:-translate-y-0.5 transition-transform">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Rata-rata Waktu Respon
            </span>
            <span className="material-symbols-outlined text-tertiary bg-tertiary-container/20 p-2 rounded-xl">
              timer
            </span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold text-on-surface">1j 45m</span>
            <span className="text-xs font-bold text-primary bg-primary-container/20 px-2 py-0.5 rounded-full">
              -15m avg
            </span>
          </div>
        </div>
      </div>

      {/* Rekapitulasi: Volume & Segmen Sampah, TPS Kritis, Armada Cartrack, Laporan Bulanan, Survey Kepuasan */}
      <RekapTabs
        reports={reports}
        surveiList={surveiList}
        tpsList={tpsList}
        armadaList={armada}
        selectedKecamatan={selectedKecamatan}
      />

      {/* Peta Sebaran Laporan Sampah - Full Width */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">map</span>
            <div>
              <h2 className="text-sm font-bold text-on-surface">
                Peta Sebaran Laporan Sampah & Heatmap Kepadatan Samarinda
              </h2>
              <p className="text-[11px] text-on-surface-variant">
                Visualisasi geospasial sebaran titik pengaduan masyarakat se-Kota Samarinda
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-primary bg-primary-container/20 px-3 py-1 rounded-full">
            {filteredReports.length} Titik Laporan Terpantau
          </span>
        </div>
        <div className="h-[600px] rounded-xl overflow-hidden relative">
          <EcoMap reports={filteredReports} />
        </div>
      </div>
    </div>
  );
}