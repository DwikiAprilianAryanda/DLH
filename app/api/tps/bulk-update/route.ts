import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUserFromToken } from '@/lib/auth';

const prisma = new PrismaClient();

export async function PATCH(request: Request) {
  try {
    const currentUser = getCurrentUserFromToken();
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const body = await request.json();
    const { jam_buka, jam_tutup, kecamatan, onlyEmpty } = body;

    const where: any = {};
    if (kecamatan && kecamatan !== 'Semua') {
      where.kecamatan = kecamatan;
    }
    if (onlyEmpty) {
      where.AND = [{ jam_buka: null }, { jam_tutup: null }];
    }

    const result = await prisma.tps.updateMany({
      where,
      data: {
        jam_buka: jam_buka || null,
        jam_tutup: jam_tutup || null,
      },
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    console.error('Gagal update massal jam operasional:', error);
    return NextResponse.json({ error: 'Gagal update massal' }, { status: 500 });
  }
}