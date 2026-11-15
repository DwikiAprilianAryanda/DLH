import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUserFromToken } from '@/lib/auth';

const prisma = new PrismaClient();

const VALID_STATUSES = [
  'Menunggu Persetujuan',
  'Belum Ditangani',
  'Proses',
  'Ditangani',
  'Ditolak',
] as const;

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Verifikasi Keamanan: Hanya admin yang berhak memperbarui status laporan
    const currentUser = getCurrentUserFromToken();
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Akses ditolak. Tindakan ini hanya dapat dilakukan oleh staf admin DLH.' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // 2. Validasi status laporan
    if (!body.status || !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json(
        { error: 'Status laporan tidak valid.' },
        { status: 400 }
      );
    }

    const existing = await prisma.laporanSampah.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Laporan tidak ditemukan.' },
        { status: 404 }
      );
    }

    // 3. Validasi foto bukti & catatan petugas
    // Catatan wajib diisi saat armada dikirim (Proses)
    if (body.status === 'Proses' && !body.catatan_petugas) {
      return NextResponse.json(
        { error: 'Catatan petugas disposisi wajib diisi.' },
        { status: 400 }
      );
    }
    // Foto bukti dan catatan penyelesaian HANYA wajib saat penyelesaian penanganan (Ditangani)
    if (body.status === 'Ditangani' && (!body.catatan_petugas || !body.foto_bukti_petugas)) {
      return NextResponse.json(
        { error: 'Foto bukti dan catatan penyelesaian wajib diisi untuk menyelesaikan laporan.' },
        { status: 400 }
      );
    }

    // 4. Validasi format foto bukti jika ada
    if (body.foto_bukti_petugas) {
      const isDataImg = typeof body.foto_bukti_petugas === 'string' && /^data:image\/(jpeg|png|webp);base64,/.test(body.foto_bukti_petugas);
      const isHttpImg = typeof body.foto_bukti_petugas === 'string' && /^https:\/\//.test(body.foto_bukti_petugas);
      if (!isDataImg && !isHttpImg) {
        return NextResponse.json(
          { error: 'Format foto bukti harus berupa gambar (JPG, PNG, atau WEBP).' },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.laporanSampah.update({
      where: { id: params.id },
      data: {
        status: body.status,
        catatan_petugas: typeof body.catatan_petugas === 'string' ? body.catatan_petugas.trim() : null,
        foto_bukti_petugas: body.foto_bukti_petugas || null,
      },
    });

    if (updated.user_id) {
      let notifTitle = 'Pembaruan Status Laporan';
      let notifPesan =
        body.catatan_petugas ||
        `Status laporan "${updated.title}" telah diperbarui menjadi "${body.status}".`;

      const isGotongRoyong = updated.jenis_laporan === 'Gotong Royong';

      if (existing?.status === 'Menunggu Persetujuan' && body.status === 'Belum Ditangani') {
        notifTitle = isGotongRoyong ? 'Permohonan Gotong Royong Disetujui!' : 'Laporan Pengaduan Telah di-ACC!';
        notifPesan =
          body.catatan_petugas ||
          (isGotongRoyong
            ? `Permohonan gotong royong "${updated.title}" telah disetujui DLH dan akan segera dijadwalkan.`
            : `Laporan pengaduan "${updated.title}" telah diverifikasi & disetujui admin DLH dan kini diterbitkan ke publik.`);
      } else if (body.status === 'Ditolak') {
        notifTitle = isGotongRoyong ? 'Permohonan Gotong Royong Ditolak' : 'Laporan Pengaduan Ditolak';
        notifPesan =
          body.catatan_petugas ||
          `Mohon maaf, laporan "${updated.title}" belum dapat disetujui oleh admin DLH.`;
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

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Verifikasi Keamanan: Hanya admin yang berhak menghapus laporan
    const currentUser = getCurrentUserFromToken();
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Akses ditolak. Tindakan ini hanya dapat dilakukan oleh staf admin DLH.' },
        { status: 403 }
      );
    }

    const { id } = params;
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'ID laporan tidak valid.' }, { status: 400 });
    }

    const existing = await prisma.laporanSampah.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Laporan tidak ditemukan.' }, { status: 404 });
    }

    // 2. Hapus data relasi (survei kepuasan) dan laporan secara atomik
    await prisma.$transaction(async (tx) => {
      // Hapus survei kepuasan terkait jika ada
      await tx.surveiKepuasan.deleteMany({
        where: { laporan_id: id },
      });

      // Hapus data laporan sampah
      await tx.laporanSampah.delete({
        where: { id },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Laporan "${existing.title}" berhasil dihapus.`,
    });
  } catch (error) {
    console.error('Gagal menghapus laporan:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus laporan dari database.' },
      { status: 500 }
    );
  }
}
