export interface ReportItem {
  id: string;
  user_id?: string;
  user_name: string;
  user_avatar?: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  kecamatan: string;
  kelurahan: string;
  foto_url: string;
  status: 'Menunggu' | 'Armada Dikirim' | 'Selesai/Dibersihkan';
  urgensi: 'Kritis' | 'Sedang' | 'Normal';
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

export const INITIAL_REPORTS: ReportItem[] = [
  {
    id: "rep-001",
    user_name: "Budi Santoso",
    user_avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    title: "Tumpukan Sampah Liar di Pinggir Jalan Antasari",
    description: "Terdapat penumpukan sampah plastik dan limbah rumah tangga dalam jumlah besar yang meluap ke badan jalan. Mengganggu pengguna jalan dan mengeluarkan bau tidak sedap.",
    latitude: -0.4912,
    longitude: 117.1365,
    kecamatan: "Samarinda Ulu",
    kelurahan: "Air Putih",
    foto_url: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80",
    status: "Menunggu",
    urgensi: "Kritis",
    created_at: "2026-08-09T08:30:00Z",
    updated_at: "2026-08-09T08:30:00Z"
  },
  {
    id: "rep-002",
    user_name: "Siti Rahmawati",
    user_avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    title: "Sampah Organik Pasar Sungai Dama Melimpah",
    description: "Sisa sayuran dan limbah basah di depan area TPS Pasar Sungai Dama menumpuk sejak kemarin sore.",
    latitude: -0.5085,
    longitude: 117.1642,
    kecamatan: "Samarinda Ilir",
    kelurahan: "Sungai Dama",
    foto_url: "https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&w=800&q=80",
    status: "Armada Dikirim",
    urgensi: "Kritis",
    created_at: "2026-08-09T07:15:00Z",
    updated_at: "2026-08-09T09:00:00Z",
    catatan_petugas: "Armada Truk DLH-04 sedang menuju lokasi untuk pembersihan massal."
  },
  {
    id: "rep-003",
    user_name: "Ahmad Rizky",
    user_avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80",
    title: "Pembersihan Drainase & Pohon Tumbang Damanhuri",
    description: "Sampah ranting dan limbah ranting memenuhi drainase di Jl. Damanhuri RT 18.",
    latitude: -0.4688,
    longitude: 117.1610,
    kecamatan: "Sungai Pinang",
    kelurahan: "Dadi Mulya",
    foto_url: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80",
    status: "Selesai/Dibersihkan",
    urgensi: "Normal",
    created_at: "2026-08-08T14:20:00Z",
    updated_at: "2026-08-09T10:00:00Z",
    catatan_petugas: "Pembersihan selesai dilaksanakan oleh Tim Kebersihan DLH Sektor Sungai Pinang."
  },
  {
    id: "rep-004",
    user_name: "Dewi Lestari",
    user_avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80",
    title: "TPS Liar di Sekitar Bandara Aji Pangeran Tumenggung",
    description: "Terdapat timbunan kantong plastik dan material konstruksi bekas yang dibuang sembarangan.",
    latitude: -0.4285,
    longitude: 117.1755,
    kecamatan: "Samarinda Utara",
    kelurahan: "Lempake",
    foto_url: "https://images.unsplash.com/photo-1528323273322-d81458248d40?auto=format&fit=crop&w=800&q=80",
    status: "Menunggu",
    urgensi: "Sedang",
    created_at: "2026-08-09T09:45:00Z",
    updated_at: "2026-08-09T09:45:00Z"
  },
  {
    id: "rep-005",
    user_name: "Hendra Wijaya",
    user_avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    title: "Penumpukan Sampah di Kawasan Pemukiman Loa Janan",
    description: "Kontainer tempat sampah penuh meluap ke badan jalan RT 05.",
    latitude: -0.5280,
    longitude: 117.1120,
    kecamatan: "Loa Janan Ilir",
    kelurahan: "Simpang Tiga",
    foto_url: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=800&q=80",
    status: "Armada Dikirim",
    urgensi: "Sedang",
    created_at: "2026-08-09T06:00:00Z",
    updated_at: "2026-08-09T08:15:00Z"
  }
];

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
