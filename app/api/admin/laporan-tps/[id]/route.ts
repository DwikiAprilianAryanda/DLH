import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

/** Hapus laporan pengawas yang keliru / tidak sah. Hanya admin. */
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    if (!requireRole('admin')) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const ada = await prisma.laporanPembersihanTps.findUnique({
      where: { id: params.id },
      select: { id: true },
    });
    if (!ada) {
      return NextResponse.json({ error: 'Laporan tidak ditemukan' }, { status: 404 });
    }

    await prisma.laporanPembersihanTps.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Gagal hapus laporan pengawas:', error);
    return NextResponse.json({ error: 'Gagal menghapus laporan' }, { status: 500 });
  }
}
