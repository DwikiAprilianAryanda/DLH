'use client';

import { useState } from 'react';
import { useReports } from '@/context/ReportContext';
import { KECAMATAN_SAMARINDA } from '@/lib/mock-data';
import CartrackFleetMonitoring from '@/components/admin/CartrackFleetMonitoring';
import FuelConsumptionCalculator from '@/components/admin/FuelConsumptionCalculator';

export default function AdminArmadaPage() {
  const { armada } = useReports();
  const [activeTab, setActiveTab] = useState<'cartrack' | 'bbm'>('cartrack');
  const [selectedKecamatan, setSelectedKecamatan] = useState<string>('Semua Kecamatan');

  return (
    <div className="space-y-6">
      {/* Page Title & Navigation Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-[24px]">local_shipping</span>
            <h1 className="text-xl font-bold text-on-surface">
              Armada Kebersihan & Manajemen BBM
            </h1>
          </div>
          <p className="text-xs text-on-surface-variant">
            Integrasi 30 unit armada sampah DLH Samarinda dengan Cartrack IoT dan simulator estimasi bahan bakar operasional.
          </p>
        </div>

        {/* Global Filter Kecamatan */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-on-surface-variant whitespace-nowrap">
            Kecamatan:
          </label>
          <select
            value={selectedKecamatan}
            onChange={(e) => setSelectedKecamatan(e.target.value)}
            className="px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="Semua Kecamatan">Semua Kecamatan (10)</option>
            {KECAMATAN_SAMARINDA.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Tab Controls */}
      <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-1">
        <button
          onClick={() => setActiveTab('cartrack')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
            activeTab === 'cartrack'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">satellite_alt</span>
          Monitoring Cartrack (30 Unit)
        </button>

        <button
          onClick={() => setActiveTab('bbm')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
            activeTab === 'bbm'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">local_gas_station</span>
          Kalkulator & Proyeksi BBM
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'cartrack' && (
        <CartrackFleetMonitoring
          armadaList={armada}
          selectedKecamatan={selectedKecamatan}
        />
      )}

      {activeTab === 'bbm' && (
        <FuelConsumptionCalculator
          armadaList={armada}
          selectedKecamatan={selectedKecamatan}
        />
      )}
    </div>
  );
}
