'use client';

import { useState } from 'react';
import type { ReportItem, ArmadaItem } from '@/lib/mock-data';
import type { TpsItem } from '@/components/map/TpsMap';
import MonthlyRecapChart from './MonthlyRecapChart';
import SurveyRecapChart, { type SurveiItem } from './SurveyRecapChart';
import WasteCompositionChart from './WasteCompositionChart';
import CriticalTpsList from './CriticalTpsList';
import CartrackFleetMonitoring from './CartrackFleetMonitoring';

interface RekapTabsProps {
  reports: ReportItem[];
  surveiList: SurveiItem[];
  tpsList?: TpsItem[];
  armadaList?: ArmadaItem[];
  selectedKecamatan?: string;
}

type TabKey = 'volume' | 'tps_kritis' | 'cartrack' | 'laporan' | 'survey';

export default function RekapTabs({
  reports,
  surveiList,
  tpsList = [],
  armadaList = [],
  selectedKecamatan = 'Semua Kecamatan',
}: RekapTabsProps) {
  const [tab, setTab] = useState<TabKey>('volume');

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'volume', label: 'Volume & Segmen Sampah', icon: 'pie_chart' },
    { key: 'tps_kritis', label: 'TPS Kritis', icon: 'warning' },
    { key: 'cartrack', label: 'Monitoring Armada Cartrack (30 Unit)', icon: 'satellite_alt' },
    { key: 'laporan', label: 'Rekap Laporan Bulanan', icon: 'bar_chart' },
    { key: 'survey', label: 'Rekap Survey Kepuasan', icon: 'reviews' },
  ];

  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 p-5">
      <div className="flex items-center gap-2 mb-5 border-b border-outline-variant/30 pb-1 overflow-x-auto scrollbar-none">
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

      {tab === 'volume' && (
        <WasteCompositionChart selectedKecamatan={selectedKecamatan} />
      )}

      {tab === 'tps_kritis' && (
        <CriticalTpsList
          reports={reports}
          tpsList={tpsList}
          selectedKecamatan={selectedKecamatan}
        />
      )}

      {tab === 'cartrack' && (
        <CartrackFleetMonitoring
          armadaList={armadaList}
          selectedKecamatan={selectedKecamatan}
        />
      )}

      {tab === 'laporan' && <MonthlyRecapChart reports={reports} />}

      {tab === 'survey' && <SurveyRecapChart surveiList={surveiList} />}
    </div>
  );
}