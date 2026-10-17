'use client';

import { useMemo, useState } from 'react';

interface WasteCompositionProps {
  selectedKecamatan?: string;
}

export default function WasteCompositionChart({
  selectedKecamatan = 'Semua Kecamatan',
}: WasteCompositionProps) {
  const [activeView, setActiveView] = useState<'komposisi' | 'segmen'>('komposisi');

  // Proporsi realistis persampahan Kota Samarinda (~512 ton/hari total kota)
  const data = useMemo(() => {
    const isFiltered = selectedKecamatan !== 'Semua Kecamatan';
    const baseDailyTon = isFiltered ? 58.4 : 512.6;
    const baseMonthlyTon = isFiltered ? 1752 : 15378;

    return {
      dailyTon: baseDailyTon,
      monthlyTon: baseMonthlyTon,
      efektivitasKelola: 86.4,
      organik: {
        percentage: 56.2,
        tonPerDay: +(baseDailyTon * 0.562).toFixed(1),
        subtypes: [
          { name: 'Sisa Makanan & Dapur', pct: 36.5, color: 'bg-primary' },
          { name: 'Seresah Dedaunan & Ranting', pct: 12.4, color: 'bg-primary-container' },
          { name: 'Limbah Sayur/Buah Pasar', pct: 7.3, color: 'bg-secondary' },
        ],
      },
      nonOrganik: {
        percentage: 43.8,
        tonPerDay: +(baseDailyTon * 0.438).toFixed(1),
        subtypes: [
          { name: 'Plastik (Kemasan, Botol, Tas)', pct: 21.4, color: 'bg-tertiary-container' },
          { name: 'Kertas & Karton Kardus', pct: 10.2, color: 'bg-tertiary' },
          { name: 'Logam, Kaleng & Kaca', pct: 5.6, color: 'bg-outline' },
          { name: 'Residu TPA Tidak Terdaur', pct: 6.6, color: 'bg-error' },
        ],
      },
      segmen: [
        {
          id: 'rumah-tangga',
          label: 'Pemukiman / Rumah Tangga',
          desc: 'Limbah harian warga & perumahan',
          icon: 'home',
          pct: 58.5,
          tonPerDay: +(baseDailyTon * 0.585).toFixed(1),
          color: 'bg-primary',
          textColor: 'text-primary',
        },
        {
          id: 'pasar',
          label: 'Pasar Tradisional & Sentra Kuliner',
          desc: 'Pasar Segiri, Pasar Pagi, warung makan & ruko',
          icon: 'storefront',
          pct: 22.3,
          tonPerDay: +(baseDailyTon * 0.223).toFixed(1),
          color: 'bg-secondary',
          textColor: 'text-secondary',
        },
        {
          id: 'fasilitas-publik',
          label: 'Fasilitas Publik & Perkantoran',
          desc: 'Sekolah, rumah sakit, instansi dinas & taman',
          icon: 'domain',
          pct: 11.8,
          tonPerDay: +(baseDailyTon * 0.118).toFixed(1),
          color: 'bg-tertiary',
          textColor: 'text-tertiary',
        },
        {
          id: 'komersial-industri',
          label: 'Kawasan Komersial & Usaha Lainnya',
          desc: 'Mall, pergudangan & bengkel non-B3',
          icon: 'factory',
          pct: 7.4,
          tonPerDay: +(baseDailyTon * 0.074).toFixed(1),
          color: 'bg-outline',
          textColor: 'text-outline',
        },
      ],
    };
  }, [selectedKecamatan]);

  return (
    <div className="space-y-5">
      {/* Top Header & Overview Cards */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-outline-variant/30 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">
              pie_chart
            </span>
            <h2 className="text-base font-bold text-on-surface">
              Monitoring Volume & Segmen Sampah
            </h2>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-primary-container/20 text-primary">
              {selectedKecamatan}
            </span>
          </div>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Estimasi timbulan sampah terkelola berdasarkan tonase armada & survei DLH
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-surface-container-low p-1 rounded-xl self-start md:self-auto">
          <button
            onClick={() => setActiveView('komposisi')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeView === 'komposisi'
                ? 'bg-surface-container-lowest text-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">eco</span>
            Organik vs Non-Organik
          </button>
          <button
            onClick={() => setActiveView('segmen')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeView === 'segmen'
                ? 'bg-surface-container-lowest text-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">hub</span>
            Asal Segmen Sampah
          </button>
        </div>
      </div>

      {/* Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-container/20 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">delete_sweep</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
              Timbulan Terkelola / Hari
            </p>
            <p className="text-lg font-bold text-on-surface mt-0.5">
              {data.dailyTon} <span className="text-xs font-semibold text-on-surface-variant">Ton/hari</span>
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary-container/30 text-secondary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">calendar_month</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
              Akumulasi Bulan Ini
            </p>
            <p className="text-lg font-bold text-on-surface mt-0.5">
              {data.monthlyTon.toLocaleString('id-ID')}{' '}
              <span className="text-xs font-semibold text-on-surface-variant">Ton</span>
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-tertiary-container/20 text-tertiary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">verified</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
              Rasio Terangkut ke TPA
            </p>
            <p className="text-lg font-bold text-on-surface mt-0.5">
              {data.efektivitasKelola}%{' '}
              <span className="text-xs font-semibold text-primary">Terkontrol</span>
            </p>
          </div>
        </div>
      </div>

      {activeView === 'komposisi' ? (
        /* View 1: Komposisi Organik vs Non-Organik */
        <div className="space-y-4">
          {/* Main Visual Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-primary flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block"></span>
                Sampah Organik: {data.organik.percentage}% ({data.organik.tonPerDay} Ton/hari)
              </span>
              <span className="text-tertiary flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-tertiary-container inline-block"></span>
                Non-Organik: {data.nonOrganik.percentage}% ({data.nonOrganik.tonPerDay} Ton/hari)
              </span>
            </div>

            {/* Split Progress Track */}
            <div className="w-full h-5 bg-surface-container-high rounded-full overflow-hidden flex p-0.5 shadow-inner">
              <div
                style={{ width: `${data.organik.percentage}%` }}
                className="bg-primary h-full rounded-l-full transition-all duration-500 relative group cursor-pointer"
                title={`Organik: ${data.organik.percentage}%`}
              ></div>
              <div
                style={{ width: `${data.nonOrganik.percentage}%` }}
                className="bg-tertiary-container h-full rounded-r-full transition-all duration-500 relative group cursor-pointer"
                title={`Non-Organik: ${data.nonOrganik.percentage}%`}
              ></div>
            </div>
          </div>

          {/* Subtype Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Organik Breakdown */}
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">recycling</span>
                  Rincian Sampah Organik
                </span>
                <span className="text-xs font-bold text-primary">{data.organik.percentage}%</span>
              </div>
              <div className="space-y-2">
                {data.organik.subtypes.map((sub) => (
                  <div key={sub.name} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-on-surface font-medium">{sub.name}</span>
                      <span className="font-bold text-on-surface">{sub.pct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                      <div
                        style={{ width: `${(sub.pct / data.organik.percentage) * 100}%` }}
                        className={`h-full ${sub.color} rounded-full`}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Non-Organik Breakdown */}
            <div className="p-4 rounded-xl bg-tertiary/5 border border-tertiary/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-tertiary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">category</span>
                  Rincian Sampah Non-Organik / Anorganik
                </span>
                <span className="text-xs font-bold text-tertiary">{data.nonOrganik.percentage}%</span>
              </div>
              <div className="space-y-2">
                {data.nonOrganik.subtypes.map((sub) => (
                  <div key={sub.name} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-on-surface font-medium">{sub.name}</span>
                      <span className="font-bold text-on-surface">{sub.pct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                      <div
                        style={{ width: `${(sub.pct / data.nonOrganik.percentage) * 100}%` }}
                        className={`h-full ${sub.color} rounded-full`}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* View 2: Asal Segmen Sampah */
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.segmen.map((s) => (
              <div
                key={s.id}
                className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl ${s.color}/15 ${s.textColor} flex items-center justify-center`}>
                      <span className="material-symbols-outlined text-[20px]">{s.icon}</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-on-surface">{s.label}</h4>
                      <p className="text-[10px] text-on-surface-variant line-clamp-1">{s.desc}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${s.textColor}`}>{s.pct}%</span>
                </div>

                <div className="mt-3 space-y-1">
                  <div className="w-full h-2 bg-surface-container-low rounded-full overflow-hidden">
                    <div
                      style={{ width: `${s.pct}%` }}
                      className={`h-full ${s.color} rounded-full transition-all duration-500`}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-on-surface-variant pt-0.5">
                    <span>Kontribusi Timbulan</span>
                    <span className="font-semibold text-on-surface">~{s.tonPerDay} Ton / hari</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
