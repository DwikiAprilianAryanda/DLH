import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUserFromToken } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const tps = await prisma.tps.findMany({
      orderBy: { nama: 'asc' },
    });
    return NextResponse.json(tps);
  } catch (error) {
    console.error('Gagal ambil data TPS:', error);
    return NextResponse.json({ error: 'Gagal ambil data TPS' }, { status: 500 });
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