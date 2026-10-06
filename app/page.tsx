'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useReports } from '@/context/ReportContext';
import { useAuth } from '@/context/AuthContext';
import { haversineDistance } from '@/lib/geo';
import type { TpsItem } from '@/components/map/TpsMap';

export default function Home() {
  const { user } = useAuth();
  const { reports } = useReports();

  const [tpsList, setTpsList] = useState<TpsItem[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'granted' | 'denied'>('idle');

  useEffect(() => {
    const fetchTps = async () => {
      try {
        const res = await fetch('/api/tps');
        const data = await res.json();
        setTpsList(data);
      } catch (error) {
        console.error('Gagal ambil data TPS:', error);
      }
    };
    fetchTps();
  }, []);

  const handleFindNearest = () => {
    if (!navigator.geolocation) {
      setGpsStatus('denied');
      return;
    }
    setGpsStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        setGpsStatus('granted');
      },
      () => setGpsStatus('denied')
    );
  };

  let nearestTps: (TpsItem & { distance: number }) | null = null;
  if (userLocation && tpsList.length > 0) {
    const withDistance = tpsList.map((t) => ({
      ...t,
      distance: haversineDistance(userLocation[0], userLocation[1], t.latitude, t.longitude),
    }));
    withDistance.sort((a, b) => a.distance - b.distance);
    nearestTps = withDistance[0] || null;
  }

  const activeReportsCount = reports.filter(
    (r) => r.status === 'Menunggu' || r.status === 'Armada Dikirim'
  ).length;
  const cleanedCount = reports.filter((r) => r.status === 'Selesai/Dibersihkan').length;

  const recentReports = reports.slice(0, 5);

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <main className="pt-20 px-4 max-w-lg mx-auto space-y-4">
        <div>
          <h1 className="text-xl font-bold text-on-surface">
            {user ? `Halo, ${user.full_name.split(' ')[0]}!` : 'Selamat Datang di EcoMap'}
          </h1>
          <p className="text-xs text-on-surface-variant">
            Pantau kebersihan Samarinda bersama Dinas Lingkungan Hidup
          </p>
        </div>

        {/* Ringkasan Laporan */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/30 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-error-container text-on-error-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">warning</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-on-surface-variant truncate">Laporan Aktif</p>
              <p className="text-xl font-bold text-on-surface leading-tight">{activeReportsCount}</p>
            </div>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/30 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">eco</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-on-surface-variant truncate">Sudah Dibersihkan</p>
              <p className="text-xl font-bold text-on-surface leading-tight">{cleanedCount}</p>
            </div>
          </div>
        </div>

        {/* TPS Terdekat */}
        <div className="bg-primary text-on-primary rounded-2xl p-4 shadow-md">
          {!userLocation ? (
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold opacity-80 block">
                  TPS Terdekat
                </span>
                <p className="text-xs font-medium mt-0.5">
                  Aktifkan lokasi GPS buat lihat TPS paling dekat dari posisi kamu
                </p>
              </div>
              <button
                onClick={handleFindNearest}
                disabled={gpsStatus === 'loading'}
                className="shrink-0 px-3.5 py-2 rounded-full bg-white/20 hover:bg-white/30 text-xs font-bold transition-colors disabled:opacity-60 flex items-center gap-1.5"
              >
                <span className={`material-symbols-outlined text-[18px] ${gpsStatus === 'loading' ? 'animate-spin' : ''}`}>
                  {gpsStatus === 'loading' ? 'progress_activity' : 'my_location'}
                </span>
                {gpsStatus === 'loading' ? 'Mencari...' : 'Aktifkan GPS'}
              </button>
            </div>
          ) : nearestTps ? (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] uppercase tracking-wider font-bold opacity-80 block">
                  TPS Terdekat Dari Lokasi Kamu
                </span>
                <p className="text-base font-bold mt-0.5 truncate">{nearestTps.nama}</p>
                <p className="text-xs opacity-90">
                  {nearestTps.kecamatan} &middot; sekitar{' '}
                  {nearestTps.distance < 1
                    ? `${Math.round(nearestTps.distance * 1000)} m`
                    : `${nearestTps.distance.toFixed(1)} km`}
                </p>
              </div>
              <Link
                href="/kontak"
                className="shrink-0 px-3 py-2 rounded-full bg-white/20 hover:bg-white/30 text-xs font-bold transition-colors"
              >
                Lihat Peta
              </Link>
            </div>
          ) : (
            <p className="text-xs">Nggak nemu titik TPS.</p>
          )}
        </div>

        {/* Quick Report CTA */}
        <Link
          href="/lapor"
          className="flex items-center justify-between bg-surface-container-lowest p-3.5 rounded-2xl shadow-sm border border-outline-variant/30 hover:bg-surface-container-low transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">add_a_photo</span>
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface">Lihat Sampah di Sekitar?</p>
              <p className="text-[11px] text-on-surface-variant">Laporkan titik lokasi presisi</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
        </Link>

        {/* Laporan Terbaru */}
                {/* Laporan Terbaru */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Laporan Terbaru
            </h2>
            <Link href="/riwayat" className="text-xs font-semibold text-primary hover:underline">
              Lihat Semua
            </Link>
          </div>

          {recentReports.length === 0 && (
            <p className="text-xs text-on-surface-variant text-center py-6">
              Belum ada laporan masuk.
            </p>
          )}

            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
            {recentReports.map((report) => (
              <Link
                key={report.id}
                href={`/laporan/${report.id}`}
                className="shrink-0 w-[88%] snap-center bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm border border-outline-variant/30 hover:shadow-md transition-shadow"
              >
                <div className="relative w-full h-56 bg-surface-container">
                  <img
                    src={report.foto_url}
                    alt={report.title}
                    className="w-full h-full object-cover"
                  />
                  <span
                    className={`absolute top-2 right-2 px-2 py-1 rounded-full text-[10px] font-bold shadow-sm ${
                      report.status === 'Selesai/Dibersihkan'
                        ? 'bg-primary-container text-on-primary-container'
                        : report.status === 'Armada Dikirim'
                        ? 'bg-secondary-container text-on-secondary-container'
                        : 'bg-error-container text-on-error-container'
                    }`}
                  >
                    {report.status}
                  </span>
                </div>
                <div className="p-3">
                  <p className="text-xs font-bold text-on-surface line-clamp-1">{report.title}</p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">{report.kecamatan}</p>
                  <p className="text-[11px] text-on-surface-variant line-clamp-2 mt-1 leading-relaxed">
                    {report.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}