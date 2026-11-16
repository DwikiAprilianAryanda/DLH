import { LIMITS } from '@/lib/laporan-validation';

/**
 * Aturan laporan pengawas "TPS sudah dibersihkan" (notulensi DLH poin 4).
 * Dipakai di browser (form pengawas) dan server (API). Ubah angka di sini saja kalau
 * DLH minta batas lain.
 */

/** Pengawas harus berada paling jauh sekian meter dari titik TPS saat melapor. */
export const PENGAWAS_MAX_JARAK_METER = 100;

/** Laporan ulang untuk TPS yang sama oleh pengawas yang sama ditolak selama sekian menit (cegah dobel kirim). */
export const JEDA_LAPORAN_ULANG_MENIT = 5;

export const CATATAN_PENGAWAS_MAKS = 300;

export type FieldErrors = Record<string, string>;

export interface LaporanTpsInput {
  tps_id: string;
  foto_url: string;
  catatan: string | null;
  latitude: number;
  longitude: number;
  /** id laporan warga yang ditindaklanjuti (boleh kosong untuk patroli rutin) */
  laporan_id: string | null;
}

function clean(v: unknown): string {
  if (typeof v !== 'string') return '';
  return v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
}

/** Cek tanda file asli (JPEG / PNG / WEBP) dari data URL base64, bukan cuma percaya awalan "data:image/...". */
export function fotoDataUrlValid(dataUrl: string): boolean {
  const m = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!m) return false;

  // 32 karakter base64 pertama = 24 byte pertama file (atob ada di Node 16+ dan browser).
  let bin: string;
  try {
    bin = atob(m[2].slice(0, 32));
  } catch {
    return false;
  }
  const byte = (i: number) => bin.charCodeAt(i);

  if (m[1] === 'jpeg') return bin.length >= 3 && byte(0) === 0xff && byte(1) === 0xd8 && byte(2) === 0xff;
  if (m[1] === 'png') {
    return bin.length >= 4 && byte(0) === 0x89 && byte(1) === 0x50 && byte(2) === 0x4e && byte(3) === 0x47;
  }
  // webp: "RIFF" .... "WEBP"
  return bin.length >= 12 && bin.slice(0, 4) === 'RIFF' && bin.slice(8, 12) === 'WEBP';
}

export function validateLaporanTps(
  body: unknown
): { ok: true; data: LaporanTpsInput } | { ok: false; errors: FieldErrors } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, errors: { _form: 'Data laporan tidak valid.' } };
  }
  const b = body as Record<string, unknown>;
  const errors: FieldErrors = {};

  const tpsId = clean(b.tps_id);
  if (!tpsId || tpsId.length > 64) errors.tps_id = 'TPS belum dipilih.';

  let foto = '';
  if (typeof b.foto_url !== 'string' || !b.foto_url) {
    errors.foto_url = 'Foto TPS wajib diambil.';
  } else if (b.foto_url.length > LIMITS.dataUrlMaxLength) {
    errors.foto_url = 'Ukuran foto terlalu besar. Coba foto ulang.';
  } else if (!fotoDataUrlValid(b.foto_url)) {
    errors.foto_url = 'Foto harus berformat JPG, PNG, atau WEBP.';
  } else {
    foto = b.foto_url;
  }

  const catatan = clean(b.catatan);
  if (catatan.length > CATATAN_PENGAWAS_MAKS) {
    errors.catatan = `Catatan maksimal ${CATATAN_PENGAWAS_MAKS} karakter.`;
  }

  const lat = typeof b.latitude === 'number' ? b.latitude : NaN;
  const lng = typeof b.longitude === 'number' ? b.longitude : NaN;
  if (!Number.isFinite(lat) || lat < LIMITS.latitude.min || lat > LIMITS.latitude.max) {
    errors.latitude = 'Lokasi GPS belum terdeteksi. Aktifkan GPS lalu coba lagi.';
  }
  if (!Number.isFinite(lng) || lng < LIMITS.longitude.min || lng > LIMITS.longitude.max) {
    errors.longitude = 'Lokasi GPS belum terdeteksi. Aktifkan GPS lalu coba lagi.';
  }

  let laporanId: string | null = null;
  if (b.laporan_id !== undefined && b.laporan_id !== null && b.laporan_id !== '') {
    const v = clean(b.laporan_id);
    if (!v || v.length > 64) errors.laporan_id = 'Laporan warga yang dituju tidak valid.';
    else laporanId = v;
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    data: {
      tps_id: tpsId,
      foto_url: foto,
      catatan: catatan || null,
      latitude: lat,
      longitude: lng,
      laporan_id: laporanId,
    },
  };
}

/** 10 Akun Kredensial Resmi Pengawas Kecamatan DLH Samarinda */
export const DAFTAR_AKUN_PENGAWAS = [
  {
    kecamatan: 'Samarinda Ulu',
    email: 'pengawas.samarinda-ulu@dlh.samarindakota.go.id',
    password: '5BwAPKKNQmzk',
    id: 'pengawas-samarinda-ulu',
    full_name: 'Pengawas Samarinda Ulu',
  },
  {
    kecamatan: 'Samarinda Ilir',
    email: 'pengawas.samarinda-ilir@dlh.samarindakota.go.id',
    password: 'MSjEqyAYmUf7',
    id: 'pengawas-samarinda-ilir',
    full_name: 'Pengawas Samarinda Ilir',
  },
  {
    kecamatan: 'Sungai Pinang',
    email: 'pengawas.sungai-pinang@dlh.samarindakota.go.id',
    password: 'LV4XwtybGA2N',
    id: 'pengawas-sungai-pinang',
    full_name: 'Pengawas Sungai Pinang',
  },
  {
    kecamatan: 'Samarinda Utara',
    email: 'pengawas.samarinda-utara@dlh.samarindakota.go.id',
    password: 'GdjZPB7ubduv',
    id: 'pengawas-samarinda-utara',
    full_name: 'Pengawas Samarinda Utara',
  },
  {
    kecamatan: 'Samarinda Kota',
    email: 'pengawas.samarinda-kota@dlh.samarindakota.go.id',
    password: 'G4LEtZQYh3tK',
    id: 'pengawas-samarinda-kota',
    full_name: 'Pengawas Samarinda Kota',
  },
  {
    kecamatan: 'Sungai Kunjang',
    email: 'pengawas.sungai-kunjang@dlh.samarindakota.go.id',
    password: 'qjyJDbX9hRMw',
    id: 'pengawas-sungai-kunjang',
    full_name: 'Pengawas Sungai Kunjang',
  },
  {
    kecamatan: 'Sambutan',
    email: 'pengawas.sambutan@dlh.samarindakota.go.id',
    password: '9cQfc5WdukQ4',
    id: 'pengawas-sambutan',
    full_name: 'Pengawas Sambutan',
  },
  {
    kecamatan: 'Palaran',
    email: 'pengawas.palaran@dlh.samarindakota.go.id',
    password: '3uRMb3euXMCR',
    id: 'pengawas-palaran',
    full_name: 'Pengawas Palaran',
  },
  {
    kecamatan: 'Loa Janan Ilir',
    email: 'pengawas.loa-janan-ilir@dlh.samarindakota.go.id',
    password: 'SAvc6c9uMrSV',
    id: 'pengawas-loa-janan-ilir',
    full_name: 'Pengawas Loa Janan Ilir',
  },
  {
    kecamatan: 'Samarinda Seberang',
    email: 'pengawas.samarinda-seberang@dlh.samarindakota.go.id',
    password: 'StHmWtqNey3g',
    id: 'pengawas-samarinda-seberang',
    full_name: 'Pengawas Samarinda Seberang',
  },
] as const;

export function getPengawasByEmail(email: string) {
  const cleanEmail = email.trim().toLowerCase();
  return DAFTAR_AKUN_PENGAWAS.find((p) => p.email.toLowerCase() === cleanEmail);
}

export function getPengawasById(id: string) {
  return DAFTAR_AKUN_PENGAWAS.find((p) => p.id === id);
}

export interface LaporanPembersihanItem {
  id: string;
  tps_id: string;
  tps_nama: string;
  kecamatan: string;
  pengawas_id: string;
  pengawas_nama: string;
  foto_url: string;
  catatan: string | null;
  latitude: number | null;
  longitude: number | null;
  jarak_meter: number | null;
  laporan_id: string | null;
  created_at: string;
}

const globalForLaporanTps = globalThis as unknown as { fallbackLaporanTps?: LaporanPembersihanItem[] };
export const fallbackLaporanTps: LaporanPembersihanItem[] = globalForLaporanTps.fallbackLaporanTps ?? [];
if (process.env.NODE_ENV !== 'production') {
  globalForLaporanTps.fallbackLaporanTps = fallbackLaporanTps;
}
