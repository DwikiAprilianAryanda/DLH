'use client';

import { useState } from 'react';
import type { ReportItem } from '@/lib/mock-data';
import MonthlyRecapChart from './MonthlyRecapChart';
import SurveyRecapChart, { type SurveiItem } from './SurveyRecapChart';

interface RekapTabsProps {
  reports: ReportItem[];
  surveiList: SurveiItem[];
}

type TabKey = 'laporan' | 'survey';

export default function RekapTabs({ reports, surveiList }: RekapTabsProps) {
  const [tab, setTab] = useState<TabKey>('laporan');

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'laporan', label: 'Rekap Laporan', icon: 'bar_chart' },
    { key: 'survey', label: 'Rekap Survey Kepuasan', icon: 'reviews' },
  ];

  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 p-5">
      <div className="flex items-center gap-2 mb-4 border-b border-outline-variant/30 pb-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-t-lg transition-colors border-b-2 ${
              tab === t.key
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'laporan' ? (
        <MonthlyRecapChart reports={reports} />
      ) : (
        <SurveyRecapChart surveiList={surveiList} />
      )}
    </div>
  );
}