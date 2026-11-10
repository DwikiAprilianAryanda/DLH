'use client';

import { useMemo, useState } from 'react';
import type { ArmadaItem } from '@/lib/mock-data';
import { JENIS_ARMADA, KOSONG } from '@/lib/armada';

interface ArmadaPickerProps {
  armada: ArmadaItem[];
  /** id armada terpilih; '' = belum memilih */
  value: string;
  onChange: (id: string) => void;
}

/** Bagian rincian yang sudah terisi saja ("-" = belum ada datanya, tidak ditampilkan). */
function rincian(a: ArmadaItem): string {
  return [a.plat_nomor, a.nama_petugas, a.kecamatan_tugas].filter((v) => v && v !== KOSONG).join(' · ');
}

/**
 * Pemilih armada untuk disposisi: filter jenis + kotak cari + daftar bergulir.
 * Pengganti <select> tunggal yang terlalu panjang untuk 96 unit.
 */
export default function ArmadaPicker({ armada, value, onChange }: ArmadaPickerProps) {
  const [jenis, setJenis] = useState('Semua');
  const [q, setQ] = useState('');

  // Jenis yang benar-benar ada di data, urut sesuai daftar resmi; jenis tak dikenal ('-') jadi "Lainnya".
  const opsiJenis = useMemo(() => {
    const hitung = new Map<string, number>();
    for (const a of armada) {
      const j = a.jenis_armada && a.jenis_armada !== KOSONG ? a.jenis_armada : 'Lainnya';
      hitung.set(j, (hitung.get(j) ?? 0) + 1);
    }
    const urut = [...(JENIS_ARMADA as readonly string[]), 'Lainnya'];
    return urut.filter((j) => hitung.has(j)).map((j) => ({ nama: j, jumlah: hitung.get(j) as number }));
  }, [armada]);

  const tersaring = useMemo(() => {
    const kata = q.trim().toLowerCase();
    return armada.filter((a) => {
      const j = a.jenis_armada && a.jenis_armada !== KOSONG ? a.jenis_armada : 'Lainnya';
      if (jenis !== 'Semua' && j !== jenis) return false;
      if (!kata) return true;
      return [a.nama_armada, a.plat_nomor, a.nama_petugas, a.kecamatan_tugas]
        .join(' ')
        .toLowerCase()
        .includes(kata);
    });
  }, [armada, jenis, q]);

  const terpilih = armada.find((a) => a.id === value);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <select
          value={jenis}
          onChange={(e) => setJenis(e.target.value)}
          className="w-[42%] px-2.5 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
          aria-label="Filter jenis armada"
        >
          <option value="Semua">Semua jenis ({armada.length})</option>
          {opsiJenis.map((j) => (
            <option key={j.nama} value={j.nama}>
              {j.nama} ({j.jumlah})
            </option>
          ))}
        </select>
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[16px]">
            search
          </span>
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            maxLength={40}
            placeholder="Cari nama / plat / petugas"
            className="w-full pl-8 pr-2.5 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      <div className="max-h-48 overflow-y-auto rounded-xl border border-outline-variant/40 bg-surface-container-low divide-y divide-outline-variant/20">
        {tersaring.length === 0 ? (
          <p className="p-3 text-center text-[11px] text-on-surface-variant">Tidak ada armada yang cocok.</p>
        ) : (
          tersaring.map((a) => {
            const aktif = a.id === value;
            const perawatan = a.status === 'Perawatan';
            const detail = rincian(a);
            return (
              <button
                key={a.id}
                type="button"
                disabled={perawatan}
                onClick={() => onChange(a.id)}
                className={`w-full text-left px-3 py-2 flex items-center gap-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  aktif ? 'bg-primary/10' : 'hover:bg-surface-container'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[18px] shrink-0 ${
                    aktif ? 'text-primary' : 'text-on-surface-variant'
                  }`}
                >
                  {aktif ? 'radio_button_checked' : 'radio_button_unchecked'}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-bold text-on-surface truncate">{a.nama_armada}</span>
                  {detail && (
                    <span className="block text-[10px] text-on-surface-variant truncate">{detail}</span>
                  )}
                </span>
                {a.status === 'Bertugas' && (
                  <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    Sedang bertugas
                  </span>
                )}
                {perawatan && (
                  <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
                    Perawatan
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>

      <p className="text-[11px] text-on-surface-variant">
        {terpilih ? (
          <>
            Dipilih: <span className="font-bold text-on-surface">{terpilih.nama_armada}</span>
          </>
        ) : (
          'Belum ada armada dipilih.'
        )}
      </p>
    </div>
  );
}
