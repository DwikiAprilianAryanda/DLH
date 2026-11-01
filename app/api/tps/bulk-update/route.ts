import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUserFromToken } from '@/lib/auth';
import { KECAMATAN_SAMARINDA } from '@/lib/mock-data';

const prisma = new PrismaClient();
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function PATCH(request: Request) {
  try {
    const currentUser = getCurrentUserFromToken();
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const body = await request.json();
    const { jam_buka, jam_tutup, kecamatan, onlyEmpty } = body;

    if (jam_buka && !TIME_REGEX.test(jam_buka)) {
      return NextResponse.json({ error: 'Format jam buka harus HH:mm (contoh: 06:00)' }, { status: 400 });
    }
    if (jam_tutup && !TIME_REGEX.test(jam_tutup)) {
      return NextResponse.json({ error: 'Format jam tutup harus HH:mm (contoh: 18:00)' }, { status: 400 });
    }

    if (jam_buka && jam_tutup && jam_buka === jam_tutup) {
      return NextResponse.json({ error: 'Jam buka dan jam tutup massal tidak boleh sama' }, { status: 400 });
    }

    const where: any = {};
    if (kecamatan && kecamatan !== 'Semua') {
      if (!(KECAMATAN_SAMARINDA as readonly string[]).includes(kecamatan)) {
        return NextResponse.json({ error: 'Pilihan kecamatan tidak valid' }, { status: 400 });
      }
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