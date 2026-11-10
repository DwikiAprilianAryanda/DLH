'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import type { TpsItem } from '@/components/map/TpsMap';
import { haversineDistance } from '@/lib/geo';
import { awalHariWita, formatWaktuWita } from '@/lib/waktu';

interface LaporanWarga {
  id: string;
  title: string;
  kelurahan: string | null;
  latitude: number;
  longitude: number;
  status: string;
  urgensi: string;
  created_at: string;
  ditindaklanjuti_pada: string | null;
}

interface RiwayatItem {
  id: string;
  tps_nama: string;
  catatan: string | null;
  laporan_id: string | null;
  created_at: string;
}

const URGENSI_CLS: Record<string, string> = {
  Kritis: 'bg-error-container text-on-error-container',
  Sedang: 'bg-amber-100 text-amber-800',
  Normal: 'bg-surface-container-high text-on-surface-variant',
};

export default function PengawasDashboardPage() {
  const { user } = useAuth();
  const kecamatan = user?.kecamatan ?? null;

  const [tpsList, setTpsList] = useState<TpsItem[]>([]);
  const [kebersihan, setKebersihan] = useState<Record<string, string>>({});
  const [riwayat, setRiwayat] = useState<RiwayatItem[]>([]);
  const [laporanWarga, setLaporanWarga] = useState<LaporanWarga[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let batal = false;
    (async () => {
      try {
        const [rTps, rBersih, rRiwayat, rWarga] = await Promise.all([
          fetch('/api/tps'),
          fetch('/api/tps/kebersihan'),
          fetch('/api/pengawas/laporan-tps'),
          fetch('/api/pengawas/laporan-warga'),
        ]);
        const [dTps, dBersih, dRiwayat, dWarga] = await Promise.all([
          rTps.json(),
          rBersih.json(),
          rRiwayat.json(),
          rWarga.json(),
        ]);
        if (batal) return;

        if (Array.isArray(dTps)) setTpsList(dTps);
        if (Array.isArray(dBersih)) {
          const peta: Record<string, string> = {};
          for (const r of dBersih as { tps_id: string; waktu: string }[]) peta[r.tps_id] = r.waktu;
          setKebersihan(peta);
        }
        if (Array.isArray(dRiwayat)) setRiwayat(dRiwayat);
        if (Array.isArray(dWarga)) setLaporanWarga(dWarga);
        setError('');
      } catch (e) {
        console.error('Gagal memuat dashboard pengawas:', e);
        if (!batal) setError('Data gagal dimuat. Periksa koneksi lalu muat ulang halaman.');
      } finally {
        if (!batal) setLoading(false);
      }
    })();
    return () => {
      batal = true;
    };
  }, []);

  const awalHari = useMemo(() => awalHariWita(), []);
  const bersihHariIni = (id: string) => {
    const w = kebersihan[id];
    return !!w && new Date(w) >= awalHari;
  };

  const tpsWilayah = useMemo(
    () => (kecamatan ? tpsList.filter((t) => t.kecamatan === kecamatan) : []),
    [tpsList, kecamatan]
  );
  const jumlahBersih = tpsWilayah.filter((t) => bersihHariIni(t.id)).length;
  const belumHariIni = tpsWilayah
    .filter((t) => !bersihHariIni(t.id))
    .sort((a, b) => a.nama.localeCompare(b.nama));

  // TPS terdekat dari tiap laporan warga (di antara TPS kecamatan ini)
  const perluDicek = useMemo(
    () =>
      laporanWarga.map((l) => {
        let terdekat: TpsItem | null = null;
        let jarak = Infinity;
        for (const t of tpsWilayah) {
          const j = haversineDistance(l.latitude, l.longitude, t.latitude, t.longitude) * 1000;
          if (j < jarak) {
            jarak = j;
            terdekat = t;
          }
        }
        return { laporan: l, tps: terdekat, jarak: terdekat ? jarak : null };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [laporanWarga, tpsWilayah]
  );
  const belumDitindak = perluDicek.filter((p) => !p.laporan.ditindaklanjuti_pada).length;

  if (!kecamatan) {
    return (
      <div className="bg-error-container text-on-error-container rounded-2xl p-4 text-sm font-semibold">
        Akun ini belum punya kecamatan tugas. Hubungi admin DLH untuk mengaturnya.
      </div>
    );
  }

  const kartu = [
    { label: 'TPS di wilayahmu', nilai: tpsWilayah.length, icon: 'location_on', cls: 'bg-primary/10 text-primary' },
    { label: 'Bersih hari ini', nilai: jumlahBersih, icon: 'task_alt', cls: 'bg-emerald-100 text-emerald-700' },
    { label: 'Belum dilaporkan hari ini', nilai: belumHariIni.length, icon: 'pending_actions', cls: 'bg-amber-100 text-amber-700' },
    { label: 'Laporan warga perlu dicek', nilai: belumDitindak, icon: 'campaign', cls: 'bg-error-container text-on-error-container' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-on-surface">Halo, {user?.full_name}</h1>
        <p className="text-xs text-on-surface-variant">
          Ringkasan tugas pengawas Kecamatan {kecamatan} hari ini.
        </p>
      </div>

      {error && (
        <div className="bg-error-container text-on-error-container rounded-xl p-3 text-xs font-semibold">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kartu.map((k) => (
          <div
            key={k.label}
            className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 shadow-2xs flex items-center gap-3"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${k.cls}`}>
              <span className="material-symbols-outlined text-[22px]">{k.icon}</span>
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold text-on-surface leading-none">{loading ? '–' : k.nilai}</p>
              <p className="text-[11px] text-on-surface-variant mt-1 leading-tight">{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* Perlu dicek: laporan warga di kecamatan (hanya baca) */}
        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-bold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-error">campaign</span>
              Perlu dicek: laporan warga
            </h2>
            <p className="text-[11px] text-on-surface-variant">
              Pengaduan warga di kecamatanmu yang belum selesai. Status laporan tetap diubah oleh admin DLH.
            </p>
          </div>

          {loading ? (
            <div className="h-24 rounded-2xl bg-surface-container-low animate-pulse" />
          ) : perluDicek.length === 0 ? (
            <p className="text-xs text-on-surface-variant bg-surface-container-low rounded-xl p-4 text-center">
              Tidak ada laporan warga yang perlu dicek.
            </p>
          ) : (
            <ul className="space-y-2.5 max-h-[34rem] overflow-y-auto pr-1">
              {perluDicek.map(({ laporan: l, tps, jarak }) => (
                <li
                  key={l.id}
                  className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-3.5 shadow-2xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-on-surface break-words min-w-0">{l.title}</p>
                    <span
                      className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        URGENSI_CLS[l.urgensi] ?? URGENSI_CLS.Normal
                      }`}
                    >
                      {l.urgensi}
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant break-words">
                    {l.kelurahan && l.kelurahan !== '-' ? `${l.kelurahan} · ` : ''}
                    {formatWaktuWita(l.created_at)} · {l.status}
                  </p>
                  {tps && jarak !== null && (
                    <p className="text-[11px] text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">near_me</span>
                      TPS terdekat: <span className="font-semibold text-on-surface">{tps.nama}</span> (±
                      {jarak < 1000 ? `${Math.round(jarak)} m` : `${(jarak / 1000).toFixed(1)} km`})
                    </p>
                  )}

                  {l.ditindaklanjuti_pada ? (
                    <p className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      Sudah kamu laporkan bersih · {formatWaktuWita(l.ditindaklanjuti_pada)}. Menunggu admin menutup laporan.
                    </p>
                  ) : (
                    <Link
                      href={`/pengawas/lapor?laporan=${encodeURIComponent(l.id)}${
                        tps ? `&tps=${encodeURIComponent(tps.id)}` : ''
                      }`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary text-on-primary text-xs font-bold rounded-xl hover:bg-primary/90 active:scale-95 transition-all"
                    >
                      <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                      Tindak lanjuti
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* TPS yang belum dilaporkan bersih hari ini */}
        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-bold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-amber-600">pending_actions</span>
              TPS belum dilaporkan hari ini
            </h2>
            <p className="text-[11px] text-on-surface-variant">Untuk patroli rutin, tanpa menunggu laporan warga.</p>
          </div>

          {loading ? (
            <div className="h-24 rounded-2xl bg-surface-container-low animate-pulse" />
          ) : belumHariIni.length === 0 ? (
            <p className="text-xs text-emerald-700 bg-emerald-50 rounded-xl p-4 text-center font-semibold">
              Semua TPS di kecamatanmu sudah dilaporkan bersih hari ini.
            </p>
          ) : (
            <ul className="space-y-2 max-h-[34rem] overflow-y-auto pr-1">
              {belumHariIni.map((t) => (
                <li
                  key={t.id}
                  className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-on-surface truncate">{t.nama}</p>
                    <p className="text-[10px] text-on-surface-variant">
                      {kebersihan[t.id]
                        ? `Terakhir dibersihkan ${formatWaktuWita(kebersihan[t.id])}`
                        : 'Belum pernah dilaporkan bersih'}
                    </p>
                  </div>
                  <Link
                    href={`/pengawas/lapor?tps=${encodeURIComponent(t.id)}`}
                    className="shrink-0 text-[11px] font-bold text-primary hover:underline"
                  >
                    Lapor
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-on-surface flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-primary">history</span>
            Laporan terakhir saya
          </h2>
          <Link href="/pengawas/lapor" className="text-xs font-bold text-primary hover:underline">
            Buat laporan
          </Link>
        </div>
        {riwayat.length === 0 ? (
          <p className="text-xs text-on-surface-variant">Belum ada laporan.</p>
        ) : (
          <ul className="grid sm:grid-cols-2 gap-2">
            {riwayat.slice(0, 6).map((r) => (
              <li
                key={r.id}
                className="bg-surface-container-low rounded-xl px-3.5 py-2.5 text-xs border border-outline-variant/20"
              >
                <p className="font-bold text-on-surface break-words">{r.tps_nama}</p>
                <p className="text-on-surface-variant mt-0.5">
                  {formatWaktuWita(r.created_at)}
                  {r.laporan_id ? ' · tindak lanjut laporan warga' : ' · patroli'}
                </p>
                {r.catatan && <p className="text-on-surface-variant mt-0.5 break-words">{r.catatan}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
