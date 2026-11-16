'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import type { TpsItem } from '@/components/map/TpsMap';
import { awalHariWita, formatWaktuWita } from '@/lib/waktu';

interface RiwayatItem {
  id: string;
  tps_nama: string;
  catatan: string | null;
  laporan_id: string | null;
  created_at: string;
}

export default function PengawasDashboardPage() {
  const { user } = useAuth();
  const kecamatan = user?.kecamatan ?? null;

  const [tpsList, setTpsList] = useState<TpsItem[]>([]);
  const [kebersihan, setKebersihan] = useState<Record<string, string>>({});
  const [riwayat, setRiwayat] = useState<RiwayatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let batal = false;
    (async () => {
      try {
        const [rTps, rBersih, rRiwayat] = await Promise.all([
          fetch('/api/tps'),
          fetch('/api/tps/kebersihan'),
          fetch('/api/pengawas/laporan-tps'),
        ]);
        const [dTps, dBersih, dRiwayat] = await Promise.all([
          rTps.json(),
          rBersih.json(),
          rRiwayat.json(),
        ]);
        if (batal) return;

        if (Array.isArray(dTps)) setTpsList(dTps);
        if (Array.isArray(dBersih)) {
          const peta: Record<string, string> = {};
          for (const r of dBersih as { tps_id: string; waktu: string }[]) peta[r.tps_id] = r.waktu;
          setKebersihan(peta);
        }
        if (Array.isArray(dRiwayat)) setRiwayat(dRiwayat);
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

  if (!kecamatan) {
    return (
      <div className="bg-error-container text-on-error-container rounded-2xl p-4 text-sm font-semibold">
        Akun ini belum punya kecamatan tugas. Hubungi admin DLH untuk mengaturnya.
      </div>
    );
  }

  const kartu = [
    { label: 'Total TPS di wilayahmu', nilai: tpsWilayah.length, icon: 'location_on', cls: 'bg-primary/10 text-primary' },
    { label: 'Sudah bersih hari ini', nilai: jumlahBersih, icon: 'task_alt', cls: 'bg-emerald-100 text-emerald-700' },
    { label: 'Belum dilaporkan hari ini', nilai: belumHariIni.length, icon: 'pending_actions', cls: 'bg-amber-100 text-amber-700' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-on-surface">Halo, {user?.full_name}</h1>
          <p className="text-xs text-on-surface-variant">
            Monitoring kebersihan TPS wilayah Kecamatan {kecamatan} hari ini.
          </p>
        </div>
        <Link
          href="/pengawas/lapor"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs hover:bg-primary/90 active:scale-95 transition-all shadow-sm self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">add_a_photo</span>
          Lapor Pembersihan TPS
        </Link>
      </div>

      {error && (
        <div className="bg-error-container text-on-error-container rounded-xl p-3 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* 3 Kartu Ringkasan Wilayah Pengawas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {kartu.map((k) => (
          <div
            key={k.label}
            className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 shadow-2xs flex items-center gap-3"
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${k.cls}`}>
              <span className="material-symbols-outlined text-[24px]">{k.icon}</span>
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold text-on-surface leading-none">{loading ? '–' : k.nilai}</p>
              <p className="text-[11px] text-on-surface-variant mt-1 leading-tight">{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* TPS yang belum dilaporkan bersih hari ini */}
        <section className="space-y-3 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-amber-600">pending_actions</span>
                TPS Belum Dilaporkan Hari Ini
              </h2>
              <p className="text-[11px] text-on-surface-variant">Patroli rutin harian untuk memastikan TPS bersih.</p>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              {belumHariIni.length} TPS
            </span>
          </div>

          {loading ? (
            <div className="h-24 rounded-2xl bg-surface-container-low animate-pulse" />
          ) : belumHariIni.length === 0 ? (
            <p className="text-xs text-emerald-700 bg-emerald-50 rounded-xl p-4 text-center font-semibold">
              Semua TPS di kecamatanmu sudah dilaporkan bersih hari ini. Kerja bagus!
            </p>
          ) : (
            <ul className="space-y-2 max-h-[30rem] overflow-y-auto pr-1">
              {belumHariIni.map((t) => (
                <li
                  key={t.id}
                  className="bg-surface-container-low border border-outline-variant/20 rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-3 hover:bg-surface-container transition-colors"
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
                    className="shrink-0 px-3 py-1.5 bg-primary text-on-primary rounded-lg text-[11px] font-bold hover:bg-primary/90 transition-all"
                  >
                    Lapor Bersih
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Laporan Terakhir Pengawas */}
        <section className="space-y-3 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-primary">history</span>
              Riwayat Laporan Saya
            </h2>
            <Link href="/pengawas/lapor" className="text-xs font-bold text-primary hover:underline">
              + Buat baru
            </Link>
          </div>
          {loading ? (
            <div className="h-24 rounded-2xl bg-surface-container-low animate-pulse" />
          ) : riwayat.length === 0 ? (
            <p className="text-xs text-on-surface-variant bg-surface-container-low rounded-xl p-4 text-center">
              Belum ada riwayat laporan pembersihan TPS dari akun ini.
            </p>
          ) : (
            <ul className="space-y-2 max-h-[30rem] overflow-y-auto pr-1">
              {riwayat.map((r) => (
                <li
                  key={r.id}
                  className="bg-surface-container-low rounded-xl px-3.5 py-2.5 text-xs border border-outline-variant/20"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-on-surface break-words">{r.tps_nama}</p>
                    <span className="text-[10px] font-semibold text-on-surface-variant shrink-0">
                      {formatWaktuWita(r.created_at)}
                    </span>
                  </div>
                  {r.catatan && (
                    <p className="text-on-surface-variant mt-1 text-[11px] bg-surface-container-lowest/70 p-2 rounded-lg">
                      {r.catatan}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
