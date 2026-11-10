import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Publik (dipakai peta TPS warga): kapan tiap TPS terakhir dilaporkan sudah dibersihkan.
 * Sengaja hanya tps_id + waktu; foto, nama pengawas, dan koordinat pengawas tidak ikut.
 */
export async function GET() {
  try {
    const rows = await prisma.laporanPembersihanTps.groupBy({
      by: ['tps_id'],
      _max: { created_at: true },
    });

    return NextResponse.json(
      rows
        .filter((r) => r._max.created_at)
        .map((r) => ({ tps_id: r.tps_id, waktu: (r._max.created_at as Date).toISOString() }))
    );
  } catch (error) {
    // Database tidak bisa dihubungi: peta tetap jalan, hanya tanpa status pembersihan.
    console.error('Gagal ambil status kebersihan TPS (database offline):', error);
    return NextResponse.json([]);
  }
}
