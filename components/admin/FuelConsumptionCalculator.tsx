'use client';

import { useMemo, useState } from 'react';
import type { ArmadaItem } from '@/lib/mock-data';

interface FuelConsumptionCalculatorProps {
  armadaList: ArmadaItem[];
  selectedKecamatan?: string;
}

// Jarak rata-rata pulang pergi (round-trip) ke TPA Sambutan (km) berdasarkan kecamatan asal
const JARAK_TPA_SAMBUTAN: Record<string, number> = {
  'Sambutan': 12,
  'Samarinda Ilir': 16,
  'Samarinda Kota': 18,
  'Samarinda Ulu': 24,
  'Sungai Pinang': 22,
  'Samarinda Utara': 28,
  'Sungai Kunjang': 26,
  'Samarinda Seberang': 25,
  'Loa Janan Ilir': 27,
  'Palaran': 30,
};

// Jarak rata-rata ke TPA Bukit Pinang (km)
const JARAK_TPA_BUKIT_PINANG: Record<string, number> = {
  'Sambutan': 32,
  'Samarinda Ilir': 24,
  'Samarinda Kota': 20,
  'Samarinda Ulu': 14,
  'Sungai Pinang': 16,
  'Samarinda Utara': 18,
  'Sungai Kunjang': 15,
  'Samarinda Seberang': 22,
  'Loa Janan Ilir': 26,
  'Palaran': 34,
};

// Efisiensi konsumsi BBM standar (km/liter)
const DEFAULT_EFFICIENCY: Record<string, number> = {
  compactor: 4.5, // Truk Compactor (berat dengan hidrolik) ~4.5 km/L
  dump: 5.0,      // Truk Dump ~5.0 km/L
  pickup: 8.5,    // Pick-up Reaksi Cepat ~8.5 km/L
};

export default function FuelConsumptionCalculator({
  armadaList,
  selectedKecamatan = 'Semua Kecamatan',
}: FuelConsumptionCalculatorProps) {
  // Parameter Kalkulator yang dapat disesuaikan secara dinamis
  const [targetTpa, setTargetTpa] = useState<'sambutan' | 'bukit_pinang'>('sambutan');
  const [fuelPrice, setFuelPrice] = useState<number>(6800); // Default Biosolar Rp 6.800/liter
  const [fuelType, setFuelType] = useState<string>('biosolar');
  const [defaultRitase, setDefaultRitase] = useState<number>(2.5); // Rata-rata 2 - 3 ritase/hari
  const [hariOperasional, setHariOperasional] = useState<number>(26); // 26 hari kerja/bulan
  const [effCompactor, setEffCompactor] = useState<number>(DEFAULT_EFFICIENCY.compactor);
  const [effDump, setEffDump] = useState<number>(DEFAULT_EFFICIENCY.dump);
  const [effPickup, setEffPickup] = useState<number>(DEFAULT_EFFICIENCY.pickup);
  const [showFormulaModal, setShowFormulaModal] = useState<boolean>(false);

  // Penanganan perubahan tipe BBM
  const handleFuelTypeChange = (type: string) => {
    setFuelType(type);
    if (type === 'biosolar') setFuelPrice(6800);
    else if (type === 'dexlite') setFuelPrice(14500);
    else if (type === 'pertalite') setFuelPrice(10000);
  };

  // Filter armada berdasarkan kecamatan
  const filteredArmada = useMemo(() => {
    return armadaList.filter((a) => {
      if (selectedKecamatan !== 'Semua Kecamatan' && a.kecamatan_tugas !== selectedKecamatan) {
        return false;
      }
      return true;
    });
  }, [armadaList, selectedKecamatan]);

  // Kalkulasi detail per unit armada
  const fleetCalculations = useMemo(() => {
    return filteredArmada.map((unit) => {
      let vehicleType = 'Compactor';
      let efficiency = effCompactor;

      if (unit.nama_armada.toLowerCase().includes('dump')) {
        vehicleType = 'Dump Truck';
        efficiency = effDump;
      } else if (unit.nama_armada.toLowerCase().includes('pick-up')) {
        vehicleType = 'Pick-up';
        efficiency = effPickup;
      }

      // Jarak per ritase berdasarkan kecamatan tugas unit
      const distanceTable = targetTpa === 'sambutan' ? JARAK_TPA_SAMBUTAN : JARAK_TPA_BUKIT_PINANG;
      const roundTripDistance = distanceTable[unit.kecamatan_tugas] || 22;

      // Jika unit dalam status 'Perawatan', ritase 0
      const activeRitase = unit.status === 'Perawatan' ? 0 : defaultRitase;

      // Jarak harian (km)
      const dailyDistance = activeRitase * roundTripDistance;

      // Konsumsi BBM harian (liter)
      const dailyLiters = efficiency > 0 ? dailyDistance / efficiency : 0;

      // Biaya harian (Rp)
      const dailyCost = dailyLiters * fuelPrice;

      // Bulanan
      const monthlyDistance = dailyDistance * hariOperasional;
      const monthlyLiters = dailyLiters * hariOperasional;
      const monthlyCost = dailyCost * hariOperasional;

      return {
        unit,
        vehicleType,
        efficiency,
        roundTripDistance,
        activeRitase,
        dailyDistance,
        dailyLiters,
        dailyCost,
        monthlyDistance,
        monthlyLiters,
        monthlyCost,
      };
    });
  }, [filteredArmada, targetTpa, defaultRitase, fuelPrice, hariOperasional, effCompactor, effDump, effPickup]);

  // Ringkasan Agregat Armada
  const summary = useMemo(() => {
    const totalDailyLiters = fleetCalculations.reduce((acc, c) => acc + c.dailyLiters, 0);
    const totalDailyCost = fleetCalculations.reduce((acc, c) => acc + c.dailyCost, 0);
    const totalDailyDistance = fleetCalculations.reduce((acc, c) => acc + c.dailyDistance, 0);
    const totalMonthlyLiters = fleetCalculations.reduce((acc, c) => acc + c.monthlyLiters, 0);
    const totalMonthlyCost = fleetCalculations.reduce((acc, c) => acc + c.monthlyCost, 0);

    return {
      totalDailyLiters,
      totalDailyCost,
      totalDailyDistance,
      totalMonthlyLiters,
      totalMonthlyCost,
    };
  }, [fleetCalculations]);

  // Format rupiah
  const formatRp = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Export to CSV function
  const handleExportCsv = () => {
    const headers = [
      'ID Armada',
      'Nama Armada',
      'Plat Nomor',
      'Tipe',
      'Kecamatan Tugas',
      'Status',
      'Ritase/Hari',
      'Jarak PP (km)',
      'Jarak Harian (km)',
      'Efisiensi (km/L)',
      'Konsumsi Harian (Liter)',
      'Biaya Harian (Rp)',
      'Konsumsi Bulanan (Liter)',
      'Biaya Bulanan (Rp)',
    ];

    const rows = fleetCalculations.map((c) => [
      c.unit.id,
      `"${c.unit.nama_armada}"`,
      `"${c.unit.plat_nomor}"`,
      c.vehicleType,
      `"${c.unit.kecamatan_tugas}"`,
      c.unit.status,
      c.activeRitase,
      c.roundTripDistance,
      c.dailyDistance.toFixed(1),
      c.efficiency,
      c.dailyLiters.toFixed(2),
      Math.round(c.dailyCost),
      c.monthlyLiters.toFixed(2),
      Math.round(c.monthlyCost),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Estimasi_Konsumsi_BBM_Armada_DLH_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner & Notes Context */}
      <div className="bg-gradient-to-r from-amber-700 via-orange-800 to-stone-900 rounded-2xl p-5 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-200 border border-amber-400/30">
                <span className="material-symbols-outlined text-[13px]">local_gas_station</span>
                Kalkulator Estimasi Bahan Bakar (BBM)
              </span>
              <span className="text-xs text-amber-100/80">30 Armada Kebersihan DLH</span>
            </div>
            <h3 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              Kalkulasi Konsumsi BBM & Ritase Operasional
            </h3>
            <p className="text-xs text-amber-100/90 max-w-2xl leading-relaxed">
              Memodelkan kebutuhan bahan bakar armada sampah berdasarkan ritase pembuangan ke TPA (Sambutan / Bukit Pinang), jarak tempuh per kecamatan, efisiensi bahan bakar per jenis truk, dan harga bahan bakar operasional.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowFormulaModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">info</span>
              <span>Rumus & Parameter DLH</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs shadow transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>Ekspor CSV</span>
            </button>
          </div>
        </div>

        {/* Aggregate KPI Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-white/10">
          <div className="bg-white/10 rounded-xl p-3 border border-white/10">
            <span className="text-[10px] text-amber-200 uppercase tracking-wider font-semibold block">
              Konsumsi BBM Harian
            </span>
            <div className="text-2xl font-bold mt-0.5 text-white">
              {Math.round(summary.totalDailyLiters).toLocaleString('id-ID')}{' '}
              <span className="text-xs font-normal text-amber-200">Liter/hari</span>
            </div>
            <span className="text-[10px] text-amber-100/70 block mt-0.5">
              {summary.totalMonthlyLiters.toLocaleString('id-ID', { maximumFractionDigits: 0 })} Liter/bulan ({hariOperasional} hari)
            </span>
          </div>

          <div className="bg-white/10 rounded-xl p-3 border border-white/10">
            <span className="text-[10px] text-amber-200 uppercase tracking-wider font-semibold block">
              Estimasi Biaya Harian
            </span>
            <div className="text-xl font-bold mt-0.5 text-white truncate">
              {formatRp(summary.totalDailyCost)}
            </div>
            <span className="text-[10px] text-amber-100/70 block mt-0.5 truncate">
              {formatRp(summary.totalMonthlyCost)} / bulan
            </span>
          </div>

          <div className="bg-white/10 rounded-xl p-3 border border-white/10">
            <span className="text-[10px] text-amber-200 uppercase tracking-wider font-semibold block">
              Total Jarak Tempuh
            </span>
            <div className="text-2xl font-bold mt-0.5 text-white">
              {Math.round(summary.totalDailyDistance).toLocaleString('id-ID')}{' '}
              <span className="text-xs font-normal text-amber-200">km/hari</span>
            </div>
            <span className="text-[10px] text-amber-100/70 block mt-0.5">
              Rata-rata {defaultRitase} ritase per armada
            </span>
          </div>

          <div className="bg-white/10 rounded-xl p-3 border border-white/10">
            <span className="text-[10px] text-amber-200 uppercase tracking-wider font-semibold block">
              Armada Diperhitungkan
            </span>
            <div className="text-2xl font-bold mt-0.5 text-white">
              {fleetCalculations.filter((c) => c.activeRitase > 0).length}{' '}
              <span className="text-xs font-normal text-amber-200">/ {filteredArmada.length} Unit</span>
            </div>
            <span className="text-[10px] text-amber-100/70 block mt-0.5">
              {filteredArmada.length - fleetCalculations.filter((c) => c.activeRitase > 0).length} unit dalam perawatan
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Simulation Controls */}
      <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30 space-y-4">
        <div className="flex items-center justify-between border-b border-outline-variant/30 pb-2.5">
          <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-[18px]">tune</span>
            Simulator Variabel & Parameter Konsumsi BBM
          </h4>
          <span className="text-[11px] text-on-surface-variant font-medium">
            Nilai otomatis memperbarui seluruh estimasi
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* TPA Tujuan */}
          <div className="space-y-1.5">
            <label className="block font-bold text-on-surface-variant uppercase text-[10px] tracking-wider">
              TPA Tujuan Pengangkutan
            </label>
            <div className="grid grid-cols-2 gap-1.5 bg-surface-container p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setTargetTpa('sambutan')}
                className={`py-1.5 px-2 rounded-lg font-bold text-center transition-all ${
                  targetTpa === 'sambutan'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                TPA Sambutan
              </button>
              <button
                type="button"
                onClick={() => setTargetTpa('bukit_pinang')}
                className={`py-1.5 px-2 rounded-lg font-bold text-center transition-all ${
                  targetTpa === 'bukit_pinang'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                TPA B. Pinang
              </button>
            </div>
          </div>

          {/* Tipe & Harga BBM */}
          <div className="space-y-1.5">
            <label className="block font-bold text-on-surface-variant uppercase text-[10px] tracking-wider">
              Bahan Bakar & Harga / Liter
            </label>
            <div className="flex items-center gap-1.5">
              <select
                value={fuelType}
                onChange={(e) => handleFuelTypeChange(e.target.value)}
                className="w-1/2 px-2.5 py-1.5 bg-surface-container-lowest border border-outline-variant/40 rounded-xl font-semibold text-on-surface"
              >
                <option value="biosolar">Biosolar</option>
                <option value="dexlite">Dexlite</option>
                <option value="pertalite">Pertalite</option>
              </select>
              <div className="w-1/2 relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-on-surface-variant font-bold">
                  Rp
                </span>
                <input
                  type="number"
                  value={fuelPrice}
                  onChange={(e) => setFuelPrice(Number(e.target.value))}
                  className="w-full pl-7 pr-2 py-1.5 bg-surface-container-lowest border border-outline-variant/40 rounded-xl font-bold text-on-surface text-right"
                />
              </div>
            </div>
          </div>

          {/* Rata-rata Ritase per Hari */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-on-surface-variant uppercase text-[10px] tracking-wider">
                Ritase / Hari / Armada
              </label>
              <span className="font-bold text-primary">{defaultRitase} Rit</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="0.5"
              value={defaultRitase}
              onChange={(e) => setDefaultRitase(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-on-surface-variant">
              <span>1 Rit</span>
              <span>2.5 Rit (Std)</span>
              <span>5 Rit</span>
            </div>
          </div>

          {/* Hari Operasional / Bulan */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-on-surface-variant uppercase text-[10px] tracking-wider">
                Hari Kerja / Bulan
              </label>
              <span className="font-bold text-primary">{hariOperasional} Hari</span>
            </div>
            <input
              type="range"
              min="20"
              max="31"
              step="1"
              value={hariOperasional}
              onChange={(e) => setHariOperasional(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-on-surface-variant">
              <span>20 Hari</span>
              <span>26 Hari (Std)</span>
              <span>30 Hari</span>
            </div>
          </div>
        </div>

        {/* Efisiensi Armada (Km/Liter) Tweaks */}
        <div className="pt-2 border-t border-outline-variant/20 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="font-bold text-on-surface text-[11px] flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-amber-600">speed</span>
            Efisiensi Konsumsi Truk (km/L):
          </span>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1 text-[11px] font-medium text-on-surface-variant">
              Compactor:
              <input
                type="number"
                step="0.1"
                value={effCompactor}
                onChange={(e) => setEffCompactor(Number(e.target.value))}
                className="w-14 px-1.5 py-0.5 bg-surface-container-lowest border border-outline-variant/40 rounded font-bold text-center text-on-surface"
              />
              km/L
            </label>
            <label className="flex items-center gap-1 text-[11px] font-medium text-on-surface-variant">
              Dump:
              <input
                type="number"
                step="0.1"
                value={effDump}
                onChange={(e) => setEffDump(Number(e.target.value))}
                className="w-14 px-1.5 py-0.5 bg-surface-container-lowest border border-outline-variant/40 rounded font-bold text-center text-on-surface"
              />
              km/L
            </label>
            <label className="flex items-center gap-1 text-[11px] font-medium text-on-surface-variant">
              Pick-up:
              <input
                type="number"
                step="0.1"
                value={effPickup}
                onChange={(e) => setEffPickup(Number(e.target.value))}
                className="w-14 px-1.5 py-0.5 bg-surface-container-lowest border border-outline-variant/40 rounded font-bold text-center text-on-surface"
              />
              km/L
            </label>
          </div>
        </div>
      </div>

      {/* Detailed Armada Fleet Fuel Breakdown Table */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-outline-variant/30 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">
              Rincian Estimasi Konsumsi BBM per Unit Armada ({filteredArmada.length} Unit)
            </h4>
            <p className="text-[11px] text-on-surface-variant mt-0.5">
              Dihitung berdasarkan kecamatan tugas, jarak ke {targetTpa === 'sambutan' ? 'TPA Sambutan' : 'TPA Bukit Pinang'}, dan ritase harian.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container-low text-on-surface-variant uppercase text-[10px] tracking-wider border-b border-outline-variant/30 font-bold">
              <tr>
                <th className="px-3.5 py-3">Armada & Plat</th>
                <th className="px-3.5 py-3">Tipe Kendaraan</th>
                <th className="px-3.5 py-3">Kecamatan</th>
                <th className="px-3.5 py-3 text-center">Jarak PP</th>
                <th className="px-3.5 py-3 text-center">Ritase</th>
                <th className="px-3.5 py-3 text-right">Konsumsi Harian</th>
                <th className="px-3.5 py-3 text-right">Biaya Harian</th>
                <th className="px-3.5 py-3 text-right">Estimasi Bulanan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {fleetCalculations.map((c) => (
                <tr key={c.unit.id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="px-3.5 py-2.5">
                    <p className="font-bold text-on-surface">{c.unit.nama_armada}</p>
                    <span className="text-[10px] font-mono text-on-surface-variant">{c.unit.plat_nomor}</span>
                  </td>
                  <td className="px-3.5 py-2.5">
                    <span className="font-semibold text-on-surface">{c.vehicleType}</span>
                    <span className="block text-[10px] text-on-surface-variant font-mono">
                      {c.efficiency} km/L
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5">
                    <span className="font-medium text-on-surface">{c.unit.kecamatan_tugas}</span>
                  </td>
                  <td className="px-3.5 py-2.5 text-center font-mono text-on-surface">
                    {c.roundTripDistance} km
                  </td>
                  <td className="px-3.5 py-2.5 text-center">
                    {c.unit.status === 'Perawatan' ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 font-bold">
                        Bengkel (0 Rit)
                      </span>
                    ) : (
                      <span className="font-bold text-on-surface">{c.activeRitase} Rit</span>
                    )}
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-mono font-bold text-on-surface">
                    {c.dailyLiters.toFixed(1)} L
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-mono font-bold text-emerald-700">
                    {formatRp(c.dailyCost)}
                  </td>
                  <td className="px-3.5 py-2.5 text-right">
                    <span className="font-mono font-bold text-on-surface block">
                      {formatRp(c.monthlyCost)}
                    </span>
                    <span className="text-[10px] text-on-surface-variant font-mono">
                      {c.monthlyLiters.toFixed(0)} L / bln
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-surface-container font-bold text-on-surface border-t-2 border-outline-variant/40">
              <tr>
                <td colSpan={5} className="px-3.5 py-3 text-right uppercase text-[11px] tracking-wider">
                  Total Estimasi Keseluruhan:
                </td>
                <td className="px-3.5 py-3 text-right font-mono text-primary text-sm">
                  {summary.totalDailyLiters.toFixed(1)} L
                </td>
                <td className="px-3.5 py-3 text-right font-mono text-emerald-700 text-sm">
                  {formatRp(summary.totalDailyCost)}
                </td>
                <td className="px-3.5 py-3 text-right font-mono text-primary text-sm">
                  {formatRp(summary.totalMonthlyCost)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Modal / Penjelasan Rumus DLH */}
      {showFormulaModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest max-w-lg w-full rounded-2xl p-6 shadow-2xl border border-outline-variant/40 space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
              <h3 className="font-bold text-base text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600">calculate</span>
                Metodologi & Rumus Konsumsi BBM DLH
              </h3>
              <button
                onClick={() => setShowFormulaModal(false)}
                className="text-on-surface-variant hover:text-on-surface p-1"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs text-on-surface leading-relaxed">
              <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-900 font-medium">
                Catatan Rapat Inovasi: <em>&quot;Diminta membuat perhitungan konsumsi bensin rumus nya dari mereka&quot;</em>. Modul ini dibangun secara modular agar formula dari DLH Kota Samarinda dapat langsung dipasang tanpa mengubah struktur basis data.
              </div>

              <div>
                <h5 className="font-bold text-on-surface mb-1">Formula Perhitungan Saat Ini:</h5>
                <ul className="list-disc pl-5 space-y-1 font-mono text-[11px] text-on-surface-variant">
                  <li>Jarak Harian (km) = Ritase &times; Jarak PP Kecamatan ke TPA</li>
                  <li>Konsumsi BBM (Liter) = Jarak Harian (km) &divide; Efisiensi Kendaraan (km/L)</li>
                  <li>Biaya Harian (Rp) = Konsumsi BBM (Liter) &times; Harga BBM per Liter</li>
                  <li>Biaya Bulanan (Rp) = Biaya Harian &times; Jumlah Hari Kerja Operasional</li>
                </ul>
              </div>

              <div>
                <h5 className="font-bold text-on-surface mb-1">Koefisien Standar Kendaraan Berat DLH:</h5>
                <p className="text-on-surface-variant">
                  Truk Compactor memiliki konsumsi tertinggi (~4.5 km/L) karena beban pemadatan hidrolik mekanik sampah basah. Dump Truck rata-rata 5.0 km/L, sedangkan Pick-up Reaksi Cepat memiliki efisiensi ~8.5 km/L.
                </p>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowFormulaModal(false)}
                className="px-4 py-2 bg-primary text-on-primary font-bold rounded-xl text-xs"
              >
                Tutup Informasi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
