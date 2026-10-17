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

export const INITIAL_ARMADA: ArmadaItem[] = [
  { id: "arm-01", nama_armada: "Truk Compactor DLH 01", plat_nomor: "KT 8123 BA", nama_petugas: "Pak Supriadi", telepon: "0812-5544-3321", status: "Bertugas", kecamatan_tugas: "Samarinda Ulu" },
  { id: "arm-02", nama_armada: "Truk Compactor DLH 02", plat_nomor: "KT 8124 BA", nama_petugas: "Pak Agus Hermawan", telepon: "0812-5544-3322", status: "Bertugas", kecamatan_tugas: "Samarinda Ulu" },
  { id: "arm-03", nama_armada: "Truk Compactor DLH 03", plat_nomor: "KT 8125 BA", nama_petugas: "Pak Wahyu Hidayat", telepon: "0812-5544-3323", status: "Tersedia", kecamatan_tugas: "Samarinda Ilir" },
  { id: "arm-04", nama_armada: "Truk Compactor DLH 04", plat_nomor: "KT 8456 BA", nama_petugas: "Pak Bambang Hermanto", telepon: "0813-4422-9900", status: "Bertugas", kecamatan_tugas: "Samarinda Ilir" },
  { id: "arm-05", nama_armada: "Truk Compactor DLH 05", plat_nomor: "KT 8457 BA", nama_petugas: "Pak Dedi Setiawan", telepon: "0813-4422-9901", status: "Bertugas", kecamatan_tugas: "Sungai Pinang" },
  { id: "arm-06", nama_armada: "Truk Compactor DLH 06", plat_nomor: "KT 8458 BA", nama_petugas: "Pak Hendra Wijaya", telepon: "0813-4422-9902", status: "Tersedia", kecamatan_tugas: "Sungai Pinang" },
  { id: "arm-07", nama_armada: "Truk Compactor DLH 07", plat_nomor: "KT 8459 BA", nama_petugas: "Pak Arif Rahman", telepon: "0813-4422-9903", status: "Bertugas", kecamatan_tugas: "Samarinda Utara" },
  { id: "arm-08", nama_armada: "Truk Compactor DLH 08", plat_nomor: "KT 8460 BA", nama_petugas: "Pak Eko Prasetyo", telepon: "0813-4422-9904", status: "Bertugas", kecamatan_tugas: "Samarinda Utara" },
  { id: "arm-09", nama_armada: "Truk Compactor DLH 09", plat_nomor: "KT 8461 BA", nama_petugas: "Pak Surya Dinata", telepon: "0813-4422-9905", status: "Tersedia", kecamatan_tugas: "Samarinda Kota" },
  { id: "arm-10", nama_armada: "Truk Compactor DLH 10", plat_nomor: "KT 8462 BA", nama_petugas: "Pak Rudi Hartono", telepon: "0813-4422-9906", status: "Bertugas", kecamatan_tugas: "Samarinda Kota" },
  { id: "arm-11", nama_armada: "Truk Compactor DLH 11", plat_nomor: "KT 8463 BA", nama_petugas: "Pak Samsul Bahri", telepon: "0813-4422-9907", status: "Bertugas", kecamatan_tugas: "Sungai Kunjang" },
  { id: "arm-12", nama_armada: "Truk Compactor DLH 12", plat_nomor: "KT 8464 BA", nama_petugas: "Pak Ilham Saputra", telepon: "0813-4422-9908", status: "Bertugas", kecamatan_tugas: "Sungai Kunjang" },
  { id: "arm-13", nama_armada: "Truk Compactor DLH 13", plat_nomor: "KT 8465 BA", nama_petugas: "Pak Anton Sujarwo", telepon: "0813-4422-9909", status: "Tersedia", kecamatan_tugas: "Sambutan" },
  { id: "arm-14", nama_armada: "Truk Compactor DLH 14", plat_nomor: "KT 8466 BA", nama_petugas: "Pak Firman Utina", telepon: "0813-4422-9910", status: "Bertugas", kecamatan_tugas: "Palaran" },
  { id: "arm-15", nama_armada: "Truk Dump DLH 15", plat_nomor: "KT 8001 AA", nama_petugas: "Pak Joko Susilo", telepon: "0852-1122-3344", status: "Bertugas", kecamatan_tugas: "Samarinda Seberang" },
  { id: "arm-16", nama_armada: "Truk Dump DLH 16", plat_nomor: "KT 8002 AA", nama_petugas: "Pak Mansyur", telepon: "0852-1122-3345", status: "Tersedia", kecamatan_tugas: "Samarinda Seberang" },
  { id: "arm-17", nama_armada: "Truk Dump DLH 17", plat_nomor: "KT 8003 AA", nama_petugas: "Pak Ruslan Efendi", telepon: "0852-1122-3346", status: "Bertugas", kecamatan_tugas: "Loa Janan Ilir" },
  { id: "arm-18", nama_armada: "Truk Dump DLH 18", plat_nomor: "KT 8004 AA", nama_petugas: "Pak Yudi Pratama", telepon: "0852-1122-3347", status: "Bertugas", kecamatan_tugas: "Loa Janan Ilir" },
  { id: "arm-19", nama_armada: "Truk Dump DLH 19", plat_nomor: "KT 8005 AA", nama_petugas: "Pak Gunawan", telepon: "0852-1122-3348", status: "Perawatan", kecamatan_tugas: "Palaran" },
  { id: "arm-20", nama_armada: "Truk Dump DLH 20", plat_nomor: "KT 8006 AA", nama_petugas: "Pak Hariyanto", telepon: "0852-1122-3349", status: "Bertugas", kecamatan_tugas: "Sambutan" },
  { id: "arm-21", nama_armada: "Truk Dump DLH 21", plat_nomor: "KT 8007 AA", nama_petugas: "Pak Syahril", telepon: "0852-1122-3350", status: "Bertugas", kecamatan_tugas: "Sungai Pinang" },
  { id: "arm-22", nama_armada: "Truk Dump DLH 22", plat_nomor: "KT 8008 AA", nama_petugas: "Pak Deni Kurniawan", telepon: "0852-1122-3351", status: "Tersedia", kecamatan_tugas: "Samarinda Ulu" },
  { id: "arm-23", nama_armada: "Truk Dump DLH 23", plat_nomor: "KT 8009 AA", nama_petugas: "Pak Ridwan Hakim", telepon: "0852-1122-3352", status: "Bertugas", kecamatan_tugas: "Samarinda Ilir" },
  { id: "arm-24", nama_armada: "Truk Dump DLH 24", plat_nomor: "KT 8010 AA", nama_petugas: "Pak Taufik Hidayat", telepon: "0852-1122-3353", status: "Perawatan", kecamatan_tugas: "Samarinda Utara" },
  { id: "arm-25", nama_armada: "Pick-up Reaksi Cepat DLH 25", plat_nomor: "KT 8789 CA", nama_petugas: "Mas Rian", telepon: "0821-9988-7766", status: "Bertugas", kecamatan_tugas: "Samarinda Kota" },
  { id: "arm-26", nama_armada: "Pick-up Reaksi Cepat DLH 26", plat_nomor: "KT 8790 CA", nama_petugas: "Mas Bagus", telepon: "0821-9988-7767", status: "Bertugas", kecamatan_tugas: "Samarinda Ulu" },
  { id: "arm-27", nama_armada: "Pick-up Reaksi Cepat DLH 27", plat_nomor: "KT 8791 CA", nama_petugas: "Mas Dimas", telepon: "0821-9988-7768", status: "Tersedia", kecamatan_tugas: "Sungai Kunjang" },
  { id: "arm-28", nama_armada: "Pick-up Reaksi Cepat DLH 28", plat_nomor: "KT 8792 CA", nama_petugas: "Mas Andre", telepon: "0821-9988-7769", status: "Bertugas", kecamatan_tugas: "Sungai Pinang" },
  { id: "arm-29", nama_armada: "Pick-up Reaksi Cepat DLH 29", plat_nomor: "KT 8793 CA", nama_petugas: "Mas Rizky", telepon: "0821-9988-7770", status: "Tersedia", kecamatan_tugas: "Samarinda Seberang" },
  { id: "arm-30", nama_armada: "Pick-up Reaksi Cepat DLH 30", plat_nomor: "KT 8794 CA", nama_petugas: "Mas Ferry", telepon: "0821-9988-7771", status: "Bertugas", kecamatan_tugas: "Sambutan" }
];

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