'use client';

import { useState } from 'react';
import { useReports } from '@/context/ReportContext';
import { KECAMATAN_SAMARINDA } from '@/lib/mock-data';
import CartrackFleetMonitoring from '@/components/admin/CartrackFleetMonitoring';

export default function AdminArmadaPage() {
  const { armada } = useReports();
  const [selectedKecamatan, setSelectedKecamatan] = useState<string>('Semua Kecamatan');

  return (
    <div className="space-y-6">
      {/* Page Title & Navigation Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-[24px]">local_shipping</span>
            <h1 className="text-xl font-bold text-on-surface">
              Armada Kebersihan Kota Samarinda
            </h1>
          </div>
          <p className="text-xs text-on-surface-variant">
            Monitoring real-time 30 unit armada sampah DLH Samarinda dengan integrasi Cartrack IoT telematics.
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

      {/* Cartrack Fleet Monitoring */}
      <CartrackFleetMonitoring
        armadaList={armada}
        selectedKecamatan={selectedKecamatan}
      />
    </div>
  );
}
