export interface ReportItem {
  id: string;
  user_id?: string;
  user_name: string;
  user_avatar?: string;
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
  created_at: string;
  updated_at: string;
  catatan_petugas?: string;
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


export const INITIAL_ARMADA: ArmadaItem[] = [
  {
    id: "arm-01",
    nama_armada: "Truk Compactor DLH 01",
    plat_nomor: "KT 8123 BA",
    nama_petugas: "Pak Supriadi",
    telepon: "0812-5544-3321",
    status: "Bertugas",
    kecamatan_tugas: "Samarinda Ulu"
  },
  {
    id: "arm-02",
    nama_armada: "Truk Compactor DLH 04",
    plat_nomor: "KT 8456 BA",
    nama_petugas: "Pak Bambang Hermanto",
    telepon: "0813-4422-9900",
    status: "Bertugas",
    kecamatan_tugas: "Samarinda Ilir"
  },
  {
    id: "arm-03",
    nama_armada: "Pick-up Kebersihan DLH 08",
    plat_nomor: "KT 8789 CA",
    nama_petugas: "Mas Rian",
    telepon: "0821-9988-7766",
    status: "Tersedia",
    kecamatan_tugas: "Sungai Pinang"
  },
  {
    id: "arm-04",
    nama_armada: "Truk Dump DLH 12",
    plat_nomor: "KT 8001 AA",
    nama_petugas: "Pak Joko Susilo",
    telepon: "0852-1122-3344",
    status: "Tersedia",
    kecamatan_tugas: "Samarinda Utara"
  }
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
