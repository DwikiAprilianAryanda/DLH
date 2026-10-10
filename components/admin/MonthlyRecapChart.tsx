'use client';

import { useMemo, useState } from 'react';
import type { ReportItem } from '@/lib/mock-data';

interface MonthlyRecapChartProps {
  reports: ReportItem[];
  /** Berapa bulan terakhir yang ditampilkan (default 6) */
  monthsBack?: number;
}

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

export default function MonthlyRecapChart({ reports, monthsBack = 6 }: MonthlyRecapChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const data = useMemo(() => {
    const now = new Date();
    // Bangun daftar `monthsBack` bulan terakhir (termasuk bulan ini), urut dari terlama ke terbaru
    const buckets: { year: number; month: number; label: string; count: number }[] = [];
    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ year: d.getFullYear(), month: d.getMonth(), label: MONTH_LABELS[d.getMonth()], count: 0 });
    }

    reports.forEach((r) => {
      const created = new Date(r.created_at);
      const bucket = buckets.find((b) => b.year === created.getFullYear() && b.month === created.getMonth());
      if (bucket) bucket.count += 1;
    });

    return buckets;
  }, [reports, monthsBack]);

  const maxCount = Math.max(1, ...data.map((d) => d.count));
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">bar_chart</span>
            Rekap Laporan Bulanan
          </h2>
          <p className="text-[11px] text-on-surface-variant mt-0.5">
            Jumlah laporan masuk {monthsBack} bulan terakhir
          </p>
        </div>
        <span className="text-xs font-bold text-primary bg-primary-container/20 px-2.5 py-1 rounded-full">
          Total {total}
        </span>
      </div>

      {total === 0 ? (
        <p className="text-xs text-on-surface-variant text-center py-10">
          Belum ada data laporan untuk direkap.
        </p>
      ) : (
        <div className="flex items-end justify-between gap-2 h-44 px-1" role="img" aria-label={`Grafik rekap laporan ${monthsBack} bulan terakhir`}>
          {data.map((d, idx) => {
            const heightPct = (d.count / maxCount) * 100;
            const isHovered = hoverIdx === idx;
            return (
              <div
                key={`${d.year}-${d.month}`}
                className="flex-1 h-full flex flex-col items-center justify-end gap-1.5 relative"
                onMouseEnter={() => setHoverIdx(idx)}
                onMouseLeave={() => setHoverIdx(null)}
              >
                {isHovered && (
                  <div className="absolute -top-7 bg-on-surface text-surface-container-lowest text-[10px] font-bold px-2 py-1 rounded-lg shadow-md whitespace-nowrap z-10">
                    {d.count} laporan
                  </div>
                )}
                <div
                  className={`w-full max-w-[28px] rounded-t-md transition-all ${
                    isHovered ? 'bg-primary' : 'bg-primary/70'
                  }`}
                  style={{ height: `${Math.max(heightPct, d.count > 0 ? 4 : 2)}%` }}
                />
                <span className="text-[10px] font-semibold text-on-surface-variant">{d.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}