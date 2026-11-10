import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/api-auth';
import { KECAMATAN_SAMARINDA } from '@/lib/mock-data';
import { awalHariWitaDari } from '@/lib/waktu';

export const dynamic = 'force-dynamic';

/**
 * Daftar laporan pengawas untuk admin. Foto TIDAK ikut (base64 besar);
 * ambil per laporan lewat /api/admin/laporan-tps/[id]/foto.
 * Query: kecamatan, dari=YYYY-MM-DD, sampai=YYYY-MM-DD (tanggal WITA), limit (maks 200), offset.
 */
export async function GET(request: Request) {
  try {
    if (!requireRole('admin')) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const sp = new URL(request.url).searchParams;
    const where: Prisma.LaporanPembersihanTpsWhereInput = {};

    const kecamatan = sp.get('kecamatan');
    if (kecamatan && kecamatan !== 'Semua') {
      if (!(KECAMATAN_SAMARINDA as readonly string[]).includes(kecamatan)) {
        return NextResponse.json({ error: 'Kecamatan tidak valid' }, { status: 400 });
      }
      where.kecamatan = kecamatan;
    }

    const dari = sp.get('dari');
    const sampai = sp.get('sampai');
    const waktu: { gte?: Date; lt?: Date } = {};
    if (dari) {
      const d = awalHariWitaDari(dari);
      if (!d) return NextResponse.json({ error: 'Format tanggal "dari" harus YYYY-MM-DD' }, { status: 400 });
      waktu.gte = d;
    }
    if (sampai) {
      const d = awalHariWitaDari(sampai, 1);
      if (!d) return NextResponse.json({ error: 'Format tanggal "sampai" harus YYYY-MM-DD' }, { status: 400 });
      waktu.lt = d;
    }
    if (waktu.gte || waktu.lt) where.created_at = waktu;

    const limit = Math.min(Math.max(Number(sp.get('limit')) || 100, 1), 200);
    const offset = Math.max(Number(sp.get('offset')) || 0, 0);

    const [total, items] = await Promise.all([
      prisma.laporanPembersihanTps.count({ where }),
      prisma.laporanPembersihanTps.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          tps_id: true,
          tps_nama: true,
          kecamatan: true,
          pengawas_nama: true,
          catatan: true,
          latitude: true,
          longitude: true,
          jarak_meter: true,
          laporan_id: true,
          created_at: true,
        },
      }),
    ]);

    // Judul laporan warga yang ditindaklanjuti (kalau ada); laporan yang sudah dihapus -> null
    const idLaporan = Array.from(new Set(items.map((i) => i.laporan_id).filter((v): v is string => !!v)));
    const judul = new Map<string, string>();
    if (idLaporan.length > 0) {
      const lap = await prisma.laporanSampah.findMany({
        where: { id: { in: idLaporan } },
        select: { id: true, title: true },
      });
      for (const l of lap) judul.set(l.id, l.title);
    }

    return NextResponse.json({
      total,
      items: items.map((i) => ({
        ...i,
        laporan_judul: i.laporan_id ? judul.get(i.laporan_id) ?? null : null,
      })),
    });
  } catch (error) {
    console.error('Gagal ambil laporan pengawas (admin):', error);
    return NextResponse.json({ error: 'Gagal mengambil laporan pengawas' }, { status: 500 });
  }
}
