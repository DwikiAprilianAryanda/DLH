import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUserFromToken } from '@/lib/auth';

const prisma = new PrismaClient();

// Semua survei kepuasan (lintas warga) — khusus admin, buat rekap dashboard.
export async function GET() {
  try {
    const currentUser = getCurrentUserFromToken();
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const surveiList = await prisma.surveiKepuasan.findMany({
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json(surveiList);
  } catch (error) {
    console.error('Gagal ambil data survei admin:', error);
    return NextResponse.json({ error: 'Gagal ambil data survei' }, { status: 500 });
  }
}