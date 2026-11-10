import spec from '@/prisma/armada-seed.json';

export interface ArmadaSeedRow {
  id: string;
  nama_armada: string;
  jenis_armada: string;
  bagian_pekerjaan: string;
  plat_nomor: string;
  tahun: string;
  nama_petugas: string;
  telepon: string;
  status: 'Tersedia';
  kecamatan_tugas: string;
}

/**
 * 96 unit armada DLH 2026 dari SARANA_PRASARANA_2026.pdf (lihat prisma/armada-seed.json).
 * Field yang belum ada datanya diisi '-' supaya kelihatan masih perlu dilengkapi.
 * Logika yang sama diduplikasi di prisma/seed-armada.mjs (script seed tidak bisa import TS).
 */
export function buildArmadaSeed(): ArmadaSeedRow[] {
  const urutPerJenis: Record<string, number> = {};
  const hasil: ArmadaSeedRow[] = [];
  let n = 0;

  for (const row of spec.rows) {
    for (let i = 0; i < row.jumlah; i++) {
      n += 1;
      urutPerJenis[row.jenis] = (urutPerJenis[row.jenis] ?? 0) + 1;
      hasil.push({
        id: `arm-${String(n).padStart(3, '0')}`,
        nama_armada: `${row.jenis} ${String(urutPerJenis[row.jenis]).padStart(2, '0')}`,
        jenis_armada: row.jenis,
        bagian_pekerjaan: row.bagian,
        plat_nomor: '-',
        tahun: '-',
        nama_petugas: '-',
        telepon: '-',
        status: 'Tersedia',
        kecamatan_tugas: '-',
      });
    }
  }
  return hasil;
}
