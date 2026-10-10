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

    // Update status ke "Proses" (armada dikirim) atau "Ditangani" (selesai) adalah
    // tindakan pengawasan — wajib disertai foto bukti & deskripsi dari petugas.
    const requiresBukti = body.status === 'Proses' || body.status === 'Ditangani';
    if (requiresBukti && (!body.catatan_petugas || !body.foto_bukti_petugas)) {
      return NextResponse.json(
        { error: 'Foto bukti dan deskripsi wajib diisi untuk memperbarui status ini' },
        { status: 400 }
      );
    }

    const updated = await prisma.laporanSampah.update({
      where: { id: params.id },
      data: {
        status: body.status,
        catatan_petugas: body.catatan_petugas,
        foto_bukti_petugas: body.foto_bukti_petugas || null,
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
        notifTitle = 'Laporan Selesai — Yuk Kasih Penilaian!';
        notifPesan =
          body.catatan_petugas
            ? `${body.catatan_petugas} Laporan "${updated.title}" sudah selesai ditangani. Yuk isi survei kepuasan di halaman Riwayat Laporan — masukan kamu membantu DLH meningkatkan layanan.`
            : `Laporan "${updated.title}" sudah selesai ditangani. Yuk isi survei kepuasan di halaman Riwayat Laporan — masukan kamu membantu DLH meningkatkan layanan.`;
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