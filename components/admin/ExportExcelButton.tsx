'use client';

import { useEffect, useRef, useState } from 'react';
import { hariIniWita } from '@/lib/waktu';

interface ExportExcelButtonProps {
  /** Kecamatan terpilih di dashboard; 'Semua Kecamatan' = tanpa filter. */
  kecamatan?: string;
}

/** Geser tanggal 'YYYY-MM-DD' sebanyak n hari (murni kalender, tanpa zona waktu). */
function geserHari(tanggal: string, n: number): string {
  const [y, m, d] = tanggal.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/**
 * Tombol "Unduh Excel" + popover pilihan periode.
 * Rentang tanggal hanya berlaku untuk file Excel, bukan untuk grafik di dashboard.
 */
export default function ExportExcelButton({ kecamatan = 'Semua Kecamatan' }: ExportExcelButtonProps) {
  const [open, setOpen] = useState(false);
  const [dari, setDari] = useState('');
  const [sampai, setSampai] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);

  // Tutup popover kalau klik di luar atau tekan Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pilihCepat = (jenis: 'bulan' | '30hari' | 'semua') => {
    setError('');
    const hariIni = hariIniWita();
    if (jenis === 'semua') {
      setDari('');
      setSampai('');
    } else if (jenis === 'bulan') {
      setDari(`${hariIni.slice(0, 7)}-01`);
      setSampai(hariIni);
    } else {
      setDari(geserHari(hariIni, -29));
      setSampai(hariIni);
    }
  };

  const unduh = async () => {
    setError('');
    if (dari && sampai && dari > sampai) {
      setError('Tanggal "dari" harus sebelum atau sama dengan "sampai".');
      return;
    }

    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (kecamatan && kecamatan !== 'Semua Kecamatan') p.set('kecamatan', kecamatan);
      if (dari) p.set('dari', dari);
      if (sampai) p.set('sampai', sampai);

      const res = await fetch(`/api/admin/rekap/export?${p.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Gagal membuat file Excel.');
      }

      const blob = await res.blob();
      const nama =
        /filename="([^"]+)"/.exec(res.headers.get('Content-Disposition') || '')?.[1] || 'rekap-tropis.xlsx';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nama;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengunduh file.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full px-2.5 py-2 bg-surface-container-low border border-outline-variant/40 rounded-lg text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30';
  const chipCls =
    'px-2.5 py-1 rounded-full bg-surface-container text-[11px] font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors';

  return (
    <div ref={wrapRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="px-3.5 py-2 bg-primary text-on-primary text-xs font-bold rounded-xl hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-sm"
      >
        <span className="material-symbols-outlined text-[16px]">download</span>
        Unduh Excel
        <span className="material-symbols-outlined text-[16px]">{open ? 'expand_less' : 'expand_more'}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-30 w-72 max-w-[calc(100vw-2rem)] bg-surface-container-lowest border border-outline-variant/40 rounded-2xl shadow-xl p-4 space-y-3">
          <div>
            <p className="text-xs font-bold text-on-surface">Periode rekap Excel</p>
            <p className="text-[11px] text-on-surface-variant">
              Hanya berlaku untuk file yang diunduh, bukan untuk grafik. Kosongkan untuk semua data.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={() => pilihCepat('bulan')} className={chipCls}>
              Bulan ini
            </button>
            <button type="button" onClick={() => pilihCepat('30hari')} className={chipCls}>
              30 hari terakhir
            </button>
            <button type="button" onClick={() => pilihCepat('semua')} className={chipCls}>
              Semua data
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                Dari
              </label>
              <input type="date" value={dari} onChange={(e) => setDari(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                Sampai
              </label>
              <input type="date" value={sampai} onChange={(e) => setSampai(e.target.value)} className={inputCls} />
            </div>
          </div>

          <p className="text-[11px] text-on-surface-variant">
            Kecamatan:{' '}
            <span className="font-bold text-on-surface">
              {kecamatan === 'Semua Kecamatan' ? 'Semua' : kecamatan}
            </span>{' '}
            (mengikuti filter dashboard)
          </p>

          {error && <p className="text-[11px] text-error font-semibold">{error}</p>}

          <button
            type="button"
            onClick={unduh}
            disabled={loading}
            className="w-full py-2.5 bg-primary text-on-primary text-xs font-bold rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
          >
            <span className={`material-symbols-outlined text-[16px] ${loading ? 'animate-spin' : ''}`}>
              {loading ? 'progress_activity' : 'download'}
            </span>
            {loading ? 'Menyiapkan file...' : 'Unduh'}
          </button>
        </div>
      )}
    </div>
  );
}
