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
    const laporan = await prisma.laporanSampah.create({
      data: {
        user_id: body.user_id,
        user_name: body.user_name,
        user_avatar: body.user_avatar,
        title: body.title,
        description: body.description,
        latitude: body.latitude,
        longitude: body.longitude,
        kecamatan: body.kecamatan,
        kelurahan: body.kelurahan,
        foto_url: body.foto_url,
        urgensi: body.urgensi,
        status: 'Menunggu',
      },
    });

    if (laporan.user_id) {
      await prisma.notifikasi.create({
        data: {
          user_id: laporan.user_id,
          judul: 'Laporan Berhasil Dibuat',
          pesan: `Laporan "${laporan.title}" di ${laporan.kecamatan} telah terdaftar dan menunggu verifikasi petugas DLH.`,
        },
      });
    }

    return NextResponse.json(laporan);
  } catch (error) {
    console.error('Gagal kirim laporan:', error);
    return NextResponse.json({ error: 'Gagal kirim laporan' }, { status: 500 });
  }
}