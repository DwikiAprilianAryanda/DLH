'use client';

import { useState } from 'react';
import type { ReportItem, ArmadaItem } from '@/lib/mock-data';
import type { TpsItem } from '@/components/map/TpsMap';
import MonthlyRecapChart from './MonthlyRecapChart';
import SurveyRecapChart, { type SurveiItem } from './SurveyRecapChart';
import CriticalTpsList from './CriticalTpsList';
import ExportExcelButton from './ExportExcelButton';

interface RekapTabsProps {
  reports: ReportItem[];
  surveiList: SurveiItem[];
  tpsList?: TpsItem[];
  armadaList?: ArmadaItem[];
  selectedKecamatan?: string;
}

type TabKey = 'tps_kritis' | 'laporan' | 'survey';

export default function RekapTabs({
  reports,
  surveiList,
  tpsList = [],
  selectedKecamatan = 'Semua Kecamatan',
}: RekapTabsProps) {
  const [tab, setTab] = useState<TabKey>('tps_kritis');

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'tps_kritis', label: 'Area Kritis', icon: 'warning' },
    { key: 'laporan', label: 'Rekap Laporan Bulanan', icon: 'bar_chart' },
    { key: 'survey', label: 'Rekap Survey Kepuasan', icon: 'reviews' },
  ];

  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 p-5">
      <div className="flex items-center gap-3 mb-5 border-b border-outline-variant/30 pb-1">
        <div className="flex-1 min-w-0 flex items-center gap-2 overflow-x-auto scrollbar-none">
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
        <ExportExcelButton kecamatan={selectedKecamatan} />
      </div>

      {tab === 'tps_kritis' && (
        <CriticalTpsList
          reports={reports}
          tpsList={tpsList}
          selectedKecamatan={selectedKecamatan}
        />
      )}

      {tab === 'laporan' && <MonthlyRecapChart reports={reports} />}

      {tab === 'survey' && <SurveyRecapChart surveiList={surveiList} />}
    </div>
  );
}