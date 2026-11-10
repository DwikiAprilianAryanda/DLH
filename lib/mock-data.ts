import { buildArmadaSeed } from '@/lib/armada-seed-data';

export interface ReportItem {
  id: string;
  user_id?: string;
  user_name: string;
  user_avatar?: string | null;
  jenis_laporan: 'Pengaduan' | 'Gotong Royong';
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  kecamatan: string;
  kelurahan: string;
  foto_url: string;
  status: 'Menunggu Persetujuan' | 'Ditolak' | 'Belum Ditangani' | 'Proses' | 'Ditangani';
  urgensi: 'Kritis' | 'Sedang' | 'Normal';
  tanggal_rencana?: string | null;
  jumlah_peserta?: number | null;
  nama_pemohon?: string | null;
  institusi?: string | null;
  surat_permohonan_url?: string | null;
  created_at: string;
  updated_at: string;
  catatan_petugas?: string | null;
  foto_bukti_petugas?: string | null;
}

export interface ArmadaItem {
  id: string;
  nama_armada: string;
  plat_nomor: string;
  nama_petugas: string;
  telepon: string;
  status: 'Tersedia' | 'Bertugas' | 'Perawatan';
  kecamatan_tugas: string;
  // Rincian armada (revisi DLH 2026). '-' = belum ada datanya.
  jenis_armada?: string;
  bagian_pekerjaan?: string;
  tahun?: string;
  // Ritase = jumlah perjalanan pulang-pergi. Diisi oleh GET /api/armada.
  ritase_hari_ini?: number;
  ritase_bulan_ini?: number;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  judul: string;
  pesan: string;
  dibaca: boolean;
  created_at: string;
  tipe: 'status_update' | 'info' | 'urgent';
}

export const INITIAL_REPORTS: ReportItem[] = [
  {
    id: 'rep-01',
    user_id: 'user-01',
    user_name: 'Budi Santoso',
    user_avatar: null,
    jenis_laporan: 'Pengaduan',
    title: 'Tumpukan Sampah Liar di Pinggir Jalan Juanda',
    description: 'Ada tumpukan sampah plastik dan limbah rumah tangga meluber ke bahu jalan dekat ruko.',
    latitude: -0.482753,
    longitude: 117.131994,
    kecamatan: 'Samarinda Ulu',
    kelurahan: 'Air Putih',
    foto_url: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=800&q=80',
    status: 'Belum Ditangani',
    urgensi: 'Kritis',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'rep-02',
    user_id: 'user-02',
    user_name: 'Siti Rahma',
    user_avatar: null,
    jenis_laporan: 'Pengaduan',
    title: 'Sampah Menumpuk di Sekitar Pasar Segiri',
    description: 'Sisa sayuran dan kantong sampah menumpuk di gang belakang pasar, aroma menyengat.',
    latitude: -0.49382,
    longitude: 117.14672,
    kecamatan: 'Samarinda Kota',
    kelurahan: 'Sidodadi',
    foto_url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80',
    status: 'Proses',
    urgensi: 'Sedang',
    catatan_petugas: 'Armada Truk DLH 04 sedang meluncur ke lokasi pasar.',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'rep-03',
    user_id: 'user-03',
    user_name: 'Ahmad Fauzi',
    user_avatar: null,
    jenis_laporan: 'Pengaduan',
    title: 'Limbah Ranting & Sampah Saluran Air Jl. Kesuma Bangsa',
    description: 'Pembersihan saluran drainase menghasilkan tumpukan sampah basah di trotoar.',
    latitude: -0.4912,
    longitude: 117.1365,
    kecamatan: 'Samarinda Ulu',
    kelurahan: 'Dadi Mulya',
    foto_url: 'https://images.unsplash.com/photo-1528323273322-d81458248d40?auto=format&fit=crop&w=800&q=80',
    status: 'Ditangani',
    urgensi: 'Normal',
    catatan_petugas: 'Pembersihan selesai dilaksanakan oleh tim regu oranye DLH.',
    foto_bukti_petugas: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    id: 'rep-04',
    user_id: 'user-04',
    user_name: 'Ketua RT 14 Sambutan',
    user_avatar: null,
    jenis_laporan: 'Gotong Royong',
    title: 'Kerja Bakti Kebersihan Lingkungan RT 14 Sambutan',
    description: 'Warga merencanakan aksi bersih lingkungan dan drainase pemukiman, memohon bantuan armada angkut sampah.',
    latitude: -0.5102,
    longitude: 117.1724,
    kecamatan: 'Sambutan',
    kelurahan: 'Sambutan',
    foto_url: 'https://images.unsplash.com/photo-1591193686104-fccc64bfa1e9?auto=format&fit=crop&w=800&q=80',
    status: 'Menunggu Persetujuan',
    urgensi: 'Normal',
    tanggal_rencana: new Date(Date.now() + 86400000 * 3).toISOString(),
    jumlah_peserta: 45,
    nama_pemohon: 'Pak Hendra (Ketua RT 14)',
    institusi: 'Paguyuban Warga RT 14 Kelurahan Sambutan',
    surat_permohonan_url: 'mock_surat.pdf',
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 8).toISOString(),
  }
];

// 96 unit dari SARANA_PRASARANA_2026.pdf (lihat prisma/armada-seed.json).
// Hanya dipakai sebagai cadangan kalau database tidak bisa dihubungi.
export const INITIAL_ARMADA: ArmadaItem[] = buildArmadaSeed();

export const INITIAL_NOTIFIKASI: NotificationItem[] = [
  {
    id: "notif-01",
    user_id: "user-current",
    judul: "Status Laporan Diperbarui!",
    pesan: "Laporan sampah Anda di Pasar Sungai Dama telah ditindaklanjuti. Armada Truk DLH-04 telah dikirim ke lokasi.",
    dibaca: false,
    created_at: "2026-08-09T09:00:00Z",
    tipe: "status_update"
  },
  {
    id: "notif-02",
    user_id: "user-current",
    judul: "Pembersihan Selesai",
    pesan: "Laporan lokasi drainase Damanhuri telah selesai dibersihkan oleh Petugas DLH.",
    dibaca: true,
    created_at: "2026-08-09T10:00:00Z",
    tipe: "info"
  }
];

export const KECAMATAN_SAMARINDA = [
  "Samarinda Ulu",
  "Samarinda Ilir",
  "Sungai Pinang",
  "Samarinda Utara",
  "Samarinda Kota",
  "Sungai Kunjang",
  "Sambutan",
  "Palaran",
  "Loa Janan Ilir",
  "Samarinda Seberang"
];