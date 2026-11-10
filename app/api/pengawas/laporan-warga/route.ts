import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

/**
 * Daftar "Perlu dicek" untuk pengawas: pengaduan warga di kecamatan pengawas itu yang belum selesai.
 * HANYA BACA, tanpa foto/deskripsi panjang/nama pelapor (data pelapor tidak perlu diketahui pengawas).
 * Kecamatan diambil dari database, bukan dari token atau query.
 */
export async function GET() {
  try {
    const user = requireRole('pengawas');
    if (!user) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const profil = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { kecamatan: true, role: true },
    });
    if (!profil || profil.role !== 'pengawas' || !profil.kecamatan) {
      return NextResponse.json([]);
    }

    const laporan = await prisma.laporanSampah.findMany({
      where: {
        kecamatan: profil.kecamatan,
        jenis_laporan: 'Pengaduan',
        status: { in: ['Belum Ditangani', 'Proses'] },
      },
      orderBy: { created_at: 'desc' },
      take: 50,
      select: {
        id: true,
        title: true,
        kelurahan: true,
        latitude: true,
        longitude: true,
        status: true,
        urgensi: true,
        created_at: true,
      },
    });

    // Tandai yang sudah ditindaklanjuti pengawas (sudah ada laporan pembersihan yang tertaut)
    const ditindak = await prisma.laporanPembersihanTps.findMany({
      where: { laporan_id: { in: laporan.map((l) => l.id) } },
      select: { laporan_id: true, created_at: true },
      orderBy: { created_at: 'desc' },
    });
    const waktuTindak = new Map<string, Date>();
    for (const t of ditindak) {
      if (t.laporan_id && !waktuTindak.has(t.laporan_id)) waktuTindak.set(t.laporan_id, t.created_at);
    }

    return NextResponse.json(
      laporan.map((l) => ({
        ...l,
        ditindaklanjuti_pada: waktuTindak.get(l.id)?.toISOString() ?? null,
      }))
    );
  } catch (error) {
    console.error('Gagal ambil laporan warga untuk pengawas:', error);
    return NextResponse.json({ error: 'Gagal mengambil laporan warga' }, { status: 500 });
  }
}
