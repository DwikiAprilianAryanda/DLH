'use client';

import { useState } from 'react';
import { useReports } from '@/context/ReportContext';
import { KECAMATAN_SAMARINDA } from '@/lib/mock-data';
import CartrackFleetMonitoring from '@/components/admin/CartrackFleetMonitoring';
import ArmadaManager from '@/components/admin/ArmadaManager';

type TabKey = 'data' | 'cartrack';

export default function AdminArmadaPage() {
  const { armada } = useReports();
  const [tab, setTab] = useState<TabKey>('data');
  const [selectedKecamatan, setSelectedKecamatan] = useState<string>('Semua Kecamatan');

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'data', label: 'Data Armada & Ritase', icon: 'list_alt' },
    { key: 'cartrack', label: 'Monitoring Cartrack', icon: 'satellite_alt' },
  ];

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
            {armada.length} unit armada DLH Samarinda. Kelola data armada, catat ritase harian, dan
            pantau lewat integrasi Cartrack.
          </p>
        </div>

        {/* Filter Kecamatan: hanya relevan untuk tab Cartrack */}
        {tab === 'cartrack' && (
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
        )}
      </div>

      <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-1 overflow-x-auto scrollbar-none">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
              tab === t.key
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'data' && <ArmadaManager />}

      {tab === 'cartrack' && (
        <CartrackFleetMonitoring armadaList={armada} selectedKecamatan={selectedKecamatan} />
      )}
    </div>
  );
}
