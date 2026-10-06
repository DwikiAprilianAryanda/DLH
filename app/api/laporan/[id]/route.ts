import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const updated = await prisma.laporanSampah.update({
      where: { id: params.id },
      data: {
        status: body.status,
        catatan_petugas: body.catatan_petugas,
      },
    });

    if (updated.user_id) {
      const notifTitle =
        body.status === 'Armada Dikirim'
          ? 'Armada Kebersihan Dikirim!'
          : body.status === 'Selesai/Dibersihkan'
          ? 'Laporan Sampah Selesai Dibersihkan'
          : 'Pembaruan Status Laporan';

      const notifPesan =
        body.catatan_petugas ||
        `Status laporan "${updated.title}" telah diperbarui menjadi "${body.status}".`;

      await prisma.notifikasi.create({
        data: {
          user_id: updated.user_id,
          judul: notifTitle,
          pesan: notifPesan,
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Gagal update laporan:', error);
    return NextResponse.json({ error: 'Gagal update laporan' }, { status: 500 });
  }
}