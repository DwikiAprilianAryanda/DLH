'use client';

import { useCallback, useEffect, useState } from 'react';
import { KECAMATAN_SAMARINDA } from '@/lib/mock-data';
import { formatWaktuWita } from '@/lib/waktu';
import { PENGAWAS_MAX_JARAK_METER } from '@/lib/pengawas';

interface LaporanTpsRow {
  id: string;
  tps_id: string;
  tps_nama: string;
  kecamatan: string;
  pengawas_nama: string;
  catatan: string | null;
  latitude: number | null;
  longitude: number | null;
  jarak_meter: number | null;
  laporan_id: string | null;
  laporan_judul: string | null;
  created_at: string;
}

const PER_HALAMAN = 50;

export default function AdminPembersihanTpsPage() {
  const [items, setItems] = useState<LaporanTpsRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const [kecamatan, setKecamatan] = useState('Semua');
  const [dari, setDari] = useState('');
  const [sampai, setSampai] = useState('');

  const [fotoId, setFotoId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LaporanTpsRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const buatQuery = useCallback(
    (offset: number) => {
      const p = new URLSearchParams({ limit: String(PER_HALAMAN), offset: String(offset) });
      if (kecamatan !== 'Semua') p.set('kecamatan', kecamatan);
      if (dari) p.set('dari', dari);
      if (sampai) p.set('sampai', sampai);
      return p.toString();
    },
    [kecamatan, dari, sampai]
  );

  const muat = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/laporan-tps?${buatQuery(0)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat laporan');
      setItems(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat laporan');
    } finally {
      setLoading(false);
    }
  }, [buatQuery]);

  useEffect(() => {
    muat();
  }, [muat]);

  const muatLagi = async () => {
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/admin/laporan-tps?${buatQuery(items.length)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat laporan');
      setItems((prev) => [...prev, ...data.items]);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat laporan');
    } finally {
      setLoadingMore(false);
    }
  };

  const hapus = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/laporan-tps/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Gagal menghapus laporan');
      }
      setItems((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setTotal((t) => Math.max(0, t - 1));
      setDeleteTarget(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus, coba lagi.');
    } finally {
      setIsDeleting(false);
    }
  };

  const inputCls =
    'px-3.5 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded-xl text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-on-surface">Laporan Pembersihan TPS</h1>
        <p className="text-xs text-on-surface-variant">
          Laporan pengawas kecamatan bahwa TPS sudah dibersihkan, lengkap dengan foto bukti, jam, dan tanggal.
          Total <span className="font-bold text-primary">{total}</span> laporan sesuai filter.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
            Kecamatan
          </label>
          <select value={kecamatan} onChange={(e) => setKecamatan(e.target.value)} className={inputCls}>
            <option value="Semua">Semua Kecamatan</option>
            {KECAMATAN_SAMARINDA.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
            Dari tanggal
          </label>
          <input type="date" value={dari} onChange={(e) => setDari(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
            Sampai tanggal
          </label>
          <input type="date" value={sampai} onChange={(e) => setSampai(e.target.value)} className={inputCls} />
        </div>
        {(kecamatan !== 'Semua' || dari || sampai) && (
          <button
            onClick={() => {
              setKecamatan('Semua');
              setDari('');
              setSampai('');
            }}
            className="px-3.5 py-2 text-xs font-bold text-primary hover:underline"
          >
            Reset filter
          </button>
        )}
      </div>

      {error && (
        <div className="bg-error-container text-on-error-container rounded-xl p-3 text-xs font-semibold">
          {error}
        </div>
      )}

      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container-low text-on-surface-variant uppercase tracking-wider font-bold border-b border-outline-variant/30">
              <tr>
                <th className="py-3.5 px-4">Waktu</th>
                <th className="py-3.5 px-4">TPS</th>
                <th className="py-3.5 px-4">Kecamatan</th>
                <th className="py-3.5 px-4">Pengawas</th>
                <th className="py-3.5 px-4">Jarak ke TPS</th>
                <th className="py-3.5 px-4">Catatan</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 font-medium text-on-surface">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-on-surface-variant">
                    Memuat data...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-on-surface-variant">
                    Belum ada laporan pembersihan.
                  </td>
                </tr>
              ) : (
                items.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-container-low/50 transition-colors align-top">
                    <td className="py-3 px-4 whitespace-nowrap">{formatWaktuWita(r.created_at)}</td>
                    <td className="py-3 px-4 break-words max-w-[220px]">
                      <span className="font-bold">{r.tps_nama}</span>
                      {r.laporan_id && (
                        <span className="mt-1 flex items-start gap-1 text-[10px] font-semibold text-primary">
                          <span className="material-symbols-outlined text-[13px] shrink-0">link</span>
                          <span className="break-words min-w-0">
                            Tindak lanjut laporan warga:{' '}
                            {r.laporan_judul ?? '(laporan sudah dihapus)'}
                          </span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-on-surface-variant whitespace-nowrap">{r.kecamatan}</td>
                    <td className="py-3 px-4 break-words max-w-[160px]">{r.pengawas_nama}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {r.jarak_meter === null ? (
                        '-'
                      ) : (
                        <span
                          className={
                            r.jarak_meter > PENGAWAS_MAX_JARAK_METER ? 'text-error font-bold' : undefined
                          }
                        >
                          {Math.round(r.jarak_meter)} m
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-on-surface-variant break-words max-w-[240px]">
                      {r.catatan || '-'}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setFotoId(r.id)}
                          className="px-3 py-1.5 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary/90 transition-all flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">image</span>
                          Foto
                        </button>
                        <button
                          onClick={() => setDeleteTarget(r)}
                          className="w-8 h-8 rounded-xl bg-error-container text-on-error-container flex items-center justify-center hover:opacity-80 transition-opacity"
                          title="Hapus"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && items.length < total && (
        <div className="text-center">
          <button
            onClick={muatLagi}
            disabled={loadingMore}
            className="px-5 py-2.5 bg-surface-container-lowest border border-outline-variant/40 text-on-surface text-xs font-bold rounded-xl hover:bg-surface-container transition-all disabled:opacity-50"
          >
            {loadingMore ? 'Memuat...' : `Muat lebih banyak (${items.length} dari ${total})`}
          </button>
        </div>
      )}

      {/* Foto bukti */}
      {fotoId && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setFotoId(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-surface-container-lowest rounded-3xl p-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setFotoId(null)}
              className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-surface-container-lowest border border-outline-variant/40 shadow flex items-center justify-center text-on-surface-variant"
              aria-label="Tutup"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/admin/laporan-tps/${fotoId}/foto`}
              alt="Foto bukti TPS dibersihkan"
              className="w-full max-h-[80vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}

      {/* Konfirmasi hapus */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-surface-container-lowest rounded-3xl p-6 shadow-2xl space-y-4 border border-outline-variant/30 text-center">
            <div className="w-14 h-14 rounded-full bg-error-container text-on-error-container mx-auto flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">delete</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-on-surface">Hapus Laporan Ini?</h3>
              <p className="text-xs text-on-surface-variant mt-1 break-words">
                Laporan <span className="font-bold">{deleteTarget.tps_nama}</span> ({formatWaktuWita(deleteTarget.created_at)}) akan
                dihapus permanen. Status kebersihan TPS di peta ikut menyesuaikan.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 bg-surface-container text-on-surface-variant font-bold text-xs rounded-xl hover:bg-surface-container-high"
              >
                Batal
              </button>
              <button
                onClick={hapus}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-error text-on-error font-bold text-xs rounded-xl hover:opacity-90 shadow-md disabled:opacity-50"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
