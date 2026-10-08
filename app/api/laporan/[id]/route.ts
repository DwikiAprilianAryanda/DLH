import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const existing = await prisma.laporanSampah.findUnique({ where: { id: params.id } });

    const updated = await prisma.laporanSampah.update({
      where: { id: params.id },
      data: {
        status: body.status,
        catatan_petugas: body.catatan_petugas,
      },
    });

    if (updated.user_id) {
      let notifTitle = 'Pembaruan Status Laporan';
      let notifPesan =
        body.catatan_petugas ||
        `Status laporan "${updated.title}" telah diperbarui menjadi "${body.status}".`;

      if (existing?.status === 'Menunggu Persetujuan' && body.status === 'Belum Ditangani') {
        notifTitle = 'Permohonan Gotong Royong Disetujui!';
        notifPesan =
          body.catatan_petugas ||
          `Permohonan gotong royong "${updated.title}" telah disetujui DLH dan akan segera dijadwalkan.`;
      } else if (body.status === 'Ditolak') {
        notifTitle = 'Permohonan Gotong Royong Ditolak';
        notifPesan =
          body.catatan_petugas ||
          `Mohon maaf, permohonan gotong royong "${updated.title}" belum dapat disetujui.`;
      } else if (body.status === 'Proses') {
        notifTitle = 'Armada Kebersihan Dikirim!';
      } else if (body.status === 'Ditangani') {
        notifTitle = 'Laporan Sampah Selesai Dibersihkan';
      }

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