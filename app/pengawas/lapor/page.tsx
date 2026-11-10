'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import type { TpsItem } from '@/components/map/TpsMap';
import { haversineDistance } from '@/lib/geo';
import { kompresFoto } from '@/lib/gambar';
import { awalHariWita, formatWaktuWita } from '@/lib/waktu';
import { CATATAN_PENGAWAS_MAKS, PENGAWAS_MAX_JARAK_METER } from '@/lib/pengawas';

interface RiwayatItem {
  id: string;
  tps_id: string;
  tps_nama: string;
  kecamatan: string;
  catatan: string | null;
  jarak_meter: number | null;
  created_at: string;
}

type GpsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok'; lat: number; lng: number; akurasi: number }
  | { status: 'error'; pesan: string };

function LaporTpsIsi() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  // Dari dashboard: ?laporan=<id laporan warga>&tps=<id TPS terdekat>
  const laporanId = searchParams.get('laporan');
  const tpsParam = searchParams.get('tps');
  const autoDibuka = useRef(false);

  const [tpsList, setTpsList] = useState<TpsItem[]>([]);
  const [kebersihan, setKebersihan] = useState<Record<string, string>>({});
  const [riwayat, setRiwayat] = useState<RiwayatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');

  // Form lapor
  const [selected, setSelected] = useState<TpsItem | null>(null);
  const [foto, setFoto] = useState<string | null>(null);
  const [fotoError, setFotoError] = useState('');
  const [fotoMemproses, setFotoMemproses] = useState(false);
  const [catatan, setCatatan] = useState('');
  const [gps, setGps] = useState<GpsState>({ status: 'idle' });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const kecamatan = user?.kecamatan ?? null;

  const muatData = useCallback(async () => {
    try {
      const [resTps, resBersih, resRiwayat] = await Promise.all([
        fetch('/api/tps'),
        fetch('/api/tps/kebersihan'),
        fetch('/api/pengawas/laporan-tps'),
      ]);

      const dataTps = await resTps.json();
      if (Array.isArray(dataTps)) setTpsList(dataTps);

      const dataBersih = await resBersih.json();
      if (Array.isArray(dataBersih)) {
        const peta: Record<string, string> = {};
        for (const r of dataBersih as { tps_id: string; waktu: string }[]) peta[r.tps_id] = r.waktu;
        setKebersihan(peta);
      }

      if (resRiwayat.ok) {
        const dataRiwayat = await resRiwayat.json();
        if (Array.isArray(dataRiwayat)) setRiwayat(dataRiwayat);
      }
      setLoadError('');
    } catch (error) {
      console.error('Gagal memuat data pengawas:', error);
      setLoadError('Data gagal dimuat. Periksa koneksi lalu muat ulang halaman.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    muatData();
  }, [muatData]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const awalHari = useMemo(() => awalHariWita(), []);
  const bersihHariIni = (id: string) => {
    const w = kebersihan[id];
    return !!w && new Date(w) >= awalHari;
  };

  const tpsWilayah = useMemo(
    () => (kecamatan ? tpsList.filter((t) => t.kecamatan === kecamatan) : []),
    [tpsList, kecamatan]
  );

  const tpsTersaring = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tpsWilayah
      .filter((t) => !q || t.nama.toLowerCase().includes(q))
      .sort((a, b) => {
        const sa = bersihHariIni(a.id) ? 1 : 0;
        const sb = bersihHariIni(b.id) ? 1 : 0;
        return sa - sb || a.nama.localeCompare(b.nama);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tpsWilayah, search, kebersihan, awalHari]);

  const jumlahBersihHariIni = tpsWilayah.filter((t) => bersihHariIni(t.id)).length;

  const jarakMeter =
    selected && gps.status === 'ok'
      ? haversineDistance(gps.lat, gps.lng, selected.latitude, selected.longitude) * 1000
      : null;
  const dalamRadius = jarakMeter !== null && jarakMeter <= PENGAWAS_MAX_JARAK_METER;

  const mulaiGps = () => {
    if (!navigator.geolocation) {
      setGps({ status: 'error', pesan: 'Perangkat ini tidak mendukung GPS.' });
      return;
    }
    setGps({ status: 'loading' });
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setGps({
          status: 'ok',
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          akurasi: pos.coords.accuracy,
        }),
      (err) =>
        setGps({
          status: 'error',
          pesan:
            err.code === err.PERMISSION_DENIED
              ? 'Izin lokasi ditolak. Aktifkan izin lokasi untuk situs ini di pengaturan browser.'
              : 'Lokasi belum bisa dideteksi. Pastikan GPS menyala lalu coba lagi.',
        }),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  };

  const bukaForm = (tps: TpsItem) => {
    setSelected(tps);
    setFoto(null);
    setFotoError('');
    setCatatan('');
    setSubmitError('');
    mulaiGps();
  };

  // Datang dari daftar "Perlu dicek": langsung buka form untuk TPS terdekat dari laporan warga itu.
  useEffect(() => {
    if (autoDibuka.current || loading || !tpsParam) return;
    const tps = tpsWilayah.find((t) => t.id === tpsParam);
    if (tps) {
      autoDibuka.current = true;
      bukaForm(tps);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, tpsParam, tpsWilayah]);

  const tutupForm = () => {
    if (submitting) return;
    setSelected(null);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFotoError('');
    if (!file) return;
    setFotoMemproses(true);
    try {
      setFoto(await kompresFoto(file));
    } catch (err) {
      setFoto(null);
      setFotoError(err instanceof Error ? err.message : 'Foto gagal diproses.');
    } finally {
      setFotoMemproses(false);
      e.target.value = '';
    }
  };

  const kirim = async () => {
    if (!selected || submitting) return;
    setSubmitError('');

    if (!foto) {
      setSubmitError('Ambil foto TPS terlebih dahulu.');
      return;
    }
    if (gps.status !== 'ok') {
      setSubmitError('Lokasi GPS belum terdeteksi.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/pengawas/laporan-tps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tps_id: selected.id,
          foto_url: foto,
          catatan,
          latitude: gps.lat,
          longitude: gps.lng,
          laporan_id: laporanId || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = data.fields ? ` ${Object.values(data.fields as Record<string, string>).join(' ')}` : '';
        throw new Error(`${data.error || 'Gagal mengirim laporan.'}${detail}`);
      }

      setToast(`${selected.nama} tercatat sudah dibersihkan.`);
      setSelected(null);
      await muatData();
      // Selesai menindaklanjuti laporan warga: kembali ke dashboard supaya daftar "Perlu dicek" ikut diperbarui.
      if (laporanId) router.push('/pengawas');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Gagal mengirim laporan.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!kecamatan) {
    return (
      <div className="bg-error-container text-on-error-container rounded-2xl p-4 text-sm font-semibold">
        Akun ini belum punya kecamatan tugas. Hubungi admin DLH untuk mengaturnya.
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div>
        <h1 className="text-lg font-bold text-on-surface">Lapor TPS Dibersihkan</h1>
        <p className="text-xs text-on-surface-variant">
          Pilih TPS di Kecamatan {kecamatan} yang sudah dibersihkan, lalu kirim laporan dengan foto.
        </p>
      </div>

      {laporanId && (
        <div className="bg-primary/10 text-primary rounded-xl p-3 text-xs font-semibold flex items-start gap-2">
          <span className="material-symbols-outlined text-[18px] shrink-0">link</span>
          Kamu menindaklanjuti laporan warga. Laporan pembersihanmu akan tertaut ke laporan itu.
        </div>
      )}

      <div className="bg-primary text-on-primary rounded-2xl p-4 shadow-md flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] uppercase tracking-wider font-bold opacity-80 block">
            Dilaporkan bersih hari ini
          </span>
          <p className="text-2xl font-bold">
            {jumlahBersihHariIni}
            <span className="text-sm font-medium opacity-80"> / {tpsWilayah.length} TPS</span>
          </p>
        </div>
        <span className="material-symbols-outlined text-[40px] opacity-70">task_alt</span>
      </div>

      {loadError && (
        <div className="bg-error-container text-on-error-container rounded-xl p-3 text-xs font-semibold">
          {loadError}
        </div>
      )}

      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
          search
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama TPS..."
          maxLength={60}
          className="w-full pl-9 pr-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <section className="space-y-2.5">
        {loading ? (
          <div className="h-24 rounded-2xl bg-surface-container-low animate-pulse" />
        ) : tpsTersaring.length === 0 ? (
          <p className="text-center text-xs text-on-surface-variant py-8">
            {tpsWilayah.length === 0
              ? `Belum ada TPS terdaftar di Kecamatan ${kecamatan}.`
              : 'Tidak ada TPS dengan nama tersebut.'}
          </p>
        ) : (
          tpsTersaring.map((tps) => {
            const bersih = bersihHariIni(tps.id);
            const waktu = kebersihan[tps.id];
            return (
              <div
                key={tps.id}
                className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-2xs"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-on-surface truncate">{tps.nama}</p>
                  {bersih ? (
                    <p className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1 mt-0.5">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      Bersih · {formatWaktuWita(waktu)}
                    </p>
                  ) : (
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      {waktu
                        ? `Terakhir dibersihkan ${formatWaktuWita(waktu)}`
                        : 'Belum pernah dilaporkan bersih'}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => bukaForm(tps)}
                  className="shrink-0 px-3.5 py-2 bg-primary text-on-primary text-xs font-bold rounded-xl hover:bg-primary/90 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                  Lapor
                </button>
              </div>
            );
          })
        )}
      </section>

      <section className="space-y-2.5">
        <h2 className="text-sm font-bold text-on-surface flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[18px] text-primary">history</span>
          Riwayat laporan saya
        </h2>
        {riwayat.length === 0 ? (
          <p className="text-xs text-on-surface-variant">Belum ada laporan.</p>
        ) : (
          <ul className="space-y-2">
            {riwayat.map((r) => (
              <li
                key={r.id}
                className="bg-surface-container-low rounded-xl px-3.5 py-2.5 text-xs border border-outline-variant/20"
              >
                <p className="font-bold text-on-surface">{r.tps_nama}</p>
                <p className="text-on-surface-variant mt-0.5">{formatWaktuWita(r.created_at)}</p>
                {r.catatan && <p className="text-on-surface-variant mt-0.5 break-words">{r.catatan}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {toast && (
        <div className="fixed bottom-6 inset-x-4 z-50 max-w-lg mx-auto bg-emerald-700 text-white text-xs font-bold rounded-xl px-4 py-3 shadow-xl flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          {toast}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center">
          <div className="w-full max-w-lg bg-surface-container-lowest rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-outline-variant/30 max-h-[92vh] overflow-y-auto space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-on-surface break-words">{selected.nama}</h3>
                <p className="text-[11px] text-on-surface-variant">
                  {laporanId ? 'Tindak lanjut laporan warga' : 'Laporan TPS sudah dibersihkan'}
                </p>
              </div>
              <button
                onClick={tutupForm}
                disabled={submitting}
                className="w-8 h-8 shrink-0 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high disabled:opacity-50"
                aria-label="Tutup"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Lokasi GPS */}
            <div
              className={`rounded-xl p-3 text-xs font-semibold flex items-start gap-2 ${
                gps.status === 'ok' && dalamRadius
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : gps.status === 'loading' || gps.status === 'idle'
                  ? 'bg-surface-container-low text-on-surface-variant'
                  : 'bg-error-container text-on-error-container'
              }`}
            >
              <span className="material-symbols-outlined text-[18px] shrink-0">
                {gps.status === 'loading' ? 'progress_activity' : gps.status === 'ok' && dalamRadius ? 'my_location' : 'location_off'}
              </span>
              <div className="min-w-0 flex-1">
                {gps.status === 'loading' && <p>Mendeteksi lokasi kamu...</p>}
                {gps.status === 'error' && <p>{gps.pesan}</p>}
                {gps.status === 'ok' && jarakMeter !== null && (
                  <p>
                    {dalamRadius
                      ? `Lokasi sesuai: sekitar ${Math.round(jarakMeter)} m dari titik TPS.`
                      : `Kamu sekitar ${Math.round(jarakMeter)} m dari titik TPS. Dekati TPS sampai maksimal ${PENGAWAS_MAX_JARAK_METER} m, lalu cek lokasi ulang.`}
                  </p>
                )}
              </div>
              {(gps.status === 'error' || (gps.status === 'ok' && !dalamRadius)) && (
                <button
                  onClick={mulaiGps}
                  className="shrink-0 underline font-bold"
                >
                  Cek ulang
                </button>
              )}
            </div>

            {/* Foto */}
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Foto TPS setelah dibersihkan *
              </label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFile}
                className="hidden"
              />
              {foto ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={foto} alt="Foto TPS" className="w-full max-h-64 object-cover rounded-xl border border-outline-variant/30" />
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="absolute bottom-2 right-2 px-3 py-1.5 rounded-full bg-black/60 text-white text-[11px] font-bold"
                  >
                    Foto ulang
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={fotoMemproses}
                  className="w-full h-32 rounded-xl border-2 border-dashed border-outline-variant/60 flex flex-col items-center justify-center gap-1 text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-60"
                >
                  <span className={`material-symbols-outlined text-[32px] ${fotoMemproses ? 'animate-spin' : ''}`}>
                    {fotoMemproses ? 'progress_activity' : 'photo_camera'}
                  </span>
                  <span className="text-xs font-semibold">
                    {fotoMemproses ? 'Memproses foto...' : 'Ambil foto TPS'}
                  </span>
                </button>
              )}
              {fotoError && <p className="text-[11px] text-error font-semibold mt-1">{fotoError}</p>}
            </div>

            {/* Catatan */}
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Catatan (opsional)
              </label>
              <textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                maxLength={CATATAN_PENGAWAS_MAKS}
                rows={2}
                placeholder="Contoh: bak kontainer sudah dikosongkan, sekitar TPS disapu"
                className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
              <p className="text-[10px] text-on-surface-variant text-right">
                {catatan.length}/{CATATAN_PENGAWAS_MAKS}
              </p>
            </div>

            {submitError && (
              <p className="text-xs text-error font-semibold bg-error-container/30 p-2.5 rounded-xl break-words">
                {submitError}
              </p>
            )}

            <p className="text-[11px] text-on-surface-variant">
              Jam dan tanggal laporan dicatat otomatis oleh sistem saat kamu menekan kirim.
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={tutupForm}
                disabled={submitting}
                className="flex-1 py-3 bg-surface-container text-on-surface-variant font-bold text-xs rounded-xl hover:bg-surface-container-high disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={kirim}
                disabled={submitting || !foto || !dalamRadius}
                className="flex-1 py-3 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary/90 shadow-md disabled:opacity-50"
              >
                {submitting ? 'Mengirim...' : 'Kirim Laporan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// useSearchParams di Next 14 wajib dibungkus Suspense supaya build tidak gagal.
export default function LaporTpsPage() {
  return (
    <Suspense fallback={null}>
      <LaporTpsIsi />
    </Suspense>
  );
}
