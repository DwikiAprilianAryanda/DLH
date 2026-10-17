'use client';

import { useMemo } from 'react';
import type { ReportItem } from '@/lib/mock-data';
import type { TpsItem } from '@/components/map/TpsMap';
import { haversineDistance } from '@/lib/geo';

interface CriticalTpsListProps {
  reports: ReportItem[];
  tpsList: TpsItem[];
  selectedKecamatan?: string;
}

export interface CriticalTpsItem {
  tps: TpsItem;
  reportCount: number;
  kritisCount: number;
  sedangCount: number;
  latestReportDate: string;
}

export function computeCriticalTps(
  reports: ReportItem[],
  tpsList: TpsItem[],
  selectedKecamatan = 'Semua Kecamatan'
): CriticalTpsItem[] {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // 1. Filter laporan hanya di bulan berjalan (direset per awal bulan secara otomatis)
  const monthlyReports = reports.filter((r) => {
    const d = new Date(r.created_at);
    const isThisMonth = d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    if (!isThisMonth) return false;
    if (selectedKecamatan !== 'Semua Kecamatan' && r.kecamatan !== selectedKecamatan) {
      return false;
    }
    return true;
  });

  if (tpsList.length === 0) return [];

  // 2. Petakan setiap laporan ke titik TPS terdekat
  const tpsStatsMap: Record<
    string,
    { tps: TpsItem; reportCount: number; kritisCount: number; sedangCount: number; latestDate: string }
  > = {};

  monthlyReports.forEach((r) => {
    // Cari TPS terdekat dari koordinat laporan
    let nearest: TpsItem | null = null;
    let minDistance = Infinity;

    for (const t of tpsList) {
      const dist = haversineDistance(r.latitude, r.longitude, t.latitude, t.longitude);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = t;
      }
    }

    if (nearest) {
      if (!tpsStatsMap[nearest.id]) {
        tpsStatsMap[nearest.id] = {
          tps: nearest,
          reportCount: 0,
          kritisCount: 0,
          sedangCount: 0,
          latestDate: r.created_at,
        };
      }
      tpsStatsMap[nearest.id].reportCount += 1;
      if (r.urgensi === 'Kritis') tpsStatsMap[nearest.id].kritisCount += 1;
      if (r.urgensi === 'Sedang') tpsStatsMap[nearest.id].sedangCount += 1;

      if (new Date(r.created_at) > new Date(tpsStatsMap[nearest.id].latestDate)) {
        tpsStatsMap[nearest.id].latestDate = r.created_at;
      }
    }
  });

  // 3. Urutkan berdasarkan laporan terbanyak (klaster paling kritis)
  const sorted = Object.values(tpsStatsMap)
    .sort((a, b) => b.reportCount - a.reportCount)
    .map((item) => ({
      tps: item.tps,
      reportCount: item.reportCount,
      kritisCount: item.kritisCount,
      sedangCount: item.sedangCount,
      latestReportDate: item.latestDate,
    }));

  return sorted;
}

export default function CriticalTpsList({
  reports,
  tpsList,
  selectedKecamatan = 'Semua Kecamatan',
}: CriticalTpsListProps) {
  const criticalTps = useMemo(
    () => computeCriticalTps(reports, tpsList, selectedKecamatan),
    [reports, tpsList, selectedKecamatan]
  );

  const monthName = new Date().toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  });

  const maxReports = criticalTps[0]?.reportCount || 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant/30 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-error text-2xl">
              warning
            </span>
            <h2 className="text-base font-bold text-on-surface">
              Peringkat TPS Kritis
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-error-container text-on-error-container">
              Periode {monthName}
            </span>
          </div>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Daftar titik TPS dengan akumulasi laporan keluhan warga terbanyak (otomatis direset per bulan)
          </p>
        </div>

        <span className="text-xs font-semibold text-on-surface-variant flex items-center gap-1 self-start sm:self-auto">
          <span className="material-symbols-outlined text-xs">restart_alt</span>
          Reset berkala tiap awal bulan
        </span>
      </div>

      {criticalTps.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-2">
          <span className="material-symbols-outlined text-4xl text-primary">verified</span>
          <p className="text-sm font-bold text-on-surface">
            Tidak Ada Titik TPS Kritis Bulan Ini
          </p>
          <p className="text-xs text-on-surface-variant max-w-md mx-auto">
            Semua TPS di wilayah {selectedKecamatan} terpantau bersih dan belum mencatat lonjakan laporan keluhan warga pada periode {monthName}.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {criticalTps.slice(0, 6).map((item, idx) => {
            const isTop1 = idx === 0;
            const pct = Math.round((item.reportCount / maxReports) * 100);

            return (
              <div
                key={item.tps.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isTop1
                    ? 'bg-error-container/15 border-error/30 shadow-xs'
                    : 'bg-surface-container-lowest border-outline-variant/30 hover:bg-surface-container-low'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isTop1
                          ? 'bg-error text-on-error shadow-sm'
                          : 'bg-surface-container-high text-on-surface-variant'
                      }`}
                    >
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-on-surface truncate">
                          {item.tps.nama}
                        </h4>
                        {isTop1 && (
                          <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-error text-on-error shrink-0">
                            Paling Kritis
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-on-surface-variant truncate mt-0.5">
                        Kecamatan {item.tps.kecamatan} &bull; {item.tps.bangunan || 'TPS Terbuka'} ({item.tps.mobilitas || 'Statis'})
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-bold text-error">
                      {item.reportCount} <span className="text-[11px] font-medium text-on-surface-variant">Laporan</span>
                    </span>
                    <p className="text-[10px] text-on-surface-variant">
                      {item.kritisCount > 0 ? `${item.kritisCount} Urgensi Kritis` : 'Urgensi Normal'}
                    </p>
                  </div>
                </div>

                {/* Progress bar visualizer */}
                <div className="mt-2.5 space-y-1">
                  <div className="w-full h-1.5 bg-surface-container-low rounded-full overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${
                        isTop1 ? 'bg-error' : 'bg-tertiary'
                      }`}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
