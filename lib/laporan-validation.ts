import { KECAMATAN_SAMARINDA } from '@/lib/mock-data';

/**
 * Batas input form laporan. Dipakai di DUA tempat:
 *  - browser (maxLength / min / max + pesan error langsung), dan
 *  - server (app/api/laporan/route.ts) sebagai penjaga yang sebenarnya.
 * Ubah angka di sini saja kalau DLH minta batas lain.
 */
export const LIMITS = {
  title: { min: 5, max: 100 },
  description: { min: 10, max: 1000 },
  kelurahan: { max: 60 },
  namaPemohon: { min: 3, max: 80 },
  institusi: { min: 3, max: 100 },
  jumlahPeserta: { min: 1, max: 1000 },
  // Kotak kasar Kalimantan Timur — cukup buat nolak koordinat ngawur (0,0 / 9999)
  latitude: { min: -2.5, max: 2.5 },
  longitude: { min: 113.5, max: 119 },
  tanggalMaxHariKeDepan: 365,
  fileMaxBytes: 5 * 1024 * 1024,
  // base64 ~ 4/3 ukuran file, kasih sedikit ruang
  dataUrlMaxLength: 7_300_000,
} as const;

export const URGENSI_VALUES = ['Kritis', 'Sedang', 'Normal'] as const;
export const JENIS_VALUES = ['Pengaduan', 'Gotong Royong'] as const;

export type LaporanFieldErrors = Record<string, string>;

export interface LaporanInput {
  jenis_laporan: (typeof JENIS_VALUES)[number];
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  kecamatan: string;
  kelurahan: string;
  foto_url: string | null;
  urgensi: (typeof URGENSI_VALUES)[number];
  tanggal_rencana: Date | null;
  jumlah_peserta: number | null;
  nama_pemohon: string | null;
  institusi: string | null;
  surat_permohonan_url: string | null;
}

/** Rapikan teks: buang karakter kontrol, spasi berlebih di ujung. */
function cleanText(v: unknown, keepNewlines = false): string {
  if (typeof v !== 'string') return '';
  const noCtrl = keepNewlines
    ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    : v.replace(/[\u0000-\u001F\u007F]/g, ' ');
  return noCtrl.trim();
}

function checkLength(
  errors: LaporanFieldErrors,
  key: string,
  label: string,
  value: string,
  min: number,
  max: number
) {
  if (value.length < min) {
    errors[key] = min === 1 ? `${label} wajib diisi.` : `${label} minimal ${min} karakter.`;
  } else if (value.length > max) {
    errors[key] = `${label} maksimal ${max} karakter.`;
  }
}

export function validateLaporan(
  body: any
): { ok: true; data: LaporanInput } | { ok: false; errors: LaporanFieldErrors } {
  const errors: LaporanFieldErrors = {};

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, errors: { _form: 'Data laporan tidak valid.' } };
  }

  const jenis = body.jenis_laporan ?? 'Pengaduan';
  if (!JENIS_VALUES.includes(jenis)) {
    errors.jenis_laporan = 'Jenis laporan tidak dikenal.';
  }
  const isGR = jenis === 'Gotong Royong';

  const title = cleanText(body.title);
  checkLength(errors, 'title', isGR ? 'Judul kegiatan' : 'Judul laporan', title, LIMITS.title.min, LIMITS.title.max);

  const description = cleanText(body.description, true);
  checkLength(
    errors,
    'description',
    isGR ? 'Alasan/tujuan kegiatan' : 'Deskripsi',
    description,
    LIMITS.description.min,
    LIMITS.description.max
  );

  const kecamatan = cleanText(body.kecamatan);
  if (!(KECAMATAN_SAMARINDA as readonly string[]).includes(kecamatan)) {
    errors.kecamatan = 'Kecamatan tidak valid.';
  }

  const kelurahan = cleanText(body.kelurahan) || 'Samarinda';
  if (kelurahan.length > LIMITS.kelurahan.max) {
    errors.kelurahan = `Kelurahan/RT maksimal ${LIMITS.kelurahan.max} karakter.`;
  }

  const lat = typeof body.latitude === 'number' ? body.latitude : NaN;
  const lng = typeof body.longitude === 'number' ? body.longitude : NaN;
  if (!Number.isFinite(lat) || lat < LIMITS.latitude.min || lat > LIMITS.latitude.max) {
    errors.latitude = 'Latitude tidak valid atau di luar wilayah Kalimantan Timur.';
  }
  if (!Number.isFinite(lng) || lng < LIMITS.longitude.min || lng > LIMITS.longitude.max) {
    errors.longitude = 'Longitude tidak valid atau di luar wilayah Kalimantan Timur.';
  }

  const urgensi = isGR ? 'Normal' : body.urgensi ?? 'Sedang';
  if (!URGENSI_VALUES.includes(urgensi)) {
    errors.urgensi = 'Tingkat urgensi tidak valid.';
  }

  // Foto: data URL gambar, atau https (foto bawaan untuk Gotong Royong)
  let foto: string | null = null;
  if (typeof body.foto_url === 'string' && body.foto_url) {
    const f = body.foto_url;
    if (/^data:image\/(jpeg|png|webp);base64,/.test(f)) {
      if (f.length > LIMITS.dataUrlMaxLength) errors.foto_url = 'Ukuran foto terlalu besar (maksimal 5MB).';
      else foto = f;
    } else if (/^https:\/\/[^\s]{1,480}$/.test(f)) {
      foto = f;
    } else {
      errors.foto_url = 'Foto harus berformat JPG, PNG, atau WEBP.';
    }
  } else if (!isGR) {
    errors.foto_url = 'Foto bukti sampah wajib diunggah.';
  }

  // Field khusus Gotong Royong
  let tanggal: Date | null = null;
  let peserta: number | null = null;
  let namaPemohon: string | null = null;
  let institusi: string | null = null;
  let surat: string | null = null;

  if (isGR) {
    // tanggal rencana
    const tglRaw = typeof body.tanggal_rencana === 'string' ? body.tanggal_rencana : '';
    const parsed = tglRaw ? new Date(tglRaw) : null;
    if (!parsed || Number.isNaN(parsed.getTime())) {
      errors.tanggal_rencana = 'Tanggal rencana wajib diisi dengan benar.';
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const maxDate = new Date(today);
      maxDate.setDate(maxDate.getDate() + LIMITS.tanggalMaxHariKeDepan);
      if (parsed < today) errors.tanggal_rencana = 'Tanggal rencana tidak boleh sebelum hari ini.';
      else if (parsed > maxDate) errors.tanggal_rencana = 'Tanggal rencana maksimal 1 tahun ke depan.';
      else tanggal = parsed;
    }

    // jumlah peserta: harus bilangan bulat dalam rentang wajar
    const n = body.jumlah_peserta;
    if (
      typeof n !== 'number' ||
      !Number.isInteger(n) ||
      n < LIMITS.jumlahPeserta.min ||
      n > LIMITS.jumlahPeserta.max
    ) {
      errors.jumlah_peserta = `Jumlah peserta harus bilangan bulat ${LIMITS.jumlahPeserta.min}–${LIMITS.jumlahPeserta.max}.`;
    } else {
      peserta = n;
    }

    namaPemohon = cleanText(body.nama_pemohon);
    checkLength(errors, 'nama_pemohon', 'Nama pemohon', namaPemohon, LIMITS.namaPemohon.min, LIMITS.namaPemohon.max);

    institusi = cleanText(body.institusi);
    checkLength(errors, 'institusi', 'Institusi/lembaga', institusi, LIMITS.institusi.min, LIMITS.institusi.max);

    const s = body.surat_permohonan_url;
    if (typeof s !== 'string' || !s) {
      errors.surat_permohonan_url = 'Surat permohonan (PDF) wajib diunggah.';
    } else if (!s.startsWith('data:application/pdf;base64,')) {
      errors.surat_permohonan_url = 'Surat permohonan harus berformat PDF.';
    } else if (s.length > LIMITS.dataUrlMaxLength) {
      errors.surat_permohonan_url = 'Ukuran surat terlalu besar (maksimal 5MB).';
    } else {
      surat = s;
    }
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: {
      jenis_laporan: jenis,
      title,
      description,
      latitude: lat,
      longitude: lng,
      kecamatan,
      kelurahan,
      foto_url: foto,
      urgensi,
      tanggal_rencana: tanggal,
      jumlah_peserta: peserta,
      nama_pemohon: namaPemohon,
      institusi,
      surat_permohonan_url: surat,
    },
  };
}