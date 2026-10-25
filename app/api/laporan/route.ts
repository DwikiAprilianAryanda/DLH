import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { INITIAL_REPORTS } from '@/lib/mock-data';
import { getCurrentUserFromToken } from '@/lib/auth';
import { validateLaporan } from '@/lib/laporan-validation';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const laporan = await prisma.laporanSampah.findMany({
      orderBy: { created_at: 'desc' },
    });
    return NextResponse.json(laporan && laporan.length > 0 ? laporan : INITIAL_REPORTS);
  } catch (error) {
    console.error('Gagal ambil data laporan (database offline), fallback ke INITIAL_REPORTS:', error);
    return NextResponse.json(INITIAL_REPORTS);
  }
}

export async function POST(request: Request) {
  try {
    // 1. Harus login — identitas pelapor diambil dari token, BUKAN dari body
    const currentUser = getCurrentUserFromToken();
    if (!currentUser) {
      return NextResponse.json({ error: 'Silakan login terlebih dahulu untuk mengirim laporan.' }, { status: 401 });
    }

    // 2. Body harus JSON valid
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Format data tidak valid.' }, { status: 400 });
    }

    // 3. Validasi + batas panjang/rentang semua field
    const result = validateLaporan(body);
    if (!result.ok) {
      const first = Object.values(result.errors)[0];
      return NextResponse.json({ error: first, fields: result.errors }, { status: 400 });
    }
    const d = result.data;
    const isGotongRoyong = d.jenis_laporan === 'Gotong Royong';

    const profile = await prisma.profile.findUnique({
      where: { id: currentUser.id },
      select: { id: true, full_name: true },
    });
    if (!profile) {
      return NextResponse.json({ error: 'Akun tidak ditemukan, silakan login ulang.' }, { status: 401 });
    }

    const laporan = await prisma.laporanSampah.create({
      data: {
        user_id: profile.id,
        user_name: profile.full_name,
        jenis_laporan: d.jenis_laporan,
        title: d.title,
        description: d.description,
        latitude: d.latitude,
        longitude: d.longitude,
        kecamatan: d.kecamatan,
        kelurahan: d.kelurahan,
        foto_url: d.foto_url,
        urgensi: d.urgensi,
        tanggal_rencana: d.tanggal_rencana,
        jumlah_peserta: d.jumlah_peserta,
        nama_pemohon: d.nama_pemohon,
        institusi: d.institusi,
        surat_permohonan_url: d.surat_permohonan_url,
        status: isGotongRoyong ? 'Menunggu Persetujuan' : 'Belum Ditangani',
      },
    });

    const notifPesan = isGotongRoyong
      ? `Permohonan gotong royong "${laporan.title}" telah diajukan dan menunggu persetujuan DLH.`
      : `Laporan "${laporan.title}" di ${laporan.kecamatan} telah terdaftar dan menunggu verifikasi petugas DLH.`;

    await prisma.notifikasi.create({
      data: {
        user_id: profile.id,
        judul: isGotongRoyong ? 'Permohonan Gotong Royong Terkirim' : 'Laporan Berhasil Dibuat',
        pesan: notifPesan,
      },
    });

    return NextResponse.json(laporan);
  } catch (error) {
    // Detail error hanya di log server, user cukup dapat pesan umum
    console.error('Gagal kirim laporan:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan di server saat menyimpan laporan. Coba lagi beberapa saat.' },
      { status: 500 }
    );
  }
}