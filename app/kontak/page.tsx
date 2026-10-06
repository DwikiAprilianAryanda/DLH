'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/layout/Header';
import { haversineDistance } from '@/lib/geo';
import type { TpsItem } from '@/components/map/TpsMap';

const TpsMap = dynamic(() => import('@/components/map/TpsMap'), { ssr: false });

export default function PetaTpsPage() {
  const [tpsList, setTpsList] = useState<TpsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'granted' | 'denied'>('idle');
  const [selectedKecamatan, setSelectedKecamatan] = useState('Semua');

  useEffect(() => {
    const fetchTps = async () => {
      try {
        const res = await fetch('/api/tps');
        const data = await res.json();
        setTpsList(data);
      } catch (error) {
        console.error('Gagal ambil data TPS:', error);
      } finally {
        setLoading(false);
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

  const kecamatanList = [
    'Semua',
    ...Array.from(new Set(tpsList.map((t) => t.kecamatan))).sort(),
  ];

  const filteredTps =
    selectedKecamatan === 'Semua' ? tpsList : tpsList.filter((t) => t.kecamatan === selectedKecamatan);

  let nearestTps: (TpsItem & { distance: number }) | null = null;
  if (userLocation) {
    const withDistance = tpsList.map((t) => ({
      ...t,
      distance: haversineDistance(userLocation[0], userLocation[1], t.latitude, t.longitude),
    }));
    withDistance.sort((a, b) => a.distance - b.distance);
    nearestTps = withDistance[0] || null;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <main className="pt-20 px-4 max-w-lg mx-auto space-y-4">
        <div>
          <h1 className="text-xl font-bold text-on-surface">Peta TPS Samarinda</h1>
          <p className="text-xs text-on-surface-variant">
            Titik lokasi Tempat Pembuangan Sampah (TPS) se-Kota Samarinda
          </p>
        </div>

        <div className="bg-primary text-on-primary rounded-2xl p-4 shadow-md">
          {!userLocation ? (
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold opacity-80 block">
                  Cari TPS Terdekat
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
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold opacity-80 block">
                TPS Terdekat Dari Lokasi Kamu
              </span>
              <p className="text-base font-bold mt-0.5">{nearestTps.nama}</p>
              <p className="text-xs opacity-90">
                {nearestTps.kecamatan} &middot; sekitar{' '}
                {nearestTps.distance < 1
                  ? `${Math.round(nearestTps.distance * 1000)} m`
                  : `${nearestTps.distance.toFixed(1)} km`}{' '}
                dari kamu
              </p>
            </div>
          ) : (
            <p className="text-xs">Nggak nemu titik TPS.</p>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {kecamatanList.map((k) => (
            <button
              key={k}
              onClick={() => setSelectedKecamatan(k)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedKecamatan === k
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {k}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="h-[400px] rounded-2xl bg-surface-container-low animate-pulse flex items-center justify-center">
            <p className="text-xs text-on-surface-variant">Memuat peta...</p>
          </div>
        ) : (
          <div className="h-[400px] rounded-2xl overflow-hidden shadow-sm border border-outline-variant/30">
            <TpsMap tpsList={filteredTps} userLocation={userLocation} nearestTpsId={nearestTps?.id} />
          </div>
        )}

        <p className="text-[11px] text-on-surface-variant text-center">
          Total {filteredTps.length} titik TPS{' '}
          {selectedKecamatan !== 'Semua' ? `di Kecamatan ${selectedKecamatan}` : 'se-Kota Samarinda'}
        </p>
      </main>
    </div>
  );
}