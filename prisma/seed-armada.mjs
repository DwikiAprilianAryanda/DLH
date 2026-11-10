/**
 * Isi tabel armada dengan 96 unit dari SARANA_PRASARANA_2026.pdf.
 *
 *   npm run db:seed-armada                 -> tambah unit yang belum ada
 *   npm run db:seed-armada -- --hapus-demo -> sekalian hapus 30 armada contoh lama (arm-01 .. arm-30)
 *
 * Aman dijalankan berulang: baris yang sudah ada (id sama) TIDAK ditimpa, jadi data yang
 * sudah dilengkapi admin (plat, tahun, wilayah, dst) tidak hilang. Kalau admin menghapus
 * satu unit lalu script dijalankan lagi, unit itu muncul lagi.
 *
 * Logika penomoran sama dengan lib/armada-seed-data.ts (tidak bisa import TS dari sini).
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

const spec = JSON.parse(readFileSync(new URL('./armada-seed.json', import.meta.url), 'utf8'));
const hapusDemo = process.argv.includes('--hapus-demo');

function buatSeed() {
  const urutPerJenis = {};
  const hasil = [];
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

const prisma = new PrismaClient();

try {
  const semua = await prisma.armada.findMany({
    select: { id: true, nama_armada: true, jenis_armada: true },
  });

  // Armada contoh lama: id "arm-NN" (2 digit) dan belum punya jenis_armada.
  const demo = semua.filter((a) => /^arm-\d{2}$/.test(a.id) && a.jenis_armada === '-');
  if (demo.length > 0) {
    if (hapusDemo) {
      const res = await prisma.armada.deleteMany({ where: { id: { in: demo.map((a) => a.id) } } });
      console.log(`Armada contoh lama dihapus: ${res.count} baris.`);
    } else {
      console.log(
        `PERHATIAN: ada ${demo.length} armada contoh lama (arm-01 ...) di database.\n` +
          `Jalankan ulang dengan: npm run db:seed-armada -- --hapus-demo`
      );
    }
  }

  const seed = buatSeed();
  const res = await prisma.armada.createMany({ data: seed, skipDuplicates: true });
  const total = await prisma.armada.count();
  console.log(`Seed armada selesai: ${res.count} unit baru ditambahkan dari ${seed.length} baris PDF.`);
  console.log(`Total armada di database sekarang: ${total}.`);
} catch (error) {
  console.error('Seed armada gagal:', error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
