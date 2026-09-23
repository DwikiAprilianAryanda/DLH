'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { KECAMATAN_SAMARINDA } from '@/lib/mock-data';
import { useReports } from '@/context/ReportContext';

const EcoMap = dynamic(() => import('@/components/map/EcoMap'), { ssr: false });

export default function AdminDashboardPage() {
  const { reports, armada } = useReports();
  const [selectedKecamatan, setSelectedKecamatan] = useState('Semua Kecamatan');
  const [showHeatmap, setShowHeatmap] = useState(true);

  const filteredReports = reports.filter((r) => {
    if (selectedKecamatan !== 'Semua Kecamatan' && r.kecamatan !== selectedKecamatan) {
      return false;
    }
    return true;
  });

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

        {/* Zona Kritis */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/30 hover:-translate-y-0.5 transition-transform">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Zona Kritis (Heatmap)
            </span>
            <span className="material-symbols-outlined text-error bg-error-container/20 p-2 rounded-xl">
              local_fire_department
            </span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold text-error">
              {reports.filter((r) => r.urgensi === 'Kritis').length}
            </span>
            <span className="text-xs font-bold text-error bg-error-container/20 px-2 py-0.5 rounded-full">
              Klaster Merah
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

      {/* Main Analytics Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[700px]">
        {/* Left Filter & Controls Panel */}
        <div className="lg:col-span-3 bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
              <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">
                  filter_alt
                </span>
                Filter Analitik
              </h2>
            </div>

            {/* Kecamatan Filter */}
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Kecamatan Samarinda
              </label>
              <select
                value={selectedKecamatan}
                onChange={(e) => setSelectedKecamatan(e.target.value)}
                className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="Semua Kecamatan">Semua Kecamatan</option>
                {KECAMATAN_SAMARINDA.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>

            {/* Heatmap Layer Toggle */}
            <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-on-surface">
                  Visualisasi Heatmap
                </span>
                <button
                  onClick={() => setShowHeatmap(!showHeatmap)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    showHeatmap ? 'bg-primary' : 'bg-outline-variant'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      showHeatmap ? 'translate-x-5' : ''
                    }`}
                  ></span>
                </button>
              </div>
              <p className="text-[11px] text-on-surface-variant">
                Menampilkan kepadatan titik laporan sampah di wilayah Samarinda.
              </p>
            </div>

            {/* Fleet Status Summary */}
            <div className="pt-2">
              <span className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                Armada Siaga DLH
              </span>
              <div className="space-y-2">
                {armada.slice(0, 3).map((arm) => (
                  <div
                    key={arm.id}
                    className="p-2.5 rounded-xl bg-surface-container-low text-xs flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-on-surface">{arm.nama_armada}</p>
                      <p className="text-[10px] text-on-surface-variant">
                        {arm.kecamatan_tugas}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        arm.status === 'Bertugas'
                          ? 'bg-secondary-container text-on-secondary-container'
                          : 'bg-primary-container text-on-primary-container'
                      }`}
                    >
                      {arm.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Interactive Leaflet Map Container */}
        <div className="lg:col-span-9 bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 p-2 relative overflow-hidden">
          <EcoMap reports={filteredReports} />
        </div>
      </div>
    </div>
  );
}
