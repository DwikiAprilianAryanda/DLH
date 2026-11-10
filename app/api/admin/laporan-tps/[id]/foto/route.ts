import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/api-auth';
import { fotoDataUrlValid } from '@/lib/pengawas';

export const dynamic = 'force-dynamic';

/** Foto bukti satu laporan pengawas sebagai gambar biasa (bisa dipakai langsung di <img src>). Hanya admin. */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    if (!requireRole('admin')) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const row = await prisma.laporanPembersihanTps.findUnique({
      where: { id: params.id },
      select: { foto_url: true },
    });
    if (!row) {
      return NextResponse.json({ error: 'Laporan tidak ditemukan' }, { status: 404 });
    }

    const m = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(row.foto_url);
    if (!m || !fotoDataUrlValid(row.foto_url)) {
      return NextResponse.json({ error: 'Foto tidak valid' }, { status: 422 });
    }

    return new NextResponse(Buffer.from(m[2], 'base64'), {
      status: 200,
      headers: {
        'Content-Type': m[1],
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'",
        // Hanya admin yang boleh melihat; boleh di-cache di browser admin itu saja.
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Gagal ambil foto laporan pengawas:', error);
    return NextResponse.json({ error: 'Gagal mengambil foto' }, { status: 500 });
  }
}
