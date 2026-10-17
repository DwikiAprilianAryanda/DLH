'use client';

import { useMemo, useState } from 'react';
import type { ArmadaItem } from '@/lib/mock-data';

interface CartrackFleetMonitoringProps {
  armadaList: ArmadaItem[];
  selectedKecamatan?: string;
}

export default function CartrackFleetMonitoring({
  armadaList,
  selectedKecamatan = 'Semua Kecamatan',
}: CartrackFleetMonitoringProps) {
  const [filterType, setFilterType] = useState<string>('semua');
  const [filterStatus, setFilterStatus] = useState<string>('semua');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Saring armada berdasarkan jenis, status, pencarian, dan kecamatan terpilih
  const filteredArmada = useMemo(() => {
    return armadaList.filter((unit) => {
      // Filter kecamatan dari dashboard utama jika bukan Semua
      if (
        selectedKecamatan !== 'Semua Kecamatan' &&
        unit.kecamatan_tugas !== selectedKecamatan
      ) {
        return false;
      }

      // Filter jenis kendaraan
      if (filterType !== 'semua') {
        if (filterType === 'compactor' && !unit.nama_armada.toLowerCase().includes('compactor'))
          return false;
        if (filterType === 'dump' && !unit.nama_armada.toLowerCase().includes('dump'))
          return false;
        if (filterType === 'pickup' && !unit.nama_armada.toLowerCase().includes('pick-up'))
          return false;
      }

      // Filter status
      if (filterStatus !== 'semua' && unit.status !== filterStatus) {
        return false;
      }

      // Filter pencarian
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = unit.nama_armada.toLowerCase().includes(query);
        const matchPlate = unit.plat_nomor.toLowerCase().includes(query);
        const matchPetugas = unit.nama_petugas.toLowerCase().includes(query);
        const matchKecamatan = unit.kecamatan_tugas.toLowerCase().includes(query);
        if (!matchName && !matchPlate && !matchPetugas && !matchKecamatan) {
          return false;
        }
      }

      return true;
    });
  }, [armadaList, selectedKecamatan, filterType, filterStatus, searchQuery]);

  // Statistik Cartrack
  const totalUnits = armadaList.length;
  const onDutyCount = armadaList.filter((a) => a.status === 'Bertugas').length;
  const readyCount = armadaList.filter((a) => a.status === 'Tersedia').length;
  const maintenanceCount = armadaList.filter((a) => a.status === 'Perawatan').length;

  // Helper untuk simulasi telemetri Cartrack
  const getTelemetryData = (unit: ArmadaItem) => {
    // Generate angka konsisten berdasarkan hash id
    const hash = unit.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const speed = unit.status === 'Bertugas' ? (20 + (hash % 35)) : 0;
    const fuelLevel = 45 + (hash % 50);
    const odo = 28000 + (hash * 37) % 65000;
    const lastPingMinutes = (hash % 7) + 1;

    let type = 'Compactor';
    let icon = 'local_shipping';
    let badgeColor = 'bg-primary/10 text-primary border-primary/20';

    if (unit.nama_armada.toLowerCase().includes('dump')) {
      type = 'Dump Truck';
      icon = 'dumpster';
      badgeColor = 'bg-amber-500/10 text-amber-700 border-amber-500/20';
    } else if (unit.nama_armada.toLowerCase().includes('pick-up')) {
      type = 'Pick-up Reaksi Cepat';
      icon = 'minor_crash';
      badgeColor = 'bg-blue-500/10 text-blue-700 border-blue-500/20';
    }

    return { speed, fuelLevel, odo, lastPingMinutes, type, icon, badgeColor };
  };

  return (
    <div className="space-y-5">
      {/* Header Banner Cartrack Integration */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/20 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Cartrack IoT Telemetry Active
              </span>
              <span className="text-xs text-slate-300 font-medium">30 Unit Samarinda</span>
            </div>
            <h3 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-400">satellite_alt</span>
              Monitoring Armada Sampah Real-Time
            </h3>
            <p className="text-xs text-slate-300 max-w-xl">
              Terintegrasi langsung dengan GPS Tracker Cartrack Indonesia. Memantau ritase pengangkutan, posisi koordinat armada, kecepatan laju, dan status operasional armada kebersihan di 10 kecamatan.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href="https://fleet.cartrack.co.id"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition-all active:scale-95"
            >
              <span>Buka Portal Cartrack</span>
              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
            </a>
          </div>
        </div>

        {/* Telemetry Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-white/10">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold block">Total Armada</span>
            <div className="text-2xl font-bold mt-0.5 text-white">{totalUnits} <span className="text-xs font-normal text-slate-300">Unit</span></div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-[10px] text-emerald-300 uppercase tracking-wider font-semibold block flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Sedang Bertugas
            </span>
            <div className="text-2xl font-bold mt-0.5 text-emerald-300">{onDutyCount} <span className="text-xs font-normal text-slate-300">Unit</span></div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-[10px] text-cyan-300 uppercase tracking-wider font-semibold block flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span> Siaga / Standby
            </span>
            <div className="text-2xl font-bold mt-0.5 text-cyan-300">{readyCount} <span className="text-xs font-normal text-slate-300">Unit</span></div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-[10px] text-amber-300 uppercase tracking-wider font-semibold block flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Perawatan Bengkel
            </span>
            <div className="text-2xl font-bold mt-0.5 text-amber-300">{maintenanceCount} <span className="text-xs font-normal text-slate-300">Unit</span></div>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface-container-low p-3 rounded-xl border border-outline-variant/30 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Jenis */}
          <div className="flex items-center gap-1 bg-surface-container-lowest p-1 rounded-lg border border-outline-variant/30">
            <button
              onClick={() => setFilterType('semua')}
              className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                filterType === 'semua'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Semua Tipe
            </button>
            <button
              onClick={() => setFilterType('compactor')}
              className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                filterType === 'compactor'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Compactor (14)
            </button>
            <button
              onClick={() => setFilterType('dump')}
              className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                filterType === 'dump'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Dump Truck (10)
            </button>
            <button
              onClick={() => setFilterType('pickup')}
              className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                filterType === 'pickup'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Pick-up (6)
            </button>
          </div>

          {/* Filter Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-surface-container-lowest border border-outline-variant/30 rounded-lg font-semibold text-on-surface"
          >
            <option value="semua">Semua Status</option>
            <option value="Bertugas">Sedang Bertugas</option>
            <option value="Tersedia">Siaga / Tersedia</option>
            <option value="Perawatan">Dalam Perawatan</option>
          </select>
        </div>

        {/* Search Box */}
        <div className="relative min-w-[200px]">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[16px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari armada, plat, petugas..."
            className="w-full pl-8 pr-3 py-1.5 bg-surface-container-lowest border border-outline-variant/30 rounded-lg text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Grid of 30 Fleet Units */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredArmada.map((unit) => {
          const telemetry = getTelemetryData(unit);

          return (
            <div
              key={unit.id}
              className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-4 shadow-2xs hover:shadow-md hover:border-primary/40 transition-all space-y-3"
            >
              {/* Unit Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-primary shrink-0">
                    <span className="material-symbols-outlined text-[20px]">
                      {telemetry.icon}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-on-surface leading-tight">
                      {unit.nama_armada}
                    </h4>
                    <span className="text-[10px] font-mono font-bold text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded">
                      {unit.plat_nomor}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                    unit.status === 'Bertugas'
                      ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'
                      : unit.status === 'Tersedia'
                      ? 'bg-blue-500/10 text-blue-700 border border-blue-500/20'
                      : 'bg-amber-500/10 text-amber-700 border border-amber-500/20'
                  }`}
                >
                  {unit.status}
                </span>
              </div>

              {/* Assignment & Driver */}
              <div className="grid grid-cols-2 gap-2 text-[11px] bg-surface-container-low/60 rounded-lg p-2">
                <div>
                  <span className="text-[10px] text-on-surface-variant block">Wilayah Tugas</span>
                  <span className="font-bold text-on-surface truncate block">
                    {unit.kecamatan_tugas}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-on-surface-variant block">Petugas Kemudi</span>
                  <span className="font-semibold text-on-surface truncate block">
                    {unit.nama_petugas}
                  </span>
                </div>
              </div>

              {/* Telemetry Sensor Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[10px] text-on-surface-variant">
                  <span className="flex items-center gap-1 font-medium">
                    <span className="material-symbols-outlined text-[14px] text-emerald-600">
                      speed
                    </span>
                    {telemetry.speed > 0 ? `${telemetry.speed} km/jam` : 'Parkir (0 km/jam)'}
                  </span>
                  <span className="flex items-center gap-1 font-medium">
                    <span className="material-symbols-outlined text-[14px] text-blue-600">
                      local_gas_station
                    </span>
                    BBM: {telemetry.fuelLevel}%
                  </span>
                  <span className="flex items-center gap-1 font-medium">
                    <span className="material-symbols-outlined text-[14px] text-slate-500">
                      pin_drop
                    </span>
                    {telemetry.lastPingMinutes}m lalu
                  </span>
                </div>

                {/* Progress bar fuel */}
                <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      telemetry.fuelLevel > 50
                        ? 'bg-emerald-500'
                        : telemetry.fuelLevel > 25
                        ? 'bg-amber-500'
                        : 'bg-error'
                    }`}
                    style={{ width: `${telemetry.fuelLevel}%` }}
                  />
                </div>
              </div>

              {/* Footer Links & Dispatch Action */}
              <div className="flex items-center justify-between pt-1 border-t border-outline-variant/20 text-[11px]">
                <a
                  href={`tel:${unit.telepon}`}
                  className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
                >
                  <span className="material-symbols-outlined text-[14px]">call</span>
                  {unit.telepon}
                </a>

                <a
                  href="https://fleet.cartrack.co.id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-bold hover:underline"
                >
                  <span>Lacak GPS</span>
                  <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {filteredArmada.length === 0 && (
        <div className="text-center py-8 bg-surface-container-low rounded-xl border border-outline-variant/30 text-on-surface-variant text-xs">
          Tidak ditemukan armada dengan filter atau kata kunci tersebut.
        </div>
      )}
    </div>
  );
}
