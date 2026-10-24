import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUserFromToken } from '@/lib/auth';
import { TPS_SEED_DATA } from '@/lib/tps-seed-data';

const prisma = new PrismaClient();

const FALLBACK_TPS = TPS_SEED_DATA.map((t, idx) => ({
  id: `tps-${idx + 1}`,
  nama: t.nama,
  kecamatan: t.kecamatan,
  latitude: t.latitude,
  longitude: t.longitude,
  bangunan: t.bangunan,
  mobilitas: t.mobilitas,
  jumlah_bak: t.jumlah_bak,
  jenis: t.jenis,
  jam_buka: '06:00',
  jam_tutup: '18:00',
  created_at: new Date().toISOString(),
}));

export async function GET() {
  try {
    const tps = await prisma.tps.findMany({
      orderBy: { nama: 'asc' },
    });
    return NextResponse.json(tps && tps.length > 0 ? tps : FALLBACK_TPS);
  } catch (error) {
    console.error('Gagal ambil data TPS (database offline), fallback ke seed data:', error);
    return NextResponse.json(FALLBACK_TPS);
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = getCurrentUserFromToken();
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const body = await request.json();

    if (!body.nama || !body.kecamatan || body.latitude === undefined || body.longitude === undefined) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    if (body.jumlah_bak !== undefined && body.jumlah_bak !== null && body.jumlah_bak !== '') {
      const bak = Number(body.jumlah_bak);
      if (isNaN(bak) || bak < 1 || bak > 30) {
        return NextResponse.json({ error: 'Jumlah bak harus berupa angka wajar antara 1 hingga 30 unit' }, { status: 400 });
      }
    }

    if (body.jam_buka && body.jam_tutup && body.jam_buka === body.jam_tutup) {
      return NextResponse.json({ error: 'Jam buka dan jam tutup operasional TPS tidak boleh sama' }, { status: 400 });
    }

    const tps = await prisma.tps.create({
      data: {
        nama: body.nama,
        kecamatan: body.kecamatan,
        latitude: Number(body.latitude),
        longitude: Number(body.longitude),
        bangunan: body.bangunan || null,
        mobilitas: body.mobilitas || null,
        jumlah_bak: body.jumlah_bak ? Number(body.jumlah_bak) : null,
        jenis: body.jenis || null,
        jam_buka: body.jam_buka || null,
        jam_tutup: body.jam_tutup || null,
      },
    });

    return NextResponse.json(tps);
  } catch (error) {
    console.error('Gagal tambah TPS:', error);
    return NextResponse.json({ error: 'Gagal tambah TPS' }, { status: 500 });
  }
}