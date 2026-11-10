/**
 * Buat 10 akun pengawas, satu per kecamatan (notulensi DLH poin 5).
 *
 *   npm run db:seed-pengawas                    -> buat akun yang belum ada
 *   npm run db:seed-pengawas -- --reset-password -> buat password baru untuk akun pengawas yang sudah ada
 *
 * Password dibuat acak dan TIDAK ditampilkan di terminal maupun disimpan di repo.
 * Kredensial ditulis sekali ke file pengawas-kredensial.csv di folder proyek
 * (sudah masuk .gitignore). Bagikan ke tiap pengawas lewat jalur aman, lalu hapus file-nya.
 * Nama akun masih generik ("Pengawas <Kecamatan>"); pengawas bisa mengganti namanya di menu Profil.
 */
import 'dotenv/config';
import { randomInt } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const KECAMATAN = [
  'Samarinda Ulu',
  'Samarinda Ilir',
  'Sungai Pinang',
  'Samarinda Utara',
  'Samarinda Kota',
  'Sungai Kunjang',
  'Sambutan',
  'Palaran',
  'Loa Janan Ilir',
  'Samarinda Seberang',
];

const DOMAIN = 'dlh.samarindakota.go.id';
// Tanpa karakter yang mudah tertukar (0/O, 1/l/I)
const ALFABET = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const resetPassword = process.argv.includes('--reset-password');

function slug(teks) {
  return teks.toLowerCase().replace(/\s+/g, '-');
}

function buatPassword(panjang = 12) {
  let hasil = '';
  for (let i = 0; i < panjang; i++) hasil += ALFABET[randomInt(ALFABET.length)];
  return hasil;
}

const prisma = new PrismaClient();
const baris = [['kecamatan', 'email', 'password', 'keterangan']];

try {
  for (const kec of KECAMATAN) {
    const email = `pengawas.${slug(kec)}@${DOMAIN}`;
    const ada = await prisma.profile.findUnique({ where: { email } });

    if (ada && ada.role !== 'pengawas') {
      console.warn(`LEWATI ${email}: email sudah dipakai akun dengan role "${ada.role}".`);
      continue;
    }
    if (ada && !resetPassword) {
      console.log(`Sudah ada: ${email} (dilewati)`);
      continue;
    }

    const password = buatPassword();
    const hash = await bcrypt.hash(password, 10);

    if (ada) {
      await prisma.profile.update({ where: { id: ada.id }, data: { password: hash, kecamatan: kec } });
      baris.push([kec, email, password, 'password direset']);
      console.log(`Password direset: ${email}`);
    } else {
      await prisma.profile.create({
        data: {
          full_name: `Pengawas ${kec}`,
          email,
          password: hash,
          kecamatan: kec,
          role: 'pengawas',
        },
      });
      baris.push([kec, email, password, 'akun baru']);
      console.log(`Dibuat: ${email}`);
    }
  }

  if (baris.length > 1) {
    const berkas = new URL('../pengawas-kredensial.csv', import.meta.url);
    writeFileSync(berkas, baris.map((b) => b.join(',')).join('\n') + '\n', { mode: 0o600 });
    console.log(`\n${baris.length - 1} akun diproses. Kredensial ada di: pengawas-kredensial.csv`);
    console.log('File itu sudah di-gitignore. Bagikan ke pengawas, lalu HAPUS file-nya.');
  } else {
    console.log('\nTidak ada akun baru. Pakai --reset-password kalau perlu password baru.');
  }
} catch (error) {
  console.error('Seed pengawas gagal:', error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
