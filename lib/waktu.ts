/**
 * Helper tanggal/jam zona WITA (Asia/Makassar, UTC+8).
 * Server (Vercel dll) biasanya berjalan di UTC, jadi "hari ini" tidak boleh
 * diambil dari new Date().getDate() mentah — bisa meleset sehari antara 00:00-08:00 WITA.
 */
export const ZONA_WITA = 'Asia/Makassar';

/** Tanggal hari ini di WITA, format 'YYYY-MM-DD'. */
export function hariIniWita(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_WITA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** 'YYYY-MM-DD' (yang benar-benar ada di kalender) -> Date tengah malam UTC. Selain itu null. */
export function parseTanggal(s: unknown): Date | null {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    return null;
  }
  return date;
}

/** Rentang [gte, lt) satu bulan yang memuat tanggal 'YYYY-MM-DD'. */
export function rentangBulan(tanggal: string): { gte: Date; lt: Date } {
  const [y, m] = tanggal.split('-').map(Number);
  return { gte: new Date(Date.UTC(y, m - 1, 1)), lt: new Date(Date.UTC(y, m, 1)) };
}

/** Awal hari ini di WITA sebagai Date (UTC instant), untuk filter created_at "hari ini". */
export function awalHariWita(now: Date = new Date()): Date {
  const tgl = parseTanggal(hariIniWita(now))!;
  // 00:00 WITA = 16:00 UTC hari sebelumnya
  return new Date(tgl.getTime() - 8 * 60 * 60 * 1000);
}

/** Awal hari 'YYYY-MM-DD' di WITA sebagai Date (UTC instant), digeser hariTambah hari. Tanggal tidak valid -> null. */
export function awalHariWitaDari(tanggal: string, hariTambah = 0): Date | null {
  const t = parseTanggal(tanggal);
  if (!t) return null;
  return new Date(t.getTime() + hariTambah * 86_400_000 - 8 * 60 * 60 * 1000);
}

/** Contoh: "08 Nov 2026, 14.05 WITA" */
export function formatWaktuWita(value: Date | string): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '-';
  const tgl = new Intl.DateTimeFormat('id-ID', {
    timeZone: ZONA_WITA,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
  const jam = new Intl.DateTimeFormat('id-ID', {
    timeZone: ZONA_WITA,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
  return `${tgl}, ${jam} WITA`;
}

/** Hanya tanggal, contoh "08 Nov 2026". */
export function formatTanggalWita(value: Date | string): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: ZONA_WITA,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
}
