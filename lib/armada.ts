import { KECAMATAN_SAMARINDA } from '@/lib/mock-data';
import { hariIniWita, parseTanggal } from '@/lib/waktu';

/**
 * Aturan data armada. Dipakai di browser (form admin) dan server (API) —
 * ubah di sini saja kalau DLH menambah jenis armada atau minta batas lain.
 */

/** Jenis armada sesuai SARANA_PRASARANA_2026.pdf. Tambah di sini kalau DLH punya jenis baru. */
export const JENIS_ARMADA = [
  'Arm Roll',
  'Dump Truck',
  'Truk Engkel',
  'Truck Tangki',
  'Pick Up',
  'Speed Boat',
  'Kapal Karisma',
  'Mobil Sweeper',
] as const;

export const STATUS_ARMADA = ['Tersedia', 'Bertugas', 'Perawatan'] as const;
export type StatusArmada = (typeof STATUS_ARMADA)[number];

/** Penanda "belum ada datanya, menunggu dari DLH". */
export const KOSONG = '-';

export const ARMADA_LIMITS = {
  nama: { min: 3, max: 80 },
  bagian: { max: 100 },
  plat: { min: 3, max: 20 },
  petugas: { max: 60 },
  telepon: { min: 6, max: 20 },
  tahun: { min: 1980 },
  ritase: { min: 0, max: 50 },
  ritaseCatatan: { max: 100 },
  ritaseMaksHariMundur: 400,
} as const;

export interface ArmadaInput {
  nama_armada: string;
  jenis_armada: string;
  bagian_pekerjaan: string;
  plat_nomor: string;
  tahun: string;
  kecamatan_tugas: string;
  nama_petugas: string;
  telepon: string;
  status: StatusArmada;
}

export type FieldErrors = Record<string, string>;

function clean(v: unknown): string {
  if (typeof v !== 'string') return '';
  return v
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Satu unit armada dianggap belum lengkap kalau salah satu field rincian masih '-'. */
export function armadaBelumLengkap(a: {
  plat_nomor: string;
  tahun?: string;
  kecamatan_tugas: string;
}): boolean {
  return a.plat_nomor === KOSONG || (a.tahun ?? KOSONG) === KOSONG || a.kecamatan_tugas === KOSONG;
}

/**
 * mode 'create': nama + jenis wajib, sisanya default '-' / 'Tersedia'.
 * mode 'update': hanya field yang dikirim yang diperiksa.
 */
export function validateArmada(
  body: unknown,
  mode: 'create' | 'update'
): { ok: true; data: Partial<ArmadaInput> } | { ok: false; errors: FieldErrors } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, errors: { _form: 'Data armada tidak valid.' } };
  }
  const b = body as Record<string, unknown>;
  const errors: FieldErrors = {};
  const data: Partial<ArmadaInput> = {};
  const ada = (k: string) => mode === 'create' || k in b;

  if (ada('nama_armada')) {
    const v = clean(b.nama_armada);
    if (v.length < ARMADA_LIMITS.nama.min) {
      errors.nama_armada = `Nama armada minimal ${ARMADA_LIMITS.nama.min} karakter.`;
    } else if (v.length > ARMADA_LIMITS.nama.max) {
      errors.nama_armada = `Nama armada maksimal ${ARMADA_LIMITS.nama.max} karakter.`;
    } else data.nama_armada = v;
  }

  if (ada('jenis_armada')) {
    const v = clean(b.jenis_armada);
    if (!(JENIS_ARMADA as readonly string[]).includes(v)) {
      errors.jenis_armada = 'Pilih jenis armada dari daftar.';
    } else data.jenis_armada = v;
  }

  if (ada('bagian_pekerjaan')) {
    const v = clean(b.bagian_pekerjaan) || KOSONG;
    if (v.length > ARMADA_LIMITS.bagian.max) {
      errors.bagian_pekerjaan = `Bagian pekerjaan maksimal ${ARMADA_LIMITS.bagian.max} karakter.`;
    } else data.bagian_pekerjaan = v;
  }

  if (ada('plat_nomor')) {
    const v = clean(b.plat_nomor).toUpperCase() || KOSONG;
    if (v !== KOSONG && !/^[A-Z0-9 ]+$/.test(v)) {
      errors.plat_nomor = 'Plat nomor hanya boleh huruf dan angka (contoh: KT 1234 AB), atau kosongkan.';
    } else if (v !== KOSONG && (v.length < ARMADA_LIMITS.plat.min || v.length > ARMADA_LIMITS.plat.max)) {
      errors.plat_nomor = `Plat nomor ${ARMADA_LIMITS.plat.min}-${ARMADA_LIMITS.plat.max} karakter.`;
    } else data.plat_nomor = v;
  }

  if (ada('tahun')) {
    const v = clean(b.tahun) || KOSONG;
    const tahunMaks = new Date().getFullYear() + 1;
    if (v !== KOSONG && (!/^\d{4}$/.test(v) || Number(v) < ARMADA_LIMITS.tahun.min || Number(v) > tahunMaks)) {
      errors.tahun = `Tahun harus 4 digit antara ${ARMADA_LIMITS.tahun.min} dan ${tahunMaks}, atau kosongkan.`;
    } else data.tahun = v;
  }

  if (ada('kecamatan_tugas')) {
    const v = clean(b.kecamatan_tugas) || KOSONG;
    if (v !== KOSONG && !(KECAMATAN_SAMARINDA as readonly string[]).includes(v)) {
      errors.kecamatan_tugas = 'Wilayah kerja harus salah satu kecamatan di Samarinda, atau kosongkan.';
    } else data.kecamatan_tugas = v;
  }

  if (ada('nama_petugas')) {
    const v = clean(b.nama_petugas) || KOSONG;
    if (v.length > ARMADA_LIMITS.petugas.max) {
      errors.nama_petugas = `Nama petugas maksimal ${ARMADA_LIMITS.petugas.max} karakter.`;
    } else data.nama_petugas = v;
  }

  if (ada('telepon')) {
    const v = clean(b.telepon) || KOSONG;
    if (v !== KOSONG && !/^[0-9+\-() ]+$/.test(v)) {
      errors.telepon = 'Nomor telepon hanya boleh angka, spasi, +, -, dan tanda kurung, atau kosongkan.';
    } else if (v !== KOSONG && (v.length < ARMADA_LIMITS.telepon.min || v.length > ARMADA_LIMITS.telepon.max)) {
      errors.telepon = `Nomor telepon ${ARMADA_LIMITS.telepon.min}-${ARMADA_LIMITS.telepon.max} karakter.`;
    } else data.telepon = v;
  }

  if (ada('status')) {
    const v = mode === 'create' && b.status === undefined ? 'Tersedia' : clean(b.status);
    if (!(STATUS_ARMADA as readonly string[]).includes(v)) {
      errors.status = 'Status harus Tersedia, Bertugas, atau Perawatan.';
    } else data.status = v as StatusArmada;
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, data };
}

export interface RitaseInput {
  tanggal: string; // 'YYYY-MM-DD'
  jumlah_trip: number;
  catatan: string | null;
}

/** Ritase = jumlah perjalanan pulang-pergi armada dalam satu hari. */
export function validateRitase(
  body: unknown
): { ok: true; data: RitaseInput } | { ok: false; errors: FieldErrors } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, errors: { _form: 'Data ritase tidak valid.' } };
  }
  const b = body as Record<string, unknown>;
  const errors: FieldErrors = {};

  const tanggal = typeof b.tanggal === 'string' ? b.tanggal : '';
  const parsed = parseTanggal(tanggal);
  const hariIni = hariIniWita();
  if (!parsed) {
    errors.tanggal = 'Tanggal tidak valid.';
  } else if (tanggal > hariIni) {
    errors.tanggal = 'Tanggal ritase tidak boleh di masa depan.';
  } else {
    const hariMundur = Math.round(
      ((parseTanggal(hariIni) as Date).getTime() - parsed.getTime()) / 86_400_000
    );
    if (hariMundur > ARMADA_LIMITS.ritaseMaksHariMundur) {
      errors.tanggal = 'Tanggal ritase terlalu lama.';
    }
  }

  const n = b.jumlah_trip;
  if (
    typeof n !== 'number' ||
    !Number.isInteger(n) ||
    n < ARMADA_LIMITS.ritase.min ||
    n > ARMADA_LIMITS.ritase.max
  ) {
    errors.jumlah_trip = `Jumlah ritase harus bilangan bulat ${ARMADA_LIMITS.ritase.min}-${ARMADA_LIMITS.ritase.max}.`;
  }

  const catatan = clean(b.catatan);
  if (catatan.length > ARMADA_LIMITS.ritaseCatatan.max) {
    errors.catatan = `Catatan maksimal ${ARMADA_LIMITS.ritaseCatatan.max} karakter.`;
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, data: { tanggal, jumlah_trip: n as number, catatan: catatan || null } };
}
