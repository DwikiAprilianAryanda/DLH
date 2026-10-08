import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const laporan = await prisma.laporanSampah.findMany({
      orderBy: { created_at: 'desc' },
    });
    return NextResponse.json(laporan);
  } catch (error) {
    console.error('Gagal ambil data laporan:', error);
    return NextResponse.json({ error: 'Gagal ambil data laporan' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const isGotongRoyong = body.jenis_laporan === 'Gotong Royong';

    const laporan = await prisma.laporanSampah.create({
      data: {
        user_id: body.user_id,
        user_name: body.user_name,
        user_avatar: body.user_avatar,
        jenis_laporan: body.jenis_laporan || 'Pengaduan',
        title: body.title,
        description: body.description,
        latitude: body.latitude,
        longitude: body.longitude,
        kecamatan: body.kecamatan,
        kelurahan: body.kelurahan,
        foto_url: body.foto_url,
        urgensi: body.urgensi,
        tanggal_rencana: body.tanggal_rencana ? new Date(body.tanggal_rencana) : null,
        jumlah_peserta: body.jumlah_peserta || null,
        status: isGotongRoyong ? 'Menunggu Persetujuan' : 'Belum Ditangani',
      },
    });

    if (laporan.user_id) {
      const notifPesan = isGotongRoyong
        ? `Permohonan gotong royong "${laporan.title}" telah diajukan dan menunggu persetujuan DLH.`
        : `Laporan "${laporan.title}" di ${laporan.kecamatan} telah terdaftar dan menunggu verifikasi petugas DLH.`;

      await prisma.notifikasi.create({
        data: {
          user_id: laporan.user_id,
          judul: isGotongRoyong ? 'Permohonan Gotong Royong Terkirim' : 'Laporan Berhasil Dibuat',
          pesan: notifPesan,
        },
      });
    }

    return NextResponse.json(laporan);
  } catch (error) {
    console.error('Gagal kirim laporan:', error);
    return NextResponse.json({ error: 'Gagal kirim laporan' }, { status: 500 });
  }
}