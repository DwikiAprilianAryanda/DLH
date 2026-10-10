'use client';

import { useMemo, useState } from 'react';

export interface SurveiItem {
  id: string;
  laporan_id: string;
  user_id: string;
  rating: number;
  komentar?: string | null;
  created_at: string;
}

interface SurveyRecapChartProps {
  surveiList: SurveiItem[];
  /** Berapa bulan terakhir yang ditampilkan (default 6) */
  monthsBack?: number;
}

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

export default function SurveyRecapChart({ surveiList, monthsBack = 6 }: SurveyRecapChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const data = useMemo(() => {
    const now = new Date();
    const buckets: { year: number; month: number; label: string; count: number; ratingSum: number }[] = [];
    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        year: d.getFullYear(),
        month: d.getMonth(),
        label: MONTH_LABELS[d.getMonth()],
        count: 0,
        ratingSum: 0,
      });
    }

    surveiList.forEach((s) => {
      const created = new Date(s.created_at);
      const bucket = buckets.find((b) => b.year === created.getFullYear() && b.month === created.getMonth());
      if (bucket) {
        bucket.count += 1;
        bucket.ratingSum += s.rating;
      }
    });

    return buckets.map((b) => ({
      ...b,
      avgRating: b.count > 0 ? b.ratingSum / b.count : 0,
    }));
  }, [surveiList, monthsBack]);

  const maxCount = Math.max(1, ...data.map((d) => d.count));
  const totalSurvei = data.reduce((sum, d) => sum + d.count, 0);
  const overallAvg =
    surveiList.length > 0
      ? surveiList.reduce((sum, s) => sum + s.rating, 0) / surveiList.length
      : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary text-xl">reviews</span>
            Rekap Survey Kepuasan
          </h2>
          <p className="text-[11px] text-on-surface-variant mt-0.5">
            Jumlah & rata-rata rating survei warga, {monthsBack} bulan terakhir
          </p>
        </div>
        <div className="flex items-center gap-2">
          {totalSurvei > 0 && (
            <span className="text-xs font-bold text-tertiary bg-tertiary-container/20 px-2.5 py-1 rounded-full flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">star</span>
              {overallAvg.toFixed(1)}
            </span>
          )}
          <span className="text-xs font-bold text-primary bg-primary-container/20 px-2.5 py-1 rounded-full">
            {totalSurvei} survei
          </span>
        </div>
      </div>

      {totalSurvei === 0 ? (
        <p className="text-xs text-on-surface-variant text-center py-10">
          Belum ada survei kepuasan yang masuk.
        </p>
      ) : (
        <div className="flex items-end justify-between gap-2 h-44 px-1" role="img" aria-label={`Grafik rekap survei kepuasan ${monthsBack} bulan terakhir`}>
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
                  <div className="absolute -top-11 bg-on-surface text-surface-container-lowest text-[10px] font-bold px-2 py-1 rounded-lg shadow-md whitespace-nowrap z-10 text-center leading-tight">
                    {d.count} survei
                    {d.count > 0 && (
                      <>
                        <br />
                        rata-rata {d.avgRating.toFixed(1)} ★
                      </>
                    )}
                  </div>
                )}
                {d.count > 0 && (
                  <span className="text-[9px] font-bold text-tertiary flex items-center gap-0.5">
                    {d.avgRating.toFixed(1)}
                    <span className="material-symbols-outlined text-[11px]">star</span>
                  </span>
                )}
                <div
                  className={`w-full max-w-[28px] rounded-t-md transition-all ${
                    isHovered ? 'bg-tertiary' : 'bg-tertiary/70'
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